import { db } from "#config/database.js";
import { categories } from "#models/category.model.js";
import { eq, ilike, asc, desc, or, and, count } from "drizzle-orm";
import slugify from "slugify";
import logger from "#src/config/logger.js";
import { AppError } from "#src/utils/appError.js";
import {
  validatePaginationParams,
  validateSortParams,
  sanitizeSearch,
  validateCategoryFilters,
} from "#src/utils/validation.js";
import { CATEGORY_QUERY, CATEGORY_ERRORS } from "#src/config/pagination.js";

function buildCategoryWhereConditions(search, filters) {
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(categories.name, `%${search}%`),
        ilike(categories.slug, `%${search}%`)
      )
    );
  }
  if (filters.name)
    conditions.push(ilike(categories.name, `%${filters.name}%`));
  if (filters.slug)
    conditions.push(ilike(categories.slug, `%${filters.slug}%`));
  return conditions;
}

function buildCategoryOrderBy(sortBy, order) {
  const sortField = categories[sortBy] || categories.createdAt;
  return order === "asc" ? asc(sortField) : desc(sortField);
}

export const createCategory = async payload => {
  try {
    let { name, description, slug } = payload;

    if (!slug) {
      slug = slugify(name, { lower: true, strict: true });
    }

    //   check duplicate name or slug
    const [existingCategory] = await db
      .select()
      .from(categories)
      .where(or(ilike(categories.name, name), eq(categories.slug, slug)));

    if (existingCategory)
      throw new AppError(
        `Category with slug ${slug} or ${name} already exists`,
        409
      );

    const [newCategory] = await db
      .insert(categories)
      .values({ name, slug, description })
      .returning();

    return newCategory;
  } catch (error) {
    logger.error(`Error creating category, ${payload.slug}:`, error.message);
    throw error;
  }
};

export const getAllCategories = async (options = {}) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { page, limit, offset } = validatePaginationParams(
      options,
      CATEGORY_ERRORS
    );

    const { sortBy, order } = validateSortParams(
      options.sortBy,
      options.order,
      CATEGORY_QUERY,
      CATEGORY_ERRORS
    );

    const search = sanitizeSearch(options.search);
    const filters = validateCategoryFilters(options.filters);

    const whereConditions = buildCategoryWhereConditions(search, filters);
    const whereCondition = whereConditions.length
      ? and(...whereConditions)
      : undefined;
    const orderBy = buildCategoryOrderBy(sortBy, order);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          description: categories.description,
          created_at: categories.createdAt,
          updated_at: categories.updatedAt,
        })
        .from(categories)
        .where(whereCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count(categories.id) })
        .from(categories)
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

    logger.info(`[${requestId}] Categories fetched successfully`, {
      duration: `${Date.now() - startTime}ms`,
      count: data.length,
    });
    return response;
  } catch (error) {
    logger.error(`[${requestId}] Error fetching categories:`, error.message);
    throw new Error(CATEGORY_ERRORS.FETCH_FAILED);
  }
};

export const getCategoryById = async id => {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) throw new AppError("Category not found", 404);
    return category;
  } catch (error) {
    logger.error(`Error getting category ${id}:`, error.message);
    throw error;
  }
};

export const getCategoryBySlug = async slug => {
  try {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!category) throw new AppError("Campus not found", 404);

    return category;
  } catch (error) {
    logger.error(`Error getting category by slug ${slug}:`, error.message);
    throw error;
  }
};

export const deleteCategory = async id => {
  try {
    await getCategoryById(id); // Ensure category exists

    const [deletedCategory] = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    logger.info(`Category with ID ${id} deleted successfully.`);
    return deletedCategory;
  } catch (error) {
    logger.error(`Error deleting category ${id}:`, error.message);
    throw error;
  }
};

export const updateCategory = async (id, payload) => {
  try {
    const existingCategory = await getCategoryById(id);

    if (!existingCategory) throw new AppError("Category not found");

    if (payload.name) {
      const slug = slugify(payload.name, { lower: true, strict: true });
      payload.slug = slug;
    }
    const updatedData = { ...payload, updateAt: new Date() };

    const [updatedCategory] = await db
      .update(categories)
      .set(updatedData)
      .where(eq(categories.id, id))
      .returning({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        created_at: categories.createdAt,
        updated_at: categories.updatedAt,
      });
    logger.info(`Category with ID ${id} updated successfully.`);
    return updatedCategory;
  } catch (error) {
    logger.error(`Error updating category ${id}:`, error.message);
    throw error;
  }
};
