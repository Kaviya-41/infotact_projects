import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import mongoose from "mongoose";
import roomManager from "./roomManager.js";
import documentService from "../services/documentService.js";

const MAX_WS_PAYLOAD_BYTES = 1024 * 1024; // 1MB payload limit

export class CollaborationServer {
  private wss: WebSocketServer | null = null;

  /**
   * Attaches WebSocket server to an existing Node.js HTTP server.
   *
   * @param server Node HTTP server instance
   * @param path WebSocket endpoint path (default "/ws")
   */
  public attach(server: HttpServer, path = "/ws"): void {
    this.wss = new WebSocketServer({
      noServer: true,
      maxPayload: MAX_WS_PAYLOAD_BYTES,
    });

    server.on("upgrade", async (request, socket, head) => {
      try {
        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

        if (url.pathname !== path) {
          // Reject upgrades for unmatched paths
          socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
          socket.destroy();
          return;
        }

        const documentId = url.searchParams.get("documentId");

        // 1. Missing documentId check
        if (!documentId || documentId.trim() === "") {
          socket.write("HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\n\r\nMissing documentId query parameter\r\n");
          socket.destroy();
          return;
        }

        const cleanDocId = documentId.trim();

        // 2. Invalid ObjectId format check
        if (!mongoose.Types.ObjectId.isValid(cleanDocId)) {
          socket.write("HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\n\r\nInvalid documentId format\r\n");
          socket.destroy();
          return;
        }

        // 3. Database existence check
        const doc = await documentService.getById(cleanDocId);
        if (!doc) {
          socket.write("HTTP/1.1 404 Not Found\r\nContent-Type: text/plain\r\n\r\nDocument not found\r\n");
          socket.destroy();
          return;
        }

        // Complete WebSocket upgrade
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          void this.handleConnection(ws, cleanDocId);
        });
      } catch (error: unknown) {
        console.error("WebSocket Upgrade Error:", error);
        socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n");
        socket.destroy();
      }
    });
  }

  /**
   * Handles an established WebSocket connection.
   */
  private async handleConnection(ws: WebSocket, documentId: string): Promise<void> {
    try {
      // Get or create room (loads Y.Doc from DB on first client join)
      const room = await roomManager.getOrCreateRoom(documentId);

      // Add socket client to room (sends initial SyncStep1)
      room.addClient(ws);

      ws.on("message", (rawMessage: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
        try {
          if (!isBinary) {
            // Yjs protocol strictly expects binary frames
            return;
          }

          let buffer: Uint8Array;
          if (Buffer.isBuffer(rawMessage)) {
            buffer = new Uint8Array(rawMessage.buffer, rawMessage.byteOffset, rawMessage.byteLength);
          } else if (rawMessage instanceof ArrayBuffer) {
            buffer = new Uint8Array(rawMessage);
          } else if (Array.isArray(rawMessage)) {
            const combined = Buffer.concat(rawMessage);
            buffer = new Uint8Array(combined.buffer, combined.byteOffset, combined.byteLength);
          } else {
            return;
          }

          room.handleMessage(ws, buffer);
        } catch (msgError: unknown) {
          console.error(`WebSocket message error in room ${documentId}:`, msgError);
        }
      });

      const cleanup = (): void => {
        void roomManager.handleDisconnect(documentId, ws);
      };

      ws.on("close", cleanup);
      ws.on("error", (wsError: unknown) => {
        console.error(`WebSocket client error in room ${documentId}:`, wsError);
        cleanup();
      });
    } catch (connError: unknown) {
      console.error(`Failed to handle WebSocket connection for document ${documentId}:`, connError);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1011, "Internal server error");
      }
    }
  }

  /**
   * Closes all active WebSocket connections and server instance.
   */
  public async close(): Promise<void> {
    await roomManager.destroyAll();
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

export const collaborationServer = new CollaborationServer();
export default collaborationServer;
