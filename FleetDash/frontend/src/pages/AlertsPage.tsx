/**
 * AlertsPage.tsx – Dedicated Alerts Center Page
 * Displays critical & warning alerts with severity filters, timestamps, and vehicle drawer triggers.
 *
 * Phase 9: Connected to GET /api/alerts for real data.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle2, Filter, ChevronRight, Siren } from 'lucide-react';
import VehicleDrawer from '../components/dashboard/VehicleDrawer';
import { fetchAlerts } from '../api/alertApi';
import { socket } from '../services/socket';
import type { BackendAlert, BackendVehicleFull } from '../types/api';
import '../styles/dashboard.css';

interface DetailedAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  severity: 'Critical' | 'Warning' | 'Info';
  title: string;
  description: string;
  timestamp: string;
  status: 'Active' | 'Acknowledged' | 'Resolved';
  location: string;
}

/**
 * Map a backend alert to the DetailedAlert shape used by the page.
 */
function mapBackendAlert(alert: BackendAlert): DetailedAlert {
  const vehicle = typeof alert.vehicle === 'object' ? (alert.vehicle as BackendVehicleFull) : null;
  const vehicleId = vehicle?.vehicleId || (typeof alert.vehicle === 'string' ? alert.vehicle : 'Unknown');
  const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model}` : 'Unknown Vehicle';

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

  // Map severity/status to title case
  const severityMap: Record<string, 'Critical' | 'Warning' | 'Info'> = {
    critical: 'Critical',
    warning: 'Warning',
    info: 'Info',
  };
  const statusMap: Record<string, 'Active' | 'Acknowledged' | 'Resolved'> = {
    active: 'Active',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
  };

  return {
    id: alert._id,
    vehicleId,
    vehicleName,
    severity: severityMap[alert.severity] || 'Info',
    title: alert.type,
    description: alert.message,
    timestamp,
    status: statusMap[alert.status] || 'Active',
    location: alert.location
      ? `${alert.location.latitude.toFixed(4)}, ${alert.location.longitude.toFixed(4)}`
      : 'Unknown',
  };
}

const AlertsPage: React.FC = () => {
  const [filter, setFilter] = useState<'All' | 'Critical' | 'Warning' | 'Info' | 'Resolved'>('All');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [alertsList, setAlertsList] = useState<DetailedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAlerts();
        if (!cancelled) {
          setAlertsList(data.map(mapBackendAlert));
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load alerts';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const handleNewAlert = () => {
      load();
    };

    socket.on('alertGenerated', handleNewAlert);

    return () => {
      cancelled = true;
      socket.off('alertGenerated', handleNewAlert);
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    if (filter === 'All') return alertsList;
    if (filter === 'Resolved') return alertsList.filter(a => a.status === 'Resolved');
    return alertsList.filter(a => a.severity === filter);
  }, [filter, alertsList]);

  const handleAcknowledge = (id: string) => {
    setAlertsList(prev => prev.map(a => a.id === id ? { ...a, status: 'Acknowledged' } : a));
  };

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div>
        <h2 className="dashboard__hero-title">Alerts Center</h2>
        <p className="dashboard__hero-subtitle">
          Monitor operational warnings and critical fleet events.
        </p>
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="fd-card fd-card--compact" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Filter size={15} color="var(--fd-text-secondary)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fd-text-secondary)', marginRight: '8px' }}>Filter Severity:</span>
          {(['All', 'Critical', 'Warning', 'Info', 'Resolved'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                border: filter === tab ? '1px solid var(--fd-color-primary)' : '1px solid var(--fd-border-color)',
                backgroundColor: filter === tab ? 'var(--fd-color-primary)' : 'var(--fd-bg-surface)',
                color: filter === tab ? '#FFFFFF' : 'var(--fd-text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--fd-text-muted)', fontWeight: 500 }}>
            Showing {filteredAlerts.length} of {alertsList.length} alerts
          </span>
          {alertsList.length > 0 && (
            <button
              onClick={() => setAlertsList([])}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#EF4444',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                cursor: 'pointer'
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="fd-card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--fd-text-secondary)', fontSize: '13px' }}>
          Loading alerts...
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="fd-card" style={{ padding: '48px 24px', textAlign: 'center', color: '#EF4444', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Alerts Stream Grid */}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AnimatePresence>
            {filteredAlerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="fd-card"
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}>
                  <CheckCircle2 size={28} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--fd-text-primary)', margin: 0 }}>
                  0 Active Alerts
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--fd-text-secondary)', maxWidth: '440px', margin: 0, lineHeight: 1.5 }}>
                  All fleet systems and vehicle telemetry units are operating within nominal thresholds. No active warnings or unresolved alerts.
                </p>
              </motion.div>
            ) : (
              filteredAlerts.map((alt) => {
                const isCritical = alt.severity === 'Critical';
                const isWarning = alt.severity === 'Warning';
                const borderColor = isCritical ? 'rgba(239, 68, 68, 0.25)' : isWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(6, 182, 212, 0.25)';
                const badgeBg = isCritical ? 'rgba(239, 68, 68, 0.08)' : isWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(6, 182, 212, 0.08)';
                const badgeColor = isCritical ? '#EF4444' : isWarning ? '#F59E0B' : '#06B6D4';
                const badgeBorder = isCritical ? 'rgba(239, 68, 68, 0.25)' : isWarning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(6, 182, 212, 0.25)';

              return (
                <motion.div
                  key={alt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="fd-card fd-card--no-hover"
                  style={{
                    borderLeft: `4px solid ${badgeColor}`,
                    borderTop: `1px solid ${borderColor}`,
                    display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                        backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`,
                      }}>
                        {isCritical ? <Siren size={12} /> : isWarning ? <AlertTriangle size={12} /> : <Info size={12} />}
                        {alt.severity.toUpperCase()}
                      </span>

                      <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--fd-text-primary)' }}>
                        {alt.vehicleId}
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--fd-text-muted)' }}>({alt.vehicleName})</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {alt.status === 'Acknowledged' && (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#06B6D4', backgroundColor: 'rgba(6, 182, 212, 0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                          ● Acknowledged
                        </span>
                      )}
                      <span className="tabular-nums" style={{ fontSize: '12px', color: 'var(--fd-text-muted)', fontWeight: 500 }}>
                        {alt.timestamp}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--fd-text-primary)', marginBottom: '4px' }}>
                      {alt.title}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--fd-text-secondary)', lineHeight: 1.5 }}>
                      {alt.description}
                    </p>
                    <div style={{ fontSize: '12px', color: 'var(--fd-text-muted)', marginTop: '6px' }}>
                      Location: <strong style={{ color: 'var(--fd-text-secondary)' }}>{alt.location}</strong>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--fd-border-subtle)' }}>
                    <button
                      onClick={() => handleAcknowledge(alt.id)}
                      disabled={alt.status !== 'Active'}
                      style={{
                        fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px',
                        border: '1px solid var(--fd-border-color)', backgroundColor: 'var(--fd-bg-surface)',
                        color: alt.status === 'Active' ? 'var(--fd-text-primary)' : 'var(--fd-text-muted)',
                        cursor: alt.status === 'Active' ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={13} color={alt.status !== 'Active' ? 'var(--fd-text-muted)' : '#10B981'} />
                      {alt.status === 'Active' ? 'Acknowledge' : alt.status}
                    </button>

                    <button
                      onClick={() => setSelectedVehicleId(alt.vehicleId)}
                      style={{
                        fontSize: '13px', fontWeight: 700, color: 'var(--fd-color-primary)',
                        backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit',
                      }}
                    >
                      View Vehicle <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            }))
          }
          </AnimatePresence>
        </div>
      )}

      {/* Vehicle Drawer */}
      <VehicleDrawer
        vehicleId={selectedVehicleId}
        onClose={() => setSelectedVehicleId(null)}
      />
    </div>
  );
};

export default AlertsPage;
