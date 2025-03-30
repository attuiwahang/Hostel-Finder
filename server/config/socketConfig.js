const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken'); // You'll need to install this package

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
          cleanToken
        });
        
        // Store cleaned token
        socket.token = cleanToken;
        
        // Set userId if provided
        if (userId !== null && userId !== undefined) {
          const parsedUserId = parseInt(userId);
          socket.userId = parsedUserId;
          socket.join(`user_${parsedUserId}`);
          console.log(`User ${parsedUserId} authenticated`);
        }
        
        // Set hostelOwnerId if provided
        if (hostelOwnerId !== null && hostelOwnerId !== undefined) {
          const parsedHostelOwnerId = parseInt(hostelOwnerId);
          socket.hostelOwnerId = parsedHostelOwnerId;
          socket.join(`hostelOwner_${parsedHostelOwnerId}`);
          console.log(`Hostel Owner ${parsedHostelOwnerId} authenticated`);
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
          await prisma.hostelOwnerNotification.create({
            data: {
              hostelOwnerId: chat.hostelOwnerId,
              title: 'New Message',
              message: `You have a new message from ${chat.user.name}`,
              type: 'MESSAGE',
              isRead: false
            }
          });

          // Notify hostel owner via socket
          io.to(`hostelOwner_${chat.hostelOwnerId}`).emit("new_notification", {
            type: 'MESSAGE',
            chatId: chat.id,
            message: `New message from ${chat.user.name}`
          });
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

          // Notify user via socket
          io.to(`user_${chat.userId}`).emit("new_notification", {
            type: 'MESSAGE',
            chatId: chat.id,
            message: `New message from ${chat.hostelOwner.hostelName}`
          });
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
        } else {
          io.to(`user_${chat.userId}`).emit("messages_read", {
            chatId: parsedChatId,
            readerType,
            readerId: parsedReaderId,
            count: result.count
          });
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

// Rest of the file remains unchanged
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

const safeGetIO = () => {
  return io;
};

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

module.exports = {
  initializeSocket,
  getIO,
  safeGetIO,
  emitToRoom,
  emitToUser,
  emitToHostelOwner,
  broadcastToAll
};