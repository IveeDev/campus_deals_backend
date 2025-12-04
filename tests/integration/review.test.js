import { db } from "#config/database.js";
import { users } from "#src/models/user.model.js";
import { reviews } from "#src/models/review.model.js";
import {
  createResetDB,
  createTestServer,
  createAuthClients,
} from "./testUtils.js";

const resetDB = createResetDB(["reviews", "users"]);
const getServer = createTestServer(resetDB);
const { admin, user, anon } = createAuthClients(getServer);

beforeEach(async () => {
  await resetDB();

  await db.insert(users).values([
    {
      id: 1,
      name: "Reviewer",
      email: "reviewer@example.com",
      password: "hashed",
      role: "user",
      phone: "0000000000",
    },
    {
      id: 2,
      name: "Seller",
      email: "seller@example.com",
      password: "hashed",
      role: "user",
      phone: "1111111111",
    },
  ]);
});

describe("Review endpoints", () => {
  describe("POST /users/:userId/reviews", () => {
    const payload = { review: "Great seller", rating: "positive" };

    it("returns 401 when not authenticated", async () => {
      const res = await anon.post("/api/v1/users/2/reviews").send(payload);
      expect(res.status).toBe(401);
    });

    it("returns 400 when body is invalid", async () => {
      const res = await user.post("/api/v1/users/2/reviews").send({});
      expect(res.status).toBe(400);
    });

    it("returns 400 when user tries to review self", async () => {
      const res = await admin.post("/api/v1/users/1/reviews").send(payload);
      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error).toMatch(
        /cannot review yourself/i
      );
    });

    it("creates review for another user", async () => {
      const res = await admin.post("/api/v1/users/2/reviews").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.result.data).toBeDefined();
      expect(res.body.result.data.revieweeId).toBe(2);
    });
  });

  describe("GET /users/:userId/reviews", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.get("/api/v1/users/2/reviews");
      expect(res.status).toBe(401);
    });

    it("returns 404 when user not found", async () => {
      const res = await admin.get("/api/v1/users/999/reviews");
      expect(res.status).toBe(404);
    });

    it("returns reviews for user", async () => {
      await admin
        .post("/api/v1/users/2/reviews")
        .send({ review: "Nice", rating: "positive" });

      const res = await admin.get("/api/v1/users/2/reviews");
      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(Array.isArray(res.body.result.data)).toBe(true);
      expect(res.body.result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("GET /reviews/:id", () => {
    it("returns 404 when review not found", async () => {
      const res = await anon.get("/api/v1/reviews/999");
      expect(res.status).toBe(404);
    });

    it("returns review when it exists", async () => {
      const [review] = await db
        .insert(reviews)
        .values({
          review: "Ok",
          reviewerId: 1,
          revieweeId: 2,
          rating: "neutral",
        })
        .returning();

      const res = await anon.get(`/api/v1/reviews/${review.id}`);
      expect(res.status).toBe(200);
      expect(res.body.result.data.id).toBe(review.id);
    });
  });

  describe("PUT /reviews/:id", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon
        .put("/api/v1/reviews/1")
        .send({ review: "Updated" });
      expect(res.status).toBe(401);
    });

    it("returns 403 when non-owner tries to update review", async () => {
      const [review] = await db
        .insert(reviews)
        .values({
          review: "Ok",
          reviewerId: 1,
          revieweeId: 2,
          rating: "neutral",
        })
        .returning();

      const res = await user
        .put(`/api/v1/reviews/${review.id}`)
        .send({ review: "Hacked" });

      expect(res.status).toBe(403);
    });

    it("updates review for owner", async () => {
      const [review] = await db
        .insert(reviews)
        .values({
          review: "Ok",
          reviewerId: 1,
          revieweeId: 2,
          rating: "neutral",
        })
        .returning();

      const res = await admin
        .put(`/api/v1/reviews/${review.id}`)
        .send({ review: "Better" });

      expect(res.status).toBe(200);
      expect(res.body.result.review).toBe("Better");
    });
  });

  describe("DELETE /reviews/:id", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.delete("/api/v1/reviews/1");
      expect(res.status).toBe(401);
    });

    it("returns 403 when non-owner tries to delete review", async () => {
      const [review] = await db
        .insert(reviews)
        .values({
          review: "Ok",
          reviewerId: 1,
          revieweeId: 2,
          rating: "neutral",
        })
        .returning();

      const res = await user.delete(`/api/v1/reviews/${review.id}`);
      expect(res.status).toBe(403);
    });

    it("deletes review for owner", async () => {
      const [review] = await db
        .insert(reviews)
        .values({
          review: "Ok",
          reviewerId: 1,
          revieweeId: 2,
          rating: "neutral",
        })
        .returning();

      const res = await admin.delete(`/api/v1/reviews/${review.id}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);
    });
  });
});
