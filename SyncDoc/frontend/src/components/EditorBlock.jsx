/**
 * EditorBlock — renders and edits a single AST block.
 * Supports heading, paragraph, code, and list block types.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';

const BLOCK_TYPES = [
  { value: 'heading', label: '📌 Heading' },
  { value: 'paragraph', label: '📝 Paragraph' },
  { value: 'code', label: '💻 Code' },
  { value: 'list', label: '📋 List' },
];

const CODE_LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'ruby', 'php', 'html', 'css', 'sql', 'bash', 'json',
  'yaml', 'markdown', 'text',
];

export default function EditorBlock({
  block,
  index,
  totalBlocks,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onChangeType,
  onAddBlockBelow,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [showAddTypeSelect, setShowAddTypeSelect] = useState(false);
  const blockRef = useRef(null);

  // Close toolbar/menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (blockRef.current && !blockRef.current.contains(e.target)) {
        setIsFocused(false);
        setIsHovered(false);
        setShowTypeSelect(false);
        setShowAddTypeSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback((e) => {
    if (blockRef.current && !blockRef.current.contains(e.relatedTarget)) {
      setIsFocused(false);
    }
  }, []);

  const showControls = isHovered || isFocused || showTypeSelect || showAddTypeSelect;

  const handleTextChange = useCallback((e) => {
    onUpdate(block.id, { text: e.target.value });
  }, [block.id, onUpdate]);

  const handleCodeChange = useCallback((e) => {
    onUpdate(block.id, { code: e.target.value });
  }, [block.id, onUpdate]);

  const handleLanguageChange = useCallback((e) => {
    onUpdate(block.id, { language: e.target.value });
  }, [block.id, onUpdate]);

  const handleListItemChange = useCallback((itemIndex, newValue) => {
    const items = [...(block.data?.items || [''])];
    items[itemIndex] = newValue;
    onUpdate(block.id, { items });
  }, [block.id, block.data, onUpdate]);

  const handleAddListItem = useCallback(() => {
    const items = [...(block.data?.items || ['']), ''];
    onUpdate(block.id, { items });
  }, [block.id, block.data, onUpdate]);

  const handleRemoveListItem = useCallback((itemIndex) => {
    const items = [...(block.data?.items || [''])];
    if (items.length <= 1) return;
    items.splice(itemIndex, 1);
    onUpdate(block.id, { items });
  }, [block.id, block.data, onUpdate]);

  const handleToggleOrdered = useCallback(() => {
    onUpdate(block.id, { ordered: !block.data?.ordered });
  }, [block.id, block.data, onUpdate]);

  const handleListKeyDown = useCallback((e, itemIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const items = [...(block.data?.items || [''])];
      items.splice(itemIndex + 1, 0, '');
      onUpdate(block.id, { items });
      // Focus next input after render
      setTimeout(() => {
        const inputs = blockRef.current?.querySelectorAll('.list-item-input');
        inputs?.[itemIndex + 1]?.focus();
      }, 50);
    } else if (e.key === 'Backspace' && e.target.value === '' && (block.data?.items || []).length > 1) {
      e.preventDefault();
      handleRemoveListItem(itemIndex);
      setTimeout(() => {
        const inputs = blockRef.current?.querySelectorAll('.list-item-input');
        const focusIdx = Math.max(0, itemIndex - 1);
        inputs?.[focusIdx]?.focus();
      }, 50);
    }
  }, [block.id, block.data, onUpdate, handleRemoveListItem]);

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading':
        return (
          <input
            type="text"
            className="block-input block-heading-input"
            value={block.data?.text || ''}
            onChange={handleTextChange}
            placeholder="Heading..."
            id={`block-${block.id}-input`}
          />
        );

      case 'paragraph':
        return (
          <textarea
            className="block-input block-paragraph-input"
            value={block.data?.text || ''}
            onChange={handleTextChange}
            placeholder="Start writing..."
            rows={Math.max(2, (block.data?.text || '').split('\n').length)}
            id={`block-${block.id}-input`}
          />
        );

      case 'code':
        return (
          <div className="code-block-wrapper">
            <div className="code-block-header">
              <select
                className="language-select"
                value={block.data?.language || 'javascript'}
                onChange={handleLanguageChange}
                id={`block-${block.id}-language`}
              >
                {CODE_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <textarea
              className="block-input block-code-input"
              value={block.data?.code || ''}
              onChange={handleCodeChange}
              placeholder="// Write code here..."
              rows={Math.max(3, (block.data?.code || '').split('\n').length)}
              spellCheck={false}
              id={`block-${block.id}-input`}
            />
          </div>
        );

      case 'list':
        return (
          <div className="list-block-wrapper">
            <div className="list-block-header">
              <button
                className={`list-type-toggle ${block.data?.ordered ? 'ordered' : ''}`}
                onClick={handleToggleOrdered}
                title={block.data?.ordered ? 'Switch to unordered' : 'Switch to ordered'}
              >
                {block.data?.ordered ? '1. Ordered' : '• Unordered'}
              </button>
            </div>
            <div className="list-items">
              {(block.data?.items || ['']).map((item, i) => (
                <div key={i} className="list-item-row">
                  <span className="list-item-marker">
                    {block.data?.ordered ? `${i + 1}.` : '•'}
                  </span>
                  <input
                    type="text"
                    className="list-item-input"
                    value={item}
                    onChange={(e) => handleListItemChange(i, e.target.value)}
                    onKeyDown={(e) => handleListKeyDown(e, i)}
                    placeholder="List item..."
                    id={`block-${block.id}-item-${i}`}
                  />
                  {(block.data?.items || []).length > 1 && (
                    <button
                      className="btn-remove-item"
                      onClick={() => handleRemoveListItem(i)}
                      title="Remove item"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              className="btn-add-item"
              onClick={handleAddListItem}
              title="Add list item"
            >
              + Add item
            </button>
          </div>
        );

      default:
        return <div className="block-unknown">Unknown block type: {block.type}</div>;
    }
  };

  return (
    <div
      ref={blockRef}
      className={`editor-block block-type-${block.type} ${isFocused ? 'focused' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      id={`editor-block-${block.id}`}
    >
      <div className="block-gutter">
        <span className="block-type-label">{block.type}</span>
      </div>

      <div className="block-content">{renderBlockContent()}</div>

      {showControls && (
        <div
          className="block-toolbar"
          onMouseDown={(e) => e.preventDefault()}
        >
          <button
            className="btn-block-action"
            onClick={() => onMoveUp(block.id)}
            disabled={index === 0}
            title="Move up"
          >
            ▲
          </button>
          <button
            className="btn-block-action"
            onClick={() => onMoveDown(block.id)}
            disabled={index === totalBlocks - 1}
            title="Move down"
          >
            ▼
          </button>
          <button
            className="btn-block-action"
            onClick={() => onDuplicate(block.id)}
            title="Duplicate"
          >
            ⧉
          </button>
          <button
            className="btn-block-action"
            onClick={() => {
              setShowTypeSelect(!showTypeSelect);
              setShowAddTypeSelect(false);
            }}
            title="Change type"
          >
            ⚙
          </button>
          <button
            className="btn-block-action"
            onClick={() => {
              setShowAddTypeSelect(!showAddTypeSelect);
              setShowTypeSelect(false);
            }}
            title="Add block below"
          >
            +
          </button>
          <button
            type="button"
            className="btn-block-action btn-block-delete"
            onClick={() => onDelete(block.id)}
            title="Delete block"
            id={`btn-delete-block-${block.id}`}
          >
            🗑️
          </button>

          {showTypeSelect && (
            <div className="type-select-dropdown">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  className={`type-select-option ${block.type === bt.value ? 'active' : ''}`}
                  onClick={() => {
                    onChangeType(block.id, bt.value);
                    setShowTypeSelect(false);
                  }}
                >
                  {bt.label}
                </button>
              ))}
            </div>
          )}

          {showAddTypeSelect && (
            <div className="type-select-dropdown">
              {BLOCK_TYPES.map((bt) => (
                <button
                  key={bt.value}
                  className="type-select-option"
                  onClick={() => {
                    onAddBlockBelow(index + 1, bt.value);
                    setShowAddTypeSelect(false);
                  }}
                >
                  {bt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
