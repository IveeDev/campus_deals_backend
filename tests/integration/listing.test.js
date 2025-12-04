import { db } from "#config/database.js";
import { listings } from "#src/models/listing.model.js";
import { listingImages } from "#src/models/listing_image.model.js";
import { campuses } from "#src/models/campus.model.js";
import { categories } from "#src/models/category.model.js";
import { users } from "#src/models/user.model.js";
import { eq } from "drizzle-orm";
import {
  createResetDB,
  createTestServer,
  createAuthClients,
} from "./testUtils.js";

// Reset all tables that participate in listing FKs
const resetDB = createResetDB([
  "listing_images",
  "listings",
  "favorites",
  "reviews",
  "messages",
  "categories",
  "campuses",
  "users",
]);

const getServer = createTestServer(resetDB);
const { admin, user, anon } = createAuthClients(getServer);

beforeEach(async () => {
  await resetDB();

  // Seed users (IDs will be 1 and 2 due to RESTART IDENTITY)
  await db.insert(users).values([
    {
      name: "Admin User",
      email: "admin@example.com",
      password: "hashed",
      role: "admin",
      phone: "0000000000",
    },
    {
      name: "Normal User",
      email: "user@example.com",
      password: "hashed",
      role: "user",
      phone: "1111111111",
    },
  ]);

  // Seed a campus and category
  const [campus] = await db
    .insert(campuses)
    .values({ name: "Main Campus", slug: "main-campus" })
    .returning();

  const [category] = await db
    .insert(categories)
    .values({
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets and devices",
    })
    .returning();

  // Seed two listings
  const [listing1] = await db
    .insert(listings)
    .values({
      title: "MacBook Pro",
      description: "Powerful laptop for school work",
      price: 1500,
      condition: "brand_new",
      sellerId: 1,
      categoryId: category.id,
      campusId: campus.id,
    })
    .returning();

  // Seed images for listing1 only
  await db.insert(listingImages).values([
    {
      listingId: listing1.id,
      url: "http://example.com/macbook.jpg",
      publicId: "macbook-1",
    },
  ]);
});

describe("/api/v1/listings", () => {
  describe("GET /", () => {
    it("returns paginated listings publicly", async () => {
      const res = await anon.get("/api/v1/listings");

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(Array.isArray(res.body.result.data)).toBe(true);
      expect(res.body.result.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("GET /:id", () => {
    it("returns a listing by id with images", async () => {
      const [row] = await db.select().from(listings).limit(1);

      const res = await anon.get(`/api/v1/listings/${row.id}`);

      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      const listing = res.body.result.data;

      expect(listing.id).toBe(row.id);
      expect(listing.title).toBe("MacBook Pro");
      expect(Array.isArray(listing.images)).toBe(true);
      expect(listing.images.length).toBe(1);
    });

    it("returns 404 when listing not found", async () => {
      const res = await anon.get("/api/v1/listings/999");
      expect(res.status).toBe(404);
      expect(res.body.error || res.body.message).toMatch(/listing not found/i);
    });

    it("returns 400 for invalid id", async () => {
      const res = await anon.get("/api/v1/listings/abc");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /", () => {
    const validPayload = {
      title: "Headphones",
      description: "Noise cancelling",
      price: "99",
      categoryId: "1",
      campusId: "1",
      condition: "used",
    };

    it("returns 401 when not authenticated", async () => {
      const res = await anon.post("/api/v1/listings").send(validPayload);
      expect(res.status).toBe(401);
    });

    it("returns 400 when body is invalid", async () => {
      const res = await admin.post("/api/v1/listings").send({});
      expect(res.status).toBe(400);
    });

    it("creates listing when body is valid and images are provided", async () => {
      const res = await admin.post("/api/v1/listings").send(validPayload);
      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe("Headphones");
      expect(Array.isArray(res.body.data.images)).toBe(true);
      expect(res.body.data.images.length).toBe(1);
    });
  });

  describe("DELETE /:id (soft delete)", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.delete("/api/v1/listings/1");
      expect(res.status).toBe(401);
    });

    it("returns 403 when non-owner tries to delete listing", async () => {
      // listing with sellerId = 1 exists, user client has id = 2
      const [row] = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, 1))
        .limit(1);
      const id = row.id;

      const res = await user.delete(`/api/v1/listings/${id}`);
      expect(res.status).toBe(403);
      expect(res.body.message || res.body.error).toMatch(/unauthorized/i);
    });

    it("returns 404 when listing does not exist", async () => {
      const res = await admin.delete("/api/v1/listings/999");
      expect(res.status).toBe(404);
    });

    it("soft deletes listing for owner", async () => {
      const [row] = await db
        .select()
        .from(listings)
        .where(eq(listings.sellerId, 1))
        .limit(1);
      const id = row.id;

      const res = await admin.delete(`/api/v1/listings/${id}`);
      expect(res.status).toBe(200);

      const [dbListing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, id))
        .limit(1);

      expect(dbListing.isAvailable).toBe(false);
    });
  });

  describe("PATCH /:id", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon
        .patch("/api/v1/listings/1")
        .send({ title: "Updated" });
      expect(res.status).toBe(401);
    });

    it("returns 403 when non-owner tries to update listing", async () => {
      const [row] = await db.select().from(listings).limit(1); // sellerId = 1

      const res = await user
        .patch(`/api/v1/listings/${row.id}`)
        .send({ title: "Hacked" });

      expect(res.status).toBe(403);
      expect(res.body.message || res.body.error).toMatch(/unauthorized/i);
    });

    it("returns 404 when listing does not exist", async () => {
      const res = await admin
        .patch("/api/v1/listings/999")
        .send({ title: "Updated" });
      expect(res.status).toBe(404);
    });

    it("updates listing for owner", async () => {
      const [row] = await db.select().from(listings).limit(1); // sellerId = 1

      const res = await admin
        .patch(`/api/v1/listings/${row.id}`)
        .send({ title: "Updated MacBook" });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe("Updated MacBook");
    });
  });

  describe("GET /me", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.get("/api/v1/listings/me");
      expect(res.status).toBe(401);
    });

    it("returns listings for current user", async () => {
      const res = await admin.get("/api/v1/listings/me");
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data.data)).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /user/:userId", () => {
    it("returns 400 for invalid user id", async () => {
      const res = await admin.get("/api/v1/listings/user/abc");
      expect(res.status).toBe(400);
    });

    it("returns 404 when user does not exist", async () => {
      const res = await admin.get("/api/v1/listings/user/999");
      expect(res.status).toBe(404);
    });

    it("returns listings for a specific user", async () => {
      const res = await admin.get("/api/v1/listings/user/1");
      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(Array.isArray(res.body.result.data)).toBe(true);
      expect(res.body.result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /:id/related", () => {
    it("returns 400 for invalid listing id", async () => {
      const res = await admin.get("/api/v1/listings/abc/related");
      expect(res.status).toBe(400);
    });

    it("returns related listings for valid id", async () => {
      const [row] = await db.select().from(listings).limit(1);

      const res = await admin.get(`/api/v1/listings/${row.id}/related`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
