/**
 * axios.ts — Pre-configured Axios Instance
 *
 * Creates and exports a reusable Axios instance for all API communication.
 * - Reads the backend URL from the VITE_API_BASE_URL environment variable.
 * - Sets a 10-second timeout for all requests.
 * - Defaults Content-Type to application/json.
 * - Automatically attaches JWT Authorization header from localStorage.
 * - Handles 401 responses by clearing auth state.
 *
 * Usage:
 *   import api from '@/api/axios';
 *   // then use api.get(), api.post(), etc. in service files.
 */

import axios from 'axios';

const STORAGE_KEY_TOKEN = 'fleetdash_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor — Attach JWT token to every outgoing request
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor — Handle 401 Unauthorized globally
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored auth credentials
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem('fleetdash_user');

      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
