import type { Request, Response, NextFunction } from "express";

/**
 * Global Express error handling middleware.
 * Prevents leaking stack traces or internal DB credentials to clients.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log full error internally for server-side debugging
  console.error("API Error caught by handler:", err);

  // Handle JSON parsing syntax error
  if (err instanceof SyntaxError && "status" in err && (err as { status?: number }).status === 400) {
    res.status(400).json({
      success: false,
      message: "Malformed JSON request body",
    });
    return;
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const customErrors = (err as unknown as Record<string, unknown>).errorsArray;
    // Use custom AST error details if available; otherwise use a generic message
    // to avoid leaking Mongoose internal schema paths
    const safeMessage = Array.isArray(customErrors)
      ? "Validation failed"
      : "Request validation failed";
    res.status(400).json({
      success: false,
      message: safeMessage,
      ...(Array.isArray(customErrors) ? { errors: customErrors } : {}),
    });
    return;
  }

  // Handle Mongoose Cast Error (invalid ObjectId)
  if (err.name === "CastError") {
    res.status(400).json({
      success: false,
      message: "Invalid document ID",
    });
    return;
  }

  // Default 500 Internal Server Error (Sanitized, no stack trace)
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

export default errorHandler;
