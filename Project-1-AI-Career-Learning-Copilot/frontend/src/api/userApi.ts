/**
 * userApi.ts — User Profile API Service
 *
 * Provides functions for user profile updates and retrieval
 * using the shared Axios instance connected to VITE_API_BASE_URL.
 */

import api from './axios';
import type { User } from '../types/fleet';

/**
 * Updates the user's profile on the backend server.
 * Endpoint: PATCH /users/profile (or PUT /users/profile)
 */
export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  const response = await api.patch<User>('/users/profile', updates);
  return response.data;
}

/**
 * Fetches the current authenticated user profile.
 * Endpoint: GET /users/profile
 */
export async function fetchUserProfile(): Promise<User> {
  const response = await api.get<User>('/users/profile');
  return response.data;
}
