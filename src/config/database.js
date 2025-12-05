// import "dotenv/config";
// import { neon } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";

// const sql = neon(process.env.DATABASE_URL);

// const db = drizzle(sql);

// export { sql, db };

import "dotenv/config";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import logger from "./logger.js";

// Configure Neon based on environment
const isNeonLocal =
  process.env.DATABASE_URL?.includes("@neon-local:") ||
  process.env.DATABASE_URL?.includes("@localhost:");

if (isNeonLocal) {
  // Configuration for Neon Local (development)
  logger.info("Using Neon Local configuration for development");

  // Configure for HTTP-only communication with Neon Local
  const neonLocalHost = process.env.DATABASE_URL?.includes("@neon-local:")
    ? "neon-local"
    : "localhost";
  neonConfig.fetchEndpoint = `http://${neonLocalHost}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;

  // Disable SSL verification for self-signed certificates in development
  if (process.env.NODE_ENV === "development") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }
} else {
  // Configuration for Neon Cloud (production)
  logger.info("Using Neon Cloud configuration for production");

  // Use secure WebSocket and standard configuration for production
  neonConfig.useSecureWebSocket = true;
  neonConfig.poolQueryViaFetch = false;
}

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

logger.info(
  `Connecting to database: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@")}`
);

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Test database connection on startup
(async () => {
  try {
    await sql`SELECT 1 as test`;
    logger.info("Database connection established successfully");
  } catch (error) {
    logger.error("Failed to connect to database:", error.message);
    // Don't exit the process, let the application handle the error
  }
})();

export { db, sql };
