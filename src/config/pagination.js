/**
 * Pagination and query configuration constants
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  MIN_PAGE: 1,
};

export const USER_QUERY = {
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_ORDER: "desc",
  ALLOWED_SORT_FIELDS: [
    "id",
    "name",
    "email",
    "phone",
    "role",
    "is_verified",
    "createdAt",
    "updatedAt",
  ],
  ALLOWED_ORDERS: ["asc", "desc"],
  SEARCHABLE_FIELDS: ["name", "email", "phone"],
};

export const USER_ERRORS = {
  FETCH_FAILED: "Failed to fetch users",
  INVALID_SORT_FIELD: "Invalid sort field provided",
  INVALID_ORDER: "Invalid sort order provided",
  INVALID_PAGINATION: "Invalid pagination parameters",
};
