/**
 * useSocketTelemetry.ts – Real-Time Socket.IO Telemetry Hook
 *
 * Connects to the backend Socket.IO server, listens to live telemetry updates
 * from the development telemetry simulator, and exposes connection state.
 */

import { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import type { TelemetrySnapshot } from '../types/telemetry';

export interface LiveTelemetryPayload {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  currentSpeed: number;
  fuelLevel: number;
  mileage: number;
  status: string;
  lastUpdated: string;
}

const INITIAL_SNAPSHOT: TelemetrySnapshot = {
  speed: { value: 62, rpm: 1850, fuelEfficiency: 4.2, tripDistance: 148, updated: 'Live' },
  health: {
    overallScore: 94,
    items: [
      { id: 'engine', name: 'Engine State', status: 'Healthy', value: 'Optimal', pct: 96, icon: 'Activity' },
      { id: 'fuel', name: 'Fuel Level', status: 'Optimal', value: '72%', pct: 72, icon: 'Fuel' },
    ],
  },
  route: {
    routeName: 'NH-44 Express Corridor',
    origin: 'Bengaluru Central Depot',
    destination: 'Hosur Industrial Complex',
    vehicleId: 'FD-001',
    driverName: 'Arjun Kumar',
    nextTurn: 'Continue on NH 44 for 18 km',
    eta: '45 mins',
    totalDistance: '48 km',
    steps: [],
  },
  alerts: [],
  efficiency: {
    fuelRemainingPct: 72,
    avgConsumptionKmpl: 4.2,
    distanceTodayKm: 148,
    idleTimeMin: 12,
    fleetEfficiencyPct: 92,
  },
  timestamp: new Date().toISOString(),
};

export const useSocketTelemetry = (_updateIntervalMs: number = 3000) => {
  const [telemetry, setTelemetry] = useState<TelemetrySnapshot>(INITIAL_SNAPSHOT);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const [lastPayload, setLastPayload] = useState<LiveTelemetryPayload | null>(null);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    const onTelemetry = (data: LiveTelemetryPayload) => {
      setLastPayload(data);
      setTelemetry((prev) => ({
        ...prev,
        speed: {
          ...prev.speed,
          value: data.speed,
          rpm: Math.round(1100 + data.speed * 12),
          updated: 'Just now',
        },
        efficiency: {
          ...prev.efficiency,
          fuelRemainingPct: data.fuelLevel,
          distanceTodayKm: Math.round(data.mileage % 500),
        },
        timestamp: data.lastUpdated || new Date().toISOString(),
      }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('vehicleTelemetry', onTelemetry);

    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('vehicleTelemetry', onTelemetry);
    };
  }, []);

  return { telemetry, isConnected, lastPayload };
};

export default useSocketTelemetry;
