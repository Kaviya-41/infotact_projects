import type { WebSocket } from "ws";
import documentService from "../services/documentService.js";
import { astToYDoc } from "./astYjsMap.js";
import { DocumentRoom } from "./documentRoom.js";

export class RoomManager {
  private readonly rooms: Map<string, DocumentRoom> = new Map();

  /**
   * Retrieves an existing active document room by ID.
   */
  public getRoom(documentId: string): DocumentRoom | undefined {
    return this.rooms.get(documentId);
  }

  /**
   * Gets or creates a document room for the given documentId.
   * On room creation, loads initial document AST from MongoDB and initializes Y.Doc.
   */
  public async getOrCreateRoom(documentId: string): Promise<DocumentRoom> {
    const existing = this.rooms.get(documentId);
    if (existing) {
      return existing;
    }

    // Load initial document from MongoDB
    const doc = await documentService.getById(documentId);
    if (!doc) {
      throw new Error(`Document '${documentId}' not found`);
    }

    // Convert AST blocks to Y.Doc
    const yDoc = astToYDoc(doc.blocks);

    // Create new document room
    const room = new DocumentRoom(documentId, yDoc);
    this.rooms.set(documentId, room);

    return room;
  }

  /**
   * Handles a client disconnecting from a room.
   * If the room becomes empty, flushes MongoDB persistence and destroys the room.
   */
  public async handleDisconnect(documentId: string, ws: WebSocket): Promise<void> {
    const room = this.rooms.get(documentId);
    if (!room) return;

    const remainingCount = room.removeClient(ws);

    // When the final client disconnects, clean up room and flush persistence
    if (remainingCount === 0) {
      this.rooms.delete(documentId);
      await room.destroy();
    }
  }

  /**
   * Returns active room count.
   */
  public get roomCount(): number {
    return this.rooms.size;
  }

  /**
   * Cleans up all active rooms on server shutdown.
   */
  public async destroyAll(): Promise<void> {
    for (const [id, room] of this.rooms.entries()) {
      this.rooms.delete(id);
      await room.destroy();
    }
  }
}

export const roomManager = new RoomManager();
export default roomManager;
