import { db } from "#config/database.js";
import { conversations, messages } from "#models/message.model.js";
import { users } from "#models/user.model.js";
import { listings } from "#models/listing.model.js";
import { eq, and, or, desc, count } from "drizzle-orm";
import logger from "#config/logger.js";
import { AppError } from "#src/utils/AppError.js";

/**
 * Find or create a conversation between two users
 */
export const findOrCreateConversation = async (
  user1Id,
  user2Id,
  listingId = null
) => {
  try {
    // Prevent self-conversation
    if (user1Id === user2Id) {
      throw new AppError("Cannot create conversation with yourself", 400);
    }

    // Check if both users exist
    const [user1, user2] = await Promise.all([
      db.select().from(users).where(eq(users.id, user1Id)).limit(1),
      db.select().from(users).where(eq(users.id, user2Id)).limit(1),
    ]);

    if (!user1.length) throw new AppError("Sender not found", 404);
    if (!user2.length) throw new AppError("Receiver not found", 404);

    // Check if conversation already exists (either direction)
    const [existingConversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          or(
            and(
              eq(conversations.user1Id, user1Id),
              eq(conversations.user2Id, user2Id)
            ),
            and(
              eq(conversations.user1Id, user2Id),
              eq(conversations.user2Id, user1Id)
            )
          ),
          eq(conversations.listingId, listingId)
        )
      )
      .limit(1);

    if (existingConversation) {
      logger.info(
        `Found existing conversation ${existingConversation.id} between users ${user1Id} and ${user2Id}`
      );
      return existingConversation;
    }

    // Create new conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        user1Id,
        user2Id,
        listingId,
      })
      .returning();

    logger.info(
      `Created new conversation ${newConversation.id} between users ${user1Id} and ${user2Id}`
    );
    return newConversation;
  } catch (error) {
    logger.error("Error finding/creating conversation:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create conversation", 500);
  }
};

/**
 * Send a message
 */
export const sendMessage = async ({
  senderId,
  receiverId,
  content,
  listingId,
}) => {
  try {
    // Find or create conversation
    const conversation = await findOrCreateConversation(
      senderId,
      receiverId,
      listingId
    );

    // Create message
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId: conversation.id,
        senderId,
        receiverId,
        content,
        isRead: false,
      })
      .returning();

    // Update conversation with last message info
    await db
      .update(conversations)
      .set({
        lastMessageContent: content,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversation.id));

    logger.info(
      `Message ${newMessage.id} sent from user ${senderId} to ${receiverId}`
    );

    return {
      ...newMessage,
      conversationId: conversation.id,
    };
  } catch (error) {
    logger.error("Error sending message:", error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to send message", 500);
  }
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async userId => {
  try {
    const userConversations = await db
      .select({
        id: conversations.id,
        user1Id: conversations.user1Id,
        user2Id: conversations.user2Id,
        listingId: conversations.listingId,
        lastMessageContent: conversations.lastMessageContent,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        // Other user info
        otherUserId: users.id,
        otherUserName: users.name,
        otherUserEmail: users.email,
        // Listing info if exists
        listingTitle: listings.title,
        listingPrice: listings.price,
      })
      .from(conversations)
      .leftJoin(
        users,
        or(
          and(
            eq(conversations.user1Id, userId),
            eq(users.id, conversations.user2Id)
          ),
          and(
            eq(conversations.user2Id, userId),
            eq(users.id, conversations.user1Id)
          )
        )
      )
      .leftJoin(listings, eq(conversations.listingId, listings.id))
      .where(
        or(eq(conversations.user1Id, userId), eq(conversations.user2Id, userId))
      )
      .orderBy(desc(conversations.lastMessageAt));

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      userConversations.map(async conv => {
        const [{ unreadCount }] = await db
          .select({ unreadCount: count(messages.id) })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.receiverId, userId),
              eq(messages.isRead, false)
            )
          );

        return {
          id: conv.id,
          otherUser: {
            id: conv.otherUserId,
            name: conv.otherUserName,
            email: conv.otherUserEmail,
          },
          listing: conv.listingId
            ? {
              id: conv.listingId,
              title: conv.listingTitle,
              price: conv.listingPrice,
            }
            : null,
          lastMessage: {
            content: conv.lastMessageContent,
            sentAt: conv.lastMessageAt,
          },
          unreadCount: Number(unreadCount),
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
        };
      })
    );

    logger.info(
      `Retrieved ${conversationsWithUnread.length} conversations for user ${userId}`
    );
    return conversationsWithUnread;
  } catch (error) {
    logger.error(`Error getting conversations for user ${userId}:`, error);
    throw new AppError("Failed to retrieve conversations", 500);
  }
};

