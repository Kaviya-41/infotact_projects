/**
 * authApi.ts — Authentication API Service
 *
 * Provides functions for login, registration, and current user retrieval
 * using the shared Axios instance connected to VITE_API_BASE_URL.
 */

import api from './axios';
import type { LoginResponse, RegisterResponse, MeResponse } from '../types/api';

/**
 * Authenticates a user with email and password.
 * Endpoint: POST /auth/login
 */
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}

/**
 * Registers a new user account.
 * Endpoint: POST /auth/register
 */
export async function registerUser(
  name: string,
  email: string,
  password: string,
  organization?: string
): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', {
    name,
    email,
    password,
    organization: organization || '',
  });
  return response.data;
}

/**
 * Fetches the currently authenticated user's profile.
 * Endpoint: GET /auth/me (requires valid JWT)
 */
export async function fetchCurrentUser(): Promise<MeResponse> {
  const response = await api.get<MeResponse>('/auth/me');
  return response.data;
}
