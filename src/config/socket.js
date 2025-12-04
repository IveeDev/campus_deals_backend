import { Server } from "socket.io";
import { jwttoken } from "#utils/jwt.js";
import logger from "#config/logger.js";
import * as messageService from "#services/message.service.js";

// Store active users: { userId: socketId }
const activeUsers = new Map();

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = httpServer => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization;

      if (!token) {
        logger.warn("Socket connection attempt without token");
        return next(new Error("Authentication required"));
      }

      // Remove "Bearer " prefix if present
      const cleanToken = token.replace("Bearer ", "");

      // Verify JWT
      const decoded = jwttoken.verify(cleanToken);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;

      logger.info(
        `Socket authenticated for user ${decoded.email} (${decoded.id})`
      );
      next();
    } catch (error) {
      logger.error("Socket authentication error:", error);
      next(new Error("Invalid or expired token"));
    }
  });

  // Connection handler
  io.on("connection", socket => {
    const userId = socket.userId;
    logger.info(`User ${userId} connected via Socket.IO (${socket.id})`);

    // Register user as online
    activeUsers.set(userId, socket.id);

    // Emit to user that they're connected
    socket.emit("connected", {
      userId,
      socketId: socket.id,
      message: "Successfully connected to real-time messaging",
    });

    // Notify others that user is online
    socket.broadcast.emit("user_online", { userId });

    // Join user's personal room (for private notifications)
    socket.join(`user_${userId}`);

    // EVENT: Send a message
    socket.on("send_message", async data => {
      try {
        const { receiverId, content, listingId } = data;

        // Validate basic data
        if (!receiverId || !content) {
          socket.emit("error", { message: "Invalid message data" });
          return;
        }

        // Send message via service
        const message = await messageService.sendMessage({
          senderId: userId,
          receiverId,
          content,
          listingId,
        });

        // Emit to sender (confirmation)
        socket.emit("message_sent", {
          message,
          conversationId: message.conversationId,
        });

        // Emit to receiver (if online)
        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("new_message", {
            message,
            conversationId: message.conversationId,
          });
          logger.info(
            `Real-time message delivered to user ${receiverId} (socket: ${receiverSocketId})`
          );
        } else {
          logger.info(`User ${receiverId} is offline, message saved to DB`);
        }

        logger.info(
          `Message from ${userId} to ${receiverId} sent successfully`
        );
      } catch (error) {
        logger.error("Error in send_message event:", error);
        socket.emit("error", {
          message: error.message || "Failed to send message",
        });
      }
    });

    // EVENT: Join a conversation room
    socket.on("join_conversation", async conversationId => {
      try {
        // Verify user has access to this conversation
        const conversation = await messageService.getConversationById(
          conversationId,
          userId
        );

        socket.join(`conversation_${conversationId}`);
        socket.emit("joined_conversation", {
          conversationId,
          message: `Joined conversation ${conversationId}`,
        });

        logger.info(
          `User ${userId} joined conversation ${conversationId} room`
        );
      } catch (error) {
        logger.error("Error joining conversation:", error);
        socket.emit("error", {
          message: "Failed to join conversation",
        });
      }
    });

    // EVENT: Leave a conversation room
    socket.on("leave_conversation", conversationId => {
      socket.leave(`conversation_${conversationId}`);
      socket.emit("left_conversation", {
        conversationId,
        message: `Left conversation ${conversationId}`,
      });
      logger.info(`User ${userId} left conversation ${conversationId} room`);
    });

    // EVENT: Mark messages as read
    socket.on("mark_as_read", async data => {
      try {
        const { conversationId } = data;

        const result = await messageService.markMessagesAsRead(
          conversationId,
          userId
        );

        socket.emit("marked_as_read", {
          conversationId,
          markedCount: result.markedCount,
        });

        // Notify the other user that their messages were read
        const conversation = await messageService.getConversationById(
          conversationId,
          userId
        );
        const otherUserId = conversation.otherUser.id;
        const otherSocketId = activeUsers.get(otherUserId);

        if (otherSocketId) {
          io.to(otherSocketId).emit("messages_read", {
            conversationId,
            readByUserId: userId,
          });
        }

        logger.info(
          `User ${userId} marked messages as read in conversation ${conversationId}`
        );
      } catch (error) {
        logger.error("Error in mark_as_read event:", error);
        socket.emit("error", {
          message: "Failed to mark messages as read",
        });
      }
    });

    // EVENT: Typing indicator
    socket.on("typing_start", data => {
      const { conversationId, receiverId } = data;
      const receiverSocketId = activeUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", {
          conversationId,
          userId,
        });
      }
    });

    socket.on("typing_stop", data => {
      const { conversationId, receiverId } = data;
      const receiverSocketId = activeUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_stopped_typing", {
          conversationId,
          userId,
        });
      }
    });

    // EVENT: Disconnect

    socket.on("disconnect", () => {
      logger.info(`User ${userId} disconnected (${socket.id})`);
      activeUsers.delete(userId);

      // Notify others that user is offline
      socket.broadcast.emit("user_offline", { userId });
    });

    // EVENT: Get online users
    socket.on("get_online_users", () => {
      const onlineUserIds = Array.from(activeUsers.keys());
      socket.emit("online_users", { users: onlineUserIds });
    });
  });

  logger.info("Socket.IO initialized successfully");
  return io;
};

/**
 * Get active users (for debugging/admin purposes)
 */
export const getActiveUsers = () => {
  return Array.from(activeUsers.entries());
};
