/**
 * useVehicles.ts — Custom React hook for vehicle state with real-time Socket.IO sync.
 *
 * Phase 9 & Live Data System:
 * - Fetches initial vehicle data from GET /api/vehicles
 * - Subscribes to Socket.IO 'vehicleTelemetry' and 'telemetryBatch'
 * - Dynamically updates speed, location, fuel, mileage, and timestamps in real time
 */

import { useState, useEffect, useCallback } from 'react';
import type { Vehicle } from '../types/fleet';
import { fetchVehicles } from '../api/vehicleApi';
import type { BackendVehicle } from '../types/vehicle';
import { socket } from '../services/socket';
import type { LiveTelemetryPayload } from './useSocketTelemetry';

/**
 * Map a backend vehicle document to the frontend Vehicle type.
 */
function mapBackendVehicle(v: BackendVehicle): Vehicle {
  // Map backend type enum to frontend display type
  const typeMap: Record<string, Vehicle['type']> = {
    truck: 'Heavy Truck',
    van: 'Delivery Van',
    car: 'Service Vehicle',
    bus: 'Cargo Vessel',
    motorcycle: 'Service Vehicle',
    other: 'Service Vehicle',
  };

  // Map backend status enum to frontend display status
  const statusMap: Record<string, Vehicle['status']> = {
    online: 'Moving',
    offline: 'Offline',
    maintenance: 'Maintenance',
  };

  const lat = v.latitude ?? v.location?.latitude ?? 0;
  const lng = v.longitude ?? v.location?.longitude ?? 0;
  const speed = v.speed ?? v.currentSpeed ?? 0;

  return {
    id: v.vehicleId,
    name: `${v.make} ${v.model}`,
    type: typeMap[v.type] || 'Heavy Truck',
    driver: v.driverName || 'Unassigned',
    status: statusMap[v.status] || (speed > 0 ? 'Moving' : 'Stopped'),
    location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    telemetry: {
      speed,
      fuelLevel: v.fuelLevel ?? 0,
      engineHealth: 'N/A',
      gpsConnected: v.status === 'online',
      tripDistance: v.mileage ?? 0,
      lastUpdate: v.lastUpdated
        ? formatRelativeTime(new Date(v.lastUpdated))
        : formatRelativeTime(new Date(v.updatedAt)),
      latitude: lat,
      longitude: lng,
    },
  };
}

/** Format a date to a human-readable relative string */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec} sec ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVehicles();
      setVehicles(data.map(mapBackendVehicle));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load vehicles';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();

    // Listen for custom vehicle added event
    const handleVehicleAdded = () => {
      loadVehicles();
    };
    window.addEventListener('vehicleAdded', handleVehicleAdded);

    // Real-Time Socket.IO telemetry updates
    const handleTelemetry = (payload: LiveTelemetryPayload) => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.id === payload.vehicleId) {
            return {
              ...v,
              status: payload.speed > 0 ? 'Moving' : 'Stopped',
              location: `${payload.latitude.toFixed(4)}, ${payload.longitude.toFixed(4)}`,
              telemetry: {
                ...v.telemetry,
                speed: payload.speed,
                fuelLevel: payload.fuelLevel,
                tripDistance: payload.mileage,
                lastUpdate: 'Just now',
                latitude: payload.latitude,
                longitude: payload.longitude,
              },
            };
          }
          return v;
        })
      );
    };

    const handleTelemetryBatch = (batch: LiveTelemetryPayload[]) => {
      if (!batch || batch.length === 0) return;
      const batchMap = new Map(batch.map((item) => [item.vehicleId, item]));

      setVehicles((prev) =>
        prev.map((v) => {
          const update = batchMap.get(v.id);
          if (update) {
            return {
              ...v,
              status: update.speed > 0 ? 'Moving' : 'Stopped',
              location: `${update.latitude.toFixed(4)}, ${update.longitude.toFixed(4)}`,
              telemetry: {
                ...v.telemetry,
                speed: update.speed,
                fuelLevel: update.fuelLevel,
                tripDistance: update.mileage,
                lastUpdate: 'Just now',
                latitude: update.latitude,
                longitude: update.longitude,
              },
            };
          }
          return v;
        })
      );
    };

    socket.on('vehicleTelemetry', handleTelemetry);
    socket.on('telemetryBatch', handleTelemetryBatch);

    return () => {
      window.removeEventListener('vehicleAdded', handleVehicleAdded);
      socket.off('vehicleTelemetry', handleTelemetry);
      socket.off('telemetryBatch', handleTelemetryBatch);
    };
  }, [loadVehicles]);

  return { vehicles, loading, error, refetch: loadVehicles };
}

export default useVehicles;
