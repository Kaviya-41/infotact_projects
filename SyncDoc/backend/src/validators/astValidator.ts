import { SUPPORTED_BLOCK_TYPES } from "../models/AstNode.js";

export interface ValidationErrorItem {
  path: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrorItem[];
}

/**
 * Validates a node's data payload based on its block type.
 */
export function validateNodeData(
  type: string,
  data: unknown,
  pathPrefix: string
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (data === undefined || data === null || typeof data !== "object") {
    errors.push({
      path: `${pathPrefix}.data`,
      message: `Block of type '${type}' requires a data object`,
    });
    return errors;
  }

  const dataObj = data as Record<string, unknown>;

  switch (type) {
    case "heading": {
      if (dataObj.text === undefined || dataObj.text === null) {
        errors.push({
          path: `${pathPrefix}.data.text`,
          message: "Heading text is required",
        });
      } else if (typeof dataObj.text !== "string") {
        errors.push({
          path: `${pathPrefix}.data.text`,
          message: "Heading text must be a string",
        });
      }
      break;
    }

    case "paragraph": {
      if (dataObj.text === undefined || dataObj.text === null) {
        errors.push({
          path: `${pathPrefix}.data.text`,
          message: "Paragraph text is required",
        });
      } else if (typeof dataObj.text !== "string") {
        errors.push({
          path: `${pathPrefix}.data.text`,
          message: "Paragraph text must be a string",
        });
      }
      break;
    }

    case "code": {
      if (dataObj.language === undefined || dataObj.language === null) {
        errors.push({
          path: `${pathPrefix}.data.language`,
          message: "Code block language is required",
        });
      } else if (typeof dataObj.language !== "string") {
        errors.push({
          path: `${pathPrefix}.data.language`,
          message: "Code block language must be a string",
        });
      } else if (dataObj.language.trim() === "") {
        errors.push({
          path: `${pathPrefix}.data.language`,
          message: "Code block language must not be empty",
        });
      }

      if (dataObj.code === undefined || dataObj.code === null) {
        errors.push({
          path: `${pathPrefix}.data.code`,
          message: "Code content is required",
        });
      } else if (typeof dataObj.code !== "string") {
        errors.push({
          path: `${pathPrefix}.data.code`,
          message: "Code content must be a string",
        });
      }
      break;
    }

    case "list": {
      if (dataObj.ordered === undefined || dataObj.ordered === null) {
        errors.push({
          path: `${pathPrefix}.data.ordered`,
          message: "List ordered flag is required",
        });
      } else if (typeof dataObj.ordered !== "boolean") {
        errors.push({
          path: `${pathPrefix}.data.ordered`,
          message: "List ordered flag must be a boolean",
        });
      }

      if (dataObj.items === undefined || dataObj.items === null) {
        errors.push({
          path: `${pathPrefix}.data.items`,
          message: "List items array is required",
        });
      } else if (!Array.isArray(dataObj.items)) {
        errors.push({
          path: `${pathPrefix}.data.items`,
          message: "List items must be an array",
        });
      } else {
        const items = dataObj.items as unknown[];
        if (items.length === 0) {
          errors.push({
            path: `${pathPrefix}.data.items`,
            message: "List items must not be empty",
          });
        }
        items.forEach((item, index) => {
          if (typeof item !== "string") {
            errors.push({
              path: `${pathPrefix}.data.items[${index}]`,
              message: `List item at index ${index} must be a string`,
            });
          } else if (item.trim() === "") {
            errors.push({
              path: `${pathPrefix}.data.items[${index}]`,
              message: `List item at index ${index} must not be empty or whitespace`,
            });
          }
        });
      }
      break;
    }
  }

  return errors;
}

/**
 * Validates an individual AST node and recursively validates its children if present.
 */
