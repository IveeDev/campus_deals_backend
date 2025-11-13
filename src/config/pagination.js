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

export const CAMPUS_QUERY = {
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_ORDER: "desc",
  ALLOWED_SORT_FIELDS: [
    "id",
    "name",
    "slug",
    "lon",
    "lat",
    "createdAt",
    "updatedAt",
  ],
  ALLOWED_ORDERS: ["asc", "desc"],
  SEARCHABLE_FIELDS: ["name", "slug"],
};

export const CAMPUS_ERRORS = {
  FETCH_FAILED: "Failed to fetch campuses",
  INVALID_SORT_FIELD: "Invalid sort field provided",
  INVALID_ORDER: "Invalid sort order provided",
  INVALID_PAGINATION: "Invalid pagination parameters",
};

export const CATEGORY_QUERY = {
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_ORDER: "desc",
  ALLOWED_SORT_FIELDS: ["id", "name", "slug", "createdAt", "updatedAt"],
  ALLOWED_ORDERS: ["asc", "desc"],
  SEARCHABLE_FIELDS: ["name", "slug"],
};

export const CATEGORY_ERRORS = {
  FETCH_FAILED: "Failed to fetch categories",
  INVALID_SORT_FIELD: "Invalid sort field provided",
  INVALID_ORDER: "Invalid sort order provided",
  INVALID_PAGINATION: "Invalid pagination parameters",
};

export const LISTING_QUERY = {
  DEFAULT_SORT_BY: "createdAt",
  DEFAULT_ORDER: "desc",

  ALLOWED_SORT_FIELDS: [
    "id",
    "title",
    "price",
    "categoryId",
    "campusId",
    "condition",
    "isAvailable",
    "createdAt",
    "updatedAt",
  ],

  ALLOWED_ORDERS: ["asc", "desc"],

  SEARCHABLE_FIELDS: [
    "title",
    "description", // ✅ full-text search later
  ],

  FILTERABLE_FIELDS: [
    "categoryId",
    "campusId",
    "condition",
    "isAvailable",
    "priceMin",
    "priceMax",
  ],
};

export const LISTING_ERRORS = {
  FETCH_FAILED: "Failed to fetch listings",
  INVALID_SORT_FIELD: "Invalid sort field provided",
  INVALID_ORDER: "Invalid sort order provided",
  INVALID_PAGINATION: "Invalid pagination parameters",
  INVALID_FILTER: "Invalid filter parameters provided",
};
