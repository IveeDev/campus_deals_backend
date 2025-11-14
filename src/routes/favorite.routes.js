import express from "express";
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
} from "#controllers/favorite.controller.js";
import { authenticateToken } from "#middleware/auth.middleware.js";

const router = express.Router();

// Simplified endpoints - user ID comes from auth token
router.post("/favorites/:listingId", authenticateToken, addFavorite);
router.delete("/favorites/:listingId", authenticateToken, removeFavorite);
router.get("/favorites", authenticateToken, getUserFavorites);

export default router;
