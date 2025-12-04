# Campus Deals Messaging API Documentation

## Overview

The messaging system provides both REST API endpoints and real-time WebSocket communication using Socket.IO.

---

## 📡 REST API Endpoints

### Base URL

```
http://localhost:3000/api/v1
```

All messaging endpoints require authentication (JWT token).

---

### 1. Send a Message

**POST** `/messages`

Send a new message to another user. This will automatically create a conversation if one doesn't exist.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "receiverId": 2,
  "content": "Hi! Is this MacBook still available?",
  "listingId": 5 // Optional: link message to a specific listing
}
```

**Response:** `201 Created`

```json
{
  "message": "Message sent successfully",
  "data": {
    "id": 123,
    "conversationId": 45,
    "senderId": 1,
    "receiverId": 2,
    "content": "Hi! Is this MacBook still available?",
    "isRead": false,
    "readAt": null,
    "createdAt": "2025-12-01T23:30:00.000Z",
    "updatedAt": "2025-12-01T23:30:00.000Z"
  }
}
```

---

### 2. Get All Conversations

**GET** `/conversations`

Retrieve all conversations for the authenticated user.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`

```json
{
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "id": 45,
      "otherUser": {
        "id": 2,
        "name": "John Doe",
        "email": "john@university.edu.ng"
      },
      "listing": {
        "id": 5,
        "title": "MacBook Pro 2020",
        "price": "250000.00"
      },
      "lastMessage": {
        "content": "Yes, it's still available!",
        "sentAt": "2025-12-01T23:35:00.000Z"
      },
      "unreadCount": 2,
      "createdAt": "2025-12-01T10:00:00.000Z",
      "updatedAt": "2025-12-01T23:35:00.000Z"
    }
  ]
}
```

---

### 3. Get Conversation by ID

**GET** `/conversations/:id`

Get details of a specific conversation.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`

```json
{
  "message": "Conversation retrieved successfully",
  "data": {
    "id": 45,
    "otherUser": {
      "id": 2,
      "name": "John Doe",
      "email": "john@university.edu.ng"
    },
    "listing": {
      "id": 5,
      "title": "MacBook Pro 2020",
      "price": "250000.00"
    },
    "lastMessage": {
      "content": "Yes, it's still available!",
      "sentAt": "2025-12-01T23:35:00.000Z"
    },
    "createdAt": "2025-12-01T10:00:00.000Z",
    "updatedAt": "2025-12-01T23:35:00.000Z"
  }
}
```

---

### 4. Get Messages in a Conversation

**GET** `/conversations/:id/messages?page=1&limit=50`

Retrieve messages from a conversation with pagination.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Query Parameters:**

- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 50, max: 100) - Messages per page

**Response:** `200 OK`

```json
{
  "message": "Messages retrieved successfully",
  "result": {
    "meta": {
      "total": 125,
      "page": 1,
      "limit": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "data": [
      {
        "id": 150,
        "conversationId": 45,
        "sender": {
          "id": 2,
          "name": "John Doe",
          "email": "john@university.edu.ng"
        },
        "receiverId": 1,
        "content": "Yes, it's still available!",
        "isRead": false,
        "readAt": null,
        "createdAt": "2025-12-01T23:35:00.000Z",
        "isMine": false
      },
      {
        "id": 149,
        "conversationId": 45,
        "sender": {
          "id": 1,
          "name": "Jane Smith",
          "email": "jane@university.edu.ng"
        },
        "receiverId": 2,
        "content": "Hi! Is this MacBook still available?",
        "isRead": true,
        "readAt": "2025-12-01T23:32:00.000Z",
        "createdAt": "2025-12-01T23:30:00.000Z",
        "isMine": true
      }
    ]
  }
}
```

---

### 5. Mark Messages as Read

**PATCH** `/conversations/:id/read`

Mark all unread messages in a conversation as read.

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`

```json
{
  "message": "Messages marked as read",
  "data": {
    "markedCount": 5
  }
}
```

---

### 6. Delete a Message

**DELETE** `/messages/:id`

Delete a message (soft delete - content becomes "[Message deleted]").

**Headers:**

```
Authorization: Bearer <your-jwt-token>
```

**Response:** `200 OK`

```json
{
  "message": "Message deleted successfully",
  "data": {
    "id": 123,
    "content": "[Message deleted]",
    "updatedAt": "2025-12-01T23:40:00.000Z"
  }
}
```

---

## 🔌 WebSocket (Socket.IO) Events

### Connection

**Connect to WebSocket:**

```javascript
import io from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "your-jwt-token-here",
  },
});
```

---

### Client → Server Events

#### 1. `send_message`

Send a real-time message.

```javascript
socket.emit("send_message", {
  receiverId: 2,
  content: "Hello via WebSocket!",
  listingId: 5, // Optional
});
```

**Response Events:**

- `message_sent` - Confirmation to sender
- `new_message` - Delivered to receiver (if online)

---

#### 2. `join_conversation`

Join a conversation room to receive real-time updates.

```javascript
socket.emit("join_conversation", 45); // conversationId
```

**Response:**

```javascript
socket.on("joined_conversation", data => {
  console.log(data);
  // { conversationId: 45, message: "Joined conversation 45" }
});
```

---

#### 3. `leave_conversation`

Leave a conversation room.

```javascript
socket.emit("leave_conversation", 45);
```

---

#### 4. `mark_as_read`

Mark messages as read in real-time.

```javascript
socket.emit("mark_as_read", {
  conversationId: 45,
});
```

**Response:**

```javascript
socket.on("marked_as_read", data => {
  console.log(data);
  // { conversationId: 45, markedCount: 3 }
});
```

---

#### 5. `typing_start`

Notify the other user you're typing.

```javascript
socket.emit("typing_start", {
  conversationId: 45,
  receiverId: 2,
});
```

---

#### 6. `typing_stop`

Notify the other user you stopped typing.

```javascript
socket.emit("typing_stop", {
  conversationId: 45,
  receiverId: 2,
});
```

---

#### 7. `get_online_users`

Request list of currently online users.

```javascript
socket.emit("get_online_users");
```

**Response:**

```javascript
socket.on("online_users", data => {
  console.log(data.users); // [1, 2, 5, 10]
});
```

---

### Server → Client Events

#### 1. `connected`

Emitted when successfully connected.

```javascript
socket.on("connected", data => {
  console.log(data);
  // { userId: 1, socketId: "abc123", message: "Successfully connected..." }
});
```

---

#### 2. `new_message`

Receive a new message in real-time.

```javascript
socket.on("new_message", data => {
  console.log("New message:", data.message);
  // Display notification, update UI, etc.
});
```

---

#### 3. `message_sent`

Confirmation that your message was sent.

```javascript
socket.on("message_sent", data => {
  console.log("Message sent:", data.message);
});
```

---

#### 4. `messages_read`

Someone read your messages.

```javascript
socket.on("messages_read", data => {
  console.log(
    `User ${data.readByUserId} read messages in conversation ${data.conversationId}`
  );
  // Update UI to show read receipts
});
```

---

#### 5. `user_typing`

The other user is typing.

```javascript
socket.on("user_typing", data => {
  console.log(
    `User ${data.userId} is typing in conversation ${data.conversationId}`
  );
  // Show "typing..." indicator
});
```

---

#### 6. `user_stopped_typing`

The other user stopped typing.

```javascript
socket.on("user_stopped_typing", data => {
  // Hide "typing..." indicator
});
```

---

#### 7. `user_online` / `user_offline`

Track user online status.

```javascript
socket.on("user_online", data => {
  console.log(`User ${data.userId} is now online`);
});

socket.on("user_offline", data => {
  console.log(`User ${data.userId} is now offline`);
});
```

---

#### 8. `error`

Error occurred during socket operation.

```javascript
socket.on("error", data => {
  console.error("Socket error:", data.message);
});
```

---

## 🎯 Example Usage Flows

### Scenario 1: Send a Message via REST API

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": 2,
    "content": "Is this item still available?",
    "listingId": 5
  }'
