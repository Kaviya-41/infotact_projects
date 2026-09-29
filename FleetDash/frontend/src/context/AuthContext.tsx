/**
 * AuthContext.tsx – Frontend Authentication Context for FleetDash
 * Handles user login, signup, profile updates, and session state via backend API & localStorage.
 *
 * Phase 9: Connected to real backend JWT authentication.
 * - login() → POST /api/auth/login
 * - signup() → POST /api/auth/register
 * - On mount → GET /api/auth/me (if token exists)
 * - logout() → clears token + user from localStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types/fleet';
import { updateUserProfile } from '../api/userApi';
import { loginUser, registerUser, fetchCurrentUser } from '../api/authApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, company?: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const STORAGE_KEY_USER = 'fleetdash_user';
const STORAGE_KEY_TOKEN = 'fleetdash_token';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // On mount: restore user session from token via GET /api/auth/me
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (!token) {
        // No token — try to load from stored user (legacy fallback)
        try {
          const stored = localStorage.getItem(STORAGE_KEY_USER);
          if (stored) {
            // Clear legacy user-only storage — require real auth
            localStorage.removeItem(STORAGE_KEY_USER);
          }
        } catch {
          // ignore
        }
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetchCurrentUser();
        if (res.success && res.user) {
          const restoredUser: User = {
            id: res.user.id,
            name: res.user.name,
            email: res.user.email,
            role: res.user.role || 'Fleet Dispatcher',
            company: res.user.organization,
            organization: res.user.organization,
          };
          setUser(restoredUser);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(restoredUser));
        } else {
          // Invalid response — clear auth
          localStorage.removeItem(STORAGE_KEY_TOKEN);
          localStorage.removeItem(STORAGE_KEY_USER);
        }
      } catch {
        // Token invalid/expired — clear auth
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
      }

      setIsLoading(false);
    };

    restoreSession();
  }, []);

  // ---------------------------------------------------------------------------
  // Login — POST /api/auth/login
  // ---------------------------------------------------------------------------
  const login = useCallback(async (email: string, password: string) => {
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const res = await loginUser(email, password);

      if (res.success && res.token && res.user) {
        // Store JWT
        localStorage.setItem(STORAGE_KEY_TOKEN, res.token);

        // Build User object
        const loggedInUser: User = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role || 'Fleet Dispatcher',
          company: res.user.organization,
          organization: res.user.organization,
        };

        setUser(loggedInUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(loggedInUser));
        return { success: true };
      }

      return { success: false, error: res.message || 'Login failed.' };
    } catch (err: unknown) {
      // Extract backend error message
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const msg = axiosErr.response?.data?.message;
        if (msg) return { success: false, error: msg };
      }
      const msg = err instanceof Error ? err.message : 'Unable to connect to the server.';
      return { success: false, error: msg };
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Signup — POST /api/auth/register
  // ---------------------------------------------------------------------------
  const signup = useCallback(async (name: string, email: string, password: string, company?: string) => {
    if (!name || !email || !password) {
      return { success: false, error: 'Please fill in all required fields.' };
    }

    try {
      const res = await registerUser(name, email, password, company);

      if (res.success && res.token && res.user) {
        // Store JWT
        localStorage.setItem(STORAGE_KEY_TOKEN, res.token);

        // Build User object
        const newUser: User = {
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role || 'Fleet Manager',
          company: res.user.organization || company,
          organization: res.user.organization,
        };

        setUser(newUser);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
        return { success: true };
      }

      return { success: false, error: res.message || 'Registration failed.' };
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        const msg = axiosErr.response?.data?.message;
        if (msg) return { success: false, error: msg };
      }
      const msg = err instanceof Error ? err.message : 'Unable to connect to the server.';
      return { success: false, error: msg };
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Update Profile
  // ---------------------------------------------------------------------------
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      let updatedData: User;

      // 1. Attempt to send profile update to backend server
      try {
        const backendRes = await updateUserProfile(updates);
        updatedData = { ...(user || { name: '', email: '', role: '' }), ...backendRes };
      } catch {
        // Fallback to client-side persistence if backend API endpoint is offline
        updatedData = { ...(user || { name: '', email: '', role: '' }), ...updates };
      }

      // 2. Update React global state & persistent storage
      setUser(updatedData);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedData));
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to update profile. Please try again.';
      return { success: false, error: msg };
    }
  }, [user]);

  // ---------------------------------------------------------------------------
  // Logout — Clear token + user
  // ---------------------------------------------------------------------------
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
