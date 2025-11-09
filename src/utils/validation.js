import { PAGINATION } from "#config/pagination.js";

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

/**
 * Validates and sanitizes pagination parameters
 * @param {Object} params - Raw parameters
 * @param {Object} errors - Error config (e.g. USER_ERRORS, CAMPUS_ERRORS)
 * @returns {Object} Validated parameters
 */
export function validatePaginationParams({ page, limit }, errors) {
  const validatedPage = Math.max(
    PAGINATION.MIN_PAGE,
    parseInt(page) || PAGINATION.DEFAULT_PAGE
  );

  const validatedLimit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(PAGINATION.MIN_LIMIT, parseInt(limit) || PAGINATION.DEFAULT_LIMIT)
  );

  if (isNaN(validatedPage) || isNaN(validatedLimit)) {
    throw new ValidationError(errors.INVALID_PAGINATION);
  }

  return {
    page: validatedPage,
    limit: validatedLimit,
    offset: (validatedPage - 1) * validatedLimit,
  };
}

/**
 * Validates sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} order - Sort order
 * @param {Object} config - Query config (e.g. USER_QUERY, CAMPUS_QUERY)
 * @param {Object} errors - Error config (e.g. USER_ERRORS, CAMPUS_ERRORS)
 * @returns {Object} Validated sort parameters
 */
export function validateSortParams(sortBy, order, config, errors) {
  const validatedSortBy = config.ALLOWED_SORT_FIELDS.includes(sortBy)
    ? sortBy
    : config.DEFAULT_SORT_BY;

  const validatedOrder = config.ALLOWED_ORDERS.includes(order?.toLowerCase())
    ? order.toLowerCase()
    : config.DEFAULT_ORDER;

  if (sortBy && !config.ALLOWED_SORT_FIELDS.includes(sortBy)) {
    throw new ValidationError(
      `${errors.INVALID_SORT_FIELD}. Allowed: ${config.ALLOWED_SORT_FIELDS.join(", ")}`
    );
  }

  return { sortBy: validatedSortBy, order: validatedOrder };
}

/**
 * Sanitizes search string
 */
export function sanitizeSearch(search) {
  if (!search || typeof search !== "string") return "";
  return search.trim().slice(0, 100);
}

/**
 * Validates user filters (optional for specific endpoints)
 */
export function validateFilters(filters = {}) {
  const validatedFilters = {};

  if (filters.role && typeof filters.role === "string") {
    validatedFilters.role = filters.role.trim();
  }

  if (filters.is_verified !== undefined) {
    const boolValue = filters.is_verified;
    if (boolValue === "true" || boolValue === true) {
      validatedFilters.is_verified = true;
    } else if (boolValue === "false" || boolValue === false) {
      validatedFilters.is_verified = false;
    }
  }

  return validatedFilters;
}

export function validateCampusFilters(filters = {}) {
  const validated = {};

  if (filters.name && typeof filters.name === "string") {
    validated.name = filters.name.trim();
  }

  if (filters.slug && typeof filters.slug === "string") {
    validated.slug = filters.slug.trim();
  }

  return validated;
}

export function validateCategoryFilters(filters = {}) {
  const validated = {};

  if (filters.name && typeof filters.name === "string") {
    validated.name = filters.name.trim();
  }

  if (filters.slug && typeof filters.slug === "string") {
    validated.slug = filters.slug.trim();
  }

  return validated;
}
