import express from "express";
import {
  createReview,
  getReviewsForUser,
  getReviewById,
  updateReview,
  deleteReview,
} from "#src/controllers/review.controller.js";
import { authenticateToken } from "#middleware/auth.middleware.js";

const router = express.Router();

// Create a review for a user (seller)
router.post("/users/:userId/reviews", authenticateToken, createReview);

// Get all reviews for a user (seller)
router.get("/users/:userId/reviews", authenticateToken, getReviewsForUser);

// Get a single review by ID
router.get("/reviews/:id", getReviewById);

// Update a review (only by reviewer)
router.put("/reviews/:id", authenticateToken, updateReview);

// Delete a review (only by reviewer)
router.delete("/reviews/:id", authenticateToken, deleteReview);

export default router;
