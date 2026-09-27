/**
 * socket.ts — Shared Socket.IO Client for FleetDash
 *
 * Establishes a persistent, auto-reconnecting WebSocket connection
 * to the FleetDash backend server.
 */

import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5051/api';
  // Strip trailing /api or /api/
  return apiBase.replace(/\/api\/?$/, '');
};

export const socket: Socket = io(getSocketUrl(), {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  transports: ['websocket', 'polling'],
});

export default socket;
