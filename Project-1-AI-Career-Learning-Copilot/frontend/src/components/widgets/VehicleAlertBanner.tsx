/**
 * VehicleAlertBanner.tsx – Live Map Alerts Card
 * High-contrast, clean enterprise alert card displaying real-time geofence,
 * speed limit, temperature, and telemetry notifications with clickable inspection.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ShieldAlert, Siren, Fuel, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { VehicleAlert } from '../../types/telemetry';
import '../../styles/dashboard.css';

export interface VehicleAlertBannerProps {
  alerts?: VehicleAlert[];
  onSelectVehicle?: (id: string) => void;
  className?: string;
}

const DEFAULT_ALERTS: VehicleAlert[] = [];

export const VehicleAlertBanner: React.FC<VehicleAlertBannerProps> = ({
  alerts = DEFAULT_ALERTS,
  onSelectVehicle,
  className = '',
}) => {

  return (
    <div className={`fd-card fd-card--no-hover ${className}`} id="live-map-alerts-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: alerts.length > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.1)',
              border: alerts.length > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.25)',
              color: alerts.length > 0 ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {alerts.length > 0 ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fd-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Operational Alerts
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--fd-text-primary)' }}>
                Live Map Alerts
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              backgroundColor: alerts.length > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.1)',
              color: alerts.length > 0 ? '#EF4444' : '#10B981',
              border: alerts.length > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)'
            }}>
              {alerts.length} Active
            </span>
          </div>
        </div>

        {/* Alerts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.length === 0 ? (
            <div style={{
              padding: '36px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              borderRadius: '8px',
              backgroundColor: 'var(--fd-bg-surface)',
              border: '1px dashed var(--fd-border-subtle, var(--fd-border-color))'
            }}>
              <CheckCircle2 size={24} color="#10B981" />
              <div style={{ fontWeight: 700, color: 'var(--fd-text-primary)', fontSize: '13px' }}>
                All Vehicles Normal
              </div>
              <div style={{ fontSize: '12px', color: 'var(--fd-text-secondary)' }}>
                0 active geofence or speed alerts across map telemetry
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {alerts.map((alt) => {
                const isCritical = alt.severity === 'Critical';
                const badgeBg = isCritical ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)';
                const badgeColor = isCritical ? '#EF4444' : '#F59E0B';
                const badgeBorder = isCritical ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)';

                return (
                  <motion.div
                    key={alt.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--fd-bg-surface)',
                      border: '1px solid var(--fd-border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      cursor: onSelectVehicle ? 'pointer' : 'default',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => onSelectVehicle?.(alt.vehicleId)}
                    role={onSelectVehicle ? 'button' : undefined}
                    tabIndex={onSelectVehicle ? 0 : undefined}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {isCritical ? <Siren size={14} /> : alt.title.includes('Fuel') ? <Fuel size={14} /> : <ShieldAlert size={14} />}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fd-text-primary)' }}>
                            {alt.title}
                          </span>
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            padding: '1px 6px', borderRadius: '4px',
                            backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}`
                          }}>
                            {alt.severity}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--fd-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                          {alt.message}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span style={{ fontSize: '10.5px', color: 'var(--fd-text-muted)', fontWeight: 600, fontFamily: 'var(--fd-font-mono, monospace)' }}>
                        {alt.timestamp}
                      </span>
                      {onSelectVehicle && <ChevronRight size={13} color="var(--fd-text-muted)" />}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export const GeofenceAlertBanner = VehicleAlertBanner;
export default VehicleAlertBanner;
