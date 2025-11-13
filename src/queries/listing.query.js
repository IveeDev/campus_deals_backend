import { listings } from "#models/listing.model.js";
import { ilike, or, asc, desc, eq, gte, lte } from "drizzle-orm";

export function buildListingWhereConditions(search, filters) {
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(listings.title, `%${search}%`),
        ilike(listings.description, `%${search}%`)
      )
    );
  }

  if (filters.campusId)
    conditions.push(eq(listings.campusId, filters.campusId));

  if (filters.categoryId)
    conditions.push(eq(listings.categoryId, filters.categoryId));

  if (filters.condition)
    conditions.push(eq(listings.condition, filters.condition));

  if (filters.isAvailable !== undefined)
    conditions.push(eq(listings.isAvailable, filters.isAvailable));
  else conditions.push(eq(listings.isAvailable, true));

  if (filters.priceMin !== undefined)
    conditions.push(gte(listings.price, filters.priceMin));

  if (filters.priceMax !== undefined)
    conditions.push(lte(listings.price, filters.priceMax));

  return conditions;
}

export function buildListingOrderBy(sortBy, order) {
  const sortField = listings[sortBy] || listings.createdAt;
  return order === "asc" ? asc(sortField) : desc(sortField);
}
