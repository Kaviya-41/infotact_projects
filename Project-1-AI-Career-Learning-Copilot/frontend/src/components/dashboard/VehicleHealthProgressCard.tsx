/**
 * VehicleHealthProgressCard.tsx – Vehicle health breakdown card with progress bars
 * Shows Healthy (32), Attention Required (6), Maintenance (3), and Critical (1) breakdowns.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertCircle, Wrench, Siren } from 'lucide-react';
import '../../styles/dashboard.css';

interface HealthCategory {
  id: string;
  label: string;
  count: number;
  pct: number;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const CATEGORIES: HealthCategory[] = [
  {
    id: 'healthy',
    label: 'Healthy',
    count: 32,
    pct: 76,
    color: '#10B981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    icon: <Shield size={13} />,
  },
  {
    id: 'attention',
    label: 'Attention Required',
    count: 6,
    pct: 14,
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    icon: <AlertCircle size={13} />,
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    count: 3,
    pct: 7,
    color: '#7C3AED',
    bgColor: 'rgba(124, 58, 237, 0.08)',
    icon: <Wrench size={13} />,
  },
  {
    id: 'critical',
    label: 'Critical',
    count: 1,
    pct: 3,
    color: '#EF4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    icon: <Siren size={13} />,
  },
];

export const VehicleHealthProgressCard: React.FC = () => {
  return (
    <div className="fd-card fd-card--no-hover vehicle-health-card" id="vehicle-health-progress-card">
      <div className="fd-card__header">
        <div>
          <h3 className="fd-card__title">
            <span className="icon-badge-green">
              <Shield size={14} />
            </span>
            <span>Vehicle Health</span>
          </h3>
          <p className="fd-card__subtitle">
            Diagnostic status across fleet
          </p>
        </div>

        <span className="badge-pill-green">
          42 Total
        </span>
      </div>

      {/* Category breakdown rows */}
      <div className="health-categories-list">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="health-category-row">
            <div className="health-category-header">
              <span className="health-category-title">
                <span style={{ color: cat.color, display: 'flex', alignItems: 'center' }}>
                  {cat.icon}
                </span>
                <span className="health-category-name">{cat.label}</span>
              </span>

              <div className="health-category-meta">
                <span className="health-unit-count">
                  {cat.count} {cat.count === 1 ? 'vehicle' : 'vehicles'}
                </span>
                <span
                  className="health-pct tabular-nums"
                  style={{ color: cat.color }}
                >
                  {cat.pct}%
                </span>
              </div>
            </div>

            {/* Progress Bar Track */}
            <div className="health-progress-track">
              <motion.div
                className="health-progress-fill"
                style={{ backgroundColor: cat.color }}
                initial={{ width: 0 }}
                animate={{ width: `${cat.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(VehicleHealthProgressCard);
