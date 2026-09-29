import { useState, useRef, useEffect } from 'react';

const BLOCK_TYPES = [
  { value: 'heading', label: 'Heading', icon: '📌' },
  { value: 'paragraph', label: 'Paragraph', icon: '📝' },
  { value: 'code', label: 'Code', icon: '💻' },
  { value: 'list', label: 'List', icon: '📋' },
];

export default function AddBlockMenu({ onAddBlock, buttonText = '+ Add Block', id, style }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (type) => {
    onAddBlock(type);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="add-block-wrapper" style={style}>
      <button
        type="button"
        className="btn-add-block"
        onClick={() => setIsOpen((prev) => !prev)}
        id={id}
      >
        {buttonText}
      </button>

      {isOpen && (
        <div className="add-block-menu" id={`${id || 'add-block'}-menu`}>
          {BLOCK_TYPES.map((bt) => (
            <button
              key={bt.value}
              type="button"
              className="add-block-option"
              onClick={() => handleSelect(bt.value)}
              id={`add-block-option-${bt.value}`}
            >
              <span className="add-block-option-icon">{bt.icon}</span>
              <span className="add-block-option-label">{bt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
