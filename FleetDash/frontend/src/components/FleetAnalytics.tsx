/**
 * FleetAnalytics.tsx – Fleet Performance Analytics Component
 * Displays 7-day performance trend chart and supporting operational metrics:
 * Distance Today (3,420 km), Trips Completed (128), Avg Speed (54 km/h),
 * Fleet Utilization (84%), On-Time Delivery (92%).
 */

import React, { memo } from 'react';
import { BarChart3 } from 'lucide-react';
import '../styles/dashboard.css';

export const FleetAnalytics: React.FC = () => {
  return (
    <div className="fd-card fd-card--no-hover analytics-card" id="fleet-performance-card">
      <div className="fd-card__header">
        <div>
          <h3 className="fd-card__title">
            <span className="icon-badge-blue">
              <BarChart3 size={14} />
            </span>
            <span>Fleet Performance</span>
          </h3>
          <p className="fd-card__subtitle">
            Last 7 days distance travelled vs trips completed
          </p>
        </div>

        {/* Legend */}
        <div className="chart-legend">
          <span className="chart-legend-item chart-legend-item--distance">
            <span className="legend-line legend-line--blue" />
            Distance (km)
          </span>
          <span className="chart-legend-item chart-legend-item--trips">
            <span className="legend-line legend-line--green" />
            Trips Completed
          </span>
        </div>
      </div>

      {/* Main Chart + Supporting Metrics Grid */}
      <div className="analytics-body-grid">
        {/* SVG Smooth Area Line Chart */}
        <div className="chart-container">
          <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none" className="analytics-svg">
            <defs>
              <linearGradient id="distAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="tripsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="80" x2="800" y2="80" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="120" x2="800" y2="120" stroke="#F1F5F9" strokeWidth="1" />
            <line x1="0" y1="160" x2="800" y2="160" stroke="#F1F5F9" strokeWidth="1" />

            {/* Area Fills */}
            <path
              d="M 0 140 Q 130 90 260 110 T 520 60 T 800 40 L 800 190 L 0 190 Z"
              fill="url(#distAreaGrad)"
            />

            {/* Primary Line: Distance */}
            <path
              d="M 0 140 Q 130 90 260 110 T 520 60 T 800 40"
              fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"
            />

            {/* Secondary Line: Trips */}
            <path
              d="M 0 160 Q 130 130 260 140 T 520 100 T 800 80"
              fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round"
            />

            {/* Data Points */}
            <circle cx="260" cy="110" r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
            <circle cx="520" cy="60" r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
            <circle cx="800" cy="40" r="4" fill="#FFFFFF" stroke="#2563EB" strokeWidth="2" />
          </svg>

          {/* Day Labels */}
          <div className="chart-day-labels">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* Supporting Statistics Rows */}
        <div className="analytics-metrics-panel">
          <div className="analytics-metric-row">
            <span className="metric-label">Distance Today</span>
            <span className="metric-value metric-value--primary tabular-nums">3,420 km</span>
          </div>

          <div className="analytics-metric-row">
            <span className="metric-label">Trips Completed</span>
            <span className="metric-value tabular-nums">128</span>
          </div>

          <div className="analytics-metric-row">
            <span className="metric-label">Average Speed</span>
            <span className="metric-value metric-value--blue tabular-nums">54 km/h</span>
          </div>

          <div className="analytics-metric-row">
            <span className="metric-label">Fleet Utilization</span>
            <span className="metric-value metric-value--purple tabular-nums">84%</span>
          </div>

          <div className="analytics-metric-row">
            <span className="metric-label">On-Time Delivery</span>
            <span className="metric-value metric-value--green tabular-nums">92%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(FleetAnalytics);
