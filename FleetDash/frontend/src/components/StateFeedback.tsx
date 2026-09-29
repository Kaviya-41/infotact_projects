import React, { memo } from 'react';
import { motion } from 'framer-motion';
import './StateFeedback.css';

// ── Premium Skeleton ────────────────────────────────────────────────────────
export const PremiumSkeleton = memo(({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '8px', 
  className = '' 
}: { 
  width?: string | number, 
  height?: string | number, 
  borderRadius?: string | number,
  className?: string
}) => {
  return (
    <div 
      className={`premium-skeleton ${className}`} 
      style={{ width, height, borderRadius }}
    />
  );
});
PremiumSkeleton.displayName = 'PremiumSkeleton';

// ── Premium Empty State ──────────────────────────────────────────────────────
export const PremiumEmptyState = memo(({
  title = 'No Data Available',
  description = 'There is currently no data to display in this section.',
  icon = '📦'
}: {
  title?: string,
  description?: string,
  icon?: React.ReactNode
}) => {
  return (
    <motion.div 
      className="premium-empty-state"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="premium-empty-icon">{icon}</div>
      <h3 className="premium-empty-title">{title}</h3>
      <p className="premium-empty-desc">{description}</p>
    </motion.div>
  );
});
PremiumEmptyState.displayName = 'PremiumEmptyState';

// ── Premium Error State ──────────────────────────────────────────────────────
export const PremiumErrorState = memo(({
  title = 'Connection Error',
  description = 'Failed to load telemetry data. The server might be unreachable.',
  onRetry
}: {
  title?: string,
  description?: string,
  onRetry?: () => void
}) => {
  return (
    <motion.div 
      className="premium-error-state"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="premium-error-icon">⚠️</div>
      <h3 className="premium-error-title">{title}</h3>
      <p className="premium-error-desc">{description}</p>
      {onRetry && (
        <button className="ds-btn ds-btn-secondary" onClick={onRetry}>
          <span style={{ fontSize: '16px' }}>↻</span> Retry Connection
        </button>
      )}
    </motion.div>
  );
});
PremiumErrorState.displayName = 'PremiumErrorState';
