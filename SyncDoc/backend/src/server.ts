import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDatabase from "./config/db.js";
import collaborationServer from "./realtime/collaborationServer.js";

const startServer = async (): Promise<void> => {
  try {
    const port = process.env.PORT ?? "5000";
    const server = http.createServer(app);

    // Attach Yjs + WebSocket real-time collaboration server on /ws
    collaborationServer.attach(server, "/ws");

    server.listen(Number(port), () => {
      console.log(`SyncDoc backend & WebSocket collaboration server running on port ${port}`);
    });

    // Connect database in background
    connectDatabase().catch((err) => {
      console.warn("Database connection notice:", err.message);
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Failed to start server: ${error.message}`);
    } else {
      console.error("Failed to start server: Unknown error");
    }
    process.exit(1);
  }
};

startServer();


