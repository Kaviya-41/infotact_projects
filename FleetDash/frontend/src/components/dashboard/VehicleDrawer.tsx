/**
 * VehicleDrawer.tsx – Slide-in telemetry drawer for selected vehicle
 * Appears from the right edge when a vehicle marker or alert is clicked.
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Truck, User, Fuel, Activity, Navigation as RouteIcon, MapPin, Clock, ExternalLink, Compass } from 'lucide-react';
import { fetchVehicleById } from '../../api/vehicleApi';
import { socket } from '../../services/socket';
import type { LiveTelemetryPayload } from '../../hooks/useSocketTelemetry';
import '../../styles/dashboard.css';

interface VehicleDrawerProps {
  vehicleId: string | null;
  onClose: () => void;
}

interface DrawerVehicleData {
  id: string;
  name: string;
  driver: string;
  status: 'Moving' | 'Stopped' | 'Offline';
  speed: number;
  fuel: number | string;
  engineHealth: number | string;
  tripProgress: number;
  distanceToday: number;
  eta: string;
  route: { origin: string; destination: string };
  lastLocation: string;
}


export const VehicleDrawer: React.FC<VehicleDrawerProps> = ({ vehicleId, onClose }) => {
  const [data, setData] = useState<DrawerVehicleData | null>(null);

  useEffect(() => {
    if (!vehicleId) {
      setData(null);
      return;
    }
    let isMounted = true;
    fetchVehicleById(vehicleId).then(v => {
      if (!isMounted) return;
      const statusMap: Record<string, any> = { online: 'Moving', offline: 'Offline', maintenance: 'Stopped' };
      const speed = v.speed ?? v.currentSpeed ?? 0;
      const lat = v.latitude ?? v.location?.latitude ?? 0;
      const lng = v.longitude ?? v.location?.longitude ?? 0;
      
      const mapped: DrawerVehicleData = {
        id: v.vehicleId,
        name: `${v.make} ${v.model}`,
        driver: v.driverName || 'Unassigned',
        status: statusMap[v.status] || (speed > 0 ? 'Moving' : 'Stopped'),
        speed,
        fuel: v.fuelLevel !== undefined ? v.fuelLevel : '—',
        engineHealth: 'N/A',
        tripProgress: 0,
        distanceToday: v.mileage ?? 0,
        eta: '—',
        route: { origin: 'Unknown', destination: 'Unknown' },
        lastLocation: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      };
      setData(mapped);
    }).catch(err => {
      console.error(err);
    });

    const handleTelemetry = (payload: LiveTelemetryPayload) => {
      if (!isMounted || payload.vehicleId !== vehicleId) return;
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          speed: payload.speed,
          fuel: payload.fuelLevel,
          distanceToday: payload.mileage,
          status: payload.speed > 0 ? 'Moving' : 'Stopped',
          lastLocation: `${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`,
        };
      });
    };

    socket.on('vehicleTelemetry', handleTelemetry);

    return () => {
      isMounted = false;
      socket.off('vehicleTelemetry', handleTelemetry);
    };
  }, [vehicleId]);

  if (!vehicleId || !data) return null;

  const statusColor = data.status === 'Moving' ? '#10B981' : data.status === 'Stopped' ? '#F59E0B' : '#EF4444';

  return (
    <AnimatePresence>
      {vehicleId && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.3)',
              backdropFilter: 'blur(4px)', zIndex: 90,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Slide-in Drawer */}
          <motion.div
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '420px', maxWidth: '100vw',
              backgroundColor: 'var(--fd-bg-elevated)', boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.4)',
              zIndex: 100, display: 'flex', flexDirection: 'column',
              borderLeft: '1px solid var(--fd-border-color)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            role="dialog"
            aria-label={`Vehicle Telemetry Drawer for ${data.id}`}
          >
            {/* Drawer Header */}
            <div style={{
              padding: '24px', borderBottom: '1px solid var(--fd-border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: 'var(--fd-bg-surface)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px',
                  backgroundColor: 'var(--fd-color-primary-light)', color: 'var(--fd-color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--fd-border-color)',
                }}>
                  <Truck size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--fd-text-primary)' }}>{data.id}</span>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                      backgroundColor: `${statusColor}14`, color: statusColor,
                      border: `1px solid ${statusColor}33`, display: 'flex', alignItems: 'center', gap: '4px',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
                      {data.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--fd-text-secondary)', marginTop: '2px' }}>{data.name}</div>
                </div>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: '1px solid var(--fd-border-color)', backgroundColor: 'var(--fd-bg-surface)',
                  color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Speed Hero Display */}
              <div style={{
                textAlign: 'center', padding: '24px', borderRadius: '16px',
                backgroundColor: 'var(--fd-bg-card)', border: '1px solid var(--fd-border-color)',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  CURRENT VELOCITY
                </div>
                <div style={{
                  fontSize: '56px', fontWeight: 800, color: 'var(--fd-color-primary)',
                  fontFamily: 'var(--fd-font-mono)', lineHeight: 1, margin: '8px 0',
                }}>
                  {data.speed}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fd-text-muted)' }}>
                  Kilometers / Hour
                </div>
              </div>

              {/* Route Banner */}
              <div style={{
                padding: '16px', borderRadius: '12px',
                backgroundColor: 'var(--fd-color-primary-light)', border: '1px solid var(--fd-border-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: 'var(--fd-text-primary)' }}>
                  <RouteIcon size={16} color="var(--fd-color-primary)" />
                  <span>{data.route.origin} → {data.route.destination}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fd-color-primary)', fontFamily: 'var(--fd-font-mono)' }}>
                  ETA {data.eta}
                </span>
              </div>

              {/* Grid Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Driver */}
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={12} color="var(--fd-color-primary)" /> Driver
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--fd-text-primary)', marginTop: '4px' }}>
                    {data.driver}
                  </div>
                </div>

                {/* Fuel */}
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Fuel size={12} color="#F59E0B" /> Fuel Level
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: typeof data.fuel === 'number' && data.fuel < 25 ? '#EF4444' : '#10B981', marginTop: '4px', fontFamily: 'var(--fd-font-mono)' }}>
                    {data.fuel}{typeof data.fuel === 'number' ? '%' : ''}
                  </div>
                </div>

                {/* Engine Health */}
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={11} color="#10B981" /> Engine Health
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#10B981', marginTop: '4px', fontFamily: 'var(--fd-font-mono)' }}>
                    {data.engineHealth}{typeof data.engineHealth === 'number' ? '%' : ''}
                  </div>
                </div>

                {/* Distance Today */}
                <div style={{ padding: '14px', borderRadius: '12px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} color="var(--fd-color-purple)" /> Distance Today
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--fd-text-primary)', marginTop: '4px', fontFamily: 'var(--fd-font-mono)' }}>
                    {data.distanceToday} km
                  </div>
                </div>
              </div>

              {/* Trip Progress Bar */}
              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  <span style={{ color: 'var(--fd-text-secondary)' }}>Trip Progress</span>
                  <span style={{ color: 'var(--fd-color-primary)', fontFamily: 'var(--fd-font-mono)' }}>{data.tripProgress}%</span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--fd-border-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${data.tripProgress}%`, backgroundColor: 'var(--fd-color-primary)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* Last Location */}
              <div style={{ fontSize: '12px', color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} color="var(--fd-text-muted)" />
                <span>Location: <strong style={{ color: 'var(--fd-text-primary)' }}>{data.lastLocation}</strong></span>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div style={{
              padding: '20px 24px', borderTop: '1px solid var(--fd-border-subtle)',
              display: 'flex', gap: '12px', backgroundColor: 'var(--fd-bg-surface)',
            }}>
              <button
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  backgroundColor: 'var(--fd-bg-surface)', color: 'var(--fd-text-primary)',
                  border: '1px solid var(--fd-border-color)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
                onClick={onClose}
              >
                <Compass size={14} color="var(--fd-color-primary)" /> Locate on Map
              </button>

              <button
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  backgroundColor: 'var(--fd-color-primary)', color: '#FFFFFF',
                  border: 'none', fontSize: '13px', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
                onClick={onClose}
              >
                View Details <ExternalLink size={14} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default memo(VehicleDrawer);
