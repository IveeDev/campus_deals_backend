import logger from "#config/logger.js";
import { jwttoken } from "#utils/jwt.js";

export const authenticateToken = (req, res, next) => {
  try {
    let token = req.cookies.token;

    // Support Authorization header for mobile apps or API calls
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        error: "Authentication required",
        message: "No access token provided",
      });
    }

    const decoded = jwttoken.verify(token);
    req.user = decoded;

    logger.info(`✅ User authenticated: ${decoded.email} (${decoded.role})`);
    next();
  } catch (error) {
    logger.error("❌ Authentication error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired",
        message: "Please log in again",
      });
    }

    return res.status(401).json({
      error: "Authentication failed",
      message: "Invalid or expired token",
    });
  }
};

export const requireRole = allowedRoles => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: "Authentication required",
          message: "User not authenticated",
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(
          `🚫 Access denied for ${req.user.email} (${req.user.role}). Required: ${allowedRoles.join(", ")}`
        );
        return res.status(403).json({
          error: "Access denied",
          message: "Insufficient permissions",
        });
      }

      next();
    } catch (error) {
      logger.error("Role verification error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: "Error during role verification",
      });
    }
  };
};
