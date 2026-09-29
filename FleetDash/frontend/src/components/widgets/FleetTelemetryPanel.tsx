import React from 'react';
import { VehicleGauge } from '../canvas/VehicleGauge';
import { VehicleHealthCard } from './VehicleHealthCard';
import { FuelEfficiencyCard } from './FuelEfficiencyCard';

export const FleetTelemetryPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Dynamic Gauge Card */}
      <VehicleGauge />

      {/* Fleet Status Card */}
      <VehicleHealthCard />

      {/* Distribution Breakdown Card */}
      <FuelEfficiencyCard />
    </div>
  );
};

export default FleetTelemetryPanel;
