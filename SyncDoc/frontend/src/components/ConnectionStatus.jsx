/**
 * ConnectionStatus — small non-intrusive connection status indicator.
 */
import React from 'react';

const STATUS_CONFIG = {
  connected: { label: 'CONNECTED', color: '#10b981', icon: '●' },
  connecting: { label: 'CONNECTING...', color: '#f59e0b', icon: '◌' },
  disconnected: { label: 'DISCONNECTED', color: '#ef4444', icon: '○' },
};

export default function ConnectionStatus({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;

  return (
    <div className="connection-status" title={config.label}>
      <span className="connection-dot" style={{ color: config.color }}>
        {config.icon}
      </span>
      <span className="connection-label">{config.label}</span>
    </div>
  );
}
