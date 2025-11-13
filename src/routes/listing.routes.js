import express from "express";
import {
  createListing,
  fetchListingById,
  fetchAllListings,
  updateListingById,
  softDeleteListingById,
  fetchMyListings,
  fetchListingsByUser,
  fetchRelatedListings,
} from "#controllers/listing.controller.js";
import { upload } from "#middleware/upload.middleware.js";
import { authenticateToken } from "#middleware/auth.middleware.js";

const router = express.Router();

router;
// /routes/listing.routes.js

router
  .get("/", fetchAllListings) // ✅ public
  .post("/", authenticateToken, upload.array("images", 5), createListing)
  .get("/me", authenticateToken, fetchMyListings)
  .get("/user/:userId", authenticateToken, fetchListingsByUser)
  .get("/:id/related", authenticateToken, fetchRelatedListings)
  .get("/:id", fetchListingById)
  .patch(
    "/:id",
    authenticateToken,
    upload.array("images", 5),
    updateListingById
  )
  .delete("/:id", authenticateToken, softDeleteListingById);

export default router;
