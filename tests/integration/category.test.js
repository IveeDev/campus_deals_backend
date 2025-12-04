import { db } from "#config/database.js";
import { categories } from "#src/models/category.model.js";
import {
  createResetDB,
  createTestServer,
  bodyData,
  createAuthClients,
} from "./testUtils.js";

// Shared DB reset for this suite
const resetDB = createResetDB(["categories", "listings"]);

// Shared server lifecycle for this suite
const getServer = createTestServer(resetDB);
const { admin, user, anon } = createAuthClients(getServer);

beforeEach(async () => {
  await resetDB();

  await db.insert(categories).values([
    {
      name: "Electronics",
      slug: "electronics",
      description: "Gadgets and devices",
    },
    {
      name: "Books",
      slug: "books",
      description: "Academic and non-academic books",
    },
  ]);
});

describe("/api/v1/categories", () => {
  describe("GET /", () => {
    it("returns 401 when no token is provided", async () => {
      const res = await anon.get("/api/v1/categories");
      expect(res.status).toBe(401);
    });

    it("returns all categories for authenticated user", async () => {
      const res = await admin.get("/api/v1/categories");

      expect(res.status).toBe(200);

      const data = bodyData(res);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data.map(c => c.name)).toEqual(
        expect.arrayContaining(["Electronics", "Books"])
      );
    });
  });

  describe("GET /:id", () => {
    it("returns a category when id exists", async () => {
      const [{ id }] = await db.select().from(categories).limit(1);

      const res = await admin.get(`/api/v1/categories/${id}`);

      expect(res.status).toBe(200);

      const category = bodyData(res);
      expect(category).toMatchObject({
        id,
        name: "Electronics",
        slug: "electronics",
      });
    });

    it("returns 404 when category not found", async () => {
      const res = await admin.get("/api/v1/categories/999");

      expect(res.status).toBe(404);
      expect(res.body.message || res.body.error).toMatch(/not found/i);
    });

    it("returns 400 for invalid id", async () => {
      const res = await admin.get("/api/v1/categories/abc");

      expect(res.status).toBe(400);
    });
  });

  describe("GET /slug/:slug", () => {
    it("returns a category when slug exists", async () => {
      const res = await admin.get("/api/v1/categories/slug/electronics");

      expect(res.status).toBe(200);

      const category = bodyData(res);
      expect(category).toMatchObject({
        slug: "electronics",
        name: "Electronics",
      });
    });

    it("returns 404 when category slug not found", async () => {
      const res = await admin.get("/api/v1/categories/slug/unknown-slug");

      expect(res.status).toBe(404);
      expect(res.body.message || res.body.error).toMatch(/not found/i);
    });
  });

  describe("POST /", () => {
    it("returns 401 when no token is provided", async () => {
      const res = await anon
        .post("/api/v1/categories")
        .send({ name: "Fashion", description: "Clothes and accessories" });

      expect(res.status).toBe(401);
    });

    it("returns 403 when non-admin tries to create category", async () => {
      const res = await user
        .post("/api/v1/categories")
        .send({ name: "Fashion", description: "Clothes and accessories" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient permissions/i);
    });

    it("returns 400 when body is invalid", async () => {
      const res = await admin.post("/api/v1/categories").send({});

      expect(res.status).toBe(400);
    });

    it("creates a category with valid data and admin token", async () => {
      const res = await admin.post("/api/v1/categories").send({
        name: "Fashion",
        description: "Clothes and accessories",
      });

      expect(res.status).toBe(201);
      expect(res.body.result.data.name).toBe("Fashion");
      expect(res.body.result.data.slug).toBe("fashion");
    });
  });

  describe("PUT /:id", () => {
    it("returns 401 when no token is provided", async () => {
      const res = await anon
        .put("/api/v1/categories/1")
        .send({ name: "Updated" });

      expect(res.status).toBe(401);
    });

    it("returns 403 when non-admin tries to update category", async () => {
      const [{ id }] = await db.select().from(categories).limit(1);

      const res = await user
        .put(`/api/v1/categories/${id}`)
        .send({ name: "Updated" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient permissions/i);
    });

    it("returns 404 when category does not exist", async () => {
      const res = await admin
        .put("/api/v1/categories/999")
        .send({ name: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body.error || res.body.message).toMatch(/Category not found/i);
    });

    it("updates category when admin token and valid data", async () => {
      const [{ id }] = await db.select().from(categories).limit(1);

      const res = await admin
        .put(`/api/v1/categories/${id}`)
        .send({ name: "Updated Electronics" });

      expect(res.status).toBe(200);
      expect(res.body.result.data.name).toBe("Updated Electronics");
      expect(res.body.result.data.slug).toBe("updated-electronics");
    });
  });

  describe("DELETE /:id", () => {
    it("returns 401 when no token is provided", async () => {
      const res = await anon.delete("/api/v1/categories/1");
      expect(res.status).toBe(401);
    });

    it("returns 403 when non-admin tries to delete category", async () => {
      const [{ id }] = await db.select().from(categories).limit(1);

      const res = await user.delete(`/api/v1/categories/${id}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient permissions/i);
    });

    it("returns 404 when category does not exist", async () => {
      const res = await admin.delete("/api/v1/categories/999");

      expect(res.status).toBe(404);
      expect(res.body.message || res.body.error).toMatch(/not found/i);
    });

    it("deletes category when admin token is provided and category exists", async () => {
      // First, create a category to delete
      const createRes = await admin.post("/api/v1/categories").send({
        name: "To Delete",
        description: "Temp category",
      });
      const categoryId = createRes.body.result.data.id;

      // Delete it
      const deleteRes = await admin.delete(`/api/v1/categories/${categoryId}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toMatch(/deleted successfully/i);
    });
  });
});
