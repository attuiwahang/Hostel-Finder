const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

let io;

// Initialize Socket.IO
const initializeSocket = (server) => {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    // Add pingTimeout and pingInterval settings for better connection reliability
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Authentication middleware - SIMPLIFIED VERSION
    socket.use(async ([event, data], next) => {
      // Always allow these events without authentication
      if (event === 'authenticate' || event === 'error' || event === 'disconnect') {
        return next();
      }
      
      // Log the event for debugging
      console.log(`Socket ${socket.id} event: ${event}`, data ? 'with data' : 'no data');
      
      // Check if socket is authenticated
      if (!socket.authenticated) {
        console.log(`Socket ${socket.id} requires authentication for event ${event}`);
        return next(new Error('Authentication required'));
      }
      
      // Successfully authenticated
      next();
    });

    // Authentication event with improved handling
    socket.on("authenticate", ({ userId, hostelOwnerId, token }) => {
      try {
        // Clean the token in case it has additional quotes
        const cleanToken = typeof token === 'string' ? token.replace(/^"|"$/g, '') : token;
        
        console.log(`Socket ${socket.id} authentication attempt:`, { 
          userId: userId !== null ? userId : 'not provided', 
          hostelOwnerId: hostelOwnerId !== null ? hostelOwnerId : 'not provided',
          tokenPresent: !!cleanToken,
        });
        
        // Store cleaned token
        socket.token = cleanToken;
        
        // Set userId if provided
        if (userId !== null && userId !== undefined) {
          const parsedUserId = parseInt(userId);
          socket.userId = parsedUserId;
          socket.join(`user_${parsedUserId}`);
          console.log(`User ${parsedUserId} authenticated`);
          
          // Fetch unread notifications count after authentication
          fetchAndSendUnreadNotificationsCount(socket, 'USER', parsedUserId);
        }
        
        // Set hostelOwnerId if provided
        if (hostelOwnerId !== null && hostelOwnerId !== undefined) {
          const parsedHostelOwnerId = parseInt(hostelOwnerId);
          socket.hostelOwnerId = parsedHostelOwnerId;
          socket.join(`hostelOwner_${parsedHostelOwnerId}`);
          console.log(`Hostel Owner ${parsedHostelOwnerId} authenticated`);
          
          // Fetch unread notifications count after authentication
          fetchAndSendUnreadNotificationsCount(socket, 'HOSTEL_OWNER', parsedHostelOwnerId);
        }
        
        // Mark socket as authenticated
        socket.authenticated = true;
        
        // Send acknowledgment back to client
        socket.emit('authenticated', { 
          status: 'success',
          userId: socket.userId,
          hostelOwnerId: socket.hostelOwnerId 
        });
      } catch (error) {
        console.error(`Authentication error for socket ${socket.id}:`, error);
        socket.emit("error", { message: "Authentication failed: " + error.message });
      }
    });

    // NOTIFICATION-SPECIFIC EVENTS

    // Fetch notifications
    socket.on("fetch_notifications", async ({ type, page = 1, limit = 10 }) => {
      try {
        if (!socket.authenticated) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }

        let notifications = [];
        let totalCount = 0;
        
        // Determine user type and ID
        const isUser = !!socket.userId;
        const isHostelOwner = !!socket.hostelOwnerId;
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        if (isUser) {
          // Fetch user notifications
          [notifications, totalCount] = await Promise.all([
            prisma.notification.findMany({
              where: { userId: socket.userId },
              orderBy: { createdAt: 'desc' },
              skip,
              take: limit,
            }),
            prisma.notification.count({
              where: { userId: socket.userId }
            })
          ]);
        } else if (isHostelOwner) {
          // Fetch hostel owner notifications
          [notifications, totalCount] = await Promise.all([
            prisma.hostelOwnerNotification.findMany({
              where: { hostelOwnerId: socket.hostelOwnerId },
              orderBy: { createdAt: 'desc' },
              skip,
              take: limit,
            }),
            prisma.hostelOwnerNotification.count({
              where: { hostelOwnerId: socket.hostelOwnerId }
            })
          ]);
        }
        
        socket.emit("notifications_list", {
          notifications,
          pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit)
          }
        });
      } catch (error) {
        console.error("Error fetching notifications:", error);
        socket.emit("error", { message: "Failed to fetch notifications: " + error.message });
      }
    });

    // Mark notification as read
    socket.on("mark_notification_read", async ({ notificationId, userType }) => {
      try {
        if (!socket.authenticated) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }
        
        if (!notificationId) {
          socket.emit("error", { message: "Notification ID is required" });
          return;
        }
        
        const isUser = userType === 'USER' && !!socket.userId;
        const isHostelOwner = userType === 'HOSTEL_OWNER' && !!socket.hostelOwnerId;
        
        let updatedNotification;
        
        if (isUser) {
          // Update user notification
          updatedNotification = await prisma.notification.update({
            where: { 
              id: parseInt(notificationId),
              userId: socket.userId  // Ensure the notification belongs to this user
            },
            data: { isRead: true }
          });
          
          // Send updated unread count
          fetchAndSendUnreadNotificationsCount(socket, 'USER', socket.userId);
        } else if (isHostelOwner) {
          // Update hostel owner notification
          updatedNotification = await prisma.hostelOwnerNotification.update({
            where: { 
              id: parseInt(notificationId),
              hostelOwnerId: socket.hostelOwnerId  // Ensure the notification belongs to this hostel owner
            },
            data: { isRead: true }
          });
          
          // Send updated unread count
          fetchAndSendUnreadNotificationsCount(socket, 'HOSTEL_OWNER', socket.hostelOwnerId);
        } else {
          socket.emit("error", { message: "Invalid user type or not authenticated" });
          return;
        }
        
        socket.emit("notification_marked_read", {
          notificationId: updatedNotification.id,
          success: true
        });
      } catch (error) {
        console.error("Error marking notification as read:", error);
        socket.emit("error", { message: "Failed to mark notification as read: " + error.message });
      }
    });

    // Mark all notifications as read
    socket.on("mark_all_notifications_read", async ({ userType }) => {
      try {
        if (!socket.authenticated) {
          socket.emit("error", { message: "Authentication required" });
          return;
        }
        
        const isUser = userType === 'USER' && !!socket.userId;
        const isHostelOwner = userType === 'HOSTEL_OWNER' && !!socket.hostelOwnerId;
        
        let result;
        
        if (isUser) {
          // Update all user notifications
          result = await prisma.notification.updateMany({
            where: { 
              userId: socket.userId,
              isRead: false
            },
            data: { isRead: true }
          });
          
          // Send updated unread count (should be 0)
          socket.emit("unread_notifications_count", { count: 0 });
        } else if (isHostelOwner) {
          // Update all hostel owner notifications
          result = await prisma.hostelOwnerNotification.updateMany({
            where: { 
              hostelOwnerId: socket.hostelOwnerId,
              isRead: false
            },
            data: { isRead: true }
          });
          
          // Send updated unread count (should be 0)
          socket.emit("unread_notifications_count", { count: 0 });
        } else {
          socket.emit("error", { message: "Invalid user type or not authenticated" });
          return;
        }
        
        socket.emit("all_notifications_marked_read", {
          count: result.count,
          success: true
        });
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        socket.emit("error", { message: "Failed to mark all notifications as read: " + error.message });
      }
    });

    // Join chat room
    socket.on("join_chat", (chatId) => {
      try {
        if (!chatId) {
          socket.emit("error", { message: "Invalid chat ID" });
          return;
        }
        
        // Ensure chatId is an integer
        const parsedChatId = parseInt(chatId);
        const chatRoomId = `chat_${parsedChatId}`;
        
        socket.join(chatRoomId);
        
        // Let client know they've successfully joined
        socket.emit("joined_chat", { chatId: parsedChatId });
        
        console.log(`Socket ${socket.id} joined chat ${parsedChatId}`);
      } catch (error) {
        console.error(`Error joining chat for socket ${socket.id}:`, error);
        socket.emit("error", { message: "Failed to join chat: " + error.message });
      }
    });

    // Leave chat room
    socket.on("leave_chat", (chatId) => {
      try {
        if (!chatId) {
          socket.emit("error", { message: "Invalid chat ID" });
          return;
        }
        
        // Ensure chatId is an integer
        const parsedChatId = parseInt(chatId);
        const chatRoomId = `chat_${parsedChatId}`;
        
        socket.leave(chatRoomId);
        console.log(`Socket ${socket.id} left chat ${parsedChatId}`);
      } catch (error) {
        console.error(`Error leaving chat for socket ${socket.id}:`, error);
        socket.emit("error", { message: "Failed to leave chat: " + error.message });
      }
    });

    // Handle new message
    socket.on("send_message", async (messageData) => {
      try {
        const { chatId, senderId, senderType, content } = messageData;
        
        console.log(`Received message in chat ${chatId} from ${senderType} ${senderId}`);
        
        // Verify the data
        if (!chatId || !senderId || !senderType || !content) {
          socket.emit("error", { message: "Invalid message data" });
          return;
        }

        // Ensure IDs are integers
        const parsedChatId = parseInt(chatId);
        const parsedSenderId = parseInt(senderId);

        // Verify the sender identity
        if (
          (senderType === 'USER' && socket.userId !== parsedSenderId) ||
          (senderType === 'HOSTEL_OWNER' && socket.hostelOwnerId !== parsedSenderId)
        ) {
          console.log(`Auth mismatch: senderType=${senderType}, senderId=${parsedSenderId}, socketUserId=${socket.userId}, socketHostelOwnerId=${socket.hostelOwnerId}`);
          socket.emit("error", { message: "Unauthorized sender" });
          return;
        }

        // Get the chat
        const chat = await prisma.chat.findUnique({
          where: { id: parsedChatId },
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
          socket.emit("error", { message: "Chat not found" });
          return;
        }

        // Save the message to the database
        const newMessage = await prisma.message.create({
          data: {
            chatId: parsedChatId,
            senderId: parsedSenderId,
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

        // Broadcast to everyone in the chat room
        io.to(`chat_${parsedChatId}`).emit("receive_message", messageToSend);

        // Also emit to individual users/hostel owners (in case they're not in the chat room)
        if (senderType === 'USER') {
          io.to(`hostelOwner_${chat.hostelOwnerId}`).emit("receive_message", messageToSend);
        } else {
          io.to(`user_${chat.userId}`).emit("receive_message", messageToSend);
        }

        // Create notification for the recipient
        if (senderType === 'USER') {
          // Create notification for hostel owner
          const notification = await prisma.hostelOwnerNotification.create({
            data: {
              hostelOwnerId: chat.hostelOwnerId,
              title: 'New Message',
              message: `You have a new message from ${chat.user.name}`,
              type: 'MESSAGE',
              isRead: false,
              linkUrl: `/chats/${chat.id}`
            }
          });

          // Notify hostel owner via socket
          io.to(`hostelOwner_${chat.hostelOwnerId}`).emit("new_notification", {
            ...notification,
            chatId: chat.id,
            sender: {
              id: chat.user.id,
              name: chat.user.name,
              image: chat.user.profileImage
            }
          });
          
          // Send updated unread count to hostel owner
          fetchAndSendUnreadNotificationsCount(io, 'HOSTEL_OWNER', chat.hostelOwnerId);
        } else {
          // Create notification for user
          const notification = await prisma.notification.create({
            data: {
              userId: chat.userId,
              title: 'New Message',
              message: `You have a new message from ${chat.hostelOwner.hostelName}`,
              type: 'MESSAGE',
              isRead: false,
              linkUrl: `/chats/${chat.id}`
            }
          });

          // Notify user via socket
          io.to(`user_${chat.userId}`).emit("new_notification", {
            ...notification,
            chatId: chat.id,
            sender: {
              id: chat.hostelOwner.id,
              name: chat.hostelOwner.hostelName,
              image: chat.hostelOwner.mainPhoto
            }
          });
          
          // Send updated unread count to user
          fetchAndSendUnreadNotificationsCount(io, 'USER', chat.userId);
        }

        // Send acknowledgment back to sender
        socket.emit("message_sent", { 
          status: 'success',
          messageId: newMessage.id,
          timestamp: newMessage.timestamp
        });

        console.log(`Message sent in chat ${parsedChatId}`);
      } catch (error) {
        console.error("Error handling message:", error);
        socket.emit("error", { message: "Failed to process message: " + error.message });
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      try {
        const { chatId, userId, hostelOwnerId } = data;
        
        if (!chatId) {
          socket.emit("error", { message: "Invalid chat ID" });
          return;
        }
        
        // Ensure chatId is an integer
        const parsedChatId = parseInt(chatId);
        
        // Send to everyone in the room except the sender
        socket.to(`chat_${parsedChatId}`).emit("user_typing", { 
          chatId: parsedChatId, 
          userId: userId ? parseInt(userId) : null, 
          hostelOwnerId: hostelOwnerId ? parseInt(hostelOwnerId) : null
        });
      } catch (error) {
        console.error("Error handling typing indicator:", error);
        socket.emit("error", { message: "Failed to process typing indicator: " + error.message });
      }
    });

    // Stop typing indicator
    socket.on("stop_typing", (data) => {
      try {
        const { chatId, userId, hostelOwnerId } = data;
        
        if (!chatId) {
          socket.emit("error", { message: "Invalid chat ID" });
          return;
        }
        
        // Ensure chatId is an integer
        const parsedChatId = parseInt(chatId);
        
        socket.to(`chat_${parsedChatId}`).emit("user_stop_typing", { 
          chatId: parsedChatId, 
          userId: userId ? parseInt(userId) : null, 
          hostelOwnerId: hostelOwnerId ? parseInt(hostelOwnerId) : null
        });
      } catch (error) {
        console.error("Error handling stop typing indicator:", error);
        socket.emit("error", { message: "Failed to process stop typing indicator: " + error.message });
      }
    });

    // Mark messages as read
    socket.on("mark_read", async (data) => {
      try {
        const { chatId, readerType, readerId } = data;
        
        if (!chatId || !readerType || !readerId) {
          socket.emit("error", { message: "Missing required data" });
          return;
        }
        
        // Ensure IDs are integers
        const parsedChatId = parseInt(chatId);
        const parsedReaderId = parseInt(readerId);
        
        // Verify reader identity
        if (
          (readerType === 'USER' && socket.userId !== parsedReaderId) ||
          (readerType === 'HOSTEL_OWNER' && socket.hostelOwnerId !== parsedReaderId)
        ) {
          socket.emit("error", { message: "Unauthorized reader" });
          return;
        }

        // Get the chat
        const chat = await prisma.chat.findUnique({
          where: { id: parsedChatId }
        });

        if (!chat) {
          socket.emit("error", { message: "Chat not found" });
          return;
        }

        // Determine which messages to mark as read
        const senderTypeToMark = readerType === 'USER' ? 'HOSTEL_OWNER' : 'USER';

        // Update messages
        const result = await prisma.message.updateMany({
          where: {
            chatId: parsedChatId,
            senderType: senderTypeToMark,
            isRead: false
          },
          data: {
            isRead: true
          }
        });

        // Emit event to inform that messages have been read
        io.to(`chat_${parsedChatId}`).emit("messages_read", {
          chatId: parsedChatId,
          readerType,
          readerId: parsedReaderId,
          count: result.count
        });

        // Also emit directly to the sender of those messages
        if (readerType === 'USER') {
          io.to(`hostelOwner_${chat.hostelOwnerId}`).emit("messages_read", {
            chatId: parsedChatId,
            readerType,
            readerId: parsedReaderId,
            count: result.count
          });
          
          // Also mark related notifications as read
          if (result.count > 0) {
            await markRelatedNotificationsAsRead('USER', socket.userId, chat.id);
            // Update notification count
            fetchAndSendUnreadNotificationsCount(socket, 'USER', socket.userId);
          }
        } else {
          io.to(`user_${chat.userId}`).emit("messages_read", {
            chatId: parsedChatId,
            readerType,
            readerId: parsedReaderId,
            count: result.count
          });
          
          // Also mark related notifications as read
          if (result.count > 0) {
            await markRelatedNotificationsAsRead('HOSTEL_OWNER', socket.hostelOwnerId, chat.id);
            // Update notification count
            fetchAndSendUnreadNotificationsCount(socket, 'HOSTEL_OWNER', socket.hostelOwnerId);
          }
        }

        console.log(`${result.count} messages marked as read in chat ${parsedChatId} by ${readerType} ${parsedReaderId}`);
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read: " + error.message });
      }
    });

    // Handle reconnection
    socket.on("reconnect_attempt", () => {
      console.log(`Socket ${socket.id} attempting to reconnect`);
    });

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
};

// HELPER FUNCTIONS

// Fetch and send unread notifications count
async function fetchAndSendUnreadNotificationsCount(socketOrIo, userType, id) {
  try {
    let count = 0;
    
    if (userType === 'USER') {
      count = await prisma.notification.count({
        where: {
          userId: id,
          isRead: false
        }
      });
      
      if (socketOrIo.to) {
        // Using io
        socketOrIo.to(`user_${id}`).emit("unread_notifications_count", { count });
      } else {
        // Using socket
        socketOrIo.emit("unread_notifications_count", { count });
      }
    } else if (userType === 'HOSTEL_OWNER') {
      count = await prisma.hostelOwnerNotification.count({
        where: {
          hostelOwnerId: id,
          isRead: false
        }
      });
      
      if (socketOrIo.to) {
        // Using io
        socketOrIo.to(`hostelOwner_${id}`).emit("unread_notifications_count", { count });
      } else {
        // Using socket
        socketOrIo.emit("unread_notifications_count", { count });
      }
    }
  } catch (error) {
    console.error("Error fetching notification count:", error);
  }
}

// Mark related notifications as read (when user reads messages in a chat)
async function markRelatedNotificationsAsRead(userType, userId, chatId) {
  try {
    if (userType === 'USER') {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          type: 'MESSAGE',
          linkUrl: `/chats/${chatId}`,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    } else if (userType === 'HOSTEL_OWNER') {
      await prisma.hostelOwnerNotification.updateMany({
        where: {
          hostelOwnerId: userId,
          type: 'MESSAGE',
          linkUrl: `/chats/${chatId}`,
          isRead: false
        },
        data: {
          isRead: true
        }
      });
    }
  } catch (error) {
    console.error("Error marking related notifications as read:", error);
  }
}

// Get the io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Safely get io instance (does not throw an error if not initialized)
const safeGetIO = () => {
  return io;
};

// Emit event to room
const emitToRoom = (room, event, data) => {
  const socketIO = safeGetIO();
  if (!socketIO) {
    console.error('Socket.IO not initialized, cannot emit to room');
    return false;
  }
  
  try {
    socketIO.to(room).emit(event, data);
    return true;
  } catch (error) {
    console.error(`Error emitting to room ${room}:`, error);
    return false;
  }
};

// Emit event to user
const emitToUser = (userId, event, data) => {
  const socketIO = safeGetIO();
  if (!socketIO) {
    console.error('Socket.IO not initialized, cannot emit to user');
    return false;
  }
  
  try {
    socketIO.to(`user_${userId}`).emit(event, data);
    return true;
  } catch (error) {
    console.error(`Error emitting to user ${userId}:`, error);
    return false;
  }
};

// Emit event to hostel owner
const emitToHostelOwner = (hostelOwnerId, event, data) => {
  const socketIO = safeGetIO();
  if (!socketIO) {
    console.error('Socket.IO not initialized, cannot emit to hostel owner');
    return false;
  }
  
  try {
    socketIO.to(`hostelOwner_${hostelOwnerId}`).emit(event, data);
    return true;
  } catch (error) {
    console.error(`Error emitting to hostel owner ${hostelOwnerId}:`, error);
    return false;
  }
};

// Broadcast event to all clients
const broadcastToAll = (event, data) => {
  const socketIO = safeGetIO();
  if (!socketIO) {
    console.error('Socket.IO not initialized, cannot broadcast');
    return false;
  }
  
  try {
    socketIO.emit(event, data);
    return true;
  } catch (error) {
    console.error('Error broadcasting to all clients:', error);
    return false;
  }
};

// Create a notification for a user
const createUserNotification = async (userId, title, message, type, linkUrl = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl,
        isRead: false
      }
    });
    
    // Send notification via socket
    emitToUser(userId, "new_notification", notification);
    
    // Update unread count
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
    
    emitToUser(userId, "unread_notifications_count", { count });
    
    return notification;
  } catch (error) {
    console.error("Error creating user notification:", error);
    return null;
  }
};

