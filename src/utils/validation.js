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

export function validateListingFilters(filters = {}) {
  const validated = {};

  // ✅ campusId
  if (filters.campusId) {
    const val = Number(filters.campusId);
    if (!isNaN(val) && val > 0) validated.campusId = val;
    else throw new ValidationError("Invalid campusId", "campusId");
  }

  // ✅ categoryId
  if (filters.categoryId) {
    const val = Number(filters.categoryId);
    if (!isNaN(val) && val > 0) validated.categoryId = val;
    else throw new ValidationError("Invalid categoryId", "categoryId");
  }

  // ✅ condition (brand_new / used)
  if (filters.condition) {
    const validConditions = ["brand_new", "used"];
    if (validConditions.includes(filters.condition)) {
      validated.condition = filters.condition;
    } else {
      throw new ValidationError(
        "Invalid condition. Expected: brand_new or used",
        "condition"
      );
    }
  }

  // ✅ isAvailable (true/false)
  if (filters.isAvailable !== undefined) {
    const val = filters.isAvailable;
    if (val === "true" || val === true) validated.isAvailable = true;
    else if (val === "false" || val === false) validated.isAvailable = false;
    else throw new ValidationError("Invalid isAvailable value", "isAvailable");
  }

  // ✅ priceMin (>= 0)
  if (filters.priceMin) {
    const val = Number(filters.priceMin);
    if (!isNaN(val) && val >= 0) validated.priceMin = val;
    else throw new ValidationError("Invalid priceMin", "priceMin");
  }

  // ✅ priceMax (> priceMin)
  if (filters.priceMax) {
    const val = Number(filters.priceMax);
    if (!isNaN(val) && val >= 0) validated.priceMax = val;
    else throw new ValidationError("Invalid priceMax", "priceMax");
  }

  // ✅ Additional rule: priceMax >= priceMin
  if (
    validated.priceMin !== undefined &&
    validated.priceMax !== undefined &&
    validated.priceMax < validated.priceMin
  ) {
    throw new ValidationError(
      "priceMax cannot be less than priceMin",
      "priceMax"
    );
  }

  return validated;
}
