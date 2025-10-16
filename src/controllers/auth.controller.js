import logger from "#config/logger.js";
import {
  signUpSchema,
  signInSchema,
} from "#src/validations/auth.validation.js";
import { authenticateUser, createUser } from "#src/services/auth.service.js";
import { cookies } from "#utils/cookies.js";
import { formatValidationError } from "#utils/format.js";
import { jwttoken } from "#utils/jwt.js";

export const signUp = async (req, res, next) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }
    const { name, email, password, phone } = validationResult.data;

    // AUTH SERVICE

    const user = await createUser({ name, email, password, phone });
    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      phone: user.phone,
    });

    cookies.set(res, "token", token);
    logger.info(`User registered successfully: ${email}`);
    res.status(201).json({
      message: "User registered",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_verified: user.is_verified,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    logger.error("Sign up error", error);

    if (error.message === "User with this email already exists") {
      return res.status(409).json({ error: "Email already exists" });
    }
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    // AUTH SERVICE
    const user = await authenticateUser({ email, password });
    const token = jwttoken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      phone: user.phone,
    });
    cookies.set(res, "token", token);
    res.status(200).json({
      message: "User signed in successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        phone: user.phone,
      },
      token,
    });
  } catch (error) {
    logger.error("Signin error", error.message);

    if (error.message === "User not found")
      return res.status(404).json({ error: "User not found" });

    if (error.message === "Invalid password")
      return res.status(401).json({ error: "Invalid credentials" });

    next(error);
  }
};

export const signOut = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token || req.headers?.authorization?.replace("Bearer ", "");

    let user = null;

    if (token) {
      try {
        user = jwttoken.verify(token); // or jwttoken.decode() if you don’t need to verify signature
      } catch (error) {
        logger.warn("Invalid or expired token during signout", error.message);
      }
    }

    cookies.clear(res, "token");

    if (user) {
      logger.info(
        `User ${user.email} (ID: ${user.id}) signed out successfully`
      );
      res.status(200).json({
        message: "User signed out successfully",
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
        },
      });
    } else {
      logger.info("User signed out successfully (no token found)");
      res.status(200).json({
        message: "User signed out successfully",
      });
    }
  } catch (error) {
    logger.error("Signout error", error.message);
    next(error);
  }
};
