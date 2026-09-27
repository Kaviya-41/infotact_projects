/**
 * StatusBadge.tsx – Accessible Status Badge with text + color indicator
 * Ensures status is communicated through both color AND text label.
 */

import React from 'react';
import '../../styles/dashboard.css';

type BadgeVariant = 'moving' | 'stopped' | 'offline' | 'maintenance' | 'idle';

interface StatusBadgeProps {
  status: BadgeVariant;
  label?: string;
  className?: string;
}

const STATUS_LABELS: Record<BadgeVariant, string> = {
  moving: 'Moving',
  stopped: 'Stopped',
  offline: 'Offline',
  maintenance: 'Maintenance',
  idle: 'Idle',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const displayLabel = label || STATUS_LABELS[status] || status;
  const variantClass = status === 'idle' ? 'stopped' : status;

  return (
    <span
      className={`status-badge status-badge--${variantClass} ${className}`}
      role="status"
      aria-label={`Vehicle status: ${displayLabel}`}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
