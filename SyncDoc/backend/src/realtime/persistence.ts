import * as Y from "yjs";
import documentService from "../services/documentService.js";
import { yDocToAST } from "./astYjsMap.js";
import { normalizeAST } from "../utils/astUtils.js";
import { validateDocumentAST } from "../validators/astValidator.js";

export interface PersistenceResult {
  success: boolean;
  message: string;
  version?: number;
  errors?: Array<{ path: string; message: string }>;
}

/**
 * Persists the current state of a room's Y.Doc into the MongoDB Document collection.
 * Reuses documentService for database operations, validation, and version incrementing.
 *
 * Steps:
 * 1. Convert Y.Doc → AST blocks via yDocToAST()
 * 2. Normalize resulting AST via normalizeAST()
 * 3. Validate resulting AST via validateDocumentAST()
 * 4. Save to MongoDB via documentService.update() (increments version)
 *
 * @param documentId Document ID string
 * @param yDoc Y.Doc instance containing collaboration state
 */
export async function persistRoomState(
  documentId: string,
  yDoc: Y.Doc
): Promise<PersistenceResult> {
  const rawBlocks = yDocToAST(yDoc);

  // Normalize AST while preserving content & stable IDs
  const normalizedDocObj = normalizeAST({ blocks: rawBlocks });
  const blocks = (normalizedDocObj.blocks ?? []) as import("../models/AstNode.js").AstBlock[];

  // Fetch document via documentService
  const doc = await documentService.getById(documentId);
  if (!doc) {
    return {
      success: false,
      message: `Document '${documentId}' not found in database`,
    };
  }

  // Validate AST before saving to MongoDB
  const validation = validateDocumentAST({
    title: doc.title,
    ownerId: doc.ownerId,
    version: doc.version,
    blocks,
  });

  if (!validation.isValid) {
    return {
      success: false,
      message: "Yjs state to AST conversion failed validation",
      errors: validation.errors,
    };
  }

  // Update blocks and increment version via documentService
  const updatedDoc = await documentService.update(documentId, { blocks });
  if (!updatedDoc) {
    return {
      success: false,
      message: `Failed to update document '${documentId}' in database`,
    };
  }

  return {
    success: true,
    message: "Document state persisted successfully",
    version: updatedDoc.version,
  };
}

/**
 * Debounced persistence helper for managing rooms.
 */
export class DebouncedPersister {
  private timer: NodeJS.Timeout | null = null;
  private isPersisting = false;
  private pendingNext = false;

  constructor(
    private readonly documentId: string,
    private readonly yDoc: Y.Doc,
    private readonly delayMs = 1000
  ) {}

  /**
   * Schedules a debounced persistence task.
   */
  public schedule(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.delayMs);
  }

  /**
   * Immediately flushes pending updates to MongoDB.
   */
  public async flush(): Promise<PersistenceResult | null> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.isPersisting) {
      this.pendingNext = true;
      return null;
    }

    this.isPersisting = true;
    try {
      const result = await persistRoomState(this.documentId, this.yDoc);
      return result;
    } catch (error: unknown) {
      console.error(`Failed to persist room state for document ${this.documentId}:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Persistence failed",
      };
    } finally {
      this.isPersisting = false;
      if (this.pendingNext) {
        this.pendingNext = false;
        void this.flush();
      }
    }
  }

  /**
   * Cleans up timers.
   */
  public cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
