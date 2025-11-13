import { db } from "#config/database.js";
import { listings } from "#models/listing.model.js";
import { listingImages } from "#models/listing_image.model.js";
import { and, eq, ne, gte, lte, asc, desc, count, inArray } from "drizzle-orm";

import logger from "#config/logger.js";
import { AppError } from "#src/utils/AppError.js";
import cloudinary from "#src/config/cloudinary.js";
import {
  validatePaginationParams,
  validateSortParams,
  sanitizeSearch,
  validateListingFilters,
} from "#utils/validation.js";
import { LISTING_ERRORS, LISTING_QUERY } from "#config/pagination.js";
import {
  buildListingWhereConditions,
  buildListingOrderBy,
} from "#queries/listing.query.js";

async function getListingsForUser(userId, options = {}) {
  const { page, limit, offset } = validatePaginationParams(
    options,
    LISTING_ERRORS
  );

  const { sortBy, order } = validateSortParams(
    options.sortBy,
    options.order,
    LISTING_QUERY,
    LISTING_ERRORS
  );

  const whereCondition = eq(listings.sellerId, userId);

  // ✅ Step 1: fetch listings
  const rows = await db
    .select()
    .from(listings)
    .where(whereCondition)
    .orderBy(order === "asc" ? asc(listings[sortBy]) : desc(listings[sortBy]))
    .limit(limit)
    .offset(offset);

  if (rows.length === 0) {
    return {
      meta: { total: 0, page, limit, totalPages: 0 },
      data: [],
    };
  }

  // ✅ Step 2: fetch images
  const listingIds = rows.map(l => l.id);

  const images = await db
    .select()
    .from(listingImages)
    .where(inArray(listingImages.listingId, listingIds));

  // ✅ Step 3: attach images
  const listingMap = {};
  rows.forEach(l => {
    listingMap[l.id] = { ...l, images: [] };
  });

  images.forEach(img => {
    listingMap[img.listingId].images.push({
      url: img.url,
      publicId: img.publicId,
    });
  });

  const finalData = Object.values(listingMap);

  // ✅ Step 4: count total
  const [{ total }] = await db
    .select({ total: count(listings.id) })
    .from(listings)
    .where(whereCondition);

  return {
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: finalData,
  };
}

export const createListing = async payload => {
  try {
    const {
      title,
      description,
      price,
      categoryId,
      sellerId,
      images,
      condition,
      campusId,
    } = payload;

    const [newListing] = await db
      .insert(listings)
      .values({
        title,
        description,
        condition,
        price,
        categoryId,
        sellerId,
        campusId,
      })
      .returning();

    if (!newListing) {
      throw new AppError("Failed to create listing", 500);
    }

    const imageRecords = images.map(image => ({
      listingId: newListing.id,
      url: image.url,
      publicId: image.publicId,
    }));

    await db.insert(listingImages).values(imageRecords);

    logger.info(`✅ Listing ${newListing.id} created successfully`);

    return {
      ...newListing,
      images: imageRecords,
    };
  } catch (error) {
    logger.error(`❌ Error creating listing: ${error.message}`);
    if (error instanceof AppError) throw error;
    throw new AppError(error.message || "Internal server error", 500);
  }
};

export const getListingById = async id => {
  try {
    logger.info(`Fetching listing by ID: ${id}`);

    const rows = await db
      .select({
        listingId: listings.id,
        title: listings.title,
        description: listings.description,
        price: listings.price,
        condition: listings.condition,
        categoryId: listings.categoryId,
        sellerId: listings.sellerId,
        campusId: listings.campusId,
        isAvailable: listings.isAvailable,
        createdAt: listings.createdAt,
        updatedAt: listings.updatedAt,
        imageUrl: listingImages.url,
        imagePublicId: listingImages.publicId,
      })
      .from(listings)
      .leftJoin(listingImages, eq(listingImages.listingId, listings.id))
      .where(eq(listings.id, id));

    if (!rows.length) throw new AppError("Listing not found", 404);

    const listing = {
      id: rows[0].listingId,
      title: rows[0].title,
      description: rows[0].description,
      price: rows[0].price,
      condition: rows[0].condition,
      categoryId: rows[0].categoryId,
      sellerId: rows[0].sellerId,
      campusId: rows[0].campusId,
      isAvailable: rows[0].isAvailable,
      createdAt: rows[0].createdAt,
      updatedAt: rows[0].updatedAt,
      images: rows
        .filter(r => r.imageUrl)
        .map(r => ({
          url: r.imageUrl,
          publicId: r.imagePublicId,
        })),
    };

    return listing;
  } catch (error) {
    logger.error(`Error getting listing ${id}:, ${error.message}`);
    throw error;
  }
};

