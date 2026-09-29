/**
 * DashboardLayout.tsx – FleetDash AppShell Layout Wrapper
 * Persistent Sidebar + sticky Header + scrollable content area (<Outlet />).
 * Guarantees zero header overlap and clean independent content scrolling.
 */

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import '../styles/dashboard.css';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />
      <div className="app-shell__main">
        <Header
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        <main className="app-shell__content" id="main-content-scroll">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