// Create a notification for a hostel owner
const createHostelOwnerNotification = async (hostelOwnerId, title, message, type, linkUrl = null) => {
  try {
    const notification = await prisma.hostelOwnerNotification.create({
      data: {
        hostelOwnerId,
        title,
        message,
        type,
        linkUrl,
        isRead: false
      }
    });
    
    // Send notification via socket
    emitToHostelOwner(hostelOwnerId, "new_notification", notification);
    
    // Update unread count
    const count = await prisma.hostelOwnerNotification.count({
      where: {
        hostelOwnerId,
        isRead: false
      }
    });
    
    emitToHostelOwner(hostelOwnerId, "unread_notifications_count", { count });
    
    return notification;
  } catch (error) {
    console.error("Error creating hostel owner notification:", error);
    return null;
  }
};

// Create a broadcast notification for all users or hostel owners
const createBroadcastNotification = async (title, message, receiverType, type, linkUrl = null) => {
  try {
    // First, create the broadcast notification record
    const broadcastNotification = await prisma.broadcastNotification.create({
      data: {
        title,
        message,
        receiverType,
        type,
        linkUrl,
        isSent: false
      }
    });
    
    // Create individual notifications based on receiver type
    if (receiverType === 'USER' || receiverType === 'ALL') {
      // Get all users
      const users = await prisma.user.findMany({
        select: { id: true }
      });
      
      // Create a notification for each user
      const userNotifications = users.map(user => ({
        userId: user.id,
        title,
        message,
        type,
        linkUrl,
        isRead: false
      }));
      
      // Batch create notifications
      if (userNotifications.length > 0) {
        await prisma.notification.createMany({
          data: userNotifications
        });
        
        // Notify each user via socket
        users.forEach(user => {
          emitToUser(user.id, "new_notification", {
            title,
            message,
            type,
            linkUrl,
            createdAt: new Date()
          });
          
          // We'll need to update unread counts for each user
          fetchAndSendUnreadNotificationsCount(getIO(), 'USER', user.id);
        });
      }
    }
    
    if (receiverType === 'HOSTEL_OWNER' || receiverType === 'ALL') {
      // Get all hostel owners
      const hostelOwners = await prisma.hostelOwner.findMany({
        select: { id: true }
      });
      
      // Create a notification for each hostel owner
      const hostelOwnerNotifications = hostelOwners.map(owner => ({
        hostelOwnerId: owner.id,
        title,
        message,
        type,
        linkUrl,
        isRead: false
      }));
      
      // Batch create notifications
      if (hostelOwnerNotifications.length > 0) {
        await prisma.hostelOwnerNotification.createMany({
          data: hostelOwnerNotifications
        });
        
        // Notify each hostel owner via socket
        hostelOwners.forEach(owner => {
          emitToHostelOwner(owner.id, "new_notification", {
            title,
            message,
            type,
            linkUrl,
            createdAt: new Date()
          });
          
          // Update unread counts for each hostel owner
          fetchAndSendUnreadNotificationsCount(getIO(), 'HOSTEL_OWNER', owner.id);
        });
      }
    }
    
    // Mark broadcast notification as sent
    await prisma.broadcastNotification.update({
      where: { id: broadcastNotification.id },
      data: { isSent: true }
    });
    
    return broadcastNotification;
  } catch (error) {
    console.error("Error creating broadcast notification:", error);
    return null;
  }
};

