import logger from "#src/config/logger.js";
import { db } from "#config/database.js";
import { campuses } from "#models/campus.model.js";
import { fetchCoordinates } from "../utils/fetchCoordinates.js";
import { asc, desc, ilike, or, eq, and, count } from "drizzle-orm";
import {
  validatePaginationParams,
  validateSortParams,
  sanitizeSearch,
  validateCampusFilters,
} from "#utils/validation.js";
import { CAMPUS_ERRORS, CAMPUS_QUERY } from "#config/pagination.js";
import slugify from "slugify";
import { AppError } from "#src/utils/appError.js";

function buildCampusWhereConditions(search, filters) {
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(campuses.name, `%${search}%`),
        ilike(campuses.slug, `%${search}%`)
      )
    );
  }
  if (filters.name) conditions.push(ilike(campuses.name, `%${filters.name}%`));
  if (filters.slug) conditions.push(ilike(campuses.slug, `%${filters.slug}%`));
  return conditions;
}

function buildCampusOrderBy(sortBy, order) {
  const sortField = campuses[sortBy] || campuses.createdAt;
  return order === "asc" ? asc(sortField) : desc(sortField);
}

export const createCampus = async payload => {
  try {
    let { name, slug } = payload;

    if (!slug) {
      slug = slugify(name, { lower: true, strict: true });
    }
    // 1️⃣ Check for existing campus by slug
    const [existingSlug] = await db
      .select()
      .from(campuses)
      .where(eq(campuses.slug, slug))
      .limit(1);

    if (existingSlug)
      throw new AppError(`Campus with slug ${slug} already exists`, 409);
    // 2️⃣ Check for existing campus by name
    const [existingName] = await db
      .select()
      .from(campuses)
      .where(ilike(campuses.name, name))
      .limit(1);

    if (existingName)
      throw new AppError(`Campus with name ${name} already exists`, 409);

    if (error.code === "23505") {
      throw new AppError("Campus already exists", 409);
    }
    // 3️⃣ Fetch or reuse coordinates
    let lat = null;
    let lon = null;

    logger.info(`Fetching coordinates for campus: ${name}`);
    const coords = await fetchCoordinates(name);
    if (coords) {
      lat = coords.lat;
      lon = coords.lon;
    }

    // 4️⃣ Insert into DB
    const [newCampus] = await db
      .insert(campuses)
      .values({ name, slug, lat, lon })
      .returning();

    logger.info(`Campus created: ${newCampus.slug}`);
    return newCampus;
  } catch (error) {
    if (error.code === "23505") {
      // Postgres unique violation fallback
      const e = new Error("Campus already exists");
      e.status = 409;
      throw e;
    }

    logger.error("Error creating campus:", error.message);
    throw error;
  }
};

export const getAllCampuses = async (options = {}) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { page, limit, offset } = validatePaginationParams(
      options,
      CAMPUS_ERRORS
    );
    const { sortBy, order } = validateSortParams(
      options.sortBy,
      options.order,
      CAMPUS_QUERY,
      CAMPUS_ERRORS
    );
    const search = sanitizeSearch(options.search);
    const filters = validateCampusFilters(options.filters);

    const whereConditions = buildCampusWhereConditions(search, filters);
    const whereCondition = whereConditions.length
      ? and(...whereConditions)
      : undefined;
    const orderBy = buildCampusOrderBy(sortBy, order);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: campuses.id,
          name: campuses.name,
          slug: campuses.slug,
          lon: campuses.lon,
          lat: campuses.lat,
          created_at: campuses.createdAt,
          updated_at: campuses.updatedAt,
        })
        .from(campuses)
        .where(whereCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count(campuses.id) })
        .from(campuses)
        .where(whereCondition),
    ]);

    const total = totalResult?.[0]?.total || 0;
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

    logger.info(`[${requestId}] Campuses fetched successfully`, {
      duration: `${Date.now() - startTime}ms`,
      count: data.length,
    });

    return response;
  } catch (error) {
    logger.error(`[${requestId}] Error fetching campuses:`, error.message);
    throw new Error(CAMPUS_ERRORS.FETCH_FAILED);
  }
};

export const getCampusById = async id => {
  try {
    const [campus] = await db
      .select()
      .from(campuses)
      .where(eq(campuses.id, id))
      .limit(1);

    if (!campus) throw new AppError("Campus not found", 404);

    return campus;
  } catch (error) {
    logger.error(`Error getting user ${id}:`, error.message);
    throw error;
  }
};

export const getCampusBySlug = async slug => {
  try {
    const [campus] = await db
      .select()
      .from(campuses)
      .where(eq(campuses.slug, slug))
      .limit(1);

    if (!campus) throw new AppError("Campus not found", 404);

    return campus;
  } catch (error) {
    logger.error(`Error fetching campus by slug (${slug}):`, error.message);
    throw error;
  }
};

export const deleteCampus = async id => {
  try {
    await getCampusById(id);

    const [deletedCampus] = await db
      .delete(campuses)
      .where(eq(campuses.id, id))
      .returning({
        id: campuses.id,
        name: campuses.name,
        slug: campuses.slug,
      });
    logger.info(`Campus deleted: ${deletedCampus.slug}`);
    return deletedCampus;
  } catch (error) {
    logger.error(`Error deleting campus ${id}:`, error.message);
    throw error;
  }
};

export const updateCampus = async (id, payload) => {
  try {
    const existingCampus = await getCampusById(id);

    if (!existingCampus) throw new AppError("Campus not found");

    if (payload.name) {
      const slug = slugify(payload.name, { lower: true, strict: true });
      payload.slug = slug;
    }
    const updatedData = {
      ...payload,
      updateAt: new Date(),
    };

    const [updatedCampus] = await db
      .update(campuses)
      .set(updatedData)
      .where(eq(campuses.id, id))
      .returning({
        id: campuses.id,
        name: campuses.name,
        slug: campuses.slug,
        lat: campuses.lat,
        lon: campuses.lon,
        created_at: campuses.createdAt,
        updated_at: campuses.updatedAt,
      });
    logger.info(`User ${updatedCampus.name} updated successfully`);
    return updatedCampus;
  } catch (error) {
    logger.error(`Error updating campus ${id}:`, error.message);
    throw error;
  }
};
