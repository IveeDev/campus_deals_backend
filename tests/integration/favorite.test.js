import { db } from "#config/database.js";
import { users } from "#src/models/user.model.js";
import { listings } from "#src/models/listing.model.js";
import { campuses } from "#src/models/campus.model.js";
import { categories } from "#src/models/category.model.js";
import { favorites } from "#src/models/favorite.model.js";
import {
  createResetDB,
  createTestServer,
  createAuthClients,
} from "./testUtils.js";

const resetDB = createResetDB([
  "favorites",
  "listing_images",
  "listings",
  "categories",
  "campuses",
  "users",
]);

const getServer = createTestServer(resetDB);
const { user, anon } = createAuthClients(getServer);

beforeEach(async () => {
  await resetDB();

  await db.insert(users).values([
    {
      name: "User One",
      email: "user1@example.com",
      password: "hashed",
      role: "user",
      phone: "0000000000",
    },
    {
      name: "User Two",
      email: "user2@example.com",
      password: "hashed",
      role: "user",
      phone: "1111111111",
    },
  ]);

  const [campus] = await db
    .insert(campuses)
    .values({ name: "Main Campus", slug: "main-campus" })
    .returning();

  const [category] = await db
    .insert(categories)
    .values({ name: "Electronics", slug: "electronics" })
    .returning();

  await db.insert(listings).values({
    title: "Laptop",
    description: "Good laptop",
    price: 500,
    condition: "used",
    sellerId: 1,
    categoryId: category.id,
    campusId: campus.id,
  });
});

describe("Favorites endpoints", () => {
  describe("POST /favorites/:listingId", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.post("/api/v1/favorites/1");
      expect(res.status).toBe(401);
    });

    it("returns 400 when listing id is invalid", async () => {
      const res = await user.post("/api/v1/favorites/abc");
      expect(res.status).toBe(400);
    });

    it("returns 404 when listing does not exist", async () => {
      const res = await user.post("/api/v1/favorites/999");
      expect(res.status).toBe(404);
      expect(res.body.message || res.body.error).toMatch(/listing not found/i);
    });

    it("adds listing to favorites", async () => {
      const res = await user.post("/api/v1/favorites/1");
      expect(res.status).toBe(201);
      expect(res.body.result.data).toBeDefined();

      const rows = await db.select().from(favorites);
      expect(rows.length).toBe(1);
      expect(rows[0].listingId).toBe(1);
    });

    it("returns 400 when listing is already in favorites", async () => {
      await user.post("/api/v1/favorites/1");
      const res = await user.post("/api/v1/favorites/1");

      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error).toMatch(
        /already in favorites/i
      );
    });
  });

  describe("GET /favorites", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.get("/api/v1/favorites");
      expect(res.status).toBe(401);
    });

    it("returns user favorites", async () => {
      await user.post("/api/v1/favorites/1");

      const res = await user.get("/api/v1/favorites");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.result.data)).toBe(true);
      expect(res.body.result.data.length).toBe(1);
      expect(res.body.result.data[0].title).toBe("Laptop");
    });
  });

  describe("DELETE /favorites/:listingId", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.delete("/api/v1/favorites/1");
      expect(res.status).toBe(401);
    });

    it("returns 404 when favorite does not exist", async () => {
      const res = await user.delete("/api/v1/favorites/1");
      expect(res.status).toBe(404);
    });

    it("removes listing from favorites", async () => {
      await user.post("/api/v1/favorites/1");

      const res = await user.delete("/api/v1/favorites/1");
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/removed from favorites/i);

      const rows = await db.select().from(favorites);
      expect(rows.length).toBe(0);
    });
  });
});
