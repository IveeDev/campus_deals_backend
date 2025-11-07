import logger from "#src/config/logger.js";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "#src/services/user.service.js";
import { formatValidationError } from "#src/utils/format.js";
import {
  updateUserSchema,
  userIdSchema,
} from "#src/validations/user.validation.js";

export const fetchAllUsers = async (req, res, next) => {
  try {
    const { page, limit, sortBy, order, search, role, is_verified } = req.query;
    logger.info("Fetching all users...");
    const result = await getAllUsers({
      page,
      limit,
      sortBy,
      order,
      search,
      filters: { role, is_verified },
    });
    res.status(200).json({
      message: "Users fetched successfully",
      //   count: result.length,
      result,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/v1/users/:id
 */
export const fetchUserById = async (req, res, next) => {
  try {
    // Validate user ID
    const validationResult = userIdSchema.safeParse({ id: req.params.id });
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid user ID",
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    const user = await getUserById(id);

    res.json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No user ID found in token",
      });
    }

    const user = await getUserById(userId);
    res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    logger.info(`Updating user by ID: ${req.params.id}`);
    const idValidationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!idValidationResult.success) {
      return res.status(400).json({
        error: "Invalid user ID",
        details: formatValidationError(idValidationResult.error),
      });
    }

    // Validate the update data
    const updateValidationResult = updateUserSchema.safeParse(req.body);
    if (!updateValidationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(updateValidationResult.error),
      });
    }

    const { id } = idValidationResult.data;
    const updates = updateValidationResult.data;

    // Authorization checks
    if (!req.user) {
      res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to update user",
      });
    }

    // Allow users to update only their own information (except role)
    if (req.user.role !== "admin" && req.user.id !== id) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only update your own profile",
      });
    }

    // Only admin users can change roles

    if (req.user.role !== "admin") {
      if (updates.role !== undefined || updates.is_verified !== undefined) {
        return res.status(403).json({
          error: "Access denied",
          message: "Only admin users can change roles and verification status",
        });
      }
    }

    // Remove role from updates if non-admin user is trying to update their own profile
    if (req.user.role !== "admin") {
      delete updates.role;
      delete updates.is_verified;
    }

    const updatedUser = await updateUser(id, updates);
    logger.info(`User ${updatedUser.email} updated successfully`);
    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);

    if (error.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    if (error.message === "Email already exists") {
      return res.status(409).json({ error: "Email already exists" });
    }

    next(error);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    logger.info(`Deleting user by ID: ${req.params.id}`);

    const validationResult = userIdSchema.safeParse({ id: req.params.id });
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid user ID",
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    // Authorization check: only admin users can delete users
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admin users can delete users",
      });
    }

    // Only admin users can delete users (prevent self-deletion or user deletion by non-admins)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admin users can delete users",
      });
    }

    const deletedUser = await deleteUser(id);
    logger.info(`User ${deletedUser.email} deleted successfully`);
    res.json({
      message: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);

    if (error.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    next(error);
  }
};
