/**
 * dashboardApi.ts — Dashboard API Service
 *
 * Provides functions for all dashboard-related backend endpoints
 * using the shared Axios instance.
 */

import api from './axios';
import type {
  ApiResponse,
  DashboardSummary,
  VehicleStatusItem,
  TripStatusItem,
  AlertSummaryData,
  BackendAlert,
  BackendTrip,
} from '../types/api';

/**
 * Fetches aggregated fleet statistics.
 * Endpoint: GET /dashboard/summary
 */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
  return response.data.data;
}

/**
 * Fetches vehicle status distribution (grouped by status).
 * Endpoint: GET /dashboard/vehicle-status
 */
export async function fetchVehicleStatus(): Promise<VehicleStatusItem[]> {
  const response = await api.get<ApiResponse<VehicleStatusItem[]>>('/dashboard/vehicle-status');
  return response.data.data;
}

/**
 * Fetches trip status distribution (grouped by status).
 * Endpoint: GET /dashboard/trip-status
 */
export async function fetchTripStatus(): Promise<TripStatusItem[]> {
  const response = await api.get<ApiResponse<TripStatusItem[]>>('/dashboard/trip-status');
  return response.data.data;
}

/**
 * Fetches alert summary (by severity and by status).
 * Endpoint: GET /dashboard/alert-summary
 */
export async function fetchAlertSummary(): Promise<AlertSummaryData> {
  const response = await api.get<ApiResponse<AlertSummaryData>>('/dashboard/alert-summary');
  return response.data.data;
}

/**
 * Fetches the most recent alerts.
 * Endpoint: GET /dashboard/recent-alerts
 */
export async function fetchRecentAlerts(limit: number = 5): Promise<BackendAlert[]> {
  const response = await api.get<{ success: boolean; count: number; data: BackendAlert[] }>(
    '/dashboard/recent-alerts',
    { params: { limit } }
  );
  return response.data.data;
}

/**
 * Fetches the most recent trips.
 * Endpoint: GET /dashboard/recent-trips
 */
export async function fetchRecentTrips(limit: number = 5): Promise<BackendTrip[]> {
  const response = await api.get<{ success: boolean; count: number; data: BackendTrip[] }>(
    '/dashboard/recent-trips',
    { params: { limit } }
  );
  return response.data.data;
}
