import { ilike, or, asc, desc } from "drizzle-orm";
import { categories } from "#models/category.model.js";

export function buildCategoryWhereConditions(search, filters) {
  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(categories.name, `%${search}%`),
        ilike(categories.slug, `%${search}%`)
      )
    );
  }
  if (filters.name)
    conditions.push(ilike(categories.name, `%${filters.name}%`));
  if (filters.slug)
    conditions.push(ilike(categories.slug, `%${filters.slug}%`));
  return conditions;
}

export function buildCategoryOrderBy(sortBy, order) {
  const sortField = categories[sortBy] || categories.createdAt;
  return order === "asc" ? asc(sortField) : desc(sortField);
}
