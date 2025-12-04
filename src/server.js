import app from "./app.js";
import { createServer } from "http";
import { initializeSocket } from "#config/socket.js";
import logger from "#config/logger.js";

const PORT = process.env.PORT || 3000;

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

// Start server
const server = httpServer.listen(PORT, () => {
  logger.info(`🚀 Server is running on http://localhost:${PORT}`);
  logger.info("⚡ Socket.IO is ready for real-time messaging");
});

export default server;
export { io };
