/**
 * Dashboard.tsx – FleetDash Enterprise Fleet Operations Center Page
 * Reorganized, compact, and calm information hierarchy:
 * 1. 4 Compact KPI Overview Cards (with Sparklines) (~120-130px height)
 * 2. Hero Section: Live Fleet Map (~68%) + Live Operations Panel (~32%)
 * 3. Mid Section: Active Trips + Live Alerts (1fr 1fr)
 * 4. Analytics Section: Fleet Performance (7-day chart) + Vehicle Health Diagnostics
 * 5. Timeline: Recent Activity Stream
 * 6. Slide-in Vehicle Telemetry Drawer
 */

import React, { useState, useCallback, memo } from 'react';
import { motion, type Variants } from 'framer-motion';
import DashboardCards from '../components/DashboardCards';
import MapPlaceholder from '../components/MapPlaceholder';
import LiveOperationsCard from '../components/dashboard/LiveOperationsCard';
import ActiveTripsCard from '../components/dashboard/ActiveTripsCard';
import RecentAlerts from '../components/RecentAlerts';
import FleetAnalytics from '../components/FleetAnalytics';
import VehicleHealthProgressCard from '../components/dashboard/VehicleHealthProgressCard';
import RecentActivityCard from '../components/dashboard/RecentActivityCard';
import VehicleDrawer from '../components/dashboard/VehicleDrawer';
import '../styles/dashboard.css';

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const Dashboard: React.FC = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const handleSelectVehicle = useCallback((id: string) => {
    setSelectedVehicleId(id);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedVehicleId(null);
  }, []);

  return (
    <div className="dashboard" id="fleet-operations-dashboard">
      {/* Row 1: 4 Compact KPI Overview Cards */}
      <DashboardCards />

      {/* Row 2: Live Fleet Map (Hero Element ~68%) + Live Operations Panel (~32%) */}
      <motion.div
        className="command-center"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        {/* Main Vector / Canvas Map Visualizer */}
        <MapPlaceholder
          selectedVehicleId={selectedVehicleId}
          onSelectVehicle={handleSelectVehicle}
        />

        {/* Live Operations Panel beside the Map */}
        <div className="command-center__right">
          <LiveOperationsCard />
        </div>
      </motion.div>

      {/* Row 3: Active Trips + Live Alerts (1fr 1fr grid) */}
      <motion.div
        className="dashboard-two-col"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <ActiveTripsCard />
        <RecentAlerts onSelectVehicle={handleSelectVehicle} />
      </motion.div>

      {/* Row 4: Fleet Performance Analytics (7-day chart) + Vehicle Health Diagnostics */}
      <motion.div
        className="dashboard-analytics-grid"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <FleetAnalytics />
        <VehicleHealthProgressCard />
      </motion.div>

      {/* Row 5: Real-Time Activity Stream */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <RecentActivityCard />
      </motion.div>

      {/* Slide-in Vehicle Telemetry Drawer (Framer Motion) */}
      <VehicleDrawer
        vehicleId={selectedVehicleId}
        onClose={handleCloseDrawer}
      />
    </div>
  );
};

export { Dashboard as FleetDashPage };
export default memo(Dashboard);
