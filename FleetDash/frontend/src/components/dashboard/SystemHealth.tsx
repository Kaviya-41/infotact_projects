/**
 * SystemHealth.tsx – System Health & Status Panel
 * Displays API latency, uptime, throughput, GPS/Socket/Server status,
 * and resource gauges in the premium light theme.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Server, Radio, Shield, HardDrive } from 'lucide-react';
import '../../styles/dashboard.css';

interface HealthMetric {
  label: string;
  value: string;
  status: 'green' | 'amber' | 'red';
  icon: React.ReactNode;
}

const HEALTH_METRICS: HealthMetric[] = [
  { label: 'API Latency', value: '12 ms', status: 'green', icon: <Activity size={14} /> },
  { label: 'Uptime', value: '99.99%', status: 'green', icon: <Shield size={14} /> },
  { label: 'GPS Satellites', value: '24/24 Lock', status: 'green', icon: <Wifi size={14} /> },
  { label: 'Socket Stream', value: '4.2k ops/s', status: 'green', icon: <Radio size={14} /> },
  { label: 'Server Load', value: '23% CPU', status: 'green', icon: <Server size={14} /> },
];

interface GaugeData {
  label: string;
  value: number;
  total: string;
  color: string;
}

const GAUGES: GaugeData[] = [
  { label: 'Storage Usage', value: 42, total: '4.2 / 10.0 GB Cache', color: '#2563EB' },
  { label: 'Memory Usage', value: 62, total: '9.9 / 16.0 GB RAM', color: '#8B5CF6' },
];

const statusColors: Record<string, string> = {
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
};

const SystemHealth: React.FC = () => {
  return (
    <motion.div
      className="fd-card fd-card--no-hover"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      id="system-health-panel"
    >
      {/* Header */}
      <div className="fd-card__header">
        <h3 className="fd-card__title">
          <span style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#2563EB',
          }}>
            <Activity size={14} />
          </span>
          System Health
        </h3>
        <span style={{
          fontSize: '11px', fontWeight: 600, color: '#10B981',
          background: 'rgba(16, 185, 129, 0.08)', padding: '3px 10px',
          borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} aria-hidden="true" />
          All Systems Operational
        </span>
      </div>

      {/* Health Metrics */}
      <div className="system-health">
        {HEALTH_METRICS.map((metric) => (
          <div key={metric.label} className="system-health__metric">
            <span className="system-health__label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: statusColors[metric.status], display: 'flex' }}>{metric.icon}</span>
              {metric.label}
            </span>
            <span
              className="system-health__value"
              style={{ color: statusColors[metric.status] }}
            >
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: '#E2E8F0', margin: '16px 0' }} />

      {/* Resource Gauges */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {GAUGES.map((gauge) => (
          <div key={gauge.label} className="system-health__gauge">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={13} color={gauge.color} />
                {gauge.label}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: gauge.color, fontFamily: 'var(--fd-font-mono)' }}>
                {gauge.value}%
              </span>
            </div>
            <div className="system-health__gauge-track">
              <motion.div
                className="system-health__gauge-fill"
                style={{ background: gauge.color }}
                initial={{ width: 0 }}
                animate={{ width: `${gauge.value}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', display: 'block' }}>
              {gauge.total}
            </span>
          </div>
        ))}
      </div>

      {/* Fleet Health */}
      <div style={{ height: '1px', background: '#E2E8F0', margin: '16px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Fleet Health Index</span>
        <span style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', fontFamily: 'var(--fd-font-mono)' }}>
          94%
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px',
          background: 'rgba(16, 185, 129, 0.08)', color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}>
          ✓ Engines Normal
        </span>
        <span style={{
          fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '9999px',
          background: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B',
          border: '1px solid rgba(245, 158, 11, 0.2)',
        }}>
          ! 2 Service Due
        </span>
      </div>
    </motion.div>
  );
};

export default memo(SystemHealth);
