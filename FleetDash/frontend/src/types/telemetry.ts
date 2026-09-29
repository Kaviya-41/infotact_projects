/**
 * telemetry.ts – TypeScript interfaces for FleetDash Automotive Telemetry Data
 */

export type VehicleStatus = 'Moving' | 'Stopped' | 'Offline' | 'Idle';
export type AlertSeverity = 'Critical' | 'Warning' | 'Info' | 'Success';

export interface User {
  name: string;
  email: string;
  company?: string;
  role: string;
}

export interface VehicleSpeed {
  value: number;            // km/h
  rpm: number;              // RPM
  fuelEfficiency: number;   // km/L
  tripDistance: number;    // km
  updated: string;
}

export interface HealthItem {
  id: string;
  name: string;
  status: 'Healthy' | 'Optimal' | 'Warning' | 'Critical' | 'Connected' | 'Disconnected' | 'Normal';
  value: string | number;
  percentage?: number;
  pct?: number;
  icon: string;
}

export interface VehicleHealthData {
  items: HealthItem[];
  overallScore: number;
}

export interface RouteStep {
  id: string;
  instruction: string;
  distance: string;
  status: 'completed' | 'active' | 'pending';
}

export interface ActiveRouteData {
  routeName: string;
  origin: string;
  destination: string;
  vehicleId: string;
  driverName: string;
  nextTurn: string;
  eta: string;
  totalDistance: string;
  steps: RouteStep[];
}

export interface VehicleAlert {
  id: string;
  vehicleId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
}

export interface FuelEfficiencyData {
  fuelRemainingPct: number;
  avgConsumptionKmpl: number;
  distanceTodayKm: number;
  idleTimeMin: number;
  fleetEfficiencyPct: number;
}

export interface TelemetrySnapshot {
  speed: VehicleSpeed;
  health: VehicleHealthData;
  route: ActiveRouteData;
  alerts: VehicleAlert[];
  efficiency: FuelEfficiencyData;
  timestamp: string;
}