// Create booking notification
const createBookingNotification = async (booking) => {
  try {
    // Notification for user
    await createUserNotification(
      booking.userId,
      'Booking Update',
      `Your booking for ${booking.hostelOwner.hostelName} has been ${booking.status.toLowerCase()}.`,
      'BOOKING',
      `/bookings/${booking.id}`
    );
    
    // Notification for hostel owner
    await createHostelOwnerNotification(
      booking.hostelOwnerId,
      'New Booking',
      `${booking.userName} has made a booking starting on ${new Date(booking.checkInDate).toLocaleDateString()}.`,
      'BOOKING',
      `/hostel-owner/bookings/${booking.id}`
    );
    
    return true;
  } catch (error) {
    console.error("Error creating booking notification:", error);
    return false;
  }
};

// Create payment notification
const createPaymentNotification = async (payment, booking) => {
  try {
    // Notification for user
    await createUserNotification(
      booking.userId,
      'Payment Update',
      `Your payment of ${payment.amount} for booking #${booking.id} is ${payment.paymentStatus.toLowerCase()}.`,
      'PAYMENT',
      `/bookings/${booking.id}/payments`
    );
    
    // Notification for hostel owner
    await createHostelOwnerNotification(
      booking.hostelOwnerId,
      'Payment Received',
      `Payment of ${payment.amount} received for booking by ${booking.userName}.`,
      'PAYMENT',
      `/hostel-owner/bookings/${booking.id}/payments`
    );
    
    return true;
  } catch (error) {
    console.error("Error creating payment notification:", error);
    return false;
  }
};

// Create review notification
const createReviewNotification = async (review, userDetails, hostelDetails) => {
  try {
    // Notification for hostel owner
    await createHostelOwnerNotification(
      review.hostelOwnerId,
      'New Review',
      `${userDetails.name} has left a ${review.rating}-star review for your hostel.`,
      'REVIEW',
      `/hostel-owner/reviews/${review.id}`
    );
    
    return true;
  } catch (error) {
    console.error("Error creating review notification:", error);
    return false;
  }
};

module.exports = {
  initializeSocket,
  getIO,
  safeGetIO,
  emitToRoom,
  emitToUser,
  emitToHostelOwner,
  broadcastToAll,
  createUserNotification,
  createHostelOwnerNotification,
  createBroadcastNotification,
  createBookingNotification,
  createPaymentNotification,
  createReviewNotification
};