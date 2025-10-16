import { fetchAllUsers } from "#src/controllers/user.controller.js";
import express from "express";

const router = express.Router();

// GET /users - Get all users (admin only)
router.get("/", fetchAllUsers);

// GET /users/:id - Get user by ID (authenticated users only)
// router.get("/:id");

// PUT /users/:id - Update user by ID (authenticated users can update own profile, admin can update any)
// router.put("/:id");

// DELETE /users/:id - Delete user by ID (admin only)
// router.delete("/:id");

export default router;
