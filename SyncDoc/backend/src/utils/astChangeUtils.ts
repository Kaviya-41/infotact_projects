import type { IDocument } from "../models/Document.js";
import type { AstBlock, BlockType } from "../models/AstNode.js";
import type {
  ASTChange,
  ASTChangeResult,
  CreateBlockPayload,
  MoveBlockPayload,
} from "../types/astChangeTypes.js";
import { validateASTChange } from "../validators/astChangeValidator.js";
import { validateDocumentAST } from "../validators/astValidator.js";
import { normalizeAST } from "./astUtils.js";

/**
 * Pure utility function to apply an AST Change operation to a Document AST.
 *
 * Requirements:
 * - Operates purely in-memory (no MongoDB calls)
 * - Pure transformation: Original document AST remains completely unchanged (immutable)
 * - Preserves stable documentId and blockId
 * - Validates input change structure and target block existence
 * - Performs requested CREATE, UPDATE, DELETE, or MOVE operation
 * - Normalizes and validates resulting document AST via validateDocumentAST()
 * - Returns a predictable ASTChangeResult envelope ({ success: true, ast } | { success: false, message, errors })
 *
 * @param doc Target document object or IDocument instance.
 * @param change ASTChange operation object.
 * @returns ASTChangeResult outcome.
 */
export function applyASTChange(
  doc: unknown,
  change: ASTChange
): ASTChangeResult {
  // 1. Verify target document object
  if (doc === undefined || doc === null || typeof doc !== "object") {
    return {
      success: false,
      message: "Target document must be a valid object",
      errors: [{ path: "document", message: "Document object is required" }],
    };
  }

  // 2. Validate AST change structurally and contextually against the document
  const changeValidation = validateASTChange(change, doc);
  if (!changeValidation.isValid) {
    return {
      success: false,
      message: "AST change validation failed",
      errors: changeValidation.errors,
    };
  }

  // 3. Immutability guarantee: Deep copy the document object
  const docObj = doc as Record<string, unknown>;
  const newDoc = JSON.parse(JSON.stringify(docObj)) as IDocument;

  if (!Array.isArray(newDoc.blocks)) {
    newDoc.blocks = [];
  }

  const blocks = newDoc.blocks;
  const op = change.operation;
  const targetBlockId = change.blockId.trim();

  // 4. Execute operation logic
  switch (op) {
    case "CREATE_BLOCK": {
      const payload = change.payload as CreateBlockPayload;
      const newBlock: AstBlock = {
        id: targetBlockId, // Supplied block ID is strictly preserved!
        type: payload.type,
        data: JSON.parse(JSON.stringify(payload.data)),
      } as AstBlock;

      if (
        typeof payload.targetIndex === "number" &&
        payload.targetIndex >= 0 &&
        payload.targetIndex <= blocks.length
      ) {
        blocks.splice(payload.targetIndex, 0, newBlock);
      } else {
        blocks.push(newBlock);
      }
      break;
    }

    case "UPDATE_BLOCK": {
      const blockIndex = blocks.findIndex((b) => b && typeof b.id === "string" && b.id.trim() === targetBlockId);
      if (blockIndex === -1) {
        return {
          success: false,
          message: `Target block ID '${targetBlockId}' not found in document`,
          errors: [{ path: "blockId", message: `Block '${targetBlockId}' does not exist` }],
        };
      }

      const existingBlock = blocks[blockIndex];
      const payload = change.payload as Record<string, unknown>;

      const updatedType = (
        typeof payload.type === "string" ? payload.type : existingBlock.type
      ) as BlockType;

      let updatedData: Record<string, unknown>;
      if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
        updatedData = {
          ...(existingBlock.data as unknown as Record<string, unknown>),
          ...(payload.data as Record<string, unknown>),
        };
      } else {
        const { type: _t, targetIndex: _ti, ...dataFields } = payload;
        updatedData = {
          ...(existingBlock.data as unknown as Record<string, unknown>),
          ...dataFields,
        };
      }

      // Preserve stable block ID and array position!
      const updatedBlock = {
        id: existingBlock.id,
        type: updatedType,
        data: updatedData,
      } as unknown as AstBlock;

      blocks[blockIndex] = updatedBlock;
      break;
    }

    case "DELETE_BLOCK": {
      const blockIndex = blocks.findIndex((b) => b && typeof b.id === "string" && b.id.trim() === targetBlockId);
      if (blockIndex === -1) {
        return {
          success: false,
          message: `Target block ID '${targetBlockId}' not found in document`,
          errors: [{ path: "blockId", message: `Block '${targetBlockId}' does not exist` }],
        };
      }

      // Remove exactly one block
      blocks.splice(blockIndex, 1);
      break;
    }

    case "MOVE_BLOCK": {
      const blockIndex = blocks.findIndex((b) => b && typeof b.id === "string" && b.id.trim() === targetBlockId);
      if (blockIndex === -1) {
        return {
          success: false,
          message: `Target block ID '${targetBlockId}' not found in document`,
          errors: [{ path: "blockId", message: `Block '${targetBlockId}' does not exist` }],
        };
      }

      const payload = change.payload as MoveBlockPayload;
      const targetIndex = payload.targetIndex;

      if (targetIndex < 0 || targetIndex >= blocks.length) {
        return {
          success: false,
          message: `Target index ${targetIndex} is out of bounds (0..${blocks.length - 1})`,
          errors: [{ path: "payload.targetIndex", message: `Target index out of bounds` }],
        };
      }

      // Remove block from current position and insert at targetIndex
      const [movedBlock] = blocks.splice(blockIndex, 1);
      blocks.splice(targetIndex, 0, movedBlock);
      break;
    }
  }

  // Update version metadata if specified or increment
  if (typeof change.version === "number" && change.version > (newDoc.version || 0)) {
    newDoc.version = change.version;
  }

  // 5. Normalize resulting document AST
  const normalizedDoc = normalizeAST(newDoc as unknown as Record<string, unknown>) as unknown as IDocument;

  // 6. Validate resulting document AST
  const postValidation = validateDocumentAST(normalizedDoc);
  if (!postValidation.isValid) {
    return {
      success: false,
      message: "Resulting AST failed validation",
      errors: postValidation.errors,
    };
  }

  return {
    success: true,
    ast: normalizedDoc,
  };
}
