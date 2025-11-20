import request from "supertest";
import app from "#src/app.js";

let server;

beforeEach(() => {
  server = app.listen(0); // 0 = use random free port
});

afterEach(() => {
  server.close();
});

describe("Sample Test", () => {
  describe("GET /health", () => {
    it("should return status OK", async () => {
      const response = await request(server).get("/health");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("status", "OK");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
    });
  });

  describe("GET /api", () => {
    it("should return an API message", async () => {
      const response = await request(server).get("/api");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "CampusDeals API is running!"
      );
    });
  });

  describe("GET /", () => {
    it("should return an API message", async () => {
      const response = await request(server).get("/");
      expect(response.status).toBe(200);
      expect(response.text).toBe("Hello from  campus deals API");
    });
  });

  describe("GET /nonexistent", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(server).get("/nonexistent");
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Route not found");
    });
  });
});
