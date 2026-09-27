/**
 * Header.tsx – FleetDash Enterprise Global Header Component
 * Single sticky top bar (74px height) with:
 * - Left: "Fleet Operations" title + operational subtitle (crisp, single-line)
 * - Center: Compact search input + Telemetry pills (GPS Online, Server Healthy, Live Connected)
 * - Right: "Create Trip", "+ Add Vehicle", Notifications (3), Help, Profile Menu
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, Bell, Plus, Route as RouteIcon, Wifi, Server, Radio,
  HelpCircle, X, AlertCircle, Menu,
  User as UserIcon, Settings, LogOut, Shield, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createVehicle } from '../api/vehicleApi';
import { SAMPLE_MARKERS, type VehicleMarker } from './MapPlaceholder';
import { useSocketTelemetry } from '../hooks/useSocketTelemetry';
import '../styles/dashboard.css';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onAddVehicle?: () => void;
  onCreateTrip?: () => void;
  onToggleMobileSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title = "Operations",
  subtitle = "Monitor your fleet, active trips and operational alerts in real time.",
  onAddVehicle,
  onCreateTrip,
  onToggleMobileSidebar,
}) => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocketTelemetry();
  const navigate = useNavigate();
  const location = useLocation();

  const getRouteHeader = () => {
    switch (location.pathname) {
      case '/live-map':
        return {
          title: 'Live Fleet Map',
          subtitle: 'Real-time vehicle positions, corridor routes and operational alerts.'
        };
      case '/vehicles':
        return {
          title: 'Vehicles',
          subtitle: 'Monitor and manage all registered fleet vehicles.'
        };
      case '/analytics':
      case '/reports':
        return {
          title: 'Fleet Analytics',
          subtitle: 'Analyze fleet utilization, trips and operational performance.'
        };
      case '/alerts':
      case '/activity':
        return {
          title: 'Alerts Center',
          subtitle: 'Monitor operational warnings and critical fleet events.'
        };
      case '/settings':
        return {
          title: 'Settings',
          subtitle: 'Manage your account, fleet thresholds, notifications and preferences.'
        };
      case '/dashboard':
      default:
        return {
          title: 'Operations',
          subtitle: 'Monitor your fleet, active trips and operational alerts in real time.'
        };
    }
  };

  const routeHeader = getRouteHeader();
  const displayTitle = title !== 'Operations' ? title : routeHeader.title;
  const displaySubtitle = subtitle !== 'Monitor your fleet, active trips and operational alerts in real time.' ? subtitle : routeHeader.subtitle;

  // Dialog & popover states
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search input & focus state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Refs for clicking outside popovers & search
  const notificationRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search results filtered from existing FleetDash sample vehicles & telemetry
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SAMPLE_MARKERS.filter((v) =>
      v.id.toLowerCase().includes(q) ||
      v.name.toLowerCase().includes(q) ||
      v.driver.toLowerCase().includes(q) ||
      v.status.toLowerCase().includes(q) ||
      v.route.origin.toLowerCase().includes(q) ||
      v.route.destination.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Add Vehicle form state
  const [vehicleId, setVehicleId] = useState('FLT-015');
  const [vehicleType, setVehicleType] = useState('Heavy Truck');
  const [vehicleDriver, setVehicleDriver] = useState('Vikram Malhotra');
  const [regNumber, setRegNumber] = useState('KA-01-MJ-4021');
  const [vehicleStatus, setVehicleStatus] = useState('Moving');

  // Create Trip form state
  const [tripVehicle, setTripVehicle] = useState('FLT-001 (Volvo FH16)');
  const [tripDriver, setTripDriver] = useState('Arjun Kumar');
  const [tripStart, setTripStart] = useState('Bengaluru Central Depot');
  const [tripDest, setTripDest] = useState('Chennai Port Terminal');
  const [tripPriority, setTripPriority] = useState('Normal');
  const [tripTime, setTripTime] = useState('Today, 03:30 PM');

  // Notification items state
  const [notifications, setNotifications] = useState<any[]>([]);

  // Click outside listener for dropdowns & search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Escape key handler to dismiss open overlays/modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotificationsOpen(false);
        setIsHelpOpen(false);
        setIsProfileOpen(false);
        setIsSearchFocused(false);
        setIsAddVehicleOpen(false);
        setIsCreateTripOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Body scroll lock management when modals are open
  useEffect(() => {
    if (isAddVehicleOpen || isCreateTripOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddVehicleOpen, isCreateTripOpen]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVehicle({
        vehicleId,
        make: 'Unknown',
        model: vehicleType,
        type: vehicleType.split(' ')[0].toLowerCase(),
        driverName: vehicleDriver,
        registrationNumber: regNumber,
        status: vehicleStatus.toLowerCase(),
      });
      setIsAddVehicleOpen(false);
      triggerToast(`Vehicle ${vehicleId} successfully registered to fleet.`);
      window.dispatchEvent(new Event('vehicleAdded'));
    } catch (err: any) {
      triggerToast(`Error: ${err.message || 'Failed to add vehicle'}`);
    }
  };

  const handleCreateTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreateTripOpen(false);
    triggerToast(`Trip created: ${tripVehicle} (${tripStart} → ${tripDest}).`);
  };

  const handleSignOut = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  const handleSelectSearchResult = (v: VehicleMarker) => {
    setIsSearchFocused(false);
    setSearchQuery('');
    navigate('/live-map', { state: { selectedVehicleId: v.id } });
  };

  return (
    <>
      <header className="header" id="global-header">
        {/* ROW 1: Page Title + Description (Left) | System Status Pills + User & Popovers (Right) */}
        <div className="header__top-row">
          <div className="header__left">
            <button
              className="header__mobile-menu-btn"
              onClick={onToggleMobileSidebar}
              aria-label="Open Navigation Drawer"
              title="Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="header__greeting">{displayTitle}</h1>
              <p className="header__subtitle">{displaySubtitle}</p>
            </div>
          </div>

          <div className="header__top-right">
            {/* Live Telemetry Status Pills */}
            <div className="header__telemetry-pills">
              <div className="header__status-badge header__status-badge--online" aria-label="GPS Status: Online">
                <span className="header__status-dot header__status-dot--green" aria-hidden="true" />
                <Wifi size={12} />
                <span>GPS Online</span>
              </div>

              <div className="header__status-badge header__status-badge--online" aria-label="Server Status: Healthy">
                <span className="header__status-dot header__status-dot--green" aria-hidden="true" />
                <Server size={12} />
                <span>Server Healthy</span>
              </div>

              <div className={`header__status-badge ${isConnected ? 'header__status-badge--online' : 'header__status-badge--offline'}`} aria-label={`Socket Status: ${isConnected ? 'Live Connected' : 'Connecting'}`}>
                <span className={`header__status-dot ${isConnected ? 'header__status-dot--green' : 'header__status-dot--amber'}`} aria-hidden="true" />
                <Radio size={12} />
                <span>{isConnected ? 'Live Connected' : 'Connecting...'}</span>
              </div>
            </div>

            {/* Notification Button & Popover */}
            <div className="popover-wrapper" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsNotificationsOpen((prev) => !prev);
                  setIsHelpOpen(false);
                  setIsProfileOpen(false);
                }}
                className={`header__icon-btn ${isNotificationsOpen ? 'active' : ''}`}
                id="header-notifications-btn"
                aria-label="View notifications"
                title="Fleet Alerts & Notifications"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="header__notification-badge">{notifications.length}</span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="popover-panel popover-panel--notifications" id="notifications-popover" role="dialog" aria-label="Fleet Alerts">
                  <div className="popover-header">
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--fd-text-primary)' }}>Fleet Alerts</div>
                      <div style={{ fontSize: '11px', color: 'var(--fd-text-secondary)' }}>{notifications.length} unresolved notifications</div>
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="popover-body">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--fd-text-muted)', fontSize: '13px' }}>
                        <CheckCircle2 size={24} color="#10B981" style={{ margin: '0 auto 8px' }} />
                        <div>All systems operating within parameters</div>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const IconComponent = n.icon;
                        return (
                          <div key={n.id} className="notification-item">
                            <div style={{
                              width: '26px', height: '26px', borderRadius: '6px',
                              backgroundColor: n.bg, color: n.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              <IconComponent size={13} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span style={{ fontSize: '10.5px', fontWeight: 700, color: n.color, textTransform: 'uppercase' }}>
                                  {n.severity}: {n.code}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--fd-text-muted)' }}>{n.time}</span>
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fd-text-primary)' }}>{n.title}</div>
                              <div style={{ fontSize: '11px', color: 'var(--fd-text-secondary)', marginTop: '1px', lineHeight: 1.3 }}>{n.desc}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Help Button & Popover */}
            <div className="popover-wrapper" ref={helpRef}>
              <button
                onClick={() => {
                  setIsHelpOpen((prev) => !prev);
                  setIsNotificationsOpen(false);
                  setIsProfileOpen(false);
                }}
                className={`header__icon-btn ${isHelpOpen ? 'active' : ''}`}
                id="header-help-btn"
                aria-label="Help & Documentation"
                title="FleetDash Help & Guidance"
              >
                <HelpCircle size={16} />
              </button>

              {isHelpOpen && (
                <div className="popover-panel popover-panel--help" id="help-popover" role="dialog" aria-label="FleetDash Help">
                  <div className="popover-header">
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--fd-text-primary)' }}>FleetDash Help</div>
                    <span style={{ fontSize: '11px', color: 'var(--fd-text-secondary)' }}>Quick Operations Guide</span>
                  </div>

                  <div className="popover-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="help-tip-item">
                      <span className="help-tip-icon"><Wifi size={12} color="var(--fd-color-primary)" /></span>
                      <div>
                        <div className="help-tip-title">Monitor vehicles from Live Map</div>
                        <div className="help-tip-desc">Click vehicle markers on the map to inspect speed, fuel, and trip progress.</div>
                      </div>
                    </div>

                    <div className="help-tip-item">
                      <span className="help-tip-icon"><AlertCircle size={12} color="#EF4444" /></span>
                      <div>
                        <div className="help-tip-title">Check operational alerts</div>
                        <div className="help-tip-desc">View real-time engine, speed, and offline warnings in the alerts panel.</div>
                      </div>
                    </div>

                    <div className="help-tip-item">
                      <span className="help-tip-icon"><Shield size={12} color="#10B981" /></span>
                      <div>
                        <div className="help-tip-title">Review fleet analytics</div>
                        <div className="help-tip-desc">Analyze 7-day distance trends, completion metrics, and diagnostic health.</div>
                      </div>
                    </div>

                    <div className="help-tip-item">
                      <span className="help-tip-icon"><RouteIcon size={12} color="var(--fd-color-purple)" /></span>
                      <div>
                        <div className="help-tip-title">Manage vehicles and trips</div>
                        <div className="help-tip-desc">Use the "Add Vehicle" and "Create Trip" buttons in the top header.</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Button & Dropdown */}
            <div className="popover-wrapper" ref={profileRef}>
              <button
                onClick={() => {
                  setIsProfileOpen((prev) => !prev);
                  setIsNotificationsOpen(false);
                  setIsHelpOpen(false);
                }}
                className="header__profile-btn"
                id="header-profile-btn"
                aria-label="User Profile Menu"
              >
                <div className="header__profile-avatar">
                  {user?.name ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SL'}
                </div>
                <span className="header__profile-name">
                  {user?.name || 'Soundarya Lakshmi'}
                </span>
              </button>

              {isProfileOpen && (
                <div className="popover-panel popover-panel--profile" id="profile-dropdown" role="menu">
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--fd-border-subtle)', backgroundColor: 'var(--fd-bg-surface)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fd-text-primary)' }}>{user?.name || 'Soundarya Lakshmi'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--fd-text-secondary)', marginTop: '1px' }}>{user?.email || 'admin@fleetdash.io'}</div>
                    <div style={{
                      display: 'inline-block', marginTop: '6px', fontSize: '10px', fontWeight: 700,
                      padding: '2px 7px', borderRadius: '4px', backgroundColor: 'var(--fd-color-primary-light)', color: 'var(--fd-color-primary)',
                      border: '1px solid var(--fd-border-color)'
                    }}>
                      {user?.role || 'Fleet Dispatcher'}
                    </div>
                  </div>

                  <div style={{ padding: '4px' }}>
                    <button
                      onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                      className="menu-item-btn"
                      role="menuitem"
                    >
                      <UserIcon size={13} color="var(--fd-text-secondary)" />
                      <span>Profile Overview</span>
                    </button>

                    <button
                      onClick={() => { setIsProfileOpen(false); navigate('/settings'); }}
                      className="menu-item-btn"
                      role="menuitem"
                    >
                      <Settings size={13} color="var(--fd-text-secondary)" />
                      <span>Account Settings</span>
                    </button>

                    <div style={{ height: '1px', backgroundColor: 'var(--fd-border-subtle)', margin: '3px 0' }} />

                    <button
                      onClick={handleSignOut}
                      className="menu-item-btn menu-item-btn--danger"
                      role="menuitem"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Search (Left) | Create Trip & Add Vehicle (Right) */}
        <div className="header__action-row">
          <div className="header__search" ref={searchRef}>
            <Search size={13} className="header__search-icon" />
            <input
              type="search"
              className="header__search-input"
              placeholder="Search vehicles, routes, drivers..."
              aria-label="Search vehicles, drivers, routes or trips"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
              onFocus={() => setIsSearchFocused(true)}
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                className="header__search-clear-btn"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchFocused(false);
                }}
                aria-label="Clear search"
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}

            {/* Search Results Popover */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="popover-panel popover-panel--search" role="listbox" aria-label="Search Results">
                <div className="popover-header">
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fd-text-primary)' }}>
                    Matching Telemetry Units ({searchResults.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSearchFocused(false)}
                    style={{ fontSize: '11px', color: 'var(--fd-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                </div>

                <div className="popover-body" style={{ maxHeight: '280px' }}>
                  {searchResults.length === 0 ? (
                    <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--fd-text-muted)', fontSize: '12.5px' }}>
                      <AlertCircle size={20} style={{ margin: '0 auto 6px', color: 'var(--fd-text-muted)' }} />
                      <div>No vehicles or routes matching "{searchQuery}"</div>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--fd-color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    searchResults.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className="search-result-item"
                        onClick={() => handleSelectSearchResult(v)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700,
                            backgroundColor: 'var(--fd-color-primary-light)', color: 'var(--fd-color-primary)',
                            border: '1px solid var(--fd-border-color)', flexShrink: 0
                          }}>
                            {v.id}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fd-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {v.name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--fd-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {v.driver} • {v.route.origin} → {v.route.destination}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                            backgroundColor: v.status === 'Moving' || v.status === 'Online' ? 'var(--fd-color-success-bg)' : v.status === 'Idle' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
                            color: v.status === 'Moving' || v.status === 'Online' ? 'var(--fd-color-success)' : v.status === 'Idle' ? '#F59E0B' : '#EF4444',
                            border: `1px solid ${v.status === 'Moving' || v.status === 'Online' ? 'var(--fd-color-success-border)' : 'rgba(245,158,11,0.25)'}`
                          }}>
                            {v.status}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="header__action-btns">
            <button
              onClick={onCreateTrip || (() => setIsCreateTripOpen(true))}
              className="btn-header-secondary"
              id="btn-create-trip"
              title="Create a new fleet dispatch trip"
              aria-label="Create New Trip"
            >
              <RouteIcon size={13} color="var(--fd-color-primary)" />
              <span>Create Trip</span>
            </button>

            <button
              onClick={onAddVehicle || (() => setIsAddVehicleOpen(true))}
              className="btn-header-primary"
              id="btn-add-vehicle"
              title="Add a new vehicle to fleet telemetry"
              aria-label="Add Vehicle"
            >
              <Plus size={14} />
              <span>Add Vehicle</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Add Vehicle Modal ────────────────────────────────────────── */}
      {isAddVehicleOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsAddVehicleOpen(false)}>
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-vehicle-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 id="add-vehicle-title" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--fd-text-primary)' }}>
                  Add New Vehicle
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--fd-text-secondary)', marginTop: '1px' }}>
                  Register a new vehicle to telemetry monitoring
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddVehicleOpen(false)}
                aria-label="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddVehicleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle-id-input">Vehicle ID</label>
                  <input
                    id="vehicle-id-input"
                    type="text"
                    className="form-input"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    placeholder="e.g. FLT-015"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle-type-select">Vehicle Type</label>
                  <select
                    id="vehicle-type-select"
                    className="form-select"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    <option value="Heavy Truck">Heavy Truck (Long Haul)</option>
                    <option value="Delivery Van">Delivery Van (Last Mile)</option>
                    <option value="Cargo Vessel">Cargo Vessel</option>
                    <option value="Service Vehicle">Service Vehicle</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle-driver-input">Assigned Driver</label>
                  <input
                    id="vehicle-driver-input"
                    type="text"
                    className="form-input"
                    value={vehicleDriver}
                    onChange={(e) => setVehicleDriver(e.target.value)}
                    placeholder="Driver full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle-reg-input">Registration Number</label>
                  <input
                    id="vehicle-reg-input"
                    type="text"
                    className="form-input"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="e.g. KA-01-MJ-4021"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="vehicle-status-select">Initial Status</label>
                  <select
                    id="vehicle-status-select"
                    className="form-select"
                    value={vehicleStatus}
                    onChange={(e) => setVehicleStatus(e.target.value)}
                  >
                    <option value="Moving">Online / Moving</option>
                    <option value="Idle">Idle</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsAddVehicleOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                >
                  <Plus size={14} />
                  <span>Add Vehicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Create Trip Modal ────────────────────────────────────────── */}
      {isCreateTripOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsCreateTripOpen(false)}>
          <div
            className="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-trip-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 id="create-trip-title" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--fd-text-primary)' }}>
                  Create New Trip
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--fd-text-secondary)', marginTop: '1px' }}>
                  Dispatch an active route to a fleet vehicle
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsCreateTripOpen(false)}
                aria-label="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateTripSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label" htmlFor="trip-vehicle-select">Select Vehicle</label>
                  <select
                    id="trip-vehicle-select"
                    className="form-select"
                    value={tripVehicle}
                    onChange={(e) => setTripVehicle(e.target.value)}
                  >
                    <option value="FLT-001 (Volvo FH16)">FLT-001 — Volvo FH16 (Available)</option>
                    <option value="FLT-004 (Freightliner)">FLT-004 — Freightliner Cascadia</option>
                    <option value="FLT-007 (Scania R500)">FLT-007 — Scania R500</option>
                    <option value="FLT-012 (Sprinter #12)">FLT-012 — Mercedes Sprinter</option>
                    <option value="FLT-024 (Cascadia #24)">FLT-024 — Freightliner Cascadia</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="trip-driver-input">Driver</label>
                  <input
                    id="trip-driver-input"
                    type="text"
                    className="form-input"
                    value={tripDriver}
                    onChange={(e) => setTripDriver(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="trip-start-input">Start Location</label>
                    <input
                      id="trip-start-input"
                      type="text"
                      className="form-input"
                      value={tripStart}
                      onChange={(e) => setTripStart(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="trip-dest-input">Destination</label>
                    <input
                      id="trip-dest-input"
                      type="text"
                      className="form-input"
                      value={tripDest}
                      onChange={(e) => setTripDest(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="trip-priority-select">Priority</label>
                    <select
                      id="trip-priority-select"
                      className="form-select"
                      value={tripPriority}
                      onChange={(e) => setTripPriority(e.target.value)}
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent / Express</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="trip-time-input">Scheduled Time</label>
                    <input
                      id="trip-time-input"
                      type="text"
                      className="form-input"
                      value={tripTime}
                      onChange={(e) => setTripTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsCreateTripOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                >
                  <RouteIcon size={14} />
                  <span>Create Trip</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast Notification Banner ───────────────────────────────── */}
      {toastMessage && (
        <div className="header-toast" role="status" aria-live="polite">
          <CheckCircle2 size={15} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};

export default Header;
