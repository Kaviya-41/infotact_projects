/**
 * DashboardLayout.tsx – Automotive Telemetry Dashboard Layout Shell
 */

import React from 'react';
import '../../styles/dashboard.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F6F8FB' }}>
      {children}
    </div>
  );
};

export default DashboardLayout;
