/**
 * SyncDoc Yjs Provider — Custom WebSocket client matching the backend's binary protocol.
 *
 * Backend Protocol (from yjsSync.ts):
 *   0x00 = SyncStep1 (state vector)
 *   0x01 = SyncStep2 (state update diff)
 *   0x02 = Update    (incremental update)
 *
 * Handshake:
 *   1. Server sends SyncStep1 (its state vector)
 *   2. Client replies with SyncStep2 (diff from server's vector) + sends own SyncStep1
 *   3. Server replies with SyncStep2 (diff from client's vector)
 *   4. Both sides exchange Update messages for incremental changes
 */

import * as Y from 'yjs';

const MSG_SYNC_STEP1 = 0;
const MSG_SYNC_STEP2 = 1;
const MSG_UPDATE = 2;

const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 30000;

export class SyncDocProvider {
  constructor(documentId, wsBaseUrl) {
    this.documentId = documentId;
    this.wsBaseUrl = wsBaseUrl || import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:5000';
    this.yDoc = new Y.Doc();
    this.ws = null;
    this.status = 'disconnected'; // 'connecting' | 'connected' | 'disconnected'
    this.destroyed = false;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.synced = false;
    this._statusListeners = new Set();
    this._syncListeners = new Set();

    // Bind the update handler so we can add/remove it
    this._onLocalUpdate = this._handleLocalUpdate.bind(this);
    this.yDoc.on('update', this._onLocalUpdate);

    this.connect();
  }

  /**
   * Subscribe to status changes.
   */
  onStatusChange(fn) {
    this._statusListeners.add(fn);
    return () => this._statusListeners.delete(fn);
  }

  /**
   * Subscribe to sync events (initial sync complete).
   */
  onSync(fn) {
    this._syncListeners.add(fn);
    return () => this._syncListeners.delete(fn);
  }

  _setStatus(newStatus) {
    if (this.status === newStatus) return;
    this.status = newStatus;
    for (const fn of this._statusListeners) {
      try { fn(newStatus); } catch (e) { console.error('Status listener error:', e); }
    }
  }

  /**
   * Open WebSocket connection to the backend.
   */
  connect() {
    if (this.destroyed) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this._setStatus('connecting');
    const url = `${this.wsBaseUrl}/ws?documentId=${encodeURIComponent(this.documentId)}`;

    try {
      this.ws = new WebSocket(url);
      this.ws.binaryType = 'arraybuffer';
    } catch (err) {
      console.error('WebSocket creation failed:', err);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._setStatus('connected');
    };

    this.ws.onmessage = (event) => {
      this._handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this._setStatus('disconnected');
      if (!this.destroyed) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      // onclose will fire after onerror
    };
  }

  /**
   * Handle an incoming binary message from the backend.
   */
  _handleMessage(data) {
    const msg = new Uint8Array(data);
    if (msg.length === 0) return;

    const messageType = msg[0];
    const payload = msg.subarray(1);

    switch (messageType) {
      case MSG_SYNC_STEP1: {
        // Server sent its state vector — reply with SyncStep2 (our diff) + our SyncStep1
        const update = Y.encodeStateAsUpdate(this.yDoc, payload);
        this._sendMessage(MSG_SYNC_STEP2, update);

        // Also send our SyncStep1 so server sends us what we're missing
        const sv = Y.encodeStateVector(this.yDoc);
        this._sendMessage(MSG_SYNC_STEP1, sv);
        break;
      }

      case MSG_SYNC_STEP2: {
        // Server sent state diff — apply to our doc
        Y.applyUpdate(this.yDoc, payload, 'remote');
        if (!this.synced) {
          this.synced = true;
          for (const fn of this._syncListeners) {
            try { fn(); } catch (e) { console.error('Sync listener error:', e); }
          }
        }
        break;
      }

      case MSG_UPDATE: {
        // Incremental remote update — apply to our doc
        Y.applyUpdate(this.yDoc, payload, 'remote');
        break;
      }

      default:
        console.warn('Unknown message type:', messageType);
    }
  }

  /**
   * Handle local Y.Doc updates — send to server if not from remote.
   */
  _handleLocalUpdate(update, origin) {
    // Don't echo remote updates back to the server
    if (origin === 'remote') return;
    this._sendMessage(MSG_UPDATE, update);
  }

  /**
   * Send a binary message over WebSocket.
   */
  _sendMessage(type, payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const message = new Uint8Array(1 + payload.length);
    message[0] = type;
    message.set(payload, 1);
    try {
      this.ws.send(message);
    } catch (err) {
      console.error('Failed to send WebSocket message:', err);
    }
  }

  /**
   * Schedule reconnection with exponential backoff.
   */
  _scheduleReconnect() {
    if (this.destroyed) return;
    if (this.reconnectTimer) return;

    const delay = Math.min(
      RECONNECT_BASE_DELAY * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_DELAY
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Destroy the provider — close WebSocket, destroy Y.Doc, clean up listeners.
   */
  destroy() {
    this.destroyed = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.yDoc.off('update', this._onLocalUpdate);

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.yDoc.destroy();
    this._statusListeners.clear();
    this._syncListeners.clear();
    this._setStatus('disconnected');
  }
}
