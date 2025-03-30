// src/utils/socketService.js
import { io } from 'socket.io-client';

// Initialize socket connection
const socket = io('http://localhost:8870', {
  withCredentials: true,
  autoConnect: false
});

// Connection management
const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Room management
const joinRoom = (roomId) => {
  socket.emit('join_room', roomId);
};

const leaveRoom = (roomId) => {
  socket.emit('leave_room', roomId);
};

// Message handling
const sendMessage = (messageData) => {
  socket.emit('send_message', messageData);
};

// Create chat room ID from user and hostel IDs
const createChatRoomId = (userId, hostelOwnerId) => {
  return `chat_${userId}_${hostelOwnerId}`;
};

// Booking notifications
const sendBookingNotification = (data) => {
  socket.emit('booking_notification', data);
};

export {
  socket,
  connectSocket,
  disconnectSocket,
  joinRoom,
  leaveRoom,
  sendMessage,
  createChatRoomId,
  sendBookingNotification
};