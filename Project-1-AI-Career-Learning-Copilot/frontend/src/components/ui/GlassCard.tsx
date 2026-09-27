/**
 * GlassCard.tsx – Reusable Premium Light Card Wrapper
 * Provides consistent card styling with subtle glass effect and hover elevation.
 */

import React from 'react';
import { motion } from 'framer-motion';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
  title?: string;
  titleIcon?: React.ReactNode;
  headerRight?: React.ReactNode;
  id?: string;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  compact = false,
  title,
  titleIcon,
  headerRight,
  id,
  style,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`fd-card${compact ? ' fd-card--compact' : ''} ${className}`}
      id={id}
      style={style}
    >
      {title && (
        <div className="fd-card__header">
          <h3 className="fd-card__title">
            {titleIcon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{titleIcon}</span>}
            {title}
          </h3>
          {headerRight}
        </div>
      )}
      {children}
    </motion.div>
  );
};

export default GlassCard;
