/**
 * DocumentCard — visual card for a document in the workspace dashboard.
 * Shows title, relative update time, pastel accent, and a live indicator.
 */
import React from 'react';
import { DOC_ACCENT_COLORS, getRelativeTime } from '../utils/documentUtils.js';


export default function DocumentCard({ doc, index, onOpen }) {
  const accent = DOC_ACCENT_COLORS[index % DOC_ACCENT_COLORS.length];

  return (
    <div
      className="document-card"
      onClick={() => onOpen(doc._id)}
      style={{ '--card-accent': accent.text, '--card-accent-bg': accent.bg, '--card-accent-border': accent.border }}
      id={`doc-card-${doc._id}`}
    >
      <div className="document-card-icon" style={{ backgroundColor: accent.bg, color: accent.text }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
      </div>
      <h3 className="document-card-title">{doc.title || 'Untitled Document'}</h3>
      <span className="document-card-time">
        {doc.updatedAt ? `Edited ${getRelativeTime(doc.updatedAt)}` : 'New document'}
      </span>
      <div className="document-card-status">
        <span className="document-card-live-dot">●</span>
        <span>Live</span>
      </div>
    </div>
  );
}
