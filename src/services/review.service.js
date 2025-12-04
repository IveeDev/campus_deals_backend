import logger from "#src/config/logger.js";
import { db } from "#config/database.js";
import { reviews } from "#models/review.model.js";
import { users } from "#models/user.model.js";
import { AppError } from "#src/utils/AppError.js";
import { eq, and, desc, sql } from "drizzle-orm";

// --------------------------------------------
// UPDATE USER REVIEW STATS
// --------------------------------------------
export const updateUserReviewStats = async userId => {
  try {
    const validUserId = Number(userId);

    const [row] = await db
      .select({
        positive: sql`
        COALESCE(SUM(CASE WHEN ${reviews.rating} = 'positive' THEN 1 ELSE 0 END), 0)
      `,
        neutral: sql`
        COALESCE(SUM(CASE WHEN ${reviews.rating} = 'neutral' THEN 1 ELSE 0 END), 0)
      `,
        negative: sql`
        COALESCE(SUM(CASE WHEN ${reviews.rating} = 'negative' THEN 1 ELSE 0 END), 0)
      `,
      })
      .from(reviews)
      .where(eq(reviews.revieweeId, validUserId));

    await db
      .update(users)
      .set({
        positiveCount: Number(row.positive),
        neutralCount: Number(row.neutral),
        negativeCount: Number(row.negative),
      })
      .where(eq(users.id, validUserId));

    logger.info(`Successfully updated review stats for user ${validUserId}`);
  } catch (error) {
    logger.error(`Error updating review stats for user ${userId}:`, error);

    // Re-throw with more context if it's not already an AppError
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Failed to update review statistics: ${error.message}`,
      500,
      { originalError: error.message }
    );
  }
};

// --------------------------------------------
// CREATE REVIEW
// --------------------------------------------
export const createReview = async payload => {
  try {
    const { review, reviewerId, revieweeId, rating } = payload;

    if (reviewerId === revieweeId) {
      throw new AppError("You cannot review yourself", 400);
    }

    // Check if reviewee exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, revieweeId))
      .limit(1);

    if (!user) throw new AppError("Reviewee not found", 404);

    // Prevent duplicate review for same user
    const [existing] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.reviewerId, reviewerId),
          eq(reviews.revieweeId, revieweeId)
        )
      )
      .limit(1);

    if (existing)
      throw new AppError("You have already reviewed this user", 400);

    // Create the review
    const [newReview] = await db
      .insert(reviews)
      .values({
        review,
        reviewerId,
        revieweeId,
        rating,
      })
      .returning();

    if (!newReview) {
      throw new AppError("Failed to create review - no data returned", 500);
    }

    // Update review stats safely
    try {
      await updateUserReviewStats(revieweeId);
    } catch (statsError) {
      logger.error(
        `Failed to update review stats for user ${revieweeId}:`,
        statsError
      );
      // Don't throw here - the review was created successfully
      // Just log the error so the user still gets their success response
    }

    logger.info(
      `Review ${newReview.id} created by ${reviewerId} for user ${revieweeId}`
    );

    return newReview;
  } catch (error) {
    logger.error("Error creating review:", error);

    if (error instanceof AppError) {
      throw error;
    }

    // Handle database constraints or other unexpected errors
    throw new AppError(`Failed to create review: ${error.message}`, 500, {
      originalError: error.message,
    });
  }
};

// --------------------------------------------
// UPDATE REVIEW
// --------------------------------------------
export const updateReview = async (id, userId, payload) => {
  try {
    const [existing] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!existing) throw new AppError("Review not found", 404);
    if (existing.reviewerId !== userId) {
      throw new AppError("Not allowed to update this review", 403);
    }

    const oldRating = existing.rating;
    const newRating = payload.rating;

    const updatedPayload = {
      ...payload,
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(reviews)
      .set(updatedPayload)
      .where(eq(reviews.id, id))
      .returning();

    if (!updated) {
      throw new AppError("Failed to update review - no data returned", 500);
    }

    // Update stats if rating changed
    if (newRating !== undefined && newRating !== oldRating) {
      try {
        await updateUserReviewStats(existing.revieweeId);
      } catch (statsError) {
        logger.error(
          "Failed to update review stats during update:",
          statsError
        );
        // Continue - the review was updated successfully
      }
    }

    logger.info(`Review ${id} updated by user ${userId}`);
    return updated;
  } catch (error) {
    logger.error(`Error updating review ${id}:`, error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(`Failed to update review: ${error.message}`, 500, {
      originalError: error.message,
    });
  }
};

// --------------------------------------------
// DELETE REVIEW
// --------------------------------------------
export const deleteReview = async (id, userId) => {
  try {
    const [existing] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!existing) throw new AppError("Review not found", 404);
    if (existing.reviewerId !== userId) {
      throw new AppError("Not allowed to delete this review", 403);
    }

    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, id))
      .returning();

    if (!deleted) {
      throw new AppError("Failed to delete review - no data returned", 500);
    }

    // Update review stats
    try {
      await updateUserReviewStats(existing.revieweeId);
    } catch (statsError) {
      logger.error(
        "Failed to update review stats during deletion:",
        statsError
      );
      // Continue - the review was deleted successfully
    }

    logger.info(`Review ${id} deleted by user ${userId}`);
    return deleted;
  } catch (error) {
    logger.error(`Error deleting review ${id}:`, error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(`Failed to delete review: ${error.message}`, 500, {
      originalError: error.message,
    });
  }
};

// --------------------------------------------
// GET ALL REVIEWS FOR A USER
// --------------------------------------------
export const getReviewsForUser = async (userId, page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      throw new AppError(
        "Invalid pagination parameters. Page must be >= 1, limit between 1-100",
        400
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new AppError("User not found", 404);

    const reviewsData = await db
      .select()
      .from(reviews)
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    const result = {
      userId: user.id,
      name: user.name,
      positive: user.positiveCount,
      neutral: user.neutralCount,
      negative: user.negativeCount,
      total: user.positiveCount + user.neutralCount + user.negativeCount,
      page,
      limit,
      data: reviewsData,
    };

    logger.info(
      `Retrieved ${reviewsData.length} reviews for user ${userId}, page ${page}`
    );
    return result;
  } catch (error) {
    logger.error(`Error getting reviews for user ${userId}:`, error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(`Failed to retrieve reviews: ${error.message}`, 500, {
      originalError: error.message,
    });
  }
};

// --------------------------------------------
// GET SINGLE REVIEW
// --------------------------------------------
export const getReviewById = async id => {
  try {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, id))
      .limit(1);

    if (!review) throw new AppError("Review not found", 404);

    logger.info(`Retrieved review ${id}`);
    return review;
  } catch (error) {
    logger.error(`Error getting review ${id}:`, error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(`Failed to retrieve review: ${error.message}`, 500, {
      originalError: error.message,
    });
  }
};
