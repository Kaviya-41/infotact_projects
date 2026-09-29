import { validateNodeData, type ValidationErrorItem, type ValidationResult } from "./astValidator.js";
import type { ASTOperation } from "../types/astChangeTypes.js";
import { SUPPORTED_BLOCK_TYPES } from "../models/AstNode.js";

const SUPPORTED_OPERATIONS: ASTOperation[] = [
  "CREATE_BLOCK",
  "UPDATE_BLOCK",
  "DELETE_BLOCK",
  "MOVE_BLOCK",
];

/**
 * Validates an AST change object structurally, and optionally contextually against a target document AST.
 *
 * @param change The AST change candidate object to validate.
 * @param doc Optional target document object to check documentId matching, block existence, duplicate IDs, version ordering, and target index bounds.
 * @returns ValidationResult containing isValid boolean and error details array.
 */
export function validateASTChange(
  change: unknown,
  doc?: unknown
): ValidationResult {
  const errors: ValidationErrorItem[] = [];

  // Root change object check
  if (change === undefined || change === null || typeof change !== "object") {
    return {
      isValid: false,
      errors: [{ path: "change", message: "AST change payload must be an object" }],
    };
  }

  const changeObj = change as Record<string, unknown>;

  // 1. Validate documentId
  if (changeObj.documentId === undefined || changeObj.documentId === null) {
    errors.push({ path: "documentId", message: "documentId is required" });
  } else if (typeof changeObj.documentId !== "string" || changeObj.documentId.trim() === "") {
    errors.push({ path: "documentId", message: "documentId must be a non-empty string" });
  }

  // 2. Validate blockId
  if (changeObj.blockId === undefined || changeObj.blockId === null) {
    errors.push({ path: "blockId", message: "blockId is required" });
  } else if (typeof changeObj.blockId !== "string" || changeObj.blockId.trim() === "") {
    errors.push({ path: "blockId", message: "blockId must be a non-empty string" });
  }

  // 3. Validate operation
  if (changeObj.operation === undefined || changeObj.operation === null) {
    errors.push({ path: "operation", message: "operation is required" });
  } else if (
    typeof changeObj.operation !== "string" ||
    !SUPPORTED_OPERATIONS.includes(changeObj.operation as ASTOperation)
  ) {
    errors.push({
      path: "operation",
      message: `Unsupported operation '${String(changeObj.operation)}'. Supported operations are: ${SUPPORTED_OPERATIONS.join(", ")}`,
    });
  }

  // 4. Validate version (if present)
  if (changeObj.version !== undefined && changeObj.version !== null) {
    if (
      typeof changeObj.version !== "number" ||
      isNaN(changeObj.version) ||
      changeObj.version < 0 ||
      !Number.isInteger(changeObj.version)
    ) {
      errors.push({ path: "version", message: "version must be a non-negative integer" });
    }
  }

  const op = changeObj.operation as ASTOperation;
  const payload = changeObj.payload;

  // 5. Operation-specific payload validation
  if (op === "CREATE_BLOCK") {
    if (payload === undefined || payload === null || typeof payload !== "object") {
      errors.push({ path: "payload", message: "CREATE_BLOCK operation requires a payload object" });
    } else {
      const p = payload as Record<string, unknown>;

      if (p.type === undefined || p.type === null) {
        errors.push({ path: "payload.type", message: "CREATE_BLOCK payload requires a block type" });
      } else if (typeof p.type !== "string" || !SUPPORTED_BLOCK_TYPES.includes(p.type)) {
        errors.push({
          path: "payload.type",
          message: `Unsupported block type '${String(p.type)}'. Supported types: ${SUPPORTED_BLOCK_TYPES.join(", ")}`,
        });
      }

      if (p.data === undefined || p.data === null || typeof p.data !== "object") {
        errors.push({ path: "payload.data", message: "CREATE_BLOCK payload requires a data object" });
      } else if (typeof p.type === "string" && SUPPORTED_BLOCK_TYPES.includes(p.type)) {
        const dataErrors = validateNodeData(p.type, p.data, "payload");
        errors.push(...dataErrors);
      }

      if (p.targetIndex !== undefined && p.targetIndex !== null) {
        if (typeof p.targetIndex !== "number" || !Number.isInteger(p.targetIndex) || p.targetIndex < 0) {
          errors.push({ path: "payload.targetIndex", message: "targetIndex must be a non-negative integer" });
        }
      }
    }
  } else if (op === "UPDATE_BLOCK") {
    if (payload === undefined || payload === null || typeof payload !== "object" || Object.keys(payload).length === 0) {
      errors.push({ path: "payload", message: "UPDATE_BLOCK operation requires a non-empty payload object" });
    } else {
      const p = payload as Record<string, unknown>;

      if (p.targetIndex !== undefined && p.targetIndex !== null) {
        errors.push({ path: "payload.targetIndex", message: "targetIndex is not permitted on UPDATE_BLOCK" });
      }

      if (p.type !== undefined && p.type !== null) {
        if (typeof p.type !== "string" || !SUPPORTED_BLOCK_TYPES.includes(p.type)) {
          errors.push({
            path: "payload.type",
            message: `Unsupported block type '${String(p.type)}'`,
          });
        }
      }
    }
  } else if (op === "MOVE_BLOCK") {
    if (payload === undefined || payload === null || typeof payload !== "object") {
      errors.push({ path: "payload", message: "MOVE_BLOCK operation requires a payload object" });
    } else {
      const p = payload as Record<string, unknown>;
      if (p.targetIndex === undefined || p.targetIndex === null) {
        errors.push({ path: "payload.targetIndex", message: "MOVE_BLOCK payload requires targetIndex" });
      } else if (
        typeof p.targetIndex !== "number" ||
        !Number.isInteger(p.targetIndex) ||
        p.targetIndex < 0
      ) {
        errors.push({ path: "payload.targetIndex", message: "targetIndex must be a non-negative integer" });
      }
    }
  }

  // 6. Document contextual checks (when doc parameter is provided and basic fields are valid)
  if (doc && typeof doc === "object" && typeof changeObj.documentId === "string" && typeof changeObj.blockId === "string") {
    const docObj = doc as Record<string, unknown>;

    // Document ID match check
    const candidateIds = [
      docObj._id ? String(docObj._id).trim() : null,
      docObj.id ? String(docObj.id).trim() : null,
    ].filter(Boolean) as string[];

    if (candidateIds.length > 0 && !candidateIds.includes(changeObj.documentId.trim())) {
      errors.push({
        path: "documentId",
        message: `Change documentId '${changeObj.documentId}' does not match target document ID '${candidateIds[0]}'`,
      });
    }

    // Version compatibility check (prevent stale changes)
    if (
      typeof docObj.version === "number" &&
      typeof changeObj.version === "number" &&
      !isNaN(changeObj.version)
    ) {
      if (changeObj.version < docObj.version) {
        errors.push({
          path: "version",
          message: `Stale change version (${changeObj.version}) is less than current document version (${docObj.version})`,
        });
      }
    }

    // Block existence / duplicate checks on doc.blocks
    if (Array.isArray(docObj.blocks)) {
      const blocks = docObj.blocks as Array<Record<string, unknown>>;
      const targetBlockId = changeObj.blockId.trim();

      const existingBlock = blocks.find((b) => b && typeof b.id === "string" && b.id.trim() === targetBlockId);

      if (op === "CREATE_BLOCK") {
        if (existingBlock) {
          errors.push({
            path: "blockId",
            message: `Duplicate block ID '${targetBlockId}' already exists in document`,
          });
        }
        if (payload && typeof payload === "object") {
          const p = payload as Record<string, unknown>;
          if (typeof p.targetIndex === "number" && p.targetIndex > blocks.length) {
            errors.push({
              path: "payload.targetIndex",
              message: `targetIndex ${p.targetIndex} is out of bounds for insertion into document with ${blocks.length} blocks`,
            });
          }
        }
      } else if (op === "UPDATE_BLOCK" || op === "DELETE_BLOCK" || op === "MOVE_BLOCK") {
        if (!existingBlock) {
          errors.push({
            path: "blockId",
            message: `Target block ID '${targetBlockId}' not found in document`,
          });
        }
      }

      if (op === "MOVE_BLOCK" && payload && typeof payload === "object") {
        const p = payload as Record<string, unknown>;
        if (typeof p.targetIndex === "number" && blocks.length > 0 && p.targetIndex >= blocks.length) {
          errors.push({
            path: "payload.targetIndex",
            message: `targetIndex ${p.targetIndex} is out of bounds for document with ${blocks.length} blocks`,
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
