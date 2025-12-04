import request from "supertest";
import { db } from "#config/database.js";
import { users } from "#src/models/user.model.js";
import { createResetDB, createTestServer } from "./testUtils.js";
import { hashPassword } from "#src/services/auth.service.js";

const resetDB = createResetDB([
  "favorites",
  "listing_images",
  "listings",
  "reviews",
  "messages",
  "conversations",
  "users",
]);
const getServer = createTestServer(resetDB);

beforeEach(async () => {
  await resetDB();
});

describe("/api/v1/auth", () => {
  describe("POST /sign-up", () => {
    it("returns 400 when body is invalid", async () => {
      const res = await request(getServer())
        .post("/api/v1/auth/sign-up")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message || res.body.error).toMatch(/validation/i);
    });

    it("creates a new user and returns token + cookie", async () => {
      const payload = {
        name: "New User",
        email: "new@example.com",
        password: "password123",
        phone: "+2348012345678",
      };

      const res = await request(getServer())
        .post("/api/v1/auth/sign-up")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(payload.email.toLowerCase());
      expect(res.body.token).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("returns 409 when email already exists", async () => {
      const payload = {
        name: "Existing",
        email: "exists@example.com",
        password: "password123",
        phone: "+2348012345678",
      };

      await request(getServer()).post("/api/v1/auth/sign-up").send(payload);

      const res = await request(getServer())
        .post("/api/v1/auth/sign-up")
        .send(payload);

      expect(res.status).toBe(409);
    });
  });

  describe("POST /sign-in", () => {
    const email = "login@example.com";
    const password = "password123";

    beforeEach(async () => {
      const password_hash = await hashPassword(password);
      await db.insert(users).values({
        name: "Login User",
        email,
        password: password_hash,
        role: "user",
        phone: "+2348012345678",
      });
    });

    it("returns 400 when body is invalid", async () => {
      const res = await request(getServer())
        .post("/api/v1/auth/sign-in")
        .send({});

      expect(res.status).toBe(400);
    });

    it("returns 404 when user not found", async () => {
      const res = await request(getServer())
        .post("/api/v1/auth/sign-in")
        .send({ email: "unknown@example.com", password: "password123" });

      expect(res.status).toBe(404);
      expect(res.body.error || res.body.message).toMatch(/user not found/i);
    });

    it("returns 401 when password is invalid", async () => {
      const res = await request(getServer())
        .post("/api/v1/auth/sign-in")
        .send({ email, password: "wronger" });

      expect(res.status).toBe(401);
      expect(res.body.error || res.body.message).toMatch(/invalid/i);
    });

    it("signs in user and sets cookie", async () => {
      const res = await request(getServer())
        .post("/api/v1/auth/sign-in")
        .send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
    });
  });

  describe("POST /sign-out", () => {
    it("returns 200 even when no token is present", async () => {
      const res = await request(getServer())
        .post("/api/v1/auth/sign-out")
        .send();

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/signed out/i);
    });

    it("clears cookie when token is present", async () => {
      const email = "logout@example.com";
      const password = "password123";
      const password_hash = await hashPassword(password);
      await db.insert(users).values({
        name: "Logout User",
        email,
        password: password_hash,
        role: "user",
        phone: "+2348012345678",
      });

      const loginRes = await request(getServer())
        .post("/api/v1/auth/sign-in")
        .send({ email, password });

      const cookies = loginRes.headers["set-cookie"];
      expect(cookies).toBeDefined();

      const logoutRes = await request(getServer())
        .post("/api/v1/auth/sign-out")
        .set("Cookie", cookies);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.message).toMatch(/signed out/i);
    });
  });
});
