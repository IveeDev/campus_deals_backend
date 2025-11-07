// src/middleware/errorHandler.js
import { ValidationError } from "#utils/validation.js";

export function errorHandler(err, res) {
  console.error("🔥 Error caught by global handler:", err);

  // Validation errors (bad request)
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      field: err.field || null,
    });
  }

  // Database or known fetch errors
  if (err.message?.includes("Failed to fetch")) {
    return res.status(500).json({
      success: false,
      message: "Database operation failed. Please try again later.",
    });
  }

  // Default fallback for unexpected errors
  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred.",
  });
}
