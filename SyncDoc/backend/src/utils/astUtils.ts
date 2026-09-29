import type { AstBlock } from "../models/AstNode.js";

export type ASTVisitorCallback = (node: AstBlock, path: string) => void;

/**
 * Recursively traverses an array of AST nodes preserving original ordering.
 * Invokes callback for each node (and its nested children if present).
 */
export function traverseAST(
  nodes: AstBlock[],
  callback: ASTVisitorCallback,
  pathPrefix = "blocks"
): void {
  if (!Array.isArray(nodes)) return;

  nodes.forEach((node, index) => {
    const currentPath = `${pathPrefix}[${index}]`;
    callback(node, currentPath);

    const record = node as unknown as Record<string, unknown>;
    if ("children" in record && Array.isArray(record.children)) {
      traverseAST(record.children as AstBlock[], callback, `${currentPath}.children`);
    }
  });
}

/**
 * Collects all block IDs across flat and nested AST node structures.
 */
export function collectNodeIds(nodes: AstBlock[]): string[] {
  const ids: string[] = [];
  traverseAST(nodes, (node) => {
    if (node.id && typeof node.id === "string") {
      ids.push(node.id.trim());
    }
  });
  return ids;
}

/**
 * Recursively searches root blocks and nested children for a node matching target blockId.
 * Returns the matching AstBlock or undefined if not found.
 */
export function findNodeById(nodes: AstBlock[], blockId: string): AstBlock | undefined {
  if (!blockId || typeof blockId !== "string") return undefined;

  const targetId = blockId.trim();
  let foundNode: AstBlock | undefined;

  traverseAST(nodes, (node) => {
    if (foundNode) return; // Stop searching once found
    if (node.id && node.id.trim() === targetId) {
      foundNode = node;
    }
  });

  return foundNode;
}

/**
 * Checks whether an array of AST blocks contains duplicate IDs.
 * Uses collectNodeIds() for recursive ID gathering.
 *
 * Returns an object with:
 *   - hasDuplicates: boolean indicating if duplicates exist
 *   - duplicateIds: array of the IDs that appear more than once
 */
export function hasDuplicateIds(nodes: AstBlock[]): { hasDuplicates: boolean; duplicateIds: string[] } {
  const allIds = collectNodeIds(nodes);
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of allIds) {
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  }

  return {
    hasDuplicates: duplicates.size > 0,
    duplicateIds: Array.from(duplicates),
  };
}

/**
 * Normalizes an individual AST block node and recursively normalizes its children if present.
 *
 * Normalization trims structural metadata (id, type, language) but does NOT:
 * - Delete user content
 * - Reorder blocks
 * - Regenerate stable IDs
 * - Change block types
 * - Silently coerce invalid data into valid data
 * - Modify meaningful document text
 */
export function normalizeBlock(block: unknown): Record<string, unknown> {
  if (!block || typeof block !== "object") return block as Record<string, unknown>;

  const src = block as Record<string, unknown>;
  const blockObj: Record<string, unknown> = {};

  // Safely copy properties guarding against prototype pollution keys
  for (const key of Object.keys(src)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    blockObj[key] = src[key];
  }

  // Normalize ID and type metadata (trim whitespace only)
  if (typeof blockObj.id === "string") {
    blockObj.id = blockObj.id.trim();
  }
  if (typeof blockObj.type === "string") {
    blockObj.type = blockObj.type.trim();
  }

  // Normalize data payload based on type
  if (blockObj.data && typeof blockObj.data === "object") {
    const dataSrc = blockObj.data as Record<string, unknown>;
    const dataObj: Record<string, unknown> = {};

    for (const key of Object.keys(dataSrc)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        continue;
      }
      dataObj[key] = dataSrc[key];
    }

    // Trim code language metadata (structural, not content)
    if (blockObj.type === "code" && typeof dataObj.language === "string") {
      dataObj.language = dataObj.language.trim();
    }

    // Ensure list items is consistently an array representation (do NOT coerce ordered flag)
    if (blockObj.type === "list") {
      if (dataObj.items !== undefined && dataObj.items !== null && !Array.isArray(dataObj.items)) {
        // Leave invalid items as-is for validation to catch
      }
    }

    blockObj.data = dataObj;
  }

  // Normalize children recursively if present
  if (Array.isArray(blockObj.children)) {
    blockObj.children = blockObj.children.map((child) => normalizeBlock(child));
  }

  return blockObj;
}

/**
 * Normalizes AST document payloads without altering valid document text content or block order.
 * Trims structural metadata, preserves stable block IDs.
 *
 * Normalization must NOT hide invalid input — missing fields or invalid types
 * must still be caught by validation after normalization.
 */
export function normalizeAST<T extends Record<string, unknown>>(input: T): T {
  if (!input || typeof input !== "object") return input;

  const src = input as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  for (const key of Object.keys(src)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    normalized[key] = src[key];
  }

  // Normalize document title & ownerId metadata
  if (typeof normalized.title === "string") {
    normalized.title = normalized.title.trim();
  }
  if (typeof normalized.ownerId === "string") {
    normalized.ownerId = normalized.ownerId.trim();
  }

  // Normalize blocks array while preserving block ordering & stable IDs
  if (Array.isArray(normalized.blocks)) {
    normalized.blocks = normalized.blocks.map((block) => normalizeBlock(block));
  }

  return normalized as T;
}

export { applyASTChange } from "./astChangeUtils.js";

