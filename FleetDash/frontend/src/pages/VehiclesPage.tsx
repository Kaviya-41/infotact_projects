/**
 * VehiclesPage.tsx – Dedicated Fleet Vehicles Page
 * Provides full vehicle inventory management, telemetry status, filters, and search.
 *
 * Phase 9: Connected to real backend via useVehicles() hook.
 */

import React, { useState } from 'react';
import VehicleList from '../components/VehicleList';
import VehicleDrawer from '../components/dashboard/VehicleDrawer';
import { useVehicles } from '../hooks/useVehicles';
import type { Vehicle } from '../types/fleet';
import '../styles/dashboard.css';

const VehiclesPage: React.FC = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const { vehicles, loading, error } = useVehicles();

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicleId(vehicle.id);
  };

  return (
    <div className="dashboard">
      {/* Page Header */}
      <div>
        <h2 className="dashboard__hero-title">Vehicles</h2>
        <p className="dashboard__hero-subtitle">
          Monitor and manage all registered fleet vehicles.
        </p>
      </div>

      {/* Vehicle Telemetry Table Card */}
      <VehicleList
        vehicles={vehicles}
        loading={loading}
        error={error}
        onSelectVehicle={handleSelectVehicle}
        selectedVehicleId={selectedVehicleId || undefined}
      />

      {/* Slide-in Telemetry Drawer */}
      <VehicleDrawer
        vehicleId={selectedVehicleId}
        onClose={() => setSelectedVehicleId(null)}
      />
    </div>
  );
};

export default VehiclesPage;
