// controllers/chatController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const socketManager = require('../config/socketConfig'); // Import the socket manager

exports.getUserChats = async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Ensure the requesting user is allowed to access these chats
      if (req.user.id !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ 
          success: false, 
          message: "Not authorized to access these chats" 
        });
      }
  
      // Fetch chats with the latest message and unread count in a single query
      const chats = await prisma.chat.findMany({
        where: {
          userId: userId
        },
        include: {
          hostelOwner: {
            select: {
              id: true,
              hostelName: true,
              ownerName: true,
              mainPhoto: true
            }
          },
          messages: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 1 // Get only the latest message for each chat
          },
          _count: {
            select: {
              messages: {
                where: {
                  senderType: 'HOSTEL_OWNER',
                  isRead: false
                }
              }
            }
          }
        }
      });
  
      // Sort manually after fetching
      // Sorts chats by the timestamp of their latest message (if any)
      const sortedChats = [...chats].sort((a, b) => {
        const aLatestMessage = a.messages[0]?.timestamp;
        const bLatestMessage = b.messages[0]?.timestamp;
        
        // If no messages, put at the end
        if (!aLatestMessage && !bLatestMessage) return 0;
        if (!aLatestMessage) return 1;
        if (!bLatestMessage) return -1;
        
        // Sort descending (newest first)
        return new Date(bLatestMessage) - new Date(aLatestMessage);
      });
  
      // Transform the data to include unread count from the aggregation
      const formattedChats = sortedChats.map((chat) => ({
        ...chat,
        unreadCount: chat._count.messages
      }));
  
      return res.status(200).json({
        success: true,
        chats: formattedChats
      });
    } catch (error) {
      console.error("Error fetching user chats:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch chats",
        error: error.message
      });
    }
};

// Get all chats for a hostel owner
exports.getHostelOwnerChats = async (req, res) => {
  try {
    const hostelOwnerId = parseInt(req.params.hostelOwnerId);
    
    // Ensure the requesting user is allowed to access these chats
    if (req.user.id !== hostelOwnerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to access these chats" 
      });
    }

    // Fetch all chats for this hostel owner with unread count in a single query
    const chats = await prisma.chat.findMany({
      where: {
        hostelOwnerId: hostelOwnerId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        },
        messages: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1 // Get only the latest message for each chat
        },
        _count: {
          select: {
            messages: {
              where: {
                senderType: 'USER',
                isRead: false
              }
            }
          }
        }
      }
    });

    // Format chats with unread count and latest message timestamp
    const formattedChats = chats.map((chat) => ({
      ...chat,
      unreadCount: chat._count.messages,
      lastMessageTimestamp: chat.messages[0]?.timestamp || new Date(0)
    }));

    // Sort chats by the timestamp of their latest message
    const sortedChats = formattedChats.sort((a, b) => {
      return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
    });

    return res.status(200).json({
      success: true,
      chats: sortedChats
    });
  } catch (error) {
    console.error("Error fetching hostel owner chats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
      error: error.message
    });
  }
};

// Get chat by ID with messages
exports.getChatById = async (req, res) => {
  try {
    const chatId = parseInt(req.params.chatId);
    
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true
          }
        },
        hostelOwner: {
          select: {
            id: true,
            hostelName: true,
            ownerName: true,
            mainPhoto: true
          }
        },
        messages: {
          orderBy: {
            timestamp: 'asc' // Get messages in chronological order
          }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    // Check if the requesting user is allowed to access this chat
    if (
      req.user.id !== chat.userId && 
      req.user.id !== chat.hostelOwnerId && 
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this chat"
      });
    }

    return res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat",
      error: error.message
    });
  }
};

