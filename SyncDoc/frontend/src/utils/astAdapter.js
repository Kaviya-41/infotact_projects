/**
 * AST Adapter — converts between backend AST blocks and editor representation.
 *
 * Backend AST shape:
 *   { id: string, type: "heading"|"paragraph"|"code"|"list", data: { text?, code?, language?, ordered?, items? } }
 *
 * The editor uses backend shape directly where practical.
 * This module provides helpers for creating new blocks and extracting display content.
 */

/**
 * Generate a unique block ID (UUID v4 string).
 */
export function generateBlockId() {
  return crypto.randomUUID();
}

/**
 * Get the primary display text/content from a backend AST block.
 */
export function getBlockContent(block) {
  if (!block || !block.data) return '';
  switch (block.type) {
    case 'heading':
    case 'paragraph':
      return block.data.text || '';
    case 'code':
      return block.data.code || '';
    case 'list':
      return (block.data.items || []).join('\n');
    default:
      return '';
  }
}

/**
 * Set the primary content on a backend AST block, returning a new block object.
 */
export function setBlockContent(block, content) {
  const updated = { ...block, data: { ...block.data } };
  switch (block.type) {
    case 'heading':
    case 'paragraph':
      updated.data.text = content;
      break;
    case 'code':
      updated.data.code = content;
      break;
    case 'list':
      updated.data.items = content.split('\n').filter((s) => s.length > 0 || content === '');
      if (updated.data.items.length === 0) updated.data.items = [''];
      break;
    default:
      break;
  }
  return updated;
}

/**
 * Create a new empty block with the given type.
 */
export function createEmptyBlock(type = 'paragraph') {
  const id = generateBlockId();
  switch (type) {
    case 'heading':
      return { id, type: 'heading', data: { text: '' } };
    case 'paragraph':
      return { id, type: 'paragraph', data: { text: '' } };
    case 'code':
      return { id, type: 'code', data: { language: 'javascript', code: '' } };
    case 'list':
      return { id, type: 'list', data: { ordered: false, items: [''] } };
    default:
      return { id, type: 'paragraph', data: { text: '' } };
  }
}

/**
 * Convert a block to a different type, preserving content where possible.
 */
export function convertBlockType(block, newType) {
  if (block.type === newType) return block;
  const content = getBlockContent(block);
  const newBlock = createEmptyBlock(newType);
  newBlock.id = block.id; // preserve stable ID
  return setBlockContent(newBlock, content);
}

/**
 * Duplicate a block with a new unique ID.
 */
export function duplicateBlock(block) {
  const newBlock = JSON.parse(JSON.stringify(block));
  newBlock.id = generateBlockId();
  return newBlock;
}
