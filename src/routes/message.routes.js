import express from "express";
import {
  sendMessage,
  getUserConversations,
  getConversationById,
  getConversationMessages,
  markConversationAsRead,
  deleteMessage,
} from "#controllers/message.controller.js";
import { authenticateToken } from "#middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Message routes
router.post("/messages", sendMessage);
router.delete("/messages/:id", deleteMessage);

// Conversation routes
router.get("/conversations", getUserConversations);
router.get("/conversations/:id", getConversationById);
router.get("/conversations/:id/messages", getConversationMessages);
router.patch("/conversations/:id/read", markConversationAsRead);

export default router;
