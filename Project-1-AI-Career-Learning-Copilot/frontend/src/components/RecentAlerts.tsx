/**
 * RecentAlerts.tsx – Live Fleet Alert Stream
 * Displays critical & warning operational alerts with severity pills,
 * timestamps, and clickable 'View Vehicle →' triggers.
 *
 * Phase 9: Connected to GET /api/dashboard/recent-alerts for real data.
 */

import React, { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { AlertCircle, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import type { FleetAlert } from '../types/fleet';
import type { BackendAlert, BackendVehicleFull } from '../types/api';
import { fetchRecentAlerts } from '../api/dashboardApi';
import { socket } from '../services/socket';
import '../styles/dashboard.css';

interface RecentAlertsProps {
  onSelectVehicle?: (vehicleId: string) => void;
}

/**
 * Map backend alert to the existing FleetAlert type used by the component.
 */
function mapBackendAlert(alert: BackendAlert): FleetAlert {
  const vehicle = typeof alert.vehicle === 'object' ? (alert.vehicle as BackendVehicleFull) : null;
  const vehicleId = vehicle?.vehicleId || (typeof alert.vehicle === 'string' ? alert.vehicle : 'Unknown');
  const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : '';

  // Format timestamp
  const createdAt = new Date(alert.createdAt);
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  let timestamp: string;
  if (diffMin < 1) timestamp = 'Just now';
  else if (diffMin < 60) timestamp = `${diffMin}m ago`;
  else if (diffMin < 1440) timestamp = `${Math.floor(diffMin / 60)}h ago`;
  else timestamp = createdAt.toLocaleDateString();

  // Map severity to title case
  const severityMap: Record<string, 'Critical' | 'Warning' | 'Info'> = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };

  return {
    id: alert._id,
    vehicleId,
    vehicleName,
    severity: severityMap[alert.severity] || 'Info',
    title: alert.type,
    message: alert.message,
    timestamp,
    location: alert.location
      ? `${alert.location.latitude.toFixed(4)}, ${alert.location.longitude.toFixed(4)}`
      : 'Unknown',
  };
}

const severityConfig = {
  Critical: {
    bg: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    badgeBg: 'rgba(239, 68, 68, 0.08)',
    badgeColor: '#EF4444',
    badgeBorder: '1px solid rgba(239, 68, 68, 0.25)',
    Icon: AlertCircle,
  },
  Warning: {
    bg: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    badgeBg: 'rgba(245, 158, 11, 0.08)',
    badgeColor: '#F59E0B',
    badgeBorder: '1px solid rgba(245, 158, 11, 0.25)',
    Icon: AlertTriangle,
  },
  Info: {
    bg: 'rgba(6, 182, 212, 0.08)',
    border: '1px solid rgba(6, 182, 212, 0.25)',
    badgeBg: 'rgba(6, 182, 212, 0.08)',
    badgeColor: '#06B6D4',
    badgeBorder: '1px solid rgba(6, 182, 212, 0.25)',
    Icon: AlertCircle,
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export const RecentAlerts: React.FC<RecentAlertsProps> = ({ onSelectVehicle }) => {
  const [alerts, setAlerts] = useState<FleetAlert[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchRecentAlerts(5);
        if (!cancelled) {
          setAlerts(data.map(mapBackendAlert));
        }
      } catch {
        // Failed to load — show empty state
      }
    };
    load();

    const handleNewAlert = (newAlert: BackendAlert) => {
      if (newAlert) {
        setAlerts((prev) => [mapBackendAlert(newAlert), ...prev.slice(0, 4)]);
      } else {
        load();
      }
    };

    socket.on('alertGenerated', handleNewAlert);
    socket.on('dashboardUpdate', load);

    return () => {
      cancelled = true;
      socket.off('alertGenerated', handleNewAlert);
      socket.off('dashboardUpdate', load);
    };
  }, []);

  return (
    <motion.div
      className="fd-card fd-card--no-hover live-alerts-card"
      id="recent-alerts-card"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <div className="fd-card__header">
        <div>
          <h3 className="fd-card__title">
            <span className={alerts.length > 0 ? "icon-badge-danger" : "icon-badge-success"}>
              {alerts.length > 0 ? <AlertCircle size={14} /> : <ShieldCheck size={14} color="#10B981" />}
            </span>
            <span>Live Alerts</span>
          </h3>
          <p className="fd-card__subtitle">
            {alerts.length === 0 ? "0 active alerts · All systems operational" : "Issues requiring immediate attention"}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {alerts.length > 0 && (
            <button
              onClick={() => setAlerts([])}
              className="btn-clear-alerts"
              title="Acknowledge and dismiss all alerts"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="alerts-empty-state">
          <ShieldCheck size={28} color="#10B981" />
          <div className="empty-title">All Systems Operational</div>
          <div className="empty-subtitle">No active fleet alerts. All monitored parameters healthy.</div>
        </div>
      ) : (
        <div className="alerts-list">
          <AnimatePresence>
            {alerts.map((alt, idx) => {
              const config = severityConfig[alt.severity];
              const SevIcon = config.Icon;

              return (
                <motion.div
                  key={alt.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12, height: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.2 }}
                  className="alert-item-card"
                  style={{
                    backgroundColor: config.bg,
                    border: config.border,
                  }}
                >
                  <div className="alert-item-header">
                    <div className="alert-id-badge">
                      <span
                        className="alert-severity-pill"
                        style={{
                          backgroundColor: config.badgeBg,
                          color: config.badgeColor,
                          border: config.badgeBorder,
                        }}
                      >
                        <SevIcon size={11} /> {alt.severity.toUpperCase()}
                      </span>
                      <span className="alert-vehicle-id">{alt.vehicleId}</span>
                    </div>

                    <span className="alert-timestamp tabular-nums">{alt.timestamp}</span>
                  </div>

                  <div className="alert-content">
                    <div className="alert-title">{alt.title}</div>
                    <div className="alert-desc">{alt.message}</div>
                  </div>

                  {onSelectVehicle && (
                    <div className="alert-action-footer">
                      <button
                        onClick={() => onSelectVehicle(alt.vehicleId)}
                        className="btn-view-vehicle"
                        title={`Inspect vehicle ${alt.vehicleId}`}
                      >
                        <span>View Vehicle</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default memo(RecentAlerts);
