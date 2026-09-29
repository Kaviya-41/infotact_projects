/**
 * FleetStatusCard.tsx – Fleet status breakdown card
 */

import React from 'react';
import type { FleetStats } from '../types/fleet';

interface FleetStatusCardProps {
  stats?: FleetStats;
}

const DEFAULT_STATS: FleetStats = {
  totalVehicles: 42,
  movingVehicles: 28,
  stoppedVehicles: 9,
  offlineVehicles: 5,
  totalDistanceTodayKm: 3420,
  avgSpeedKmh: 54,
  fuelEfficiencyKmpl: 4.2,
};

const FleetStatusCard: React.FC<FleetStatusCardProps> = ({ stats = DEFAULT_STATS }) => {
  const { totalVehicles, movingVehicles, stoppedVehicles, offlineVehicles } = stats;

  return (
    <div className="fleet-card">
      <h3 className="fleet-card__title">Fleet Health Overview</h3>
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
        <div>Total: {totalVehicles}</div>
        <div style={{ color: '#16A34A' }}>Moving: {movingVehicles}</div>
        <div style={{ color: '#D97706' }}>Stopped: {stoppedVehicles}</div>
        <div style={{ color: '#DC2626' }}>Offline: {offlineVehicles}</div>
      </div>
    </div>
  );
};

export default FleetStatusCard;
