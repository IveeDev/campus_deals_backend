import { db } from "#config/database.js";
import { users } from "#src/models/user.model.js";
import { listings } from "#src/models/listing.model.js";
import { conversations, messages } from "#src/models/message.model.js";
import { campuses } from "#src/models/campus.model.js";
import { categories } from "#src/models/category.model.js";
import {
  createResetDB,
  createTestServer,
  createAuthClients,
} from "./testUtils.js";

const resetDB = createResetDB([
  "messages",
  "conversations",
  "listings",
  "categories",
  "campuses",
  "users",
]);

const getServer = createTestServer(resetDB);
const { admin, user, anon } = createAuthClients(getServer);

beforeEach(async () => {
  await resetDB();

  await db.insert(users).values([
    {
      id: 1,
      name: "Sender",
      email: "sender@example.com",
      password: "hashed",
      role: "user",
      phone: "0000000000",
    },
    {
      id: 2,
      name: "Receiver",
      email: "receiver@example.com",
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
    id: 1,
    title: "Laptop",
    description: "Nice laptop",
    price: 500,
    condition: "used",
    sellerId: 2,
    categoryId: category.id,
    campusId: campus.id,
  });
});

describe("Message & conversation endpoints", () => {
  describe("POST /messages", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.post("/api/v1/messages").send({
        receiverId: 2,
        content: "Hello",
      });
      expect(res.status).toBe(401);
    });

    it("returns 400 when body is invalid", async () => {
      const res = await admin.post("/api/v1/messages").send({});
      expect(res.status).toBe(400);
    });

    it("creates a message and conversation", async () => {
      const res = await admin.post("/api/v1/messages").send({
        receiverId: 2,
        content: "Hi there",
        listingId: 1,
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.content).toBe("Hi there");

      const convRows = await db.select().from(conversations);
      expect(convRows.length).toBe(1);

      const msgRows = await db.select().from(messages);
      expect(msgRows.length).toBe(1);
    });
  });

  describe("GET /conversations", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.get("/api/v1/conversations");
      expect(res.status).toBe(401);
    });

    it("returns user conversations", async () => {
      await admin.post("/api/v1/messages").send({
        receiverId: 2,
        content: "Hi there",
        listingId: 1,
      });

      const res = await admin.get("/api/v1/conversations");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("GET /conversations/:id", () => {
    it("returns 400 when id is invalid", async () => {
      const res = await admin.get("/api/v1/conversations/abc");
      expect(res.status).toBe(400);
    });

    it("returns 404 when conversation not found", async () => {
      const res = await admin.get("/api/v1/conversations/999");
      expect(res.status).toBe(404);
    });

    it("returns conversation for participant", async () => {
      const msgRes = await admin.post("/api/v1/messages").send({
        receiverId: 2,
        content: "Hi there",
        listingId: 1,
      });
      const convId = msgRes.body.data.conversationId;

      const res = await admin.get(`/api/v1/conversations/${convId}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(convId);
    });
  });

  describe("GET /conversations/:id/messages", () => {
    it("returns 400 when id is invalid", async () => {
      const res = await admin.get("/api/v1/conversations/abc/messages");
      expect(res.status).toBe(400);
    });

    it("returns paginated messages", async () => {
      const msgRes = await admin.post("/api/v1/messages").send({
        receiverId: 2,
        content: "Hi there",
        listingId: 1,
      });
      const convId = msgRes.body.data.conversationId;

      const res = await admin.get(`/api/v1/conversations/${convId}/messages`);
      expect(res.status).toBe(200);
      expect(res.body.result).toBeDefined();
      expect(Array.isArray(res.body.result.data)).toBe(true);
      expect(res.body.result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("PATCH /conversations/:id/read", () => {
    it("marks messages as read", async () => {
      const msgRes = await admin.post("/api/v1/messages").send({
        receiverId: 2,
        content: "Hi there",
        listingId: 1,
      });
      const convId = msgRes.body.data.conversationId;

      const res = await user.patch(`/api/v1/conversations/${convId}/read`);
      expect(res.status).toBe(200);
      expect(res.body.data.markedCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("DELETE /messages/:id", () => {
    it("returns 401 when not authenticated", async () => {
      const res = await anon.delete("/api/v1/messages/1");
      expect(res.status).toBe(401);
    });

    it("returns 403 when non-sender tries to delete", async () => {
      const msgRes = await admin.post("/api/v1/messages").send({
        receiverId: 2,
        content: "Hi there",
        listingId: 1,
      });
      const msgId = msgRes.body.data.id;

      const res = await user.delete(`/api/v1/messages/${msgId}`);
      expect(res.status).toBe(403);
    });

    it("soft deletes message for sender", async () => {
      const msgRes = await admin.post("/api/v1/messages").send({
        receiverId: 2,
        content: "Hi there",
        listingId: 1,
      });
      const msgId = msgRes.body.data.id;

      const res = await admin.delete(`/api/v1/messages/${msgId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe("[Message deleted]");
    });
  });
});