export function validateNode(
  node: unknown,
  index: number,
  seenIds: Set<string>,
  pathPrefix: string
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (node === undefined || node === null || typeof node !== "object") {
    errors.push({
      path: pathPrefix,
      message: `Block at index ${index} must be an object`,
    });
    return errors;
  }

  const blockObj = node as Record<string, unknown>;

  // Validate Block ID
  if (blockObj.id === undefined || blockObj.id === null) {
    errors.push({
      path: `${pathPrefix}.id`,
      message: "Block ID is required",
    });
  } else if (typeof blockObj.id !== "string" || blockObj.id.trim() === "") {
    errors.push({
      path: `${pathPrefix}.id`,
      message: "Block ID must be a non-empty string",
    });
  } else {
    const blockId = blockObj.id.trim();
    if (seenIds.has(blockId)) {
      errors.push({
        path: `${pathPrefix}.id`,
        message: `Duplicate block ID '${blockId}' found`,
      });
    } else {
      seenIds.add(blockId);
    }
  }

  // Validate Block Type
  if (blockObj.type === undefined || blockObj.type === null) {
    errors.push({
      path: `${pathPrefix}.type`,
      message: "Block type is required",
    });
    return errors;
  }
  if (typeof blockObj.type !== "string" || !SUPPORTED_BLOCK_TYPES.includes(blockObj.type)) {
    errors.push({
      path: `${pathPrefix}.type`,
      message: `Unsupported block type '${String(blockObj.type)}'`,
    });
    return errors;
  }

  const blockType = blockObj.type;

  // Validate Data Payload
  const dataErrors = validateNodeData(blockType, blockObj.data, pathPrefix);
  errors.push(...dataErrors);

  // Recursive Children Validation (Extensible design)
  if ("children" in blockObj && blockObj.children !== undefined) {
    const childrenErrors = validateChildren(blockObj.children, blockObj.id as string, seenIds, `${pathPrefix}.children`);
    errors.push(...childrenErrors);
  }

  return errors;
}

/**
 * Validates child AST nodes recursively.
 */
export function validateChildren(
  children: unknown,
  _parentId: string,
  seenIds: Set<string>,
  pathPrefix: string
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (!Array.isArray(children)) {
    errors.push({
      path: pathPrefix,
      message: "Children must be an array of AST nodes",
    });
    return errors;
  }

  children.forEach((child, index) => {
    const childErrors = validateNode(child, index, seenIds, `${pathPrefix}[${index}]`);
    errors.push(...childErrors);
  });

  return errors;
}

/**
 * Validates an array of AST blocks.
 */
export function validateBlocks(
  blocks: unknown,
  seenIds: Set<string> = new Set<string>(),
  parentPath = "blocks"
): ValidationErrorItem[] {
  const errors: ValidationErrorItem[] = [];

  if (blocks === undefined || blocks === null) {
    errors.push({
      path: parentPath,
      message: "blocks array is required",
    });
    return errors;
  }

  if (!Array.isArray(blocks)) {
    errors.push({
      path: parentPath,
      message: "blocks must be an array",
    });
    return errors;
  }

  blocks.forEach((block, index) => {
    const nodeErrors = validateNode(block, index, seenIds, `${parentPath}[${index}]`);
    errors.push(...nodeErrors);
  });

  return errors;
}

/**
 * Validates a complete SyncDoc Document object against AST structural rules.
 */
export function validateDocument(doc: unknown): ValidationResult {
  const errors: ValidationErrorItem[] = [];

  if (doc === undefined || doc === null || typeof doc !== "object") {
    return {
      isValid: false,
      errors: [{ path: "document", message: "Document payload must be an object" }],
    };
  }

  const docObj = doc as Record<string, unknown>;

  // Title validation
  if (docObj.title === undefined || docObj.title === null) {
    errors.push({ path: "title", message: "title is required" });
  } else if (typeof docObj.title !== "string") {
    errors.push({ path: "title", message: "title must be a string" });
  } else if (docObj.title.trim() === "") {
    errors.push({ path: "title", message: "title must not be empty or whitespace" });
  }

  // Owner ID validation
  if (docObj.ownerId === undefined || docObj.ownerId === null) {
    errors.push({ path: "ownerId", message: "ownerId is required" });
  } else if (typeof docObj.ownerId !== "string") {
    errors.push({ path: "ownerId", message: "ownerId must be a string" });
  } else if (docObj.ownerId.trim() === "") {
    errors.push({ path: "ownerId", message: "ownerId must not be empty or whitespace" });
  }

  // Version validation
  if (docObj.version !== undefined && docObj.version !== null) {
    if (typeof docObj.version !== "number" || isNaN(docObj.version) || docObj.version < 0) {
      errors.push({ path: "version", message: "version must be a non-negative number" });
    } else if (!Number.isInteger(docObj.version)) {
      errors.push({ path: "version", message: "version must be an integer" });
    }
  }

  // Blocks array & AST recursive node validation
  const seenIds = new Set<string>();
  const blockErrors = validateBlocks(docObj.blocks, seenIds, "blocks");
  errors.push(...blockErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Canonical entry point for AST document validation.
 * Validates a complete SyncDoc Document object against all AST structural rules
 * including metadata, recursive block traversal, and structural relationships.
 *
 * Flow:
 *   validateDocumentAST(document)
 *     → validate document metadata (title, ownerId, version)
 *     → validate root blocks array
 *     → validate each node (id, type, data)
 *     → validate nested children recursively
 *     → check structural relationships (unique IDs, valid types)
 *     → return valid / validation errors
 */
export function validateDocumentAST(doc: unknown): ValidationResult {
  return validateDocument(doc);
}

export { validateASTChange } from "./astChangeValidator.js";

