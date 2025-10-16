import logger from "#src/config/logger.js";
import { getAllUsers } from "#src/services/user.service.js";

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
      data: result,
    });
  } catch (error) {
    logger.error(error);
    next(error);
  }
};
