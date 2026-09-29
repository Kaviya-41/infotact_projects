/**
 * VehicleHUD.tsx – Selected Vehicle Head-Up Display Overlay
 * Automotive-inspired telemetry overlay showing speed, route, driver, engine health,
 * telemetry status and metrics for the currently selected vehicle on the fleet map.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Fuel, Clock, Activity, Radio, X } from 'lucide-react';
import '../../styles/dashboard.css';

interface VehicleData {
  id: string;
  name: string;
  driver: string;
  status: 'Online' | 'Moving' | 'Idle' | 'Offline' | 'Maintenance' | 'Stopped';
  speed: number;
  fuel: number;
  tripProgress: number;
  eta: string;
  route: { origin: string; destination: string };
  engineStatus?: string;
  lastUpdate?: string;
}

interface VehicleHUDProps {
  vehicle: VehicleData;
  onClose?: () => void;
  onOpenDrawer?: (id: string) => void;
}

const VehicleHUD: React.FC<VehicleHUDProps> = ({ vehicle, onClose, onOpenDrawer }) => {
  const statusLabel = vehicle.status.toUpperCase();
  const statusColor =
    vehicle.status === 'Moving'
      ? '#2563EB'
      : vehicle.status === 'Online'
        ? '#10B981'
        : vehicle.status === 'Idle'
          ? '#F59E0B'
          : vehicle.status === 'Maintenance'
            ? '#7C3AED'
            : '#EF4444';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={vehicle.id}
        className="vehicle-hud"
        initial={{ opacity: 0, x: 10, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 10, scale: 0.98 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        role="region"
        aria-label={`Selected vehicle: ${vehicle.id}`}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 30,
          background: 'var(--fd-bg-elevated)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--fd-border-color)',
          borderRadius: '14px',
          padding: '16px 20px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
          width: '380px',
          maxWidth: 'calc(100% - 40px)',
        }}
      >
        {/* Top Header: ID + Status + Speed + Close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--fd-text-primary)', letterSpacing: '-0.3px' }}>
              {vehicle.id}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '3px 9px', borderRadius: '9999px',
              fontSize: '10.5px', fontWeight: 700,
              backgroundColor: `${statusColor}14`, color: statusColor,
              border: `1px solid ${statusColor}33`,
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} aria-hidden="true" />
              {statusLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--fd-color-primary)', fontFamily: 'var(--fd-font-mono, monospace)', lineHeight: 1 }}>
                {vehicle.speed}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-text-secondary)' }}>km/h</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  width: '24px', height: '24px', borderRadius: '6px',
                  border: '1px solid var(--fd-border-color)', background: 'var(--fd-bg-surface)',
                  color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', marginLeft: '4px',
                }}
                aria-label="Close vehicle HUD"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Route Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 12px', borderRadius: '8px',
          backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)',
          fontSize: '12px', fontWeight: 600, color: 'var(--fd-text-primary)',
          marginBottom: '12px'
        }}>
          <span style={{ color: 'var(--fd-text-primary)' }}>{vehicle.route.origin}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--fd-color-primary)' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--fd-text-secondary)', fontWeight: 500 }}>Route</span>
            <ArrowRight size={13} />
          </div>
          <span style={{ color: 'var(--fd-text-primary)' }}>{vehicle.route.destination}</span>
        </div>

        {/* 2x2 Telemetry Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {/* Driver */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              <User size={11} color="var(--fd-color-primary)" />
              <span>Driver</span>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--fd-text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {vehicle.driver}
            </div>
          </div>

          {/* ETA */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              <Clock size={11} color="var(--fd-color-primary)" />
              <span>Target ETA</span>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--fd-text-primary)', marginTop: '2px' }}>
              {vehicle.eta}
            </div>
          </div>

          {/* Engine Status */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              <Activity size={11} color="#10B981" />
              <span>Engine</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#10B981', marginTop: '2px' }}>
              {vehicle.engineStatus || (vehicle.status === 'Offline' ? 'Disconnected' : vehicle.status === 'Maintenance' ? 'Service Needed' : 'Normal')}
            </div>
          </div>

          {/* Fuel Level */}
          <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              <Fuel size={11} color="#F59E0B" />
              <span>Fuel / Battery</span>
            </div>
            <div style={{ fontSize: '12.5px', fontWeight: 700, color: vehicle.fuel < 25 ? '#EF4444' : 'var(--fd-text-primary)', marginTop: '2px' }}>
              {vehicle.fuel}%
            </div>
          </div>
        </div>

        {/* Live Telemetry Bar + Action */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '8px', borderTop: '1px solid var(--fd-border-subtle)', fontSize: '11px', color: 'var(--fd-text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Radio size={11} color="#10B981" />
            <span>Telemetry: <strong>Live 60Hz</strong></span>
          </div>

          {onOpenDrawer ? (
            <button
              onClick={() => onOpenDrawer(vehicle.id)}
              style={{
                fontSize: '11.5px', fontWeight: 700, color: 'var(--fd-color-primary)',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '3px'
              }}
            >
              <span>Inspect Details</span>
              <ArrowRight size={12} />
            </button>
          ) : (
            <span style={{ fontSize: '10.5px', color: 'var(--fd-text-muted)' }}>
              Updated: {vehicle.lastUpdate || 'Just now'}
            </span>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VehicleHUD;

