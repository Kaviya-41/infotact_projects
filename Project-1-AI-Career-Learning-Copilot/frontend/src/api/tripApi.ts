/**
 * tripApi.ts — Trip API Service
 *
 * Provides functions for trip-related backend endpoints
 * using the shared Axios instance.
 */

import api from './axios';
import type { ApiResponse, ApiListResponse, BackendTrip } from '../types/api';

/**
 * Fetches all trips.
 * Endpoint: GET /trips
 */
export async function fetchTrips(): Promise<BackendTrip[]> {
  const response = await api.get<ApiListResponse<BackendTrip>>('/trips');
  return response.data.data;
}

/**
 * Fetches a single trip by its MongoDB _id.
 * Endpoint: GET /trips/:id
 */
export async function fetchTripById(id: string): Promise<BackendTrip> {
  const response = await api.get<ApiResponse<BackendTrip>>(`/trips/${id}`);
  return response.data.data;
}

/**
 * Creates a new trip.
 * Endpoint: POST /trips (Protected)
 */
export async function createTrip(data: Partial<BackendTrip>): Promise<BackendTrip> {
  const response = await api.post<ApiResponse<BackendTrip>>('/trips', data);
  return response.data.data;
}

/**
 * Updates an existing trip.
 * Endpoint: PUT /trips/:id (Protected)
 */
export async function updateTrip(id: string, data: Partial<BackendTrip>): Promise<BackendTrip> {
  const response = await api.put<ApiResponse<BackendTrip>>(`/trips/${id}`, data);
  return response.data.data;
}

/**
 * Deletes a trip.
 * Endpoint: DELETE /trips/:id (Protected)
 */
export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trips/${id}`);
}
