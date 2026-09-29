import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import documentRoutes from "./routes/documentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration (supports configurable frontend origin via env)
const allowedOrigin = process.env.FRONTEND_ORIGIN ?? "*";
app.use(cors({ origin: allowedOrigin }));

// Request body limit (1MB limit to prevent memory exhaustion while supporting large documents)
app.use(express.json({ limit: "1mb" }));

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "SyncDoc API is running",
  });
});

// Document CRUD routes
app.use("/api/documents", documentRoutes);

// Auth routes
app.use("/api/auth", authRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

export default app;

