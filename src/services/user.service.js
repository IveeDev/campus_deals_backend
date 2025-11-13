import logger from "#src/config/logger.js";
import { db } from "#config/database.js";
import { users } from "#models/user.model.js";
import {
  buildUserWhereConditions,
  buildUserOrderBy,
} from "#src/queries/user.query.js";
import { eq, and, count } from "drizzle-orm";
import {
  validatePaginationParams,
  validateSortParams,
  sanitizeSearch,
  validateFilters,
  ValidationError,
} from "#utils/validation.js";
import { USER_ERRORS, USER_QUERY } from "#config/pagination.js";
import { AppError } from "#src/utils/AppError.js";

/**
 
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
    const { page, limit, offset } = validatePaginationParams(
      options,
      USER_ERRORS
    );
    const { sortBy, order } = validateSortParams(
      options.sortBy,
      options.order,
      USER_QUERY,
      USER_ERRORS
    );
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
    const whereConditions = buildUserWhereConditions(search, filters);
    const whereCondition = whereConditions.length
      ? and(...whereConditions)
      : undefined;

    const orderBy = buildUserOrderBy(sortBy, order);

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

/**

 */
export const getUserById = async id => {
  try {
    const [user] = await db
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
      .where(eq(users.id, id))
      .limit(1);

    if (!user) throw new AppError("User not found", 404);
    return user;
  } catch (error) {
    logger.error(`Error getting user ${id}:`, error.message);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    // First check if user exists
    await getUserById(id);

    const [deletedUser] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
      });

    logger.info(`User ${deletedUser.email} deleted successfully`);
    return deletedUser;
  } catch (error) {
    logger.error(`Error deleting user ${id}:`, error.message);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // first check if user exists
    const existingUser = await getUserById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Check if email is being updated and if it already exists
    if (updates.email && updates.email !== existingUser.email) {
      const [emailUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, updates.email))
        .limit(1);
      if (emailUser) {
        throw new Error("Email already in use");
      }
    }

    const updatedData = {
      ...updates,
      updatedAt: new Date(),
    };

    const [updatedUser] = await db
      .update(users)
      .set(updatedData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        is_verified: users.is_verified,
        created_at: users.createdAt,
        updated_at: users.updatedAt,
      });
    logger.info(`User ${updatedUser.email} updated successfully`);
    return updatedUser;
  } catch (error) {
    logger.error(`Error updating user ${id}:`, error.message);
    throw error;
  }
};