```

---

### Scenario 2: Real-time Chat with WebSocket

**Sender (User 1):**

```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "user1-jwt-token" },
});

socket.on("connected", () => {
  console.log("Connected!");

  // Send message
  socket.emit("send_message", {
    receiverId: 2,
    content: "Hello!",
  });
});

socket.on("message_sent", data => {
  console.log("Message delivered:", data.message);
});
```

**Receiver (User 2):**

```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "user2-jwt-token" },
});

socket.on("new_message", data => {
  console.log("New message from:", data.message.senderId);
  console.log("Content:", data.message.content);

  // Mark as read
  socket.emit("mark_as_read", {
    conversationId: data.conversationId,
  });
});
```

---

### Scenario 3: Fetch Chat History

```bash
# Get all conversations
curl -X GET http://localhost:3000/api/v1/conversations \
  -H "Authorization: Bearer eyJhbGc..."

# Get messages in a specific conversation
curl -X GET "http://localhost:3000/api/v1/conversations/45/messages?page=1&limit=50" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## 🗄️ Database Schema

### Conversations Table

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL,
  last_message_content TEXT,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Messages Table

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚙️ Environment Variables

Add to your `.env` file:

```bash
# WebSocket Configuration
CLIENT_URL=http://localhost:3000  # Your frontend URL for CORS
```

---

## 🚀 Getting Started

1. **Run database migrations:**

```bash
npm run db:generate
npm run db:migrate
```

2. **Start the server:**

```bash
npm run dev
```

3. **Test WebSocket connection:**
   - Use the provided client examples
   - Or test with Socket.IO client library in your frontend

---

## 📝 Notes

- All WebSocket events require JWT authentication
- Messages are stored in the database even when sent via WebSocket
- Offline users will see messages when they next log in (REST API)
- Real-time delivery only works for online users (WebSocket)
- Conversations are automatically created when first message is sent
- Soft delete for messages (content becomes "[Message deleted]")
