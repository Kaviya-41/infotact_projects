import { apiFetch } from './documentApi.js';

/**
 * Register a new user
 */
export async function registerUser(data) {
  const result = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Login a user
 */
export async function loginUser(identifier, password) {
  const result = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
  return result;
}

/**
 * Get current user profile
 */
export async function getProfile(token) {
  const result = await apiFetch('/api/auth/me', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  return result;
}

/**
 * Update user profile
 */
export async function updateProfile(data, token) {
  const result = await apiFetch('/api/auth/me', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return result;
}

/**
 * Change password
 */
export async function changePassword(currentPassword, newPassword, token) {
  const result = await apiFetch('/api/auth/password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return result;
}
