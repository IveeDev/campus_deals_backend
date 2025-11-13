import { ilike, or, asc, desc } from "drizzle-orm";
import { campuses } from "#models/campus.model.js";

export function buildCampusWhereConditions(search, filters) {
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(campuses.name, `%${search}%`),
        ilike(campuses.slug, `%${search}%`)
      )
    );
  }
  if (filters.name) conditions.push(ilike(campuses.name, `%${filters.name}%`));
  if (filters.slug) conditions.push(ilike(campuses.slug, `%${filters.slug}%`));
  return conditions;
}

export function buildCampusOrderBy(sortBy, order) {
  const sortField = campuses[sortBy] || campuses.createdAt;
  return order === "asc" ? asc(sortField) : desc(sortField);
}
