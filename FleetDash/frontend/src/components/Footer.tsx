/**
 * Footer.tsx – FleetDash Enterprise Light Footer Component
 */

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontWeight: 600, color: '#0F172A' }}>FleetDash Telemetry Platform</span>
        <span>•</span>
        <span>High-Throughput Fleet Management System</span>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <a href="#system" onClick={(e) => e.preventDefault()} style={{ color: '#64748B', textDecoration: 'none' }}>System Status: Operational</a>
        <a href="#docs" onClick={(e) => e.preventDefault()} style={{ color: '#64748B', textDecoration: 'none' }}>API Docs</a>
        <a href="#support" onClick={(e) => e.preventDefault()} style={{ color: '#64748B', textDecoration: 'none' }}>Support</a>
      </div>
    </footer>
  );
};

export default Footer;
