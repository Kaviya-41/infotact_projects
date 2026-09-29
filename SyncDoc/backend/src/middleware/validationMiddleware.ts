import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { validateDocument } from "../validators/astValidator.js";
import { validateASTChange } from "../validators/astChangeValidator.js";
import { normalizeAST } from "../utils/astUtils.js";

function getParamId(req: Request): string {
  const id = req.params.id;
  if (Array.isArray(id)) return id[0];
  return id ?? "";
}

/**
 * Validates that req.params.id is a valid 24-character hex MongoDB ObjectId
 */
export function validateObjectId(req: Request, res: Response, next: NextFunction): void {
  const id = getParamId(req);
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({
      success: false,
      message: "Invalid document ID",
    });
    return;
  }
  next();
}

/**
 * Validates POST /api/documents request body against AST document structure rules.
 */
export function validateCreateDocument(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    // Check for MongoDB operators and dangerous keys in create payload
    const dangerousKey = containsDangerousKey(req.body as Record<string, unknown>);
    if (dangerousKey) {
      res.status(400).json({
        success: false,
        message: `Dangerous key '${dangerousKey}' is not permitted in request body`,
      });
      return;
    }

    req.body = normalizeAST(req.body as Record<string, unknown>);
  }

  const validationResult = validateDocument(req.body);

  if (!validationResult.isValid) {
    res.status(400).json({
      success: false,
      message: "Invalid AST document structure",
      errors: validationResult.errors,
    });
    return;
  }

  next();
}

/** Keys that indicate prototype pollution or MongoDB injection attempts */
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Helper to recursively check if an object contains keys starting with '$' (MongoDB operator injection)
 */
export function containsMongoOperator(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = containsMongoOperator(item);
      if (found) return found;
    }
    return null;
  }
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key.startsWith("$")) {
      return key;
    }
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === "object") {
      const nestedKey = containsMongoOperator(val);
      if (nestedKey) return nestedKey;
    }
  }
  return null;
}

/**
 * Recursively checks for both MongoDB operator keys ($...) and prototype pollution keys
 * (__proto__, constructor, prototype).
 */
export function containsDangerousKey(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = containsDangerousKey(item);
      if (found) return found;
    }
    return null;
  }
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key.startsWith("$") || DANGEROUS_KEYS.has(key)) {
      return key;
    }
    const val = (obj as Record<string, unknown>)[key];
    if (val && typeof val === "object") {
      const nestedKey = containsDangerousKey(val);
      if (nestedKey) return nestedKey;
    }
  }
  return null;
}

/**
 * Validates PUT /api/documents/:id request body against allowed update fields and AST standards.
 *
 * Only `title` and `blocks` may be updated. Immutable fields are rejected.
 * Normalization is applied before validation.
 */
export function validateUpdateDocument(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      success: false,
      message: "Update payload must be an object",
    });
    return;
  }

  const body = req.body as Record<string, unknown>;

  // Check recursively for MongoDB operators and dangerous prototype pollution keys
  const dangerousKey = containsDangerousKey(body);
  if (dangerousKey) {
    res.status(400).json({
      success: false,
      message: `Dangerous key '${dangerousKey}' is not permitted in request body`,
    });
    return;
  }

  // Reject disallowed top-level fields
  const allowedFields = new Set(["title", "blocks"]);
  for (const key of Object.keys(body)) {
    if (!allowedFields.has(key)) {
      res.status(400).json({
        success: false,
        message: `Field '${key}' is not permitted for document update (read-only or unsupported)`,
      });
      return;
    }
  }

  if (req.body && typeof req.body === "object") {
    req.body = normalizeAST(req.body as Record<string, unknown>);
  }

  // Create a synthetic document object to validate provided fields
  const syntheticDoc = {
    title: req.body.title !== undefined ? req.body.title : "Temporary Valid Title",
    ownerId: "temp-valid-owner",
    version: 1,
    blocks: req.body.blocks !== undefined ? req.body.blocks : [],
  };

  const validationResult = validateDocument(syntheticDoc);

  if (!validationResult.isValid) {
    const relevantErrors = validationResult.errors.filter((err) => {
      if (req.body.title === undefined && err.path === "title") return false;
      if (req.body.blocks === undefined && err.path === "blocks") return false;
      return true;
    });

    if (relevantErrors.length > 0) {
      res.status(400).json({
        success: false,
        message: "Invalid update request payload",
        errors: relevantErrors,
      });
      return;
    }
  }

  next();
}

/**
 * Validates POST /api/documents/:id/changes request body.
 *
 * Checks for dangerous keys (MongoDB operators, prototype pollution),
 * then structurally validates the AST change payload before it reaches the controller.
 */
export function validateChangeBody(req: Request, res: Response, next: NextFunction): void {
  if (!req.body || typeof req.body !== "object") {
    res.status(400).json({
      success: false,
      message: "AST change payload must be an object",
    });
    return;
  }

  const body = req.body as Record<string, unknown>;

  // Check recursively for MongoDB operators and dangerous prototype pollution keys
  const dangerousKey = containsDangerousKey(body);
  if (dangerousKey) {
    res.status(400).json({
      success: false,
      message: `Dangerous key '${dangerousKey}' is not permitted in request body`,
    });
    return;
  }

  // Structural validation of AST change (without document context — that happens in the service)
  const changeValidation = validateASTChange(body);
  if (!changeValidation.isValid) {
    res.status(400).json({
      success: false,
      message: "Invalid AST change payload",
      errors: changeValidation.errors,
    });
    return;
  }

  next();
}
