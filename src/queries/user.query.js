import { ilike, or, asc, desc, eq } from "drizzle-orm";
import { users } from "#models/user.model.js";

export function buildUserWhereConditions(search, filters) {
  const conditions = [];

  // Search conditions
  if (search) {
    conditions.push(
      or(
        ilike(users.name, `%${search}%`),
        ilike(users.email, `%${search}%`),
        ilike(users.phone, `%${search}%`)
      )
    );
  }

  // Filter conditions
  if (filters.role) {
    conditions.push(eq(users.role, filters.role));
  }

  if (filters.is_verified !== undefined) {
    conditions.push(eq(users.is_verified, filters.is_verified));
  }

  return conditions;
}

export function buildUserOrderBy(sortBy, order) {
  const sortField = users[sortBy] || users.createdAt;
  return order === "asc" ? asc(sortField) : desc(sortField);
}