/**
 * Get messages in a conversation (with pagination)
 */
export const getConversationMessages = async (
  conversationId,
  userId,
  { page = 1, limit = 50 } = {}
) => {
  try {
    const offset = (page - 1) * limit;

    // Verify user is part of the conversation
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new AppError("Unauthorized to access this conversation", 403);
    }

    // Get total count
    const [{ total }] = await db
      .select({ total: count(messages.id) })
      .from(messages)
      .where(eq(messages.conversationId, conversationId));

    // Get messages with sender info
    const conversationMessages = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isRead: messages.isRead,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        senderName: users.name,
        senderEmail: users.email,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(Number(total) / limit);

    logger.info(
      `Retrieved ${conversationMessages.length} messages for conversation ${conversationId}`
    );

    return {
      meta: {
        total: Number(total),
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      data: conversationMessages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        sender: {
          id: msg.senderId,
          name: msg.senderName,
          email: msg.senderEmail,
        },
        receiverId: msg.receiverId,
        content: msg.content,
        isRead: msg.isRead,
        readAt: msg.readAt,
        createdAt: msg.createdAt,
        isMine: msg.senderId === userId,
      })),
    };
  } catch (error) {
    logger.error(
      `Error getting messages for conversation ${conversationId}:`,
      error
    );
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to retrieve messages", 500);
  }
};

/**
 * Mark messages as read in a conversation
 */
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    // Verify conversation exists and user is part of it
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new AppError("Unauthorized to access this conversation", 403);
    }

    // Mark all unread messages as read
    const updatedMessages = await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      )
      .returning();

    logger.info(
      `Marked ${updatedMessages.length} messages as read in conversation ${conversationId}`
    );

    return {
      markedCount: updatedMessages.length,
    };
  } catch (error) {
    logger.error(
      `Error marking messages as read for conversation ${conversationId}:`,
      error
    );
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to mark messages as read", 500);
  }
};

/**
 * Delete a message (soft delete by setting content to deleted)
 */
export const deleteMessage = async (messageId, userId) => {
  try {
    // Get message
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1);

    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Only sender can delete
    if (message.senderId !== userId) {
      throw new AppError("Unauthorized to delete this message", 403);
    }

    // Update message content
    const [deletedMessage] = await db
      .update(messages)
      .set({
        content: "[Message deleted]",
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    logger.info(`Message ${messageId} deleted by user ${userId}`);
    return deletedMessage;
  } catch (error) {
    logger.error(`Error deleting message ${messageId}:`, error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to delete message", 500);
  }
};

/**
 * Get conversation by ID (verify user access)
 */
export const getConversationById = async (conversationId, userId) => {
  try {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      throw new AppError("Unauthorized to access this conversation", 403);
    }

    // Get other user info
    const otherUserId =
      conversation.user1Id === userId
        ? conversation.user2Id
        : conversation.user1Id;

    const [otherUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, otherUserId))
      .limit(1);

    // Get listing info if exists
    let listing = null;
    if (conversation.listingId) {
      const [listingData] = await db
        .select({
          id: listings.id,
          title: listings.title,
          price: listings.price,
        })
        .from(listings)
        .where(eq(listings.id, conversation.listingId))
        .limit(1);
      listing = listingData || null;
    }

    return {
      id: conversation.id,
      otherUser,
      listing,
      lastMessage: {
        content: conversation.lastMessageContent,
        sentAt: conversation.lastMessageAt,
      },
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  } catch (error) {
    logger.error(`Error getting conversation ${conversationId}:`, error);
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to retrieve conversation", 500);
  }
};
