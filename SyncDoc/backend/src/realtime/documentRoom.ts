import * as Y from "yjs";
import { WebSocket } from "ws";
import {
  handleYjsMessage,
  createSyncStep1Message,
  createUpdateMessage,
} from "./yjsSync.js";
import { DebouncedPersister } from "./persistence.js";

export class DocumentRoom {
  public readonly yDoc: Y.Doc;
  private readonly clients: Set<WebSocket> = new Set();
  private readonly persister: DebouncedPersister;
  private isDestroyed = false;

  constructor(public readonly documentId: string, initialYDoc?: Y.Doc) {
    this.yDoc = initialYDoc ?? new Y.Doc();
    this.persister = new DebouncedPersister(this.documentId, this.yDoc, 1000);

    // Listen to local Y.Doc update transactions
    this.yDoc.on("update", (update: Uint8Array, origin: unknown) => {
      if (this.isDestroyed) return;

      // Schedule debounced persistence on every Yjs update
      this.persister.schedule();

      // If update originated locally or from WebSocket, broadcast to other connected clients
      if (origin !== "sync-step") {
        const updateMsg = createUpdateMessage(update);
        this.broadcast(updateMsg, origin instanceof WebSocket ? origin : undefined);
      }
    });
  }

  /**
   * Adds a WebSocket client to the room and initiates Yjs synchronization handshake.
   */
  public addClient(ws: WebSocket): void {
    if (this.isDestroyed) return;

    this.clients.add(ws);

    // Send initial SyncStep1 message containing server's state vector
    const syncStep1Msg = createSyncStep1Message(this.yDoc);
    this.sendToClient(ws, syncStep1Msg);
  }

  /**
   * Removes a WebSocket client from the room.
   * Returns current client count after removal.
   */
  public removeClient(ws: WebSocket): number {
    this.clients.delete(ws);
    return this.clients.size;
  }

  /**
   * Returns current count of connected clients in the room.
   */
  public get clientCount(): number {
    return this.clients.size;
  }

  /**
   * Handles an incoming WebSocket binary message from a client in this room.
   */
  public handleMessage(ws: WebSocket, data: Uint8Array): void {
    if (this.isDestroyed) return;

    const result = handleYjsMessage(this.yDoc, data, ws);

    // Send direct reply (e.g. SyncStep2 response to SyncStep1 request)
    if (result.reply) {
      this.sendToClient(ws, result.reply);
    }

    // Broadcast update to all other clients in the room
    if (result.updateApplied) {
      const updateMsg = createUpdateMessage(result.updateApplied);
      this.broadcast(updateMsg, ws);
    }
  }

  /**
   * Broadcasts a binary message buffer to connected clients in the room.
   * Option to exclude the originating sender socket.
   */
  public broadcast(message: Uint8Array, excludeWs?: WebSocket): void {
    for (const client of this.clients) {
      if (client !== excludeWs && client.readyState === 1) { // 1 = OPEN
        try {
          client.send(message);
        } catch (error: unknown) {
          console.error(`Failed to send broadcast message to client in room ${this.documentId}:`, error);
        }
      }
    }
  }

  /**
   * Sends a binary message directly to a specific client.
   */
  private sendToClient(ws: WebSocket, message: Uint8Array): void {
    if (ws.readyState === 1) {
      try {
        ws.send(message);
      } catch (error: unknown) {
        console.error(`Failed to send message to client in room ${this.documentId}:`, error);
      }
    }
  }

  /**
   * Immediately flushes pending MongoDB persistence and destroys the room.
   */
  public async destroy(): Promise<void> {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Flush any pending persistence task immediately
    await this.persister.flush();

    // Clean up clients and Y.Doc instance
    this.clients.clear();
    this.yDoc.destroy();
  }
}
