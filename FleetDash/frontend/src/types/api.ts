/**
 * api.ts — Shared API response type definitions for FleetDash backend integration.
 *
 * All backend endpoints wrap responses in { success, data?, message?, count? }.
 * These generics provide type-safe unwrapping across the frontend API layer.
 */

// ---------------------------------------------------------------------------
// Generic API response wrappers
// ---------------------------------------------------------------------------

/** Standard single-item response from backend */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

/** Standard list response from backend (includes count) */
export interface ApiListResponse<T> {
  success: boolean;
  message?: string;
  count: number;
  data: T[];
}

// ---------------------------------------------------------------------------
// Auth response types
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  success: boolean;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Dashboard response types
// ---------------------------------------------------------------------------

export interface DashboardSummary {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  maintenanceVehicles: number;
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
  plannedTrips: number;
  cancelledTrips: number;
  totalAlerts: number;
  activeAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  infoAlerts: number;
}

export interface VehicleStatusItem {
  status: string;
  count: number;
}

export interface TripStatusItem {
  status: string;
  count: number;
}

export interface AlertSeverityItem {
  severity: string;
  count: number;
}

export interface AlertStatusItem {
  status: string;
  count: number;
}

export interface AlertSummaryData {
  bySeverity: AlertSeverityItem[];
  byStatus: AlertStatusItem[];
}

// ---------------------------------------------------------------------------
// Backend entity shapes (as returned by MongoDB)
// ---------------------------------------------------------------------------

export interface BackendVehicleFull {
  _id: string;
  vehicleId: string;
  registrationNumber: string;
  make: string;
  model: string;
  year?: number;
  type: string;
  driverName: string;
  driverPhone?: string;
  status: string;
  fuelLevel: number;
  currentSpeed: number;
  mileage: number;
  maintenanceNotes?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  // Virtuals
  speed: number;
  latitude: number;
  longitude: number;
}

export interface BackendAlert {
  _id: string;
  vehicle: BackendVehicleFull | string;
  trip?: BackendTrip | string | null;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  status: 'active' | 'acknowledged' | 'resolved';
  location?: {
    latitude: number;
    longitude: number;
  };
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTrip {
  _id: string;
  vehicle: BackendVehicleFull | string;
  driverName: string;
  origin: string;
  destination: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  startTime?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  distance: number;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}
