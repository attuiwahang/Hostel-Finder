const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const chatController = require("../controller/chatController");

// Get all chats for a user
router.get("/user/:userId", authMiddleware, chatController.getUserChats);

// Get all chats for a hostel owner
router.get("/hostel-owner/:hostelOwnerId", authMiddleware, chatController.getHostelOwnerChats);

// Get chat by ID with messages
router.get("/:chatId", authMiddleware, chatController.getChatById);

// Create a new chat
router.post("/", authMiddleware, chatController.createChat);

// Send a message
router.post("/message", authMiddleware, chatController.sendMessage);

// Mark messages as read
router.put("/message/read", authMiddleware, chatController.markMessagesAsRead);

// Get unread message count for a user
router.get("/unread/user/:userId", authMiddleware, chatController.getUserUnreadCount);

// Get unread message count for a hostel owner
router.get("/unread/hostel-owner/:hostelOwnerId", authMiddleware, chatController.getHostelOwnerUnreadCount);

module.exports = router;