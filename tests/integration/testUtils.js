import app from "#src/app.js";
import { db } from "#config/database.js";
import request from "supertest";
import { createTestToken } from "#src/utils/testToken.js";

/**
 * Create a reusable resetDB function for a list of tables.
 * Example: const resetDB = createResetDB(["campuses", "users", "listings"])
 */
export const createResetDB = tables => {
  return async () => {
    if (!tables || tables.length === 0) return;
    const tableList = tables.join(", ");
    await db.execute(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
  };
};

/**
 * Set up an HTTP server for integration tests and automatically clean up.
 * Returns a getter so tests can call getServer() inside each test.
 */
export const createTestServer = resetDB => {
  let server;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll(async () => {
    if (resetDB) {
      await resetDB();
    }
    if (server) {
      server.close();
    }
  });

  return () => server;
};

/**
 * Helper to consistently extract result.data from API responses.
 */
export const bodyData = res => res.body?.result?.data;

/**
 * Create authenticated/anonymous request helpers bound to a test server.
 * Usage:
 *   const getServer = createTestServer(resetDB);
 *   const { admin, user, anon } = createAuthClients(getServer);
 *   const res = await admin.get("/api/v1/campuses");
 */
export const createAuthClients = getServer => {
  const adminToken = createTestToken(1, "admin");
  const userToken = createTestToken(2, "user");

  const makeClient = token => {
    const withToken = req =>
      token ? req.set("Authorization", `Bearer ${token}`) : req;

    return {
      get: url => withToken(request(getServer()).get(url)),
      post: url => withToken(request(getServer()).post(url)),
      put: url => withToken(request(getServer()).put(url)),
      patch: url => withToken(request(getServer()).patch(url)),
      delete: url => withToken(request(getServer()).delete(url)),
    };
  };

  return {
    admin: makeClient(adminToken),
    user: makeClient(userToken),
    anon: makeClient(null),
  };
};
