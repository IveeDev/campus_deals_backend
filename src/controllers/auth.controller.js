import logger from "#config/logger.js";
import {
  signUpSchema,
  signInSchema,
} from "#src/validations/auth.validation.js";
import { authenticateUser, createUser } from "#src/services/auth.service.js";
import { cookies } from "#utils/cookies.js";
import { formatValidationError } from "#utils/format.js";
import { jwttoken } from "#utils/jwt.js";
import { AppError } from "#src/utils/AppError.js";
import { catchAsync } from "#src/utils/catchAsync.js";

export const signUp = catchAsync(async (req, res) => {
  // 1️⃣ Validate input with Zod
  const validationResult = signUpSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new AppError(
      "Validation failed",
      400,
      formatValidationError(validationResult.error)
    );
  }

  const { name, email, password, phone } = validationResult.data;

  // 2️⃣ Create user
  let user;
  try {
    user = await createUser({ name, email, password, phone });
  } catch (error) {
    // Catch unique constraint / email duplicate
    const code = error.code || error.cause?.code || error?.originalError?.code;
    if (code === "23505") {
      throw new AppError(`Email ${email} already exists`, 409);
    }
    throw error; // Let other errors bubble up
  }

  // 3️⃣ Generate JWT
  const token = jwttoken.sign({
    id: Number(user.id),
    email: user.email,
    phone: user.phone,
  });

  // 4️⃣ Set cookie
  cookies.set(res, "token", token);

  // 5️⃣ Response
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
});

export const signIn = catchAsync(async (req, res) => {
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
    id: Number(user.id),
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
});

export const signOut = catchAsync(async (req, res, next) => {
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
    logger.info(`User ${user.email} (ID: ${user.id}) signed out successfully`);
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
});
