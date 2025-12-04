import * as reviewService from "#services/review.service.js";
import { formatValidationError } from "#src/utils/format.js";
import { AppError } from "#src/utils/AppError.js";
import {
  createReviewSchema,
  reviewIdSchema,
  updateReviewSchema,
} from "#src/validations/review.validation.js";

// ----------------------------------------
// CREATE REVIEW
// ----------------------------------------
export const createReview = async (req, res, next) => {
  try {
    const validationResult = createReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        "Invalid review data",
        400,
        formatValidationError(validationResult.error)
      );
    }

    const reviewerId = req.user.id;
    const revieweeId = Number(req.params.userId);

    if (reviewerId === revieweeId)
      throw new AppError("You cannot review yourself", 400);

    const { review, rating } = validationResult.data;

    const newReview = await reviewService.createReview({
      reviewerId,
      revieweeId,
      review,
      rating,
    });

    res.status(201).json({
      message: "Review created successfully",
      result: { data: newReview },
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------
// GET REVIEWS FOR USER
// ----------------------------------------
export const getReviewsForUser = async (req, res, next) => {
  try {
    const userId = Number(req.params.userId);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const data = await reviewService.getReviewsForUser(userId, page, limit);

    res
      .status(200)
      .json({ message: "Reviews retrieved successfully", result: data });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------
// GET SINGLE REVIEW
// ----------------------------------------
export const getReviewById = async (req, res, next) => {
  try {
    const idResult = reviewIdSchema.safeParse(req.params);
    if (!idResult.success) {
      throw new AppError(
        "Invalid review ID",
        400,
        formatValidationError(idResult.error)
      );
    }

    const review = await reviewService.getReviewById(idResult.data.id);

    res.status(200).json({
      message: "Review retrieved successfully",
      result: {
        data: review,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------
// UPDATE REVIEW
// ----------------------------------------
export const updateReview = async (req, res, next) => {
  try {
    const idResult = reviewIdSchema.safeParse(req.params);
    if (!idResult.success) {
      throw new AppError(
        "Invalid review ID",
        400,
        formatValidationError(idResult.error)
      );
    }

    const validationResult = updateReviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        "Invalid review data",
        400,
        formatValidationError(validationResult.error)
      );
    }

    const updatedReview = await reviewService.updateReview(
      idResult.data.id,
      req.user.id, // reviewer must be logged-in user
      validationResult.data
    );

    res.status(200).json({
      message: "Review updated successfully",
      result: updatedReview,
    });
  } catch (error) {
    next(error);
  }
};

// ----------------------------------------
// DELETE REVIEW
// ----------------------------------------
export const deleteReview = async (req, res, next) => {
  try {
    const idResult = reviewIdSchema.safeParse(req.params);
    if (!idResult.success) {
      throw new AppError(
        "Invalid review ID",
        400,
        formatValidationError(idResult.error)
      );
    }

    const deleted = await reviewService.deleteReview(
      idResult.data.id,
      req.user.id
    );

    res.status(200).json({
      message: "Review deleted successfully",
      result: deleted,
    });
  } catch (error) {
    next(error);
  }
};
