/**
 * RightSidebar.tsx
 * Floating right panel displaying real-time system metrics, fleet health,
 * network status, weather, and storage/memory usage.
 * Inspired by Datadog & Samsara enterprise control panels.
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';

// ── Gauge Sub-component ────────────────────────────────────────────────────────

const MiniGauge: React.FC<{ value: number; label: string; color: string; subtext: string }> = memo(
  ({ value, label, color, subtext }) => (
    <div className="right-sidebar__gauge">
      <div className="gauge-header">
        <span className="gauge-label">{label}</span>
        <span className="gauge-val" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="gauge-track">
        <motion.div
          className="gauge-fill"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
      <span className="gauge-subtext">{subtext}</span>
    </div>
  )
);
MiniGauge.displayName = 'MiniGauge';

// ── Main Component ─────────────────────────────────────────────────────────────

const RightSidebar: React.FC = () => {
  return (
    <motion.aside
      className="right-sidebar"
      aria-label="System telemetry & health panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Panel Header */}
      <div className="right-sidebar__header">
        <div className="right-sidebar__title">
          <span className="live-pulse-ring" aria-hidden="true" />
          System Telemetry
        </div>
        <span className="right-sidebar__badge">Live 60Hz</span>
      </div>

      {/* ── Section 1: System Health ── */}
      <div className="right-sidebar__card" id="widget-system-health">
        <div className="card-title-row">
          <span className="card-icon" style={{ background: 'rgba(79,140,255,0.15)', color: '#4F8CFF' }}>
            ⚡
          </span>
          <h3>System Health</h3>
          <span className="card-status-dot green" />
        </div>
        <div className="metric-list">
          <div className="metric-item">
            <span className="metric-label">API Latency</span>
            <span className="metric-value green">12 ms</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Uptime</span>
            <span className="metric-value">99.99%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Telemetry Throughput</span>
            <span className="metric-value cyan">4.2k ops/s</span>
          </div>
        </div>
      </div>

      {/* ── Section 2: Today's Weather ── */}
      <div className="right-sidebar__card" id="widget-weather">
        <div className="card-title-row">
          <span className="card-icon" style={{ background: 'rgba(255,181,71,0.15)', color: '#FFB547' }}>
            ☀
          </span>
          <h3>Today's Weather</h3>
        </div>
        <div className="weather-widget-body">
          <div className="weather-main">
            <span className="weather-temp">29°C</span>
            <span className="weather-city">Bengaluru Hub</span>
          </div>
          <p className="weather-desc">Clear Sky · Visibility 10 km</p>
          <div className="weather-details">
            <div>
              <span>Humidity</span>
              <strong>45%</strong>
            </div>
            <div>
              <span>Wind</span>
              <strong>12 km/h</strong>
            </div>
            <div>
              <span>UV Index</span>
              <strong>6 Mod</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Network Status ── */}
      <div className="right-sidebar__card" id="widget-network-status">
        <div className="card-title-row">
          <span className="card-icon" style={{ background: 'rgba(0,212,255,0.15)', color: '#00D4FF' }}>
            📡
          </span>
          <h3>Network Status</h3>
          <span className="card-status-dot green" />
        </div>
        <div className="metric-list">
          <div className="metric-item">
            <span className="metric-label">Socket Connection</span>
            <span className="metric-value green">● Connected</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Ping</span>
            <span className="metric-value">14 ms</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Packet Loss</span>
            <span className="metric-value green">0.0%</span>
          </div>
        </div>
      </div>

      {/* ── Section 4: Fleet Health ── */}
      <div className="right-sidebar__card" id="widget-fleet-health">
        <div className="card-title-row">
          <span className="card-icon" style={{ background: 'rgba(49,214,123,0.15)', color: '#31D67B' }}>
            🛡️
          </span>
          <h3>Fleet Health</h3>
        </div>
        <MiniGauge value={94} label="Overall Health Index" color="#31D67B" subtext="39 of 42 vehicles healthy" />
        <div className="health-badges">
          <span className="h-badge green">✓ Engines Normal</span>
          <span className="h-badge amber">! 2 Service Due</span>
        </div>
      </div>

      {/* ── Section 5: Resource Allocation ── */}
      <div className="right-sidebar__card" id="widget-resources">
        <div className="card-title-row">
          <span className="card-icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA' }}>
            💾
          </span>
          <h3>Resources</h3>
        </div>
        <MiniGauge value={42} label="Storage Usage" color="#4F8CFF" subtext="4.2 GB / 10.0 GB Cache" />
        <MiniGauge value={62} label="Memory Usage" color="#A78BFA" subtext="9.9 GB / 16.0 GB RAM" />
      </div>
    </motion.aside>
  );
};

export default memo(RightSidebar);
