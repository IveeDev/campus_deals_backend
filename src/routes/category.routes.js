import express from "express";
import {
  createCategory,
  fetchAllCategories,
  fetchCategoryById,
  fetchCategoryBySlug,
  deleteCategoryById,
  updateCategoryById,
} from "#src/controllers/category.controller.js";
import { authenticateToken, requireRole } from "#middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, fetchAllCategories);
router.get("/slug/:slug", authenticateToken, fetchCategoryBySlug);
router.get("/:id", authenticateToken, fetchCategoryById);
router.post("/", authenticateToken, requireRole(["admin"]), createCategory);

router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  updateCategoryById
);
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  deleteCategoryById
);

export default router;
