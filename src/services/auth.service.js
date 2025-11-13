import logger from "#src/config/logger.js";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "#config/database.js";
import { users } from "#models/user.model.js";
import { AppError } from "#src/utils/AppError.js";

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    logger.error(`Error hashing the password: ${error}`);
    throw new Error("Error hashing");
  }
};

export const comparePassword = async (password, hashPassword) => {
  try {
    return await bcrypt.compare(password, hashPassword);
  } catch (error) {
    logger.error(`Error comparing password: ${error}`);
    throw new Error("Error comparing password");
  }
};

export const authenticateUser = async ({ email, password }) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) throw new AppError("User not found", 404);

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) throw new AppError("Invalid credentials", 401);

    logger.info(`User ${user.email} authenticated successfully!`);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      is_verified: user.is_verified,
      createdAt: user.createdAt,
    };
  } catch (error) {
    logger.error(`Error authenticating user: ${error}`);
    throw error;
  }
};

export const createUser = async ({ name, email, password, phone }) => {
  try {
    const password_hash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({ name, email, phone, password: password_hash })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        is_verified: users.is_verified,
        createdAt: users.createdAt,
      });

    logger.info(`✅ User ${newUser.email} created successfully!`);
    return newUser;
  } catch (error) {
    const code = error.code || error.cause?.code;

    if (code === "23505") {
      throw new AppError(
        `Email ${email} already exists. Please use another email.`,
        409
      );
    }

    // Other errors
    throw new AppError(error.message || "Internal server error", 500);
  }
};
