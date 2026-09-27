/**
 * LiveOperationsCard.tsx – Real-Time Operational Telemetry Metrics Panel
 * Positioned beside the main Live Fleet Map (~32% width).
 * Displays vehicle status breakdown, socket connection state, and network latency.
 */

import React, { memo } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Activity, Radio, Clock, Wifi } from 'lucide-react';
import '../../styles/dashboard.css';

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export const LiveOperationsCard: React.FC = () => {
  return (
    <motion.div
      className="fd-card fd-card--no-hover live-ops-card"
      id="live-operations-card"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      {/* Header */}
      <div className="fd-card__header">
        <h3 className="fd-card__title">
          <span className="icon-badge-blue">
            <Activity size={14} />
          </span>
          <span>Live Operations</span>
        </h3>
        <span className="badge-live-60hz">
          <span className="live-dot" aria-hidden="true" />
          <span>Live 60Hz</span>
        </span>
      </div>

      {/* Vehicle Operational Breakdown */}
      <div className="live-ops-breakdown">
        <div className="live-ops-row">
          <span className="live-ops-label">
            <span className="ops-dot ops-dot--online" aria-hidden="true" />
            Online Vehicles
          </span>
          <span className="live-ops-value tabular-nums">35</span>
        </div>

        <div className="live-ops-row">
          <span className="live-ops-label">
            <span className="ops-dot ops-dot--offline" aria-hidden="true" />
            Offline Vehicles
          </span>
          <span className="live-ops-value live-ops-value--danger tabular-nums">7</span>
        </div>

        <div className="live-ops-row">
          <span className="live-ops-label">
            <span className="ops-dot ops-dot--active" aria-hidden="true" />
            Active Trips
          </span>
          <span className="live-ops-value live-ops-value--purple tabular-nums">18</span>
        </div>

        <div className="live-ops-row">
          <span className="live-ops-label">
            <span className="ops-dot ops-dot--idle" aria-hidden="true" />
            Idle Vehicles
          </span>
          <span className="live-ops-value live-ops-value--warning tabular-nums">5</span>
        </div>
      </div>

      <div className="live-ops-divider" />

      {/* Socket & Network Diagnostics */}
      <div className="live-ops-diagnostics">
        <div className="diag-section-title">
          SOCKET TELEMETRY STREAM
        </div>

        <div className="diag-row">
          <span className="diag-label">Socket Status</span>
          <span className="diag-status-connected">
            <Radio size={12} />
            <span>Connected</span>
          </span>
        </div>

        <div className="diag-row">
          <span className="diag-label">
            <Wifi size={12} color="#2563EB" />
            Network Latency
          </span>
          <span className="diag-value-green tabular-nums">14 ms</span>
        </div>

        <div className="diag-row">
          <span className="diag-label">
            <Clock size={12} color="#94A3B8" />
            Last Sync
          </span>
          <span className="diag-value-muted">Just now</span>
        </div>
      </div>
    </motion.div>
  );
};

export default memo(LiveOperationsCard);
