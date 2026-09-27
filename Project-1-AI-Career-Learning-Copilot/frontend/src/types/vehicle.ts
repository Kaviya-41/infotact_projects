/**
 * vehicle.ts — TypeScript type definitions for vehicle data.
 *
 * BackendVehicle matches the MongoDB / Express backend model shape.
 * The UI component's Vehicle interface (in VehicleList.tsx) extends this
 * with presentation-only fields (driverInitials, avatarColor, icons, etc.).
 */

/** Shape returned by GET /vehicles from the backend (within { success, data }) */
export interface BackendVehicle {
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
  // Virtuals provided by backend toJSON
  speed: number;
  latitude: number;
  longitude: number;
}
