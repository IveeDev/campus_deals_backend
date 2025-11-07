import logger from "#src/config/logger.js";
import * as campusService from "#src/services/campus.service.js";
import {
  campusIdSchema,
  createCampusSchema,
  updateCampusSchema,
} from "#src/validations/campus.validation.js";
import { formatValidationError } from "#utils/format.js";

export const addCampus = async (req, res, next) => {
  try {
    const validationResult = createCampusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const campus = await campusService.createCampus(validationResult.data);
    res.status(201).json({
      message: "Campus created successfully",
      data: campus,
    });
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({ error: error.message });
    }
    next(error);
  }
};

export const fetchAllCampuses = async (req, res, next) => {
  try {
    const { page, limit, sortBy, order, search, name, slug } = req.query;
    const result = await campusService.getAllCampuses({
      page,
      limit,
      sortBy,
      order,
      search,
      filters: { name, slug },
    });
    res.status(200).json({
      length: result.length,
      message: "Campuses fetched successfully",
      result,
    });
  } catch (error) {
    next(error);
  }
};

export const fetchCampusById = async (req, res, next) => {
  try {
    const validationResult = campusIdSchema.safeParse({ id: req.params.id });
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid campus ID",
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;
    const campus = await campusService.getCampusById(id);

    res.json({
      message: "Campus fetched successfully",
      data: campus,
    });
  } catch (error) {
    if (error.message === "Campus not found") {
      return res.status(404).json({ error: "Campus not found" });
    }
    next(error);
  }
};

export const fetchCampusBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const campus = await campusService.getCampusBySlug(slug);
    res
      .status(200)
      .json({ message: "Campus fetched successfully", data: campus });
  } catch (error) {
    if (error.message === "Campus not found") {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const deleteCampusById = async (req, res, next) => {
  try {
    logger.info(`Deleting campus by ID: ${req.params.id}`);
    const validationResult = campusIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid campus ID",
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admin can delete campuses",
      });
    }

    const deletedCampus = await campusService.deleteCampus(id);
    logger.info(`Campus ${deletedCampus.name} deleted successfully`);
    res.json({
      message: "Campus deleted successfully",
      campus: deletedCampus,
    });
  } catch (error) {
    logger.error(`Error deleting campus: ${error.message}`);
    if (error.message === "Campus not found") {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const updateCampusById = async (req, res, next) => {
  try {
    logger.info(`Updating user by ID: ${req.params.id}`);
    const idValidationResult = campusIdSchema.safeParse({ id: req.params.id });

    if (!idValidationResult.success) {
      return res.status(400).json({
        error: "Invalid campus ID",
        details: formatValidationError(idValidationResult.error),
      });
    }

    const updateValidationResult = updateCampusSchema.safeParse(req.body);
    if (!updateValidationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(updateValidationResult.error),
      });
    }

    const { id } = idValidationResult.data;
    const updates = updateValidationResult.data;

    // Authorization checks
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Only admin can update campuses",
      });
    }

    const updatedCampus = await campusService.updateCampus(id, updates);
    logger.info(`Campus ${updatedCampus.email} updated successfully`);
    res.status(200).json({
      message: "Campus updated successfully",
      data: updatedCampus,
    });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    if (error.message === "Campus not found") {
      return res.status(404).json({ error: "Campus not found" });
    }

    next(error);
  }
};
