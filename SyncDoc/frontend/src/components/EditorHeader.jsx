/**
 * EditorHeader — document title, undo/redo, export, and connection status.
 */
import React, { useState, useRef } from 'react';
import ConnectionStatus from './ConnectionStatus.jsx';

export default function EditorHeader({
  title,
  onRename,
  connectionStatus,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportHtml,
  onExportPdf,
  onBackToWorkspace,
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef(null);

  const [prevTitle, setPrevTitle] = useState(title);

  if (title !== prevTitle) {
    setPrevTitle(title);
    setEditValue(title);
  }

  const handleStartEdit = () => {
    setEditing(true);
    setEditValue(title);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleSave = () => {
    setEditing(false);
    if (editValue.trim() && editValue.trim() !== title) {
      onRename(editValue.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditing(false);
      setEditValue(title);
    }
  };

  return (
    <header className="editor-header">
      <div className="editor-header-left">
        {onBackToWorkspace && (
          <button
            className="btn-back-workspace"
            onClick={onBackToWorkspace}
            title="Back to Workspace"
            id="btn-back-workspace"
          >
            ← Workspace
          </button>
        )}
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="title-input"
            autoFocus
            id="document-title-input"
          />
        ) : (
          <div className="title-wrapper">
            <h1
              className="document-title"
              onClick={handleStartEdit}
              title="Click to rename"
              id="document-title"
            >
              {title || 'Untitled Document'}
            </h1>
            <div className="document-subtitle">
              <span className="last-edited-dot">●</span>
              <span>Last edited just now</span>
            </div>
          </div>
        )}
      </div>

      <div className="editor-header-actions">
        <div className="action-group">
          <button
            className="btn-action"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            id="btn-undo"
          >
            ↩
          </button>
          <button
            className="btn-action"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            id="btn-redo"
          >
            ↪
          </button>
        </div>

        <div className="action-group">
          <button
            className="btn-action btn-export"
            onClick={onExportHtml}
            title="Export as HTML"
            id="btn-export-html"
          >
            📄 HTML
          </button>
          <button
            className="btn-action btn-export"
            onClick={onExportPdf}
            title="Export as PDF"
            id="btn-export-pdf"
          >
            📑 PDF
          </button>
        </div>

        <ConnectionStatus status={connectionStatus} />
      </div>
    </header>
  );
}
