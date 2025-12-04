import logger from "#src/config/logger.js";
import { db } from "#config/database.js";
import { favorites } from "#models/favorite.model.js";
import { listings } from "#models/listing.model.js";
import { listingImages } from "#models/listing_image.model.js";
import { eq, and } from "drizzle-orm";

import { AppError } from "#src/utils/AppError.js";

export const addFavorite = async (userId, listingId) => {
  try {
    // Check if listing exists first
    const listing = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    if (listing.length === 0) {
      throw new AppError("Listing not found", 404);
    }

    // check if already favorited
    const existingFavorite = await db
      .select()
      .from(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.listingId, listingId))
      );

    if (existingFavorite.length > 0) {
      throw new AppError("Listing is already in favorites", 400);
    }

    const [newFavorite] = await db
      .insert(favorites)
      .values({
        userId,
        listingId,
      })
      .returning();

    return newFavorite;
  } catch (error) {
    logger.error("Error adding favorite:", error);
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Failed to add favorite to your list", 500);
  }
};

export const removeFavorite = async (userId, listingId) => {
  try {
    const deletedFavorite = await db
      .delete(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.listingId, listingId))
      )
      .returning();

    if (deletedFavorite.length === 0)
      throw new AppError("Favorite not found", 404);
    return { message: "Removed from favorites" };
  } catch (error) {
    logger.error("Error removing favorite:", error);
    // If it's already an AppError, re-throw it directly
    if (error instanceof AppError) {
      throw error;
    }

    // Handle database foreign key constraint errors
    if (error.code === "23503") {
      // Foreign key violation in PostgreSQL
      throw new AppError("Listing not found", 404);
    }

    throw new AppError("Failed to remove favorite from your list", 500);
  }
};

export const getUserFavorites = async userId => {
  try {
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
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .leftJoin(listingImages, eq(listingImages.listingId, listings.id))
      .where(eq(favorites.userId, userId));

    // Group images
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

    return [...listingMap.values()];
  } catch (error) {
    logger.error("Error getting user favorites:", error);
    throw new AppError("Failed to retrieve your favorites", 500);
  }
};
