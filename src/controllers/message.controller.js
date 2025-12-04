import * as messageService from "#services/message.service.js";
import { catchAsync } from "#src/utils/catchAsync.js";
import { AppError } from "#src/utils/AppError.js";
import { formatValidationError } from "#src/utils/format.js";
import {
  sendMessageSchema,
  conversationIdSchema,
  messageIdSchema,
  getMessagesQuerySchema,
  markAsReadSchema,
} from "#validations/message.validation.js";

/**
 * Send a new message
 * POST /api/v1/messages
 */
export const sendMessage = catchAsync(async (req, res) => {
  const senderId = req.user.id;

  // Validate input
  const validationResult = sendMessageSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new AppError(
      "Invalid message data",
      400,
      formatValidationError(validationResult.error)
    );
  }

  const { receiverId, content, listingId } = validationResult.data;

  const message = await messageService.sendMessage({
    senderId,
    receiverId,
    content,
    listingId,
  });

  res.status(201).json({
    message: "Message sent successfully",
    data: message,
  });
});

/**
 * Get all conversations for the authenticated user
 * GET /api/v1/conversations
 */
export const getUserConversations = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const conversations = await messageService.getUserConversations(userId);

  res.status(200).json({
    message: "Conversations retrieved successfully",
    data: conversations,
  });
});

/**
 * Get a single conversation by ID
 * GET /api/v1/conversations/:id
 */
export const getConversationById = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const validationResult = conversationIdSchema.safeParse({
    id: req.params.id,
  });

  if (!validationResult.success) {
    throw new AppError(
      "Invalid conversation ID",
      400,
      formatValidationError(validationResult.error)
    );
  }

  const { id } = validationResult.data;

  const conversation = await messageService.getConversationById(id, userId);

  res.status(200).json({
    message: "Conversation retrieved successfully",
    data: conversation,
  });
});

/**
 * Get messages in a conversation
 * GET /api/v1/conversations/:id/messages
 */
export const getConversationMessages = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const idValidation = conversationIdSchema.safeParse({ id: req.params.id });
  if (!idValidation.success) {
    throw new AppError(
      "Invalid conversation ID",
      400,
      formatValidationError(idValidation.error)
    );
  }

  const queryValidation = getMessagesQuerySchema.safeParse(req.query);
  if (!queryValidation.success) {
    throw new AppError(
      "Invalid query parameters",
      400,
      formatValidationError(queryValidation.error)
    );
  }

  const { id } = idValidation.data;
  const { page, limit } = queryValidation.data;

  const result = await messageService.getConversationMessages(id, userId, {
    page,
    limit,
  });

  res.status(200).json({
    message: "Messages retrieved successfully",
    result,
  });
});

/**
 * Mark all messages in a conversation as read
 * PATCH /api/v1/conversations/:id/read
 */
export const markConversationAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const validationResult = conversationIdSchema.safeParse({
    id: req.params.id,
  });

  if (!validationResult.success) {
    throw new AppError(
      "Invalid conversation ID",
      400,
      formatValidationError(validationResult.error)
    );
  }

  const { id } = validationResult.data;

  const result = await messageService.markMessagesAsRead(id, userId);

  res.status(200).json({
    message: "Messages marked as read",
    data: result,
  });
});

/**
 * Delete a message
 * DELETE /api/v1/messages/:id
 */
export const deleteMessage = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const validationResult = messageIdSchema.safeParse({ id: req.params.id });

  if (!validationResult.success) {
    throw new AppError(
      "Invalid message ID",
      400,
      formatValidationError(validationResult.error)
    );
  }

  const { id } = validationResult.data;

  const deletedMessage = await messageService.deleteMessage(id, userId);

  res.status(200).json({
    message: "Message deleted successfully",
    data: deletedMessage,
  });
});