// Create a new chat
exports.createChat = async (req, res) => {
  try {
    const { userId, hostelOwnerId } = req.body;

    // Check if chat already exists
    const existingChat = await prisma.chat.findFirst({
      where: {
        userId: parseInt(userId),
        hostelOwnerId: parseInt(hostelOwnerId)
      }
    });

    if (existingChat) {
      return res.status(200).json({
        success: true,
        chatId: existingChat.id,
        message: "Chat already exists"
      });
    }

    // Create new chat
    const newChat = await prisma.chat.create({
      data: {
        userId: parseInt(userId),
        hostelOwnerId: parseInt(hostelOwnerId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        hostelOwner: {
          select: {
            id: true,
            hostelName: true,
            ownerName: true,
            mainPhoto: true
          }
        }
      }
    });

    // Emit new chat event via socket if needed
    try {
      const io = socketManager.getIO();
      // Notify both parties about the new chat
      io.to(`user_${userId}`).emit('new_chat', newChat);
      io.to(`hostelOwner_${hostelOwnerId}`).emit('new_chat', newChat);
    } catch (socketError) {
      console.error('Socket not initialized or error emitting new chat:', socketError);
      // Continue with HTTP response even if socket fails
    }

    return res.status(201).json({
      success: true,
      chatId: newChat.id,
      chat: newChat,
      message: "Chat created successfully"
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create chat",
      error: error.message
    });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, senderId, senderType, content } = req.body;

    // Validate inputs
    if (!chatId || !senderId || !senderType || !content) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Verify the sender identity
    if (
      (senderType === 'USER' && parseInt(senderId) !== req.user.id) ||
      (senderType === 'HOSTEL_OWNER' && parseInt(senderId) !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized sender"
      });
    }

    // Check if chat exists
    const chat = await prisma.chat.findUnique({
      where: {
        id: parseInt(chatId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true
          }
        },
        hostelOwner: {
          select: {
            id: true,
            hostelName: true,
            ownerName: true,
            mainPhoto: true
          }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        chatId: parseInt(chatId),
        senderId: parseInt(senderId),
        senderType,
        content,
        isRead: false
      }
    });

    // Prepare the message for broadcasting
    const messageToSend = {
      ...newMessage,
      sender: senderType === 'USER' 
        ? { id: chat.user.id, name: chat.user.name, profileImage: chat.user.profileImage }
        : { id: chat.hostelOwner.id, name: chat.hostelOwner.ownerName, image: chat.hostelOwner.mainPhoto }
    };

    // Create notification for the recipient
    if (senderType === 'USER') {
      // Create notification for hostel owner
      await prisma.hostelOwnerNotification.create({
        data: {
          hostelOwnerId: chat.hostelOwnerId,
          title: 'New Message',
          message: `You have a new message from ${chat.user.name}`,
          type: 'MESSAGE',
          isRead: false
        }
      });

      // Try to emit socket events
      try {
        const io = socketManager.getIO();
        // Broadcast to all in the chat room
        io.to(`chat_${chatId}`).emit('receive_message', messageToSend);
        // Also send directly to the hostel owner
        io.to(`hostelOwner_${chat.hostelOwnerId}`).emit('new_notification', {
          type: 'MESSAGE',
          chatId: chat.id,
          message: `New message from ${chat.user.name}`
        });
      } catch (socketError) {
        console.error('Socket not initialized or error emitting message:', socketError);
        // Continue with HTTP response even if socket fails
      }
    } else {
      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: chat.userId,
          title: 'New Message',
          message: `You have a new message from ${chat.hostelOwner.hostelName}`,
          type: 'MESSAGE',
          isRead: false
        }
      });

      // Try to emit socket events
      try {
        const io = socketManager.getIO();
        // Broadcast to all in the chat room
        io.to(`chat_${chatId}`).emit('receive_message', messageToSend);
        // Also send directly to the user
        io.to(`user_${chat.userId}`).emit('new_notification', {
          type: 'MESSAGE',
          chatId: chat.id,
          message: `New message from ${chat.hostelOwner.hostelName}`
        });
      } catch (socketError) {
        console.error('Socket not initialized or error emitting message:', socketError);
        // Continue with HTTP response even if socket fails
      }
    }

    return res.status(201).json({
      success: true,
      message: messageToSend
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message
    });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { chatId, readerType } = req.body;

    if (!chatId || !readerType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Get the chat to verify permissions
    const chat = await prisma.chat.findUnique({
      where: {
        id: parseInt(chatId)
      }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    // Verify the reader is part of the chat
    if (
      (readerType === 'USER' && chat.userId !== req.user.id) ||
      (readerType === 'HOSTEL_OWNER' && chat.hostelOwnerId !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized reader"
      });
    }

    // Determine which messages to mark as read
    const senderTypeToMark = readerType === 'USER' ? 'HOSTEL_OWNER' : 'USER';

    // Update messages
    await prisma.message.updateMany({
      where: {
        chatId: parseInt(chatId),
        senderType: senderTypeToMark,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    // Try to emit socket events for real-time read receipts
    try {
      const io = socketManager.getIO();
      const readerId = readerType === 'USER' ? chat.userId : chat.hostelOwnerId;
      
      // Emit to the chat room that messages have been read
      io.to(`chat_${chatId}`).emit('messages_read', {
        chatId: parseInt(chatId),
        readerType,
        readerId
      });
    } catch (socketError) {
      console.error('Socket not initialized or error emitting read status:', socketError);
      // Continue with HTTP response even if socket fails
    }

    return res.status(200).json({
      success: true,
      message: "Messages marked as read"
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message
    });
  }
};

// Get unread message count for a user
exports.getUserUnreadCount = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Ensure the requesting user is allowed to access this information
    if (req.user.id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to access this information" 
      });
    }

    // Count unread messages in a single query with a join
    const unreadCount = await prisma.message.count({
      where: {
        chat: {
          userId: userId
        },
        senderType: 'HOSTEL_OWNER',
        isRead: false
      }
    });

    return res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error("Error getting user unread count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message
    });
  }
};

// Get unread message count for a hostel owner
exports.getHostelOwnerUnreadCount = async (req, res) => {
  try {
    const hostelOwnerId = parseInt(req.params.hostelOwnerId);
    
    // Ensure the requesting user is allowed to access this information
    if (req.user.id !== hostelOwnerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: "Not authorized to access this information" 
      });
    }

    // Count unread messages in a single query with a join
    const unreadCount = await prisma.message.count({
      where: {
        chat: {
          hostelOwnerId: hostelOwnerId
        },
        senderType: 'USER',
        isRead: false
      }
    });

    return res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error("Error getting hostel owner unread count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message
    });
  }
};