import { AppError } from "#src/utils/AppError.js";

/**
 * Safely extract and validate a numeric ID from an object (req.params, req.user, etc.)
 * @param {object} source - object containing the field
 * @param {string} key - field name to extract
 * @param {string} errorMessage - message if invalid
 * @returns {number} - valid number
 * @throws AppError if invalid
 */
export const getValidatedId = (source, key, errorMessage = "Invalid ID") => {
  if (!source || typeof source[key] === "undefined") {
    throw new AppError(errorMessage, 400);
  }

  const id = Number(source[key]);
  if (!id || isNaN(id)) {
    throw new AppError(errorMessage, 400);
  }

  return id;
};
