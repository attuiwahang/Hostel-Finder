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

// Authentication with the socket server
const authenticateSocket = (userData) => {
  if (!socket.connected) {
    connectSocket();
  }
  
  const authData = {
    userId: userData.role === 'STUDENT' ? userData.id : null,
    hostelOwnerId: userData.role === 'HOSTEL_OWNER' ? userData.id : null,
    token: userData.token
  };
  
  socket.emit('authenticate', authData);
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

// Typing indicators
const sendTypingIndicator = (chatId, userId, hostelOwnerId) => {
  socket.emit('typing', { chatId, userId, hostelOwnerId });
};

const sendStopTypingIndicator = (chatId, userId, hostelOwnerId) => {
  socket.emit('stop_typing', { chatId, userId, hostelOwnerId });
};

// Mark messages as read
const markMessagesAsRead = (chatId, readerType, readerId) => {
  socket.emit('mark_read', { chatId, readerType, readerId });
};

// Create chat room ID from user and hostel IDs
const createChatRoomId = (userId, hostelOwnerId) => {
  return `chat_${userId}_${hostelOwnerId}`;
};

// ============ NOTIFICATION FUNCTIONS ============

// Fetch notifications from server
const fetchNotifications = (type, page = 1, limit = 10) => {
  socket.emit('fetch_notifications', { type, page, limit });
};

// Mark a notification as read
const markNotificationRead = (notificationId, userType) => {
  socket.emit('mark_notification_read', { notificationId, userType });
};

// Mark all notifications as read
const markAllNotificationsRead = (userType) => {
  socket.emit('mark_all_notifications_read', { userType });
};

// Listen for new notifications
const onNewNotification = (callback) => {
  socket.on('new_notification', callback);
};

// Listen for unread notification count updates
const onUnreadNotificationsCount = (callback) => {
  socket.on('unread_notifications_count', callback);
};

// Listen for notification list updates
const onNotificationsList = (callback) => {
  socket.on('notifications_list', callback);
};

// Listen for notification marked as read confirmation
const onNotificationMarkedRead = (callback) => {
  socket.on('notification_marked_read', callback);
};

// Listen for all notifications marked as read confirmation
const onAllNotificationsMarkedRead = (callback) => {
  socket.on('all_notifications_marked_read', callback);
};

// Remove notification listeners when no longer needed
const removeNotificationListeners = () => {
  socket.off('new_notification');
  socket.off('unread_notifications_count');
  socket.off('notifications_list');
  socket.off('notification_marked_read');
  socket.off('all_notifications_marked_read');
};

// Send booking notifications
const sendBookingNotification = (data) => {
  socket.emit('booking_notification', data);
};

// ============ CHAT MESSAGE LISTENERS ============

// Listen for incoming messages
const onReceiveMessage = (callback) => {
  socket.on('receive_message', callback);
};

// Listen for typing indicators
const onUserTyping = (callback) => {
  socket.on('user_typing', callback);
};

// Listen for stop typing indicators
const onUserStopTyping = (callback) => {
  socket.on('user_stop_typing', callback);
};

// Listen for messages read acknowledgment
const onMessagesRead = (callback) => {
  socket.on('messages_read', callback);
};

// Listen for message sent confirmation
const onMessageSent = (callback) => {
  socket.on('message_sent', callback);
};

// Listen for join chat confirmation
const onJoinedChat = (callback) => {
  socket.on('joined_chat', callback);
};

// Listen for authentication confirmation
const onAuthenticated = (callback) => {
  socket.on('authenticated', callback);
};

// Listen for socket errors
const onSocketError = (callback) => {
  socket.on('error', callback);
};

// Remove chat listeners when no longer needed
const removeChatListeners = () => {
  socket.off('receive_message');
  socket.off('user_typing');
  socket.off('user_stop_typing');
  socket.off('messages_read');
  socket.off('message_sent');
  socket.off('joined_chat');
};

// Remove all listeners
const removeAllListeners = () => {
  removeChatListeners();
  removeNotificationListeners();
  socket.off('authenticated');
  socket.off('error');
};

export {
  socket,
  connectSocket,
  disconnectSocket,
  authenticateSocket,
  joinRoom,
  leaveRoom,
  sendMessage,
  sendTypingIndicator,
  sendStopTypingIndicator,
  markMessagesAsRead,
  createChatRoomId,
  sendBookingNotification,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  onNewNotification,
  onUnreadNotificationsCount,
  onNotificationsList,
  onNotificationMarkedRead,
  onAllNotificationsMarkedRead,
  onReceiveMessage,
  onUserTyping,
  onUserStopTyping,
  onMessagesRead,
  onMessageSent,
  onJoinedChat,
  onAuthenticated,
  onSocketError,
  removeChatListeners,
  removeNotificationListeners,
  removeAllListeners
};