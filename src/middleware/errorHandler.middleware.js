import logger from "#src/config/logger.js";
import { AppError } from "#src/utils/AppError.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(`❌ ${err.message}`, { stack: err.stack });

  // Handle AppError explicitly
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation failed",
      details: err.errors,
    });
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }

  // Default fallback
  return res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
};
