/**
 * FleetHealth.tsx – Fleet Operational Status Donut Visualization
 * Premium light card with SVG donut chart and breakdown legend.
 */

import React from 'react';
import '../../styles/dashboard.css';

const FleetHealth: React.FC = () => {
  const total = 42;
  const moving = 28;
  const stopped = 9;
  const offline = 5;

  const movingPct = Math.round((moving / total) * 100);
  const stoppedPct = Math.round((stopped / total) * 100);
  const offlinePct = Math.round((offline / total) * 100);

  return (
    <div className="fd-card" id="fleet-health-card">
      <div className="fd-card__header">
        <h3 className="fd-card__title">Fleet Health & Status</h3>
        <span style={{
          fontSize: '12px', fontWeight: 600, color: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.08)', padding: '4px 10px',
          borderRadius: '6px', border: '1px solid rgba(37, 99, 235, 0.12)',
        }}>
          99.8% Healthy
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', padding: '8px 0' }}>
        {/* SVG Donut Chart */}
        <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
          <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#F1F5F9" strokeWidth="3.5"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#10B981" strokeWidth="3.5"
              strokeDasharray={`${movingPct}, 100`}
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#F59E0B" strokeWidth="3.5"
              strokeDasharray={`${stoppedPct}, 100`}
              strokeDashoffset={`-${movingPct}`}
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none" stroke="#EF4444" strokeWidth="3.5"
              strokeDasharray={`${offlinePct}, 100`}
              strokeDashoffset={`-${movingPct + stoppedPct}`}
            />
          </svg>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="tabular-nums" style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', lineHeight: '1' }}>
              {total}
            </span>
            <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
              Vehicles
            </span>
          </div>
        </div>

        {/* Breakdown Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Moving', count: moving, pct: movingPct, color: '#10B981' },
            { label: 'Stopped / Idle', count: stopped, pct: stoppedPct, color: '#F59E0B' },
            { label: 'Offline', count: offline, pct: offlinePct, color: '#EF4444' },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#334155' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, display: 'inline-block' }} aria-hidden="true" />
                  {item.label}
                </span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: '#0F172A' }}>{item.count} ({item.pct}%)</span>
              </div>
              <div style={{ height: '4px', backgroundColor: '#F1F5F9', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.pct}%`, backgroundColor: item.color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FleetHealth;
