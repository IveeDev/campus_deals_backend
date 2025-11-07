import express from "express";
import {
  fetchAllCampuses,
  fetchCampusById,
  fetchCampusBySlug,
  addCampus,
  deleteCampusById,
  updateCampusById,
} from "#src/controllers/campus.controller.js";
import { authenticateToken, requireRole } from "#middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, fetchAllCampuses);
router.get("/slug/:slug", authenticateToken, fetchCampusBySlug);
router.get("/:id", authenticateToken, fetchCampusById);
router.post("/", authenticateToken, requireRole(["admin"]), addCampus);
router.put("/:id", authenticateToken, requireRole(["admin"]), updateCampusById);
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  deleteCampusById
);

export default router;
