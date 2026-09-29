/**
 * WorkspaceDashboard — main hub after login, before opening the editor.
 * Shows document cards, recent activity, search, and navigation.
 */
import React, { useState, useMemo } from 'react';
import DocumentCard from './DocumentCard.jsx';
import { DOC_ACCENT_COLORS, getRelativeTime } from '../utils/documentUtils.js';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const NAV_ITEMS = [
  { id: 'overview', icon: '🏠', label: 'Overview' },
  { id: 'my-docs', icon: '📄', label: 'My Documents' },
  { id: 'shared', icon: '🤝', label: 'Shared With Me' },
  { id: 'recent', icon: '🕘', label: 'Recent' },
];

export default function WorkspaceDashboard({
  documents,
  loading,
  user,
  onOpenDocument,
  onCreateDocument,
  _onDeleteDocument,
  onLogout,
  onOpenSettings,
}) {
  const [search, setSearch] = useState('');
  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return documents;
    const q = search.toLowerCase();
    return documents.filter((doc) => doc.title.toLowerCase().includes(q));
  }, [documents, search]);

  // Sort by updatedAt descending for "recently edited"
  const recentDocs = useMemo(() => {
    return [...documents]
      .filter((d) => d.updatedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);
  }, [documents]);

  // Decide which documents to show based on active nav
  const displayDocs = useMemo(() => {
    if (activeNav === 'shared') return []; // No shared docs in demo
    return filtered;
  }, [activeNav, filtered]);

  const handleCreateNew = async () => {
    await onCreateDocument();
  };

  return (
    <div className="workspace-layout">
      {/* Ambient background */}
      <div className="bg-gradient-mesh" aria-hidden="true">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Mobile sidebar toggle */}
      <button
        className="workspace-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
        id="btn-toggle-sidebar"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="workspace-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Workspace Sidebar */}
      <aside className={`workspace-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="workspace-sidebar-brand">
          <div className="brand-logo-tile">
            <span>N</span>
          </div>
          <div className="brand-info">
            <h2 className="sidebar-title">SyncDoc</h2>
            <span className="sidebar-subtitle">Write · Collaborate · Create</span>
          </div>
        </div>

        <nav className="workspace-nav">
          <div className="workspace-nav-section">
            <span className="workspace-nav-label">Workspace</span>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`workspace-nav-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveNav(item.id);
                  setSidebarOpen(false);
                }}
                id={`nav-${item.id}`}
              >
                <span className="workspace-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="workspace-sidebar-bottom">
          <button className="workspace-nav-item" onClick={onOpenSettings} id="nav-settings">
            <span className="workspace-nav-icon">⚙</span>
            <span>Settings</span>
          </button>
          <button
            className="workspace-nav-item workspace-nav-logout"
            onClick={onLogout}
            id="nav-logout"
          >
            <span className="workspace-nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>

        {/* Sidebar user footer */}
        <div className="sidebar-user-footer">
          <div className="user-avatar-badge">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'SyncDoc User'}</span>
            <span className="user-email">{user?.email || 'user@syncdoc.io'}</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Content */}
      <main className="workspace-main">
        {/* Top bar: search + profile */}
        <div className="workspace-topbar">
          <div className="workspace-search-wrapper">
            <span className="workspace-search-icon">🔍</span>
            <input
              type="text"
              className="workspace-search-input"
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="workspace-search"
            />
          </div>
          <div className="workspace-profile">
            <div className="workspace-profile-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="workspace-profile-info">
              <span className="workspace-profile-name">{user?.name || 'SyncDoc User'}</span>
              <span className="workspace-profile-role">My Workspace</span>
            </div>
          </div>
        </div>

        {/* Greeting */}
        <div className="workspace-greeting">
          <h1>{getGreeting()} 👋</h1>
          <p>Welcome to your workspace</p>
        </div>

        {/* Scrollable content area */}
        <div className="workspace-content-scroll">
          {/* New Document CTA */}
          <button
            className="workspace-new-doc-card"
            onClick={handleCreateNew}
            id="btn-workspace-new-doc"
          >
            <span className="workspace-new-doc-icon">+</span>
            <div className="workspace-new-doc-text">
              <span className="workspace-new-doc-title">New Document</span>
              <span className="workspace-new-doc-sub">Start writing something new</span>
            </div>
          </button>

          {/* Loading state */}
          {loading && (
            <div className="workspace-loading">
              <div className="spinner"></div>
              <span>Loading documents...</span>
            </div>
          )}

          {/* Shared empty state */}
          {activeNav === 'shared' && (
            <div className="workspace-empty-state">
              <span className="workspace-empty-icon">🤝</span>
              <h3>No shared documents yet</h3>
              <p>Share a document link to start collaborating with others.</p>
            </div>
          )}

          {/* No documents state */}
          {!loading && activeNav !== 'shared' && documents.length === 0 && (
            <div className="workspace-empty-state">
              <span className="workspace-empty-icon">📄</span>
              <h3>No documents yet</h3>
              <p>Create your first document and start writing.</p>
              <button
                className="workspace-empty-cta"
                onClick={handleCreateNew}
                id="btn-empty-create"
              >
                + New Document
              </button>
            </div>
          )}

          {/* No search results */}
          {!loading && activeNav !== 'shared' && documents.length > 0 && filtered.length === 0 && search.trim() && (
            <div className="workspace-empty-state">
              <span className="workspace-empty-icon">🔍</span>
              <h3>No documents found</h3>
              <p>Try a different search term.</p>
            </div>
          )}

          {/* Document Cards Grid */}
          {!loading && displayDocs.length > 0 && (
            <>
              <div className="workspace-section-header">
                <h2>
                  {activeNav === 'recent' ? 'Recent Documents' :
                   activeNav === 'my-docs' ? 'My Documents' :
                   search.trim() ? 'Search Results' : 'Recent Documents'}
                </h2>
              </div>
              <div className="workspace-cards-grid">
                {displayDocs.map((doc, i) => (
                  <DocumentCard
                    key={doc._id}
                    doc={doc}
                    index={i}
                    onOpen={onOpenDocument}
                  />
                ))}
              </div>
            </>
          )}

          {/* Recently Edited List */}
          {!loading && activeNav === 'overview' && recentDocs.length > 0 && !search.trim() && (
            <>
              <div className="workspace-section-header workspace-section-recent">
                <h2>Recently Edited</h2>
              </div>
              <div className="workspace-recent-list">
                {recentDocs.map((doc, i) => {
                  const accent = DOC_ACCENT_COLORS[i % DOC_ACCENT_COLORS.length];
                  return (
                    <button
                      key={doc._id}
                      className="workspace-recent-item"
                      onClick={() => onOpenDocument(doc._id)}
                      id={`recent-${doc._id}`}
                    >
                      <div className="workspace-recent-icon" style={{ backgroundColor: accent.bg, color: accent.text }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                      </div>
                      <span className="workspace-recent-title">{doc.title}</span>
                      <span className="workspace-recent-time">{getRelativeTime(doc.updatedAt)}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
