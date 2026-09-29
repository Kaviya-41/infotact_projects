/**
 * useYjsDocument — React hook bridging Yjs collaborative state with React rendering.
 *
 * Architecture:
 *   Y.Doc = collaborative source of truth
 *   React state = UI projection of Y.Doc
 *
 * The hook:
 *   1. Creates/destroys SyncDocProvider when documentId changes
 *   2. Observes yDoc.getArray("blocks") for deep changes
 *   3. Provides mutation functions that modify Y.Doc directly
 *   4. Uses Y.UndoManager for undo/redo
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Y from 'yjs';
import { SyncDocProvider } from '../realtime/yjsProvider.js';
import { generateBlockId } from '../utils/astAdapter.js';

/**
 * Convert a Y.Map block to a plain JS object.
 */
function yMapToPlainBlock(yBlock) {
  if (!(yBlock instanceof Y.Map)) return null;

  const id = yBlock.get('id');
  const type = yBlock.get('type');
  const yData = yBlock.get('data');

  if (typeof id !== 'string' || typeof type !== 'string') return null;

  let data = {};
  if (yData instanceof Y.Map) {
    data = yData.toJSON();
    // Handle Y.Array items specially
    const itemsVal = yData.get('items');
    if (itemsVal instanceof Y.Array) {
      data.items = itemsVal.toArray().map(String);
    }
  } else if (yData && typeof yData === 'object') {
    data = { ...yData };
  }

  return { id, type, data };
}

/**
 * Convert a plain block to a Y.Map (mirrors backend's astYjsMap.ts astBlockToYMap).
 */
function plainBlockToYMap(block) {
  const yBlock = new Y.Map();
  yBlock.set('id', block.id);
  yBlock.set('type', block.type);

  const yData = new Y.Map();
  if (block.type === 'heading' || block.type === 'paragraph') {
    yData.set('text', typeof block.data?.text === 'string' ? block.data.text : '');
  } else if (block.type === 'code') {
    yData.set('language', typeof block.data?.language === 'string' ? block.data.language : 'javascript');
    yData.set('code', typeof block.data?.code === 'string' ? block.data.code : '');
  } else if (block.type === 'list') {
    yData.set('ordered', Boolean(block.data?.ordered));
    const yItems = new Y.Array();
    const items = Array.isArray(block.data?.items) ? block.data.items.map(String) : [''];
    yItems.insert(0, items);
    yData.set('items', yItems);
  }

  yBlock.set('data', yData);
  return yBlock;
}

/**
 * Read all blocks from the Y.Doc as plain JS objects.
 */
function readBlocks(yDoc) {
  const yBlocks = yDoc.getArray('blocks');
  const blocks = [];
  for (let i = 0; i < yBlocks.length; i++) {
    const block = yMapToPlainBlock(yBlocks.get(i));
    if (block) blocks.push(block);
  }
  return blocks;
}