// export const deleteListing = async id => {};

export const softDeleteListing = async (id, userId) => {
  try {
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!listing) throw new AppError("Listing not found", 404);

    if (listing.sellerId !== userId)
      throw new AppError("Unauthorized to delete this listing", 403);

    // Soft delete by setting isAvailable to false
    await db
      .update(listings)
      .set({ isAvailable: false })
      .where(eq(listings.id, id))
      .returning();
    logger.info(`✅ Listing ${id} soft-deleted by user ${userId}`);
    return { message: "Listing deleted successfully" };
  } catch (error) {
    logger.error(`Error deleting listing ${id}: ${error.message}`);
    throw error;
  }
};

export const updateListing = async (id, userId, payload, files = []) => {
  try {
    const listing = await getListingById(id);

    if (listing.sellerId !== userId)
      throw new AppError("Unauthorized to update this listing", 403);

    // Remove images if specified
    if (payload.removeImageIds?.length) {
      for (const publicId of payload.removeImageIds) {
        await cloudinary.uploader.destroy(publicId);
      }

      await db
        .delete(listingImages)
        .where(
          and(
            eq(listingImages.listingId, id),
            inArray(listingImages.publicId, payload.removeImageIds)
          )
        );
    }

    // ✅ Add new images
    if (files.length) {
      const newImages = files.map(file => ({
        listingId: id,
        url: file.path,
        publicId: file.filename,
      }));

      await db.insert(listingImages).values(newImages);
    }

    const updatedData = {
      ...payload,
      updatedAt: new Date(),
    };
    delete updatedData.removeImageIds;

    const [updatedListing] = await db
      .update(listings)
      .set(updatedData)
      .where(eq(listings.id, id))
      .returning();

    logger.info(`✅ Listing ${id} updated by user ${userId}`);
    return updatedListing;
  } catch (error) {
    logger.error(`Error updating listing ${id}: ${error.message}`);
    throw error;
  }
};

export const getAllListings = async (options = {}) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { page, limit, offset } = validatePaginationParams(
      options,
      LISTING_ERRORS
    );

    const { sortBy, order } = validateSortParams(
      options.sortBy,
      options.order,
      LISTING_QUERY,
      LISTING_ERRORS
    );

    const search = sanitizeSearch(options.search);
    const filters = validateListingFilters(options.filters);

    const whereConditions = buildListingWhereConditions(search, filters);
    const whereCondition =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const orderBy = buildListingOrderBy(sortBy, order);

    // ✅ 1. Fetch listings + joined images
    const rows = await db
      .select({
        id: listings.id,
        title: listings.title,
        description: listings.description,
        price: listings.price,
        condition: listings.condition,
        categoryId: listings.categoryId,
        campusId: listings.campusId,
        sellerId: listings.sellerId,
        isAvailable: listings.isAvailable,
        createdAt: listings.createdAt,
        updatedAt: listings.updatedAt,
        imageUrl: listingImages.url,
        imagePublicId: listingImages.publicId,
      })
      .from(listings)
      .leftJoin(listingImages, eq(listingImages.listingId, listings.id))
      .where(whereCondition)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // ✅ 2. Count total items
    const [totalResult] = await db
      .select({ total: count(listings.id) })
      .from(listings)
      .where(whereCondition);

    const total = Number(totalResult?.total || 0);
    const totalPages = Math.ceil(total / limit);

    // ✅ 3. Group images under each listing
    const listingMap = new Map();

    for (const row of rows) {
      if (!listingMap.has(row.id)) {
        listingMap.set(row.id, {
          id: row.id,
          title: row.title,
          description: row.description,
          price: row.price,
          condition: row.condition,
          categoryId: row.categoryId,
          campusId: row.campusId,
          sellerId: row.sellerId,
          isAvailable: row.isAvailable,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          images: [],
        });
      }

      if (row.imageUrl) {
        listingMap.get(row.id).images.push({
          url: row.imageUrl,
          publicId: row.imagePublicId,
        });
      }
    }

    const data = [...listingMap.values()];

    // ✅ 4. Structure final response
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

    logger.info(
      `[${requestId}] Listings fetched successfully (${data.length} items) in ${
        Date.now() - startTime
      }ms`
    );

    return response;
  } catch (error) {
    logger.error(`[${requestId}] Error fetching listings: ${error.message}`);
    throw new Error(LISTING_ERRORS.FETCH_FAILED);
  }
};

