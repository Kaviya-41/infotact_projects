/**
 * ActiveRouteCard.tsx – Active Route Intelligence Card
 * Displays real-time dispatch route analytics, progress bar,
 * corridor waypoint checkpoints, and ETA metrics in clean FleetDash light theme.
 */

import React from 'react';
import { CornerUpRight, ArrowRight, Clock, Navigation, Truck, MapPin, CheckCircle2, CircleDot } from 'lucide-react';
import type { ActiveRouteData } from '../../types/telemetry';
import '../../styles/dashboard.css';

export interface ActiveRouteCardProps {
  data?: ActiveRouteData;
  className?: string;
}

const DEFAULT_ROUTE: ActiveRouteData = {
  routeName: 'Bengaluru ──→ Chennai Corridor',
  origin: 'Bengaluru Central Depot',
  destination: 'Chennai Port Terminal',
  vehicleId: 'FLT-004',
  driverName: 'Karthik S',
  nextTurn: '600m Turn Right (Zone B Access)',
  eta: '14 min',
  totalDistance: '348 km',
  steps: [
    { id: 's1', instruction: 'Depart Bengaluru Central Hub (Depot 104)', distance: '1.2 km', status: 'completed' },
    { id: 's2', instruction: 'Merge onto Hosur Expressway Corridor', distance: '42.8 km', status: 'completed' },
    { id: 's3', instruction: 'Turn right in 600m onto Zone B Access Road', distance: '0.6 km', status: 'active' },
    { id: 's4', instruction: 'Arrive at Chennai Port Container Terminal', distance: '148.5 km', status: 'pending' },
  ],
};

export const ActiveRouteCard: React.FC<ActiveRouteCardProps> = ({ data = DEFAULT_ROUTE, className = '' }) => {
  return (
    <div className={`fd-card fd-card--no-hover ${className}`} id="active-route-intelligence-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: 'var(--fd-color-primary-light)',
              border: '1px solid var(--fd-border-color)',
              color: 'var(--fd-color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CornerUpRight size={16} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fd-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Active Route Intelligence
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--fd-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{data.origin.split(' ')[0]}</span>
                <ArrowRight size={14} color="var(--fd-color-primary)" />
                <span>{data.destination.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          <span style={{
            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
            backgroundColor: 'var(--fd-color-success-bg)', color: 'var(--fd-color-success)',
            border: '1px solid var(--fd-color-success-border)'
          }}>
            Optimal
          </span>
        </div>

        {/* Visual Route Progress Bar */}
        <div style={{
          padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--fd-bg-surface)',
          border: '1px solid var(--fd-border-subtle)', marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11.5px', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--fd-text-primary)' }}>
              <MapPin size={12} color="var(--fd-color-primary)" />
              <span>{data.origin}</span>
            </div>
            <div style={{ color: 'var(--fd-color-primary)', fontWeight: 700 }}>
              68% Complete (184 / 270 km)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--fd-text-primary)' }}>
              <MapPin size={12} color="var(--fd-color-success)" />
              <span>{data.destination}</span>
            </div>
          </div>

          {/* Progress track */}
          <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--fd-border-subtle)', borderRadius: '9999px', overflow: 'hidden', position: 'relative' }}>
            <div style={{
              height: '100%', width: '68%',
              background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
              borderRadius: '9999px',
              position: 'relative'
            }}>
              <span style={{
                position: 'absolute', right: '0', top: '-2px', bottom: '-2px', width: '12px',
                borderRadius: '50%', background: 'var(--fd-bg-card)', border: '3px solid var(--fd-color-primary)',
                boxShadow: '0 0 6px rgba(37, 99, 235, 0.4)'
              }} />
            </div>
          </div>
        </div>

        {/* 4 Metric Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
          <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--fd-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={11} color="var(--fd-color-primary)" />
              <span>Target ETA</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--fd-text-primary)', marginTop: '2px', fontFamily: 'var(--fd-font-mono, monospace)' }}>
              {data.eta}
            </div>
          </div>

          <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--fd-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Navigation size={11} color="var(--fd-color-primary)" />
              <span>Next Maneuver</span>
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fd-text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {data.nextTurn}
            </div>
          </div>

          <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--fd-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Truck size={11} color="var(--fd-color-warning)" />
              <span>Active Trucks</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--fd-color-warning)', marginTop: '2px', fontFamily: 'var(--fd-font-mono, monospace)' }}>
              1,240 Units
            </div>
          </div>

          <div style={{ padding: '8px 10px', borderRadius: '8px', backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-subtle)' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--fd-text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <MapPin size={11} color="var(--fd-color-success)" />
              <span>Corridor</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--fd-text-primary)', marginTop: '2px', fontFamily: 'var(--fd-font-mono, monospace)' }}>
              {data.totalDistance}
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Waypoint Steps Preview */}
        <div style={{ borderTop: '1px solid var(--fd-border-subtle)', paddingTop: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fd-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>
            Waypoint Dispatch Steps
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.steps.map((step) => (
              <div
                key={step.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 10px', borderRadius: '6px',
                  backgroundColor: step.status === 'active' ? 'var(--fd-color-primary-light)' : 'var(--fd-bg-surface)',
                  border: step.status === 'active' ? '1px solid var(--fd-border-color)' : '1px solid var(--fd-border-subtle)',
                  fontSize: '11.5px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {step.status === 'completed' ? (
                    <CheckCircle2 size={13} color="#10B981" />
                  ) : step.status === 'active' ? (
                    <CircleDot size={13} color="var(--fd-color-primary)" />
                  ) : (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--fd-border-subtle)', display: 'inline-block', marginLeft: '2px' }} />
                  )}
                  <span style={{ fontWeight: step.status === 'active' ? 700 : 500, color: step.status === 'active' ? 'var(--fd-color-primary)' : 'var(--fd-text-primary)' }}>
                    {step.instruction}
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-text-secondary)', fontFamily: 'var(--fd-font-mono, monospace)' }}>
                  {step.distance}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DispatchOverlayCard = ActiveRouteCard;
export default ActiveRouteCard;
