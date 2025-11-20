import logger from "#src/config/logger.js";
import { AppError } from "#src/utils/AppError.js";
import { formatValidationError } from "#src/utils/format.js";

export const deleteOne = ({ schema, service, resourceName }) => {
  return async (req, res, next) => {
    try {
      const validationResult = schema.safeParse({ id: req.params.id });
      if (!validationResult.success)
        throw new AppError(
          `Invalid ${resourceName} ID`,
          400,
          formatValidationError(validationResult.error)
        );

      const { id } = validationResult.data;
      const deletedResource = await service(id);

      if (!deletedResource)
        throw new AppError(`${resourceName} not found`, 404);

      logger.info(
        `${resourceName} ${deletedResource.name} deleted successfully`
      );

      res.status(200).json({
        message: `${resourceName} deleted successfully`,
        result: {
          data: deletedResource,
        },
      });
    } catch (error) {
      logger.error(`Error deleting ${resourceName}: ${error.message}`);

      next(error);
    }
  };
};

export const updateOne = ({
  idSchema,
  updateSchema,
  service,
  resourceName,
}) => {
  return async (req, res, next) => {
    try {
      logger.info(`Updating ${resourceName} by ID: ${req.params.id}`);
      const idValidation = idSchema.safeParse({ id: req.params.id });
      if (!idValidation.success)
        throw new AppError(
          `Invalid ${resourceName} ID`,
          400,
          formatValidationError(idValidation.error)
        );
      const { id } = idValidation.data;

      const updateValidation = updateSchema.safeParse(req.body);
      if (!updateValidation.success)
        throw new AppError(
          `Invalid ${resourceName} data`,
          400,
          formatValidationError(updateValidation.error)
        );

      const updatedResource = await service(id, updateValidation.data);

      if (!updatedResource) {
        return res.status(404).json({ error: `${resourceName} not found` });
      }

      logger.info(`${resourceName} ${id} updated successfully`);
      res.status(200).json({
        message: `${resourceName} updated successfully`,
        result: {
          data: updatedResource,
        },
      });
    } catch (error) {
      logger.error(`Error updating ${resourceName}: ${error.message}`);
      if (error.message === `${resourceName} not found`) {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  };
};

export const getOne = ({ schema, service, resourceName }) => {
  return async (req, res, next) => {
    try {
      logger.info(`Fetching ${resourceName} by ID: ${req.params.id}`);

      const validationResult = schema.safeParse({ id: req.params.id });
      if (!validationResult.success) {
        throw new AppError(
          `Invalid ${resourceName} ID`,
          400,
          formatValidationError(validationResult.error)
        );
      }

      const { id } = validationResult.data;
      const resource = await service(id);

      if (!resource) {
        throw new AppError(`${resourceName} not found`, 404);
      }

      res.status(200).json({
        message: `${resourceName} retrieved successfully`,
        result: {
          data: resource,
        },
      });
    } catch (error) {
      logger.error(`Error fetching ${resourceName}: ${error.message}`);
      next(error);
    }
  };
};
// export const retrieveAll = { schema, service, resourceName };
export const getSlug = ({ service, resourceName }) => {
  return async (req, res, next) => {
    try {
      logger.info(`Fetching ${resourceName} by SLUG: ${req.params.slug}`);

      const { slug } = req.params;
      const resource = await service(slug);

      if (!resource) {
        throw new AppError(`${resourceName} not found`, 404);
      }

      res.status(200).json({
        message: `${resourceName} retrieved successfully`,
        result: {
          data: resource,
        },
      });
    } catch (error) {
      logger.error(`Error fetching ${resourceName}: ${error.message}`);

      next(error);
    }
  };
};

export const createOne = ({ schema, service, resourceName }) => {
  return async (req, res, next) => {
    try {
      logger.info(`Creating ${resourceName}`);
      const validationResult = schema.safeParse(req.body);

      if (!validationResult.success) {
        throw new AppError(
          `Invalid ${resourceName} data`,
          400,
          formatValidationError(validationResult.error)
        );
      }

      const resource = await service(validationResult.data);
      res.status(201).json({
        message: `${resourceName} created successfully!`,
        result: {
          data: resource,
        },
      });
    } catch (error) {
      logger.error(`Error creating ${resourceName}: ${error.message}`);
      next(error);
    }
  };
};

export const getAll = ({ service, resourceName }) => {
  return async (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    try {
      const { page, limit, sortBy, order, search, ...filters } = req.query;

      const result = await service({
        page,
        limit,
        sortBy,
        order,
        search,
        filters,
      });

      logger.info(`[${requestId}] ${resourceName} fetched successfully`, {
        duration: `${Date.now() - startTime}ms`,
        count: result.data.length,
      });

      res.status(200).json({
        message: `${resourceName} fetched successfully`,
        result,
      });
    } catch (error) {
      logger.error(
        `[${requestId}] Error fetching ${resourceName}:`,
        error.message
      );
      next(error);
    }
  };
};
