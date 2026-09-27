/**
 * FleetDash Backend — Express Server
 *
 * Entry point for the FleetDash API server.
 * Loads config, connects to MongoDB, mounts middleware & routes, and starts listening.
 */

const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const connectDB = require('./config/db');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { startTelemetrySimulator } = require('./services/telemetrySimulator');

// ---------------------------------------------------------------------------
// Initialise Express & HTTP / Socket.IO Server
// ---------------------------------------------------------------------------
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    credentials: true,
  },
});

// Attach io instance to express app
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[FleetDash] Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[FleetDash] Socket client disconnected: ${socket.id}`);
  });
});

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------
app.use('/api', routes);

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------
app.use(notFound);       // 404 catch-all (must come after routes)
app.use(errorHandler);   // centralised error handler

// ---------------------------------------------------------------------------
// Async Startup — connect to MongoDB, then start Express & Socket.IO
// ---------------------------------------------------------------------------
const startServer = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log(`[FleetDash] Server running on http://localhost:${config.port}`);
      console.log(`[FleetDash] Health-check → GET http://localhost:${config.port}/api/health`);
      console.log(`[FleetDash] Socket.IO active on ws://localhost:${config.port}`);

      // Start real-time telemetry simulator
      startTelemetrySimulator(io);
    });
  } catch (err) {
    console.error('[FleetDash] Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
