/**
 * Sidebar.tsx – FleetDash Premium Light Navigation Sidebar
 * Persistent AppShell sidebar with NavLink active states and Lucide icons.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Map, Truck, BarChart3, Bell, Settings, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const PRIMARY_NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={20} strokeWidth={2} />, path: '/dashboard' },
  { id: 'live-map',  label: 'Live Map',  icon: <Map size={20} strokeWidth={2} />, path: '/live-map' },
  { id: 'vehicles',  label: 'Vehicles',  icon: <Truck size={20} strokeWidth={2} />, path: '/vehicles' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} strokeWidth={2} />, path: '/analytics' },
  { id: 'alerts',    label: 'Alerts',    icon: <Bell size={20} strokeWidth={2} />, path: '/alerts' },
];

const SECONDARY_NAV: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: <Settings size={20} strokeWidth={2} />, path: '/settings' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.id}
      to={item.path}
      end={item.path === '/dashboard'}
      id={`sidebar-nav-${item.id}`}
      onClick={onClose}
      className={({ isActive }) => `sidebar__nav-item${isActive ? ' active' : ''}`}
    >
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {item.icon}
      </span>
      <span>{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="sidebar__badge">{item.badge}</span>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="Main navigation">
        {/* Brand Header */}
        <div className="sidebar__header">
          <div className="sidebar__logo-icon">
            <Truck size={20} />
          </div>
          <span className="sidebar__logo-text">Fleet<span>Dash</span></span>
        </div>

        {/* Primary Nav */}
        <nav className="sidebar__nav">
          <span className="sidebar__section-title">NAVIGATION</span>
          {PRIMARY_NAV.map(renderNavItem)}

          <span className="sidebar__section-title" style={{ marginTop: '16px' }}>SYSTEM</span>
          {SECONDARY_NAV.map(renderNavItem)}
        </nav>

        {/* User Footer & Logout */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__avatar">
              {user?.name ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SL'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div className="sidebar__user-name">{user?.name || 'Soundarya Lakshmi'}</div>
              <div className="sidebar__user-role">{user?.company || 'LogiTech Logistics'}</div>
            </div>
          </div>

          <button
            onClick={() => { onClose?.(); logout(); }}
            className="sidebar__nav-item"
            style={{ width: '100%', marginTop: '6px', color: '#EF4444', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600 }}
            title="Sign Out"
            aria-label="Sign out of FleetDash"
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={18} strokeWidth={2} />
            </span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};


export default Sidebar;
