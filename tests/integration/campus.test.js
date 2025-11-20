import request from "supertest";
import app from "#src/app.js";
import { db } from "#config/database.js";
import { campuses } from "#src/models/campus.model.js";
import { createTestToken } from "#src/utils/testToken.js";

let server;

const token = createTestToken(1, "admin");
const userToken = createTestToken(2, "user");

// Utility: clean DB
const resetDB = async () => {
  await db.execute(
    `TRUNCATE TABLE campuses, users, listings RESTART IDENTITY CASCADE`
  );
};

// Utility: extract result.data
const bodyData = res => res.body?.result?.data;

beforeAll(() => {
  server = app.listen(0);
});

afterAll(async () => {
  await resetDB();
  server.close();
});

beforeEach(async () => {
  await resetDB();

  await db.insert(campuses).values([
    { name: "Campus A", slug: "campus-a", lat: 12.345678, lon: 98.765432 },
    { name: "Campus B", slug: "campus-b", lat: 23.456789, lon: 87.654321 },
  ]);
});

describe("/api/v1/campuses", () => {
  describe("GET /", () => {
    it("returns all campuses", async () => {
      const res = await request(server)
        .get("/api/v1/campuses")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const data = bodyData(res);

      expect(data.length).toBe(2);
      expect(data.map(c => c.name)).toEqual(
        expect.arrayContaining(["Campus A", "Campus B"])
      );
    });
  });

  describe("GET /:id", () => {
    it("returns a campus when id exists", async () => {
      const [{ id }] = await db.select().from(campuses).limit(1);

      const res = await request(server)
        .get(`/api/v1/campuses/${id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const campus = bodyData(res);

      expect(campus).toMatchObject({
        id,
        name: "Campus A",
        slug: "campus-a",
      });

      expect(Number(campus.lat)).toBeCloseTo(12.345678);
    });

    it("returns 404 when campus not found", async () => {
      const res = await request(server)
        .get(`/api/v1/campuses/999`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("returns 400 for invalid id", async () => {
      const res = await request(server)
        .get(`/api/v1/campuses/abc`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /", () => {
    it("should return 401 when no token is provided", async () => {
      const res = await request(server)
        .post("/api/v1/campuses")
        .send({ name: "University of Benin" });

      expect(res.status).toBe(401);
    });

    it("should return 400 when request body is invalid", async () => {
      const res = await request(server)
        .post("/api/v1/campuses")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should return 403 when a non-admin user tries to create a campus", async () => {
      const res = await request(server)
        .post("/api/v1/campuses")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Campus Z" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient permissions/i);
    });

    it("creates a campus with valid token and data", async () => {
      const res = await request(server)
        .post("/api/v1/campuses")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Campus Z" });

      expect(res.status).toBe(201);
      expect(res.body.result.data.name).toBe("Campus Z");
    });
  });

  describe("DELETE /:id", () => {
    it("should return 401 when no token is provided", async () => {
      const res = await request(server).delete("/api/v1/campuses/1");
      expect(res.status).toBe(401);
    });

    it("should return 403 when a non-admin user tries to delete a campus", async () => {
      const res = await request(server)
        .delete("/api/v1/campuses/1")
        .set("Authorization", `Bearer ${userToken}`);
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient permissions/i);
    });

    it("should return 404 if campus does not exist", async () => {
      const res = await request(server)
        .delete("/api/v1/campuses/999")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    it("should delete campus when admin token is provided and campus exists", async () => {
      // First, create a campus to delete
      const createRes = await request(server)
        .post("/api/v1/campuses")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Campus To Delete" });
      const campusId = createRes.body.result.data.id;

      // Delete it
      const deleteRes = await request(server)
        .delete(`/api/v1/campuses/${campusId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.message).toMatch(/deleted successfully/i);
    });
  });

  describe("PUT /:id", () => {
    it("should return 401 when no token is provided", async () => {
      const res = await request(server)
        .put("/api/v1/campuses/1")
        .send({ name: "updated campus" });
      expect(res.status).toBe(401);
    });

    it("should return 403 when a non-admin user tries to update a campus", async () => {
      const createRes = await request(server)
        .post("/api/v1/campuses")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Campus X" });

      const campusId = createRes.body.result.data.id;

      const res = await request(server)
        .put(`/api/v1/campuses/${campusId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({ name: "Updated Campus" });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Insufficient permissions/i);
    });

    it("should return 404 if campus does not exist", async () => {
      const res = await request(server)
        .put("/api/v1/campuses/999")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Updated Campus" });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Campus not found/i);
    });

    it("should update campus when admin token is provided and data is valid", async () => {
      // First, create a campus to update
      const createRes = await request(server)
        .post("/api/v1/campuses")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Campus To Update" });
      const campusId = createRes.body.result.data.id;

      // Update it
      const updateRes = await request(server)
        .put(`/api/v1/campuses/${campusId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "Campus Updated" });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.result.data.name).toBe("Campus Updated");
    });
  });
});
