import { PAGINATION, USER_QUERY, USER_ERRORS } from '#config/pagination.js';

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Validates and sanitizes pagination parameters
 * @param {Object} params - Raw parameters
 * @returns {Object} Validated parameters
 */
export function validatePaginationParams({ page, limit }) {
  const validatedPage = Math.max(
    PAGINATION.MIN_PAGE, 
    parseInt(page) || PAGINATION.DEFAULT_PAGE
  );

  const validatedLimit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(PAGINATION.MIN_LIMIT, parseInt(limit) || PAGINATION.DEFAULT_LIMIT)
  );

  if (isNaN(validatedPage) || isNaN(validatedLimit)) {
    throw new ValidationError(USER_ERRORS.INVALID_PAGINATION);
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
 * @returns {Object} Validated sort parameters
 */
export function validateSortParams(sortBy, order) {
  const validatedSortBy = USER_QUERY.ALLOWED_SORT_FIELDS.includes(sortBy) 
    ? sortBy 
    : USER_QUERY.DEFAULT_SORT_BY;

  const validatedOrder = USER_QUERY.ALLOWED_ORDERS.includes(order?.toLowerCase()) 
    ? order.toLowerCase() 
    : USER_QUERY.DEFAULT_ORDER;

  if (sortBy && !USER_QUERY.ALLOWED_SORT_FIELDS.includes(sortBy)) {
    throw new ValidationError(
      `${USER_ERRORS.INVALID_SORT_FIELD}. Allowed: ${USER_QUERY.ALLOWED_SORT_FIELDS.join(', ')}`
    );
  }

  return {
    sortBy: validatedSortBy,
    order: validatedOrder,
  };
}

/**
 * Sanitizes search string
 * @param {string} search - Search term
 * @returns {string} Sanitized search term
 */
export function sanitizeSearch(search) {
  if (!search || typeof search !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters and trim
  return search.trim().slice(0, 100); // Limit search length
}

/**
 * Validates filter parameters
 * @param {Object} filters - Filter object
 * @returns {Object} Validated filters
 */
export function validateFilters(filters = {}) {
  const validatedFilters = {};

  // Validate role filter
  if (filters.role && typeof filters.role === 'string') {
    validatedFilters.role = filters.role.trim();
  }

  // Validate is_verified filter
  if (filters.is_verified !== undefined) {
    const boolValue = filters.is_verified;
    if (boolValue === 'true' || boolValue === true) {
      validatedFilters.is_verified = true;
    } else if (boolValue === 'false' || boolValue === false) {
      validatedFilters.is_verified = false;
    }
  }

  return validatedFilters;
}