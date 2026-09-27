/**
 * FleetStatusSummaryCard.tsx – Selected Vehicle & Fleet Status Card
 * Displays real-time operational breakdown (Online, Active Trips, Idle, Offline)
 * and interactive telemetry overview for the currently selected vehicle.
 */

import React from 'react';
import { Truck, CheckCircle2, AlertTriangle, WifiOff, PlayCircle, ArrowRight, Gauge } from 'lucide-react';
import { SAMPLE_MARKERS } from '../MapPlaceholder';
import '../../styles/dashboard.css';

interface FleetStatusSummaryCardProps {
  selectedVehicleId?: string | null;
  onOpenDrawer?: (id: string) => void;
  className?: string;
}

export const FleetStatusSummaryCard: React.FC<FleetStatusSummaryCardProps> = ({
  selectedVehicleId,
  onOpenDrawer,
  className = '',
}) => {
  const selectedVehicle = SAMPLE_MARKERS.find(v => v.id === selectedVehicleId) || SAMPLE_MARKERS[3]; // FLT-004 default

  return (
    <div className={`fd-card fd-card--no-hover ${className}`} id="fleet-status-summary-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: 'var(--fd-color-success-bg)',
              border: '1px solid var(--fd-color-success-border)',
              color: 'var(--fd-color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Truck size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fd-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Fleet Operations Status
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--fd-text-primary)' }}>
                {selectedVehicleId ? `Selected: ${selectedVehicle.id}` : 'Fleet Status Summary'}
              </div>
            </div>
          </div>

          <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
            backgroundColor: 'var(--fd-color-primary-light)', color: 'var(--fd-color-primary)',
            border: '1px solid var(--fd-border-color)'
          }}>
            42 Total Units
          </span>
        </div>

        {/* Selected Vehicle Quick Telemetry Bar */}
        <div style={{
          padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--fd-bg-surface)',
          border: '1px solid var(--fd-border-subtle)', marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                backgroundColor: 'var(--fd-color-primary)', color: '#FFFFFF'
              }}>
                {selectedVehicle.id}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fd-text-primary)' }}>
                {selectedVehicle.driver}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--fd-color-primary)' }}>
              <Gauge size={13} />
              <span>{selectedVehicle.speed} km/h</span>
            </div>
          </div>

          {/* Route & Progress */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--fd-text-secondary)', marginBottom: '6px' }}>
            <span>{selectedVehicle.route.origin} → {selectedVehicle.route.destination}</span>
            <span style={{ fontWeight: 600, color: 'var(--fd-text-primary)' }}>Trip: {selectedVehicle.tripProgress}%</span>
          </div>

          {/* Trip Progress Bar */}
          <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--fd-border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${selectedVehicle.tripProgress}%`, backgroundColor: 'var(--fd-color-primary)', borderRadius: '9999px' }} />
          </div>
        </div>

        {/* Fleet Distribution Progress Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Online */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, marginBottom: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--fd-text-primary)' }}>
                <CheckCircle2 size={12} color="#10B981" />
                <span>Online Vehicles</span>
              </span>
              <span style={{ color: '#10B981', fontWeight: 700 }}>35 Units (83%)</span>
            </div>
            <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--fd-border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '83%', backgroundColor: '#10B981', borderRadius: '9999px' }} />
            </div>
          </div>

          {/* Active Trips */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, marginBottom: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--fd-text-primary)' }}>
                <PlayCircle size={12} color="var(--fd-color-primary)" />
                <span>Active Trips Dispatched</span>
              </span>
              <span style={{ color: 'var(--fd-color-primary)', fontWeight: 700 }}>18 Units (43%)</span>
            </div>
            <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--fd-border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '43%', backgroundColor: 'var(--fd-color-primary)', borderRadius: '9999px' }} />
            </div>
          </div>

          {/* Idle */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, marginBottom: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--fd-text-primary)' }}>
                <AlertTriangle size={12} color="#F59E0B" />
                <span>Idle / Standby</span>
              </span>
              <span style={{ color: '#F59E0B', fontWeight: 700 }}>5 Units (12%)</span>
            </div>
            <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--fd-border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '12%', backgroundColor: '#F59E0B', borderRadius: '9999px' }} />
            </div>
          </div>

          {/* Offline */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', fontWeight: 600, marginBottom: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--fd-text-primary)' }}>
                <WifiOff size={12} color="#EF4444" />
                <span>Offline / Maintenance</span>
              </span>
              <span style={{ color: '#EF4444', fontWeight: 700 }}>7 Units (17%)</span>
            </div>
            <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--fd-border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '17%', backgroundColor: '#EF4444', borderRadius: '9999px' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      {onOpenDrawer && (
        <div style={{ borderTop: '1px solid var(--fd-border-subtle)', paddingTop: '10px', marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => onOpenDrawer(selectedVehicle.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', fontWeight: 700, color: 'var(--fd-color-primary)',
              background: 'none', border: 'none', cursor: 'pointer'
            }}
          >
            <span>Open Telemetry Drawer for {selectedVehicle.id}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FleetStatusSummaryCard;
