/**
 * vehicleApi.ts — Vehicle API Service
 *
 * Provides functions that call vehicle-related backend endpoints
 * using the shared Axios instance. All response types are imported
 * from the centralized types directory.
 */

import api from './axios';
import type { BackendVehicle } from '../types/vehicle';
import type { ApiResponse, ApiListResponse } from '../types/api';

/**
 * Fetches the full list of vehicles from the backend.
 * Endpoint: GET /vehicles
 * Backend returns { success, count, data: [...] }
 */
export async function fetchVehicles(): Promise<BackendVehicle[]> {
  const response = await api.get<ApiListResponse<BackendVehicle>>('/vehicles');
  return response.data.data;
}

/**
 * Fetches a single vehicle by its MongoDB _id.
 * Endpoint: GET /vehicles/:id
 */
export async function fetchVehicleById(id: string): Promise<BackendVehicle> {
  const response = await api.get<ApiResponse<BackendVehicle>>(`/vehicles/${id}`);
  return response.data.data;
}

/**
 * Creates a new vehicle.
 * Endpoint: POST /vehicles (Protected)
 */
export async function createVehicle(data: Partial<BackendVehicle>): Promise<BackendVehicle> {
  const response = await api.post<ApiResponse<BackendVehicle>>('/vehicles', data);
  return response.data.data;
}

/**
 * Updates an existing vehicle.
 * Endpoint: PUT /vehicles/:id (Protected)
 */
export async function updateVehicle(id: string, data: Partial<BackendVehicle>): Promise<BackendVehicle> {
  const response = await api.put<ApiResponse<BackendVehicle>>(`/vehicles/${id}`, data);
  return response.data.data;
}

/**
 * Deletes a vehicle.
 * Endpoint: DELETE /vehicles/:id (Protected)
 */
export async function deleteVehicle(id: string): Promise<void> {
  await api.delete(`/vehicles/${id}`);
}
