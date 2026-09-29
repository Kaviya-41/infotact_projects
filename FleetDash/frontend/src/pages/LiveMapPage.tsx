/**
 * LiveMapPage.tsx – Real-Time Fleet Operations Command Center Page
 * Professional enterprise command center featuring:
 * 1. Compact Page Header with live vehicle count & telemetry status badges
 * 2. Primary Live Fleet Map Visualizer with interactive markers, HUD, and corridor routes
 * 3. Row 1: Active Route Intelligence (1.4fr) + Selected Vehicle / Fleet Status (1fr)
 * 4. Row 2: Live Map Alerts (1fr) + Recent Fleet Activity Stream (1fr)
 * 5. Slide-in Vehicle Telemetry Drawer
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Radio, Truck } from 'lucide-react';
import MapPlaceholder from '../components/MapPlaceholder';
import VehicleDrawer from '../components/dashboard/VehicleDrawer';
import ActiveRouteCard from '../components/widgets/ActiveRouteCard';
import FleetStatusSummaryCard from '../components/widgets/FleetStatusSummaryCard';
import VehicleAlertBanner from '../components/widgets/VehicleAlertBanner';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import { fetchDashboardSummary } from '../api/dashboardApi';
import type { DashboardSummary } from '../types/api';
import '../styles/dashboard.css';

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const LiveMapPage: React.FC = () => {
  const location = useLocation();
  const stateVehicleId = (location.state as { selectedVehicleId?: string })?.selectedVehicleId;

  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(stateVehicleId || 'FLT-004');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    if (stateVehicleId) {
      setSelectedVehicleId(stateVehicleId);
    }
  }, [stateVehicleId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchDashboardSummary();
        if (!cancelled) setSummary(data);
      } catch {
        // Failed to load — keep default display
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSelectVehicle = useCallback((id: string) => {
    setSelectedVehicleId(id);
  }, []);

  const handleOpenDrawer = useCallback((id: string) => {
    setSelectedVehicleId(id);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  return (
    <div className="dashboard" id="live-map-command-center">
      {/* Page Title & Real-Time Status Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', paddingBottom: '4px'
      }}>
        <div>
          <h2 className="dashboard__hero-title" style={{ fontSize: '26px', fontWeight: 800, color: 'var(--fd-text-primary)', letterSpacing: '-0.4px', lineHeight: 1.2 }}>
            Live Fleet Map
          </h2>
          <p className="dashboard__hero-subtitle" style={{ fontSize: '13.5px', color: 'var(--fd-text-secondary)', marginTop: '3px' }}>
            Real-time vehicle positions, routes and operational alerts
          </p>
        </div>

        {/* Right Header Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '20px',
            backgroundColor: 'var(--fd-bg-surface)', border: '1px solid var(--fd-border-color)',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            fontSize: '12px', fontWeight: 600, color: 'var(--fd-text-primary)'
          }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              backgroundColor: '#10B981', display: 'inline-block',
              boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
              animation: 'header-pulse 2s ease-in-out infinite'
            }} />
            <Truck size={13} color="var(--fd-color-primary)" />
            <span>{summary?.totalVehicles ?? 0} Vehicles Tracked</span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '20px',
            backgroundColor: 'var(--fd-color-primary-light)',
            border: '1px solid var(--fd-border-color)',
            fontSize: '12px', fontWeight: 700, color: 'var(--fd-color-primary)'
          }}>
            <Radio size={13} color="var(--fd-color-primary)" />
            <span>Live Telemetry Active</span>
          </div>
        </div>
      </div>

      {/* Main Map Container (Primary Focal Point) */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        style={{ width: '100%' }}
      >
        <MapPlaceholder
          height={620}
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={handleSelectVehicle}
          onOpenDrawer={handleOpenDrawer}
        />
      </motion.div>

      {/* ROW 1: Active Route Intelligence (1.4fr) + Selected Vehicle / Fleet Status (1fr) */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'stretch'
        }}
        className="live-map-row-1"
      >
        {/* Active Route Intelligence Card */}
        <ActiveRouteCard />

        {/* Selected Vehicle / Fleet Operations Status Card */}
        <FleetStatusSummaryCard
          selectedVehicleId={selectedVehicleId}
          onOpenDrawer={handleOpenDrawer}
        />
      </motion.div>

      {/* ROW 2: Live Map Alerts (1fr) + Recent Fleet Activity Stream (1fr) */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'stretch'
        }}
        className="live-map-row-2"
      >
        {/* Live Map Alerts Card */}
        <VehicleAlertBanner onSelectVehicle={handleSelectVehicle} />

        {/* Recent Fleet Activity Card */}
        <RecentActivityCard />
      </motion.div>

      {/* Slide-in Vehicle Telemetry Drawer */}
      <VehicleDrawer
        vehicleId={isDrawerOpen ? selectedVehicleId : null}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export default LiveMapPage;

