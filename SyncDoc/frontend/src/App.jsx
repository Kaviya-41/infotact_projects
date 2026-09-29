import { useState, useEffect, useCallback } from 'react';
import DocumentSidebar from './components/DocumentSidebar.jsx';
import EditorHeader from './components/EditorHeader.jsx';
import EditorBlock from './components/EditorBlock.jsx';
import AddBlockMenu from './components/AddBlockMenu.jsx';
import LoginPage from './components/LoginPage.jsx';
import WorkspaceDashboard from './components/WorkspaceDashboard.jsx';
import SettingsPage from './components/SettingsPage.jsx';
import { useYjsDocument } from './hooks/useYjsDocument.js';
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  exportDocument,
} from './api/documentApi.js';
import { generateBlockId } from './utils/astAdapter.js';
import './App.css';

function App() {
  // Authentication state initialized from localStorage
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('syncdoc_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('syncdoc_token') || null;
    } catch {
      return null;
    }
  });

  // View state: 'login' | 'workspace' | 'editor' | 'settings'
  const [currentView, setCurrentView] = useState(() => user ? 'workspace' : 'login');

  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [selectedDocTitle, setSelectedDocTitle] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [toasts, setToasts] = useState([]);

  const handleLogin = (userData, token) => {
    setUser(userData);
    if (token) setAuthToken(token);
    setCurrentView('workspace');
    try {
      localStorage.setItem('syncdoc_user', JSON.stringify(userData));
      if (token) localStorage.setItem('syncdoc_token', token);
    } catch {
      // ignore storage error
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    setCurrentView('login');
    setSelectedDocId(null);
    setSelectedDocTitle('');
    try {
      localStorage.removeItem('syncdoc_user');
      localStorage.removeItem('syncdoc_token');
    } catch {
      // ignore storage error
    }
  };

  const handleUpdateUser = (updatedData) => {
    setUser(updatedData);
    try {
      localStorage.setItem('syncdoc_user', JSON.stringify(updatedData));
    } catch {}
  };

  // Toast notification manager
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  // Connect real-time Yjs document hook for active document (only in editor view)
  const {
    blocks,
    connectionStatus,
    synced,
    updateBlock,
    addBlock,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    changeBlockType,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useYjsDocument(currentView === 'editor' ? selectedDocId : null);

  // Fetch document list from REST backend on mount or background refresh
  const fetchDocList = useCallback(async (selectDocIdOverride = null, isBackgroundSync = false) => {
    if (!isBackgroundSync) setLoadingDocs(true);
    try {
      const list = await getDocuments();
      setDocuments(list);

      if (selectDocIdOverride) {
        const matched = list.find((d) => d._id === selectDocIdOverride);
        if (matched) {
          setSelectedDocId(matched._id);
          setSelectedDocTitle(matched.title);
        }
      } else if (selectedDocId) {
        // Update selected doc title if it changed externally
        const currentDoc = list.find((d) => d._id === selectedDocId);
        if (currentDoc) {
          setSelectedDocTitle(currentDoc.title);
        }
      }
    } catch (err) {
      if (!isBackgroundSync) {
        console.error('Failed to load documents:', err);
        showToast(`Failed to load documents: ${err.message}`, 'error');
      }
    } finally {
      if (!isBackgroundSync) setLoadingDocs(false);
    }
  }, [selectedDocId, showToast]);

  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      if (isMounted) await fetchDocList();
    };
    loadInitial();

    // Poll for document list / title updates across multiple clients
    const interval = setInterval(() => {
      if (isMounted) fetchDocList(null, true);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchDocList]);

  // Handle opening a document from workspace → editor
  const handleOpenDocument = useCallback((docId) => {
    const matched = documents.find((d) => d._id === docId);
    if (matched) {
      setSelectedDocId(matched._id);
      setSelectedDocTitle(matched.title);
      setCurrentView('editor');
    }
  }, [documents]);

  // Handle document selection within editor sidebar
  const handleSelectDocument = useCallback((docId) => {
    const matched = documents.find((d) => d._id === docId);
    if (matched) {
      setSelectedDocId(matched._id);
      setSelectedDocTitle(matched.title);
    }
  }, [documents]);

  // Handle back to workspace
  const handleBackToWorkspace = useCallback(() => {
    setCurrentView('workspace');
  }, []);

  // Handle open settings
  const handleOpenSettings = useCallback(() => {
    setCurrentView('settings');
  }, []);

  // Handle document creation
  const handleCreateDocument = useCallback(async () => {
    try {
      const initialBlocks = [
        {
          id: generateBlockId(),
          type: 'heading',
          data: { text: '' },
        },
        {
          id: generateBlockId(),
          type: 'paragraph',
          data: { text: '' },
        },
      ];
      const newDoc = await createDocument('Untitled Document', initialBlocks);
      showToast('New blank document created', 'success');
      await fetchDocList(newDoc._id);
      // Open the new document in the editor
      setSelectedDocId(newDoc._id);
      setSelectedDocTitle(newDoc.title);
      setCurrentView('editor');
    } catch (err) {
      console.error('Failed to create document:', err);
      showToast(`Creation failed: ${err.message}`, 'error');
    }
  }, [fetchDocList, showToast]);

  // Handle document deletion
  const handleDeleteDocument = useCallback(async (docId) => {
    try {
      await deleteDocument(docId);
      showToast('Document deleted', 'info');
      const updatedList = documents.filter((d) => d._id !== docId);
      setDocuments(updatedList);

      if (selectedDocId === docId) {
        if (updatedList.length > 0) {
          setSelectedDocId(updatedList[0]._id);
          setSelectedDocTitle(updatedList[0].title);
        } else {
          setSelectedDocId(null);
          setSelectedDocTitle('');
          setCurrentView('workspace');
        }
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
      showToast(`Deletion failed: ${err.message}`, 'error');
    }
  }, [documents, selectedDocId, showToast]);

  // Handle document rename from sidebar or header
  const handleRenameDocument = useCallback(async (docId, newTitle) => {
    try {
      await updateDocument(docId, { title: newTitle });
      setDocuments((prev) =>
        prev.map((d) => (d._id === docId ? { ...d, title: newTitle } : d))
      );
      if (selectedDocId === docId) {
        setSelectedDocTitle(newTitle);
      }
      showToast('Title updated', 'success');
    } catch (err) {
      console.error('Failed to rename document:', err);
      showToast(`Rename failed: ${err.message}`, 'error');
    }
  }, [selectedDocId, showToast]);

  // Handle HTML export
  const handleExportHtml = useCallback(async () => {
    if (!selectedDocId) return;
    try {
      const response = await exportDocument(selectedDocId, 'html');
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedDocTitle || 'document'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Exported document as HTML', 'success');
    } catch (err) {
      console.error('HTML export failed:', err);
      showToast(`Export failed: ${err.message}`, 'error');
    }
  }, [selectedDocId, selectedDocTitle, showToast]);

  // Handle PDF export
  const handleExportPdf = useCallback(async () => {
    if (!selectedDocId) return;
    try {
      const response = await exportDocument(selectedDocId, 'pdf');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedDocTitle || 'document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Exported document as PDF', 'success');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast(`Export failed: ${err.message}`, 'error');
    }
  }, [selectedDocId, selectedDocTitle, showToast]);

  // Global Keyboard Shortcuts (Ctrl+Z / Cmd+Z for Undo, Ctrl+Y / Cmd+Y for Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (currentView !== 'editor') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (canRedo) {
            e.preventDefault();
            redo();
          }
        } else {
          if (canUndo) {
            e.preventDefault();
            undo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, undo, redo, canUndo, canRedo]);

  // Compute theme index deterministically based on active document index
  const docIndex = documents.findIndex((d) => d._id === selectedDocId);
  const currentTheme = docIndex >= 0 ? docIndex % 5 : 0;

  // Apply dark mode theme if configured
  useEffect(() => {
    const theme = localStorage.getItem('syncdoc_theme') || 'light';
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme-mode', 'dark');
    } else if (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme-mode', 'dark');
    }
  }, []);

  // ─── Render Login ───
  if (!user || currentView === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ─── Render Settings ───
  if (currentView === 'settings') {
    return (
      <SettingsPage 
        user={user}
        token={authToken}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        onBackToWorkspace={handleBackToWorkspace}
      />
    );
  }

  // ─── Render Workspace Dashboard ───
  if (currentView === 'workspace') {
    return (
      <>
        <WorkspaceDashboard
          documents={documents}
          loading={loadingDocs}
          user={user}
          onOpenDocument={handleOpenDocument}
          onCreateDocument={handleCreateDocument}
          onDeleteDocument={handleDeleteDocument}
          onLogout={handleLogout}
          onOpenSettings={handleOpenSettings}
        />
        {/* Toast Notification Container */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
      </>
    );
  }

  // ─── Render Editor ───
  return (
    <div className="app-layout" data-theme={currentTheme}>
      {/* Ambient pastel background mesh */}
      <div className="bg-gradient-mesh" aria-hidden="true">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Sidebar for document management */}
      <DocumentSidebar
        documents={documents}
        selectedId={selectedDocId}
        onSelect={handleSelectDocument}
        onCreate={handleCreateDocument}
        onDelete={handleDeleteDocument}
        onRename={handleRenameDocument}
        loading={loadingDocs}
        user={user}
        onLogout={handleLogout}
        onBackToWorkspace={handleBackToWorkspace}
      />

      {/* Main Editor Area */}
      <main className="editor-area">
        {selectedDocId ? (
          <>
            <EditorHeader
              title={selectedDocTitle}
              onRename={(newTitle) => handleRenameDocument(selectedDocId, newTitle)}
              connectionStatus={connectionStatus}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onExportHtml={handleExportHtml}
              onExportPdf={handleExportPdf}
              onBackToWorkspace={handleBackToWorkspace}
            />

            <div className="editor-content">
              {!synced && connectionStatus === 'connecting' ? (
                <div className="syncing-overlay">
                  <div className="spinner"></div>
                  <span>Synchronizing document...</span>
                </div>
              ) : blocks.length === 0 ? (
                <div className="editor-empty">
                  <h2>No Content Blocks</h2>
                  <p>Start collaborating by adding your first block below.</p>
                  <AddBlockMenu
                    onAddBlock={(type) => addBlock(type)}
                    buttonText="+ Add First Block"
                    style={{ maxWidth: '240px', marginTop: '16px' }}
                    id="btn-add-first-block"
                  />
                </div>
              ) : (
                <div className="editor-blocks">
                  {blocks.map((block, index) => (
                    <EditorBlock
                      key={block.id}
                      block={block}
                      index={index}
                      totalBlocks={blocks.length}
                      onUpdate={updateBlock}
                      onDelete={deleteBlock}
                      onMoveUp={(id) => moveBlock(id, 'up')}
                      onMoveDown={(id) => moveBlock(id, 'down')}
                      onDuplicate={duplicateBlock}
                      onChangeType={changeBlockType}
                      onAddBlockBelow={(idx, type) => addBlock(type || 'paragraph', idx)}
                    />
                  ))}

                  <AddBlockMenu
                    onAddBlock={(type) => addBlock(type)}
                    buttonText="+ Add Block"
                    id="btn-add-block-bottom"
                  />
                </div>
              )}

              <footer className="app-footer">
                <span>© 2026 SyncDoc. All rights reserved.</span>
                <div className="footer-links">
                  <span>Help</span>
                  <span>Feedback</span>
                  <span>Version 1.0.0</span>
                </div>
              </footer>
            </div>
          </>
        ) : (
          <div className="editor-empty">
            <h2>Select or Create a Document</h2>
            <p>Choose a document from the sidebar to begin editing.</p>
          </div>
        )}
      </main>

      {/* Bottom right decorative elements matching reference */}
      <div className="bg-decorative-cursive" aria-hidden="true">
        Good Docs<br />Brighter Ideas ♡
      </div>

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