export const getListingsByUser = async (userId, options) => {
  return getListingsForUser(userId, options);
};

export const getListingsByUserId = async (userId, options) => {
  return getListingsForUser(userId, options);
};

/**
 * Get related listings
 * @param {number} listingId - Current listing ID
 * @param {object} options
 *   - limit: number of listings
 *   - type: "basic" | "advanced"
 */

export const getRelatedListings = async (listingId, options = {}) => {
  try {
    const { limit = 10, type = "basic" } = options;

    const mainListing = await getListingById(listingId);
    if (!mainListing) throw new AppError("Listing not found", 404);

    console.log("Fetching related listings for ID:", listingId);
    console.log("Main listing:", mainListing);

    const { categoryId, campusId, price, condition } = mainListing;

    let conditions;

    if (type === "advanced") {
      const priceMin = price * 0.7;
      const priceMax = price * 1.3;

      conditions = and(
        eq(listings.categoryId, categoryId),
        ne(listings.id, listingId),
        eq(listings.isAvailable, true),
        eq(listings.campusId, campusId),
        eq(listings.condition, condition),
        gte(listings.price, priceMin),
        lte(listings.price, priceMax)
      );
    } else {
      // Basic: same category only
      conditions = and(
        eq(listings.categoryId, categoryId),
        ne(listings.id, listingId),
        eq(listings.isAvailable, true)
      );
    }

    let relatedListings = await db
      .select()
      .from(listings)
      .where(conditions)
      .orderBy(desc(listings.createdAt))
      .limit(limit);

    // Fallback for advanced: loosen conditions if not enough
    if (type === "advanced" && relatedListings.length < limit) {
      const remaining = limit - relatedListings.length;
      const loosened = and(
        eq(listings.categoryId, categoryId),
        ne(listings.id, listingId),
        eq(listings.isAvailable, true)
      );

      const more = await db
        .select()
        .from(listings)
        .where(loosened)
        .orderBy(desc(listings.createdAt))
        .limit(remaining);

      relatedListings = [...relatedListings, ...more];
    }

    // Attach images (if there are related listings)
    const listingIds = relatedListings.map(l => l.id);
    if (listingIds.length === 0) return { data: [] };

    const images = await db
      .select()
      .from(listingImages)
      .where(inArray(listingImages.listingId, listingIds));

    const listingMap = {};
    relatedListings.forEach(l => (listingMap[l.id] = { ...l, images: [] }));

    images.forEach(img => {
      if (listingMap[img.listingId]) {
        listingMap[img.listingId].images.push({
          url: img.url,
          publicId: img.publicId,
        });
      }
    });

    return { data: Object.values(listingMap) };
  } catch (error) {
    logger.error("Error fetching related listings:", error);
    throw new AppError("Failed to fetch related listings", 500);
  }
};
