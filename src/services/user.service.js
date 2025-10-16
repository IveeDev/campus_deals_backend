import logger from "#src/config/logger.js";
import { db } from "#config/database.js";
import { users } from "#models/user.model.js";
import { asc, desc, ilike, or, eq, and, count } from "drizzle-orm";
import {
  validatePaginationParams,
  validateSortParams,
  sanitizeSearch,
  validateFilters,
  ValidationError,
} from "#utils/validation.js";
import { USER_ERRORS } from "#config/pagination.js";

/**
 * @typedef {Object} UserQueryOptions
 * @property {number} [page=1] - Current page number
 * @property {number} [limit=10] - Items per page (max 100)
 * @property {string} [sortBy='createdAt'] - Field to sort by
 * @property {'asc'|'desc'} [order='desc'] - Sort order
 * @property {string} [search=''] - Search term for name, email, or phone
 * @property {Object} [filters={}] - Additional filters
 * @property {string} [filters.role] - Filter by user role
 * @property {boolean|string} [filters.is_verified] - Filter by verification status
 */

/**
 * @typedef {Object} UserListResponse
 * @property {Object} meta - Pagination metadata
 * @property {number} meta.total - Total number of items
 * @property {number} meta.page - Current page
 * @property {number} meta.limit - Items per page
 * @property {number} meta.totalPages - Total number of pages
 * @property {boolean} meta.hasNext - Whether there are more pages
 * @property {boolean} meta.hasPrev - Whether there are previous pages
 * @property {Array<Object>} data - User data array
 */

/**
 * Builds where conditions for user query
 * @private
 * @param {string} search - Sanitized search term
 * @param {Object} filters - Validated filters
 * @returns {Array} Array of where conditions
 */
function buildWhereConditions(search, filters) {
  const conditions = [];

  // Search conditions
  if (search) {
    conditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.phone, `%${search}%`)
      )
    );
  }

  // Filter conditions
  if (filters.role) {
    conditions.push(eq(users.role, filters.role));
  }

  if (filters.is_verified !== undefined) {
    conditions.push(eq(users.is_verified, filters.is_verified));
  }

  return conditions;
}

/**
 * Builds order by clause for user query
 * @private
 * @param {string} sortBy - Validated sort field
 * @param {string} order - Validated order direction
 * @returns {Function} Drizzle order function
 */
function buildOrderBy(sortBy, order) {
  const sortField = users[sortBy] || users.createdAt;
  return order === "asc" ? asc(sortField) : desc(sortField);
}

/**
 * Get paginated, sortable, searchable list of users with comprehensive validation
 *
 * @param {UserQueryOptions} options - Query options
 * @returns {Promise<UserListResponse>} Paginated user data with metadata
 *
 * @throws {ValidationError} When input parameters are invalid
 * @throws {Error} When database operation fails
 *
 * @example
 * ```javascript
 * // Basic usage
 * const result = await getAllUsers({ page: 1, limit: 20 });
 *
 * // With search and filters
 * const result = await getAllUsers({
 *   page: 1,
 *   limit: 10,
 *   search: 'john',
 *   sortBy: 'name',
 *   order: 'asc',
 *   filters: {
 *     role: 'admin',
 *     is_verified: true
 *   }
 * });
 * ```
 */
export const getAllUsers = async (options = {}) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    logger.info(`[${requestId}] Starting user query`, {
      options,
      service: "user.service",
      operation: "getAllUsers",
    });

    // Input validation and sanitization
    const { page, limit, offset } = validatePaginationParams(options);
    const { sortBy, order } = validateSortParams(options.sortBy, options.order);
    const search = sanitizeSearch(options.search);
    const filters = validateFilters(options.filters);

    logger.debug(`[${requestId}] Validated parameters`, {
      page,
      limit,
      sortBy,
      order,
      search,
      filters,
    });

    // Build query conditions
    const whereConditions = buildWhereConditions(search, filters);
    const whereCondition = whereConditions.length
      ? and(...whereConditions)
      : undefined;

    const orderBy = buildOrderBy(sortBy, order);

    // Execute queries in parallel for better performance
    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          is_verified: users.is_verified,
          created_at: users.createdAt,
          updated_at: users.updatedAt,
        })
        .from(users)
        .where(whereCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count(users.id) })
        .from(users)
        .where(whereCondition),
    ]);

    // Process results
    const total = totalResult?.[0]?.total ? Number(totalResult[0].total) : 0;
    const totalPages = Math.ceil(total / limit);

    const response = {
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        query: {
          search: search || null,
          sortBy,
          order,
          filters: Object.keys(filters).length ? filters : null,
        },
      },
      data,
    };

    const duration = Date.now() - startTime;
    logger.info(`[${requestId}] User query completed successfully`, {
      duration: `${duration}ms`,
      resultCount: data.length,
      totalCount: total,
    });

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof ValidationError) {
      logger.warn(`[${requestId}] Validation error in user query`, {
        error: error.message,
        field: error.field,
        duration: `${duration}ms`,
      });
      throw error;
    }

    logger.error(`[${requestId}] Database error in user query`, {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      service: "user.service",
      operation: "getAllUsers",
    });

    throw new Error(USER_ERRORS.FETCH_FAILED);
  }
};
