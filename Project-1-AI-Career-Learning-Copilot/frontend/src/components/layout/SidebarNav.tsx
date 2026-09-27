/**
 * SidebarNav.tsx – Vertical Navigation Capsule Control Dock
 * @deprecated This dark-themed sidebar is superseded by the light-theme
 * Sidebar.tsx component used in DashboardLayout. Retained for reference
 * and potential Week 3 Canvas fullscreen mode.
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Map, Truck, BarChart3, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={20} />, path: '/dashboard' },
  { id: 'live-map',  label: 'Live Map',  icon: <Map size={20} />, path: '/live-map' },
  { id: 'vehicles',  label: 'Vehicles',  icon: <Truck size={20} />, path: '/vehicles' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, path: '/analytics' },
  { id: 'alerts',    label: 'Alerts',    icon: <Bell size={20} />, path: '/alerts', badge: true },
  { id: 'settings',  label: 'Settings',  icon: <Settings size={20} />, path: '/settings' },
];

export const SidebarNav: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar-dock w-16 h-full bg-[#13161F]/60 backdrop-blur-xl border-r border-white/10 flex flex-col items-center justify-between py-6 rounded-3xl" aria-label="Automotive Telemetry Navigation">
      {/* Brand Icon Header */}
      <div className="sidebar-dock__logo w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF8A00] to-amber-300 flex items-center justify-center shadow-lg shadow-orange-500/20 font-bold text-black text-xs" title="FleetDash Telemetry Platform">
        FD
      </div>

      {/* Main Nav Capsule Items */}
      <nav className="sidebar-dock__nav flex flex-col gap-6">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `sidebar-dock__item w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              isActive ? 'bg-white/15 text-white active' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
            title={item.label}
          >
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="flex items-center justify-center"
            >
              {item.icon}
            </motion.div>
            {item.badge && <span className="sidebar-dock__badge" />}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="flex flex-col gap-3 items-center">
        <div
          className="w-8 h-8 rounded-full bg-slate-700 border border-white/20 flex items-center justify-center text-xs text-white font-bold cursor-pointer"
          title={user?.name || 'Fleet Manager'}
        >
          {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'OP'}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={logout}
          className="sidebar-dock__item text-rose-400 hover:text-rose-300 bg-none border-none cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={18} />
        </motion.button>
      </div>
    </aside>
  );
};

export default SidebarNav;

