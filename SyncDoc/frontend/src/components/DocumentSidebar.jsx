/**
 * DocumentSidebar — document list with search, create, rename, delete.
 */
import React, { useState } from 'react';

export default function DocumentSidebar({
  documents,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  loading,
  user,
  onLogout,
  onBackToWorkspace,
}) {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filtered = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartRename = (e, doc) => {
    e.stopPropagation();
    setEditingId(doc._id);
    setEditTitle(doc.title);
  };

  const handleRename = (e) => {
    e.preventDefault();
    if (editTitle.trim() && editingId) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (e, docId) => {
    e.stopPropagation();
    if (confirmDeleteId === docId) {
      onDelete(docId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(docId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const DOC_ACCENT_COLORS = ['#818cf8', '#2dd4bf', '#f472b6', '#fb923c', '#c084fc'];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div
          className="sidebar-brand"
          onClick={onBackToWorkspace}
          style={{ cursor: onBackToWorkspace ? 'pointer' : 'default' }}
          title={onBackToWorkspace ? 'Back to Workspace' : undefined}
        >
          <div className="brand-logo-tile">
            <span>N</span>
          </div>
          <div className="brand-info">
            <h2 className="sidebar-title">SyncDoc</h2>
            <span className="sidebar-subtitle">Write · Collaborate · Create</span>
          </div>
        </div>
        <button
          className="btn-new-doc"
          onClick={onCreate}
          title="New Document"
          id="btn-new-document"
        >
          <span>+</span>
        </button>
      </div>

      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            id="search-documents"
          />
          <kbd className="search-shortcut">Ctrl K</kbd>
        </div>
      </div>

      <div className="sidebar-list">
        {loading && (
          <div className="sidebar-loading">Loading documents...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="sidebar-empty">
            {search ? 'No matches found' : 'No documents yet'}
          </div>
        )}

        {filtered.map((doc, index) => {
          const color = DOC_ACCENT_COLORS[index % DOC_ACCENT_COLORS.length];
          const isSelected = selectedId === doc._id;

          return (
            <div
              key={doc._id}
              className={`sidebar-item ${isSelected ? 'active' : ''}`}
              onClick={() => onSelect(doc._id)}
              id={`doc-${doc._id}`}
            >
              {editingId === doc._id ? (
                <form onSubmit={handleRename} className="rename-form">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleCancelRename}
                    onKeyDown={(e) => e.key === 'Escape' && handleCancelRename()}
                    autoFocus
                    className="rename-input"
                  />
                </form>
              ) : (
                <>
                  <div
                    className="doc-icon-badge"
                    style={{ backgroundColor: `${color}20`, color: color }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                  </div>
                  <div className="sidebar-item-content">
                    <span className="sidebar-item-title">{doc.title}</span>
                    <span className="sidebar-item-date">
                      {doc.updatedAt
                        ? new Date(doc.updatedAt).toLocaleDateString()
                        : ''}
                    </span>
                  </div>
                  {isSelected && (
                    <span
                      className="active-doc-dot"
                      style={{ backgroundColor: color }}
                    />
                  )}
                  <div className="sidebar-item-actions">
                    <button
                      className="btn-icon"
                      onClick={(e) => handleStartRename(e, doc)}
                      title="Rename"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={(e) => handleDelete(e, doc._id)}
                      title={confirmDeleteId === doc._id ? 'Click again to confirm' : 'Delete'}
                    >
                      {confirmDeleteId === doc._id ? '⚠️' : '🗑️'}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Quote card at bottom of sidebar */}
      <div className="sidebar-quote-card">
        <span className="quote-icon">“</span>
        <span className="quote-text">Better docs, brighter ideas.</span>
      </div>

      {/* User profile & Logout bar */}
      <div className="sidebar-user-footer">
        <div className="user-avatar-badge">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.name || 'SyncDoc User'}</span>
          <span className="user-email">{user?.email || 'user@syncdoc.io'}</span>
        </div>
        <button
          className="btn-logout"
          onClick={onLogout}
          title="Sign out of SyncDoc"
          id="btn-logout"
        >
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
