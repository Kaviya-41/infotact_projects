/**
 * ReportsPage.tsx – Dedicated Fleet Analytics Page
 * Route: /analytics
 */

import React from 'react';
import FleetAnalytics from '../components/FleetAnalytics';
import VehicleHealthProgressCard from '../components/dashboard/VehicleHealthProgressCard';
import '../styles/dashboard.css';

const ReportsPage: React.FC = () => {
  return (
    <div className="dashboard">
      {/* Page Header */}
      <div>
        <h2 className="dashboard__hero-title">Fleet Analytics</h2>
        <p className="dashboard__hero-subtitle">
          Analyze fleet utilization, trips and operational performance.
        </p>
      </div>

      {/* Analytics Main Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <FleetAnalytics />
        <VehicleHealthProgressCard />
      </div>
    </div>
  );
};

export default ReportsPage;
