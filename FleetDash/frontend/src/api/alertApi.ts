/**
 * alertApi.ts — Alert API Service
 *
 * Provides functions for alert-related backend endpoints
 * using the shared Axios instance.
 */

import api from './axios';
import type { ApiResponse, ApiListResponse, BackendAlert } from '../types/api';

/**
 * Fetches alerts, optionally filtered by severity and/or status.
 * Endpoint: GET /alerts
 */
export async function fetchAlerts(params?: {
  severity?: string;
  status?: string;
}): Promise<BackendAlert[]> {
  const response = await api.get<ApiListResponse<BackendAlert>>('/alerts', { params });
  return response.data.data;
}

/**
 * Fetches a single alert by its MongoDB _id.
 * Endpoint: GET /alerts/:id
 */
export async function fetchAlertById(id: string): Promise<BackendAlert> {
  const response = await api.get<ApiResponse<BackendAlert>>(`/alerts/${id}`);
  return response.data.data;
}

/**
 * Creates a new alert.
 * Endpoint: POST /alerts (Protected)
 */
export async function createAlert(data: Partial<BackendAlert>): Promise<BackendAlert> {
  const response = await api.post<ApiResponse<BackendAlert>>('/alerts', data);
  return response.data.data;
}

/**
 * Updates an existing alert.
 * Endpoint: PUT /alerts/:id (Protected)
 */
export async function updateAlert(id: string, data: Partial<BackendAlert>): Promise<BackendAlert> {
  const response = await api.put<ApiResponse<BackendAlert>>(`/alerts/${id}`, data);
  return response.data.data;
}

/**
 * Deletes an alert.
 * Endpoint: DELETE /alerts/:id (Protected)
 */
export async function deleteAlert(id: string): Promise<void> {
  await api.delete(`/alerts/${id}`);
}