export function useYjsDocument(documentId) {
  const [blocks, setBlocks] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [synced, setSynced] = useState(false);
  const providerRef = useRef(null);
  const undoManagerRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!documentId) return;

    // Create provider
    const provider = new SyncDocProvider(documentId);
    providerRef.current = provider;
    const yDoc = provider.yDoc;
    const yBlocks = yDoc.getArray('blocks');

    // Set up UndoManager on the blocks array
    const undoManager = new Y.UndoManager(yBlocks, {
      trackedOrigins: new Set([null]), // track local user changes (origin = null)
    });
    undoManagerRef.current = undoManager;

    const updateUndoState = () => {
      setCanUndo(undoManager.canUndo());
      setCanRedo(undoManager.canRedo());
    };

    undoManager.on('stack-item-added', updateUndoState);
    undoManager.on('stack-item-popped', updateUndoState);
    undoManager.on('stack-cleared', updateUndoState);

    // Observe blocks changes (deep)
    const observer = () => {
      setBlocks(readBlocks(yDoc));
      updateUndoState();
    };

    yBlocks.observeDeep(observer);

    // Listen to status and sync
    provider.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    provider.onSync(() => {
      setSynced(true);
      // Read initial state after sync
      setBlocks(readBlocks(yDoc));
      updateUndoState();
    });

    return () => {
      yBlocks.unobserveDeep(observer);
      undoManager.destroy();
      undoManagerRef.current = null;
      provider.destroy();
      providerRef.current = null;
      setSynced(false);
      setCanUndo(false);
      setCanRedo(false);
    };
  }, [documentId]);

  /**
   * Update a block's data field.
   * For heading/paragraph: updateBlock(blockId, { text: 'new text' })
   * For code: updateBlock(blockId, { code: 'new code', language: 'python' })
   * For list: updateBlock(blockId, { items: ['a', 'b'], ordered: true })
   */
  const updateBlock = useCallback((blockId, dataUpdate) => {
    const provider = providerRef.current;
    if (!provider) return;

    const yBlocks = provider.yDoc.getArray('blocks');
    for (let i = 0; i < yBlocks.length; i++) {
      const yBlock = yBlocks.get(i);
      if (yBlock instanceof Y.Map && yBlock.get('id') === blockId) {
        const yData = yBlock.get('data');
        if (yData instanceof Y.Map) {
          provider.yDoc.transact(() => {
            for (const [key, value] of Object.entries(dataUpdate)) {
              if (key === 'items' && Array.isArray(value)) {
                // Replace the Y.Array items
                const existingItems = yData.get('items');
                if (existingItems instanceof Y.Array) {
                  existingItems.delete(0, existingItems.length);
                  existingItems.insert(0, value.map(String));
                } else {
                  const yItems = new Y.Array();
                  yItems.insert(0, value.map(String));
                  yData.set('items', yItems);
                }
              } else {
                yData.set(key, value);
              }
            }
          });
        }
        break;
      }
    }
  }, []);

  /**
   * Add a new block at a specific index (or end if not specified).
   */
  const addBlock = useCallback((type = 'paragraph', index = -1) => {
    const provider = providerRef.current;
    if (!provider) return;

    const yBlocks = provider.yDoc.getArray('blocks');
    const newBlock = {
      id: generateBlockId(),
      type,
      data: type === 'heading' || type === 'paragraph'
        ? { text: '' }
        : type === 'code'
          ? { language: 'javascript', code: '' }
          : { ordered: false, items: [''] },
    };

    const yMap = plainBlockToYMap(newBlock);
    const insertIndex = index >= 0 ? Math.min(index, yBlocks.length) : yBlocks.length;
    yBlocks.insert(insertIndex, [yMap]);
    return newBlock.id;
  }, []);

  /**
   * Delete a block by ID.
   */
  const deleteBlock = useCallback((blockId) => {
    const provider = providerRef.current;
    if (!provider) return;

    const yBlocks = provider.yDoc.getArray('blocks');
    for (let i = 0; i < yBlocks.length; i++) {
      const yBlock = yBlocks.get(i);
      if (yBlock instanceof Y.Map && yBlock.get('id') === blockId) {
        yBlocks.delete(i, 1);
        break;
      }
    }
  }, []);

  /**
   * Move a block up or down.
   */
  const moveBlock = useCallback((blockId, direction) => {
    const provider = providerRef.current;
    if (!provider) return;

    const yBlocks = provider.yDoc.getArray('blocks');
    let fromIndex = -1;
    for (let i = 0; i < yBlocks.length; i++) {
      const yBlock = yBlocks.get(i);
      if (yBlock instanceof Y.Map && yBlock.get('id') === blockId) {
        fromIndex = i;
        break;
      }
    }

    if (fromIndex < 0) return;
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= yBlocks.length) return;

    provider.yDoc.transact(() => {
      // Read current block as plain, remove it, re-insert at new position
      const currentBlock = yMapToPlainBlock(yBlocks.get(fromIndex));
      if (!currentBlock) return;
      yBlocks.delete(fromIndex, 1);
      const yMap = plainBlockToYMap(currentBlock);
      yBlocks.insert(toIndex, [yMap]);
    });
  }, []);

  /**
   * Duplicate a block (insert copy below it).
   */
  const duplicateBlockAction = useCallback((blockId) => {
    const provider = providerRef.current;
    if (!provider) return;

    const yBlocks = provider.yDoc.getArray('blocks');
    for (let i = 0; i < yBlocks.length; i++) {
      const yBlock = yBlocks.get(i);
      if (yBlock instanceof Y.Map && yBlock.get('id') === blockId) {
        const original = yMapToPlainBlock(yBlock);
        if (!original) return;
        const copy = { ...original, id: generateBlockId(), data: { ...original.data } };
        if (copy.data.items) copy.data.items = [...copy.data.items];
        const yMap = plainBlockToYMap(copy);
        yBlocks.insert(i + 1, [yMap]);
        break;
      }
    }
  }, []);

  /**
   * Change a block's type, preserving content where possible.
   */
  const changeBlockType = useCallback((blockId, newType) => {
    const provider = providerRef.current;
    if (!provider) return;

    const yBlocks = provider.yDoc.getArray('blocks');
    for (let i = 0; i < yBlocks.length; i++) {
      const yBlock = yBlocks.get(i);
      if (yBlock instanceof Y.Map && yBlock.get('id') === blockId) {
        const currentBlock = yMapToPlainBlock(yBlock);
        if (!currentBlock || currentBlock.type === newType) return;

        // Extract content from current block
        let content = '';
        if (currentBlock.type === 'heading' || currentBlock.type === 'paragraph') {
          content = currentBlock.data.text || '';
        } else if (currentBlock.type === 'code') {
          content = currentBlock.data.code || '';
        } else if (currentBlock.type === 'list') {
          content = (currentBlock.data.items || []).join('\n');
        }

        // Build new block with same ID
        const newBlock = { id: currentBlock.id, type: newType, data: {} };
        if (newType === 'heading' || newType === 'paragraph') {
          newBlock.data.text = content;
        } else if (newType === 'code') {
          newBlock.data = { language: 'javascript', code: content };
        } else if (newType === 'list') {
          const items = content.split('\n').filter(s => s.length > 0);
          newBlock.data = { ordered: false, items: items.length > 0 ? items : [''] };
        }

        provider.yDoc.transact(() => {
          yBlocks.delete(i, 1);
          yBlocks.insert(i, [plainBlockToYMap(newBlock)]);
        });
        break;
      }
    }
  }, []);

  /**
   * Undo the last local change.
   */
  const undo = useCallback(() => {
    undoManagerRef.current?.undo();
  }, []);

  /**
   * Redo the last undone local change.
   */
  const redo = useCallback(() => {
    undoManagerRef.current?.redo();
  }, []);

  return {
    blocks,
    connectionStatus,
    synced,
    updateBlock,
    addBlock,
    deleteBlock,
    moveBlock,
    duplicateBlock: duplicateBlockAction,
    changeBlockType,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
