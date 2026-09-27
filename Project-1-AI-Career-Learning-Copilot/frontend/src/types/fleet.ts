/**
 * fleet.ts – Type definitions for FleetDash Fleet Telemetry System
 */

export type VehicleStatus = 'Moving' | 'Stopped' | 'Offline' | 'Idle' | 'Maintenance';

export type AlertSeverity = 'Critical' | 'Warning' | 'Info';

export interface User {
  id?: string;
  name: string;
  email: string;
  company?: string;
  organization?: string;
  role: string;
}

export interface VehicleTelemetry {
  speed: number;           // km/h
  fuelLevel: number;       // percentage 0-100
  engineHealth: 'Healthy' | 'Warning' | 'Critical' | 'N/A';
  gpsConnected: boolean | null;
  tripDistance: number;    // km
  lastUpdate: string;      // human readable string e.g. "2 sec ago"
  latitude: number;
  longitude: number;
  batteryVoltage?: number; // V
  tirePressurePsi?: number;// PSI
  coolantTempC?: number;   // °C
}

export interface Vehicle {
  id: string;              // e.g. "FLT-024"
  name: string;            // e.g. "Freightliner Cascadia #24"
  type: 'Heavy Truck' | 'Delivery Van' | 'Cargo Vessel' | 'Service Vehicle';
  driver: string;
  driverAvatar?: string;
  status: VehicleStatus;
  location: string;
  telemetry: VehicleTelemetry;
}

export interface FleetStats {
  totalVehicles: number;
  movingVehicles: number;
  stoppedVehicles: number;
  offlineVehicles: number;
  totalDistanceTodayKm: number;
  avgSpeedKmh: number;
  fuelEfficiencyKmpl: number;
}

export interface FleetAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  location: string;
}

export interface FleetAnalyticsMetric {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  period: string;
}
