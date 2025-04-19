const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const socketService = require("../config/socketConfig"); 

// Get user notifications
exports.getUserNotifications = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: "Access denied. User permissions required." });
    }
    const userId = req.user.id;
    const { page = 1, limit = 10, isRead } = req.query;
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter object
    const filter = { userId: Number(userId) };
    
    // Add isRead filter if provided
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    // Get total count
    const totalNotifications = await prisma.notification.count({
      where: filter
    });
    
    // Get notifications with pagination
    const notifications = await prisma.notification.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: Number(limit)
    });
    
    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: Number(userId),
        isRead: false
      }
    });
    
    return res.status(200).json({
      notifications,
      unreadCount,
      pagination: {
        total: totalNotifications,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalNotifications / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    return res.status(500).json({
      message: "An error occurred while fetching notifications",
      error: error.message
    });
  }
};

// Get hostel owner notifications
exports.getHostelOwnerNotifications = async (req, res) => {
  try {

    console.log(req.user.role)
    // Check if user has appropriate role
    if (req.user.role !== 'hostelOwner') {
      return res.status(403).json({ message: "Access denied. Hostel owner permissions required." });
    }

    const hostelOwnerId = req.user.id;
    const { page = 1, limit = 10, isRead } = req.query;
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter object
    const filter = { hostelOwnerId: Number(hostelOwnerId) };
    
    // Add isRead filter if provided
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    // Get total count
    const totalNotifications = await prisma.hostelOwnerNotification.count({
      where: filter
    });
    
    // Get notifications with pagination
    const notifications = await prisma.hostelOwnerNotification.findMany({
      where: filter,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: Number(limit)
    });
    
    // Get unread count
    const unreadCount = await prisma.hostelOwnerNotification.count({
      where: {
        hostelOwnerId: Number(hostelOwnerId),
        isRead: false
      }
    });
    
    return res.status(200).json({
      notifications,
      unreadCount,
      pagination: {
        total: totalNotifications,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalNotifications / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching hostel owner notifications:", error);
    return res.status(500).json({
      message: "An error occurred while fetching notifications",
      error: error.message
    });
  }
};

// Mark user notification as read
exports.markUserNotificationAsRead = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: "Access denied. User permissions required." });
    }
    
    const userId = req.user.id;
    const { notificationId } = req.params;
    
    // Verify notification exists and belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id: Number(notificationId),
        userId: Number(userId)
      }
    });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id: Number(notificationId) },
      data: { isRead: true }
    });
    
    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: Number(userId),
        isRead: false
      }
    });
    
    // Send updated count via socket
    socketService.emitToUser(userId, "unread_notifications_count", { count: unreadCount });
    
    return res.status(200).json({
      message: "Notification marked as read",
      notification: updatedNotification,
      unreadCount
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      message: "An error occurred while updating the notification",
      error: error.message
    });
  }
};

// Mark hostel owner notification as read
exports.markHostelOwnerNotificationAsRead = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (req.user.role !== 'HOSTEL_OWNER') {
      return res.status(403).json({ message: "Access denied. Hostel owner permissions required." });
    }
    
    const hostelOwnerId = req.user.id;
    const { notificationId } = req.params;
    
    // Verify notification exists and belongs to the hostel owner
    const notification = await prisma.hostelOwnerNotification.findFirst({
      where: {
        id: Number(notificationId),
        hostelOwnerId: Number(hostelOwnerId)
      }
    });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Update notification
    const updatedNotification = await prisma.hostelOwnerNotification.update({
      where: { id: Number(notificationId) },
      data: { isRead: true }
    });
    
    // Get updated unread count
    const unreadCount = await prisma.hostelOwnerNotification.count({
      where: {
        hostelOwnerId: Number(hostelOwnerId),
        isRead: false
      }
    });
    
    // Send updated count via socket
    socketService.emitToHostelOwner(hostelOwnerId, "unread_notifications_count", { count: unreadCount });
    
    return res.status(200).json({
      message: "Notification marked as read",
      notification: updatedNotification,
      unreadCount
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({
      message: "An error occurred while updating the notification",
      error: error.message
    });
  }
};

// Mark all user notifications as read
exports.markAllUserNotificationsAsRead = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: "Access denied. User permissions required." });
    }
    
    const userId = req.user.id;
    
    // Update all unread notifications for the user
    const updateResult = await prisma.notification.updateMany({
      where: {
        userId: Number(userId),
        isRead: false
      },
      data: { isRead: true }
    });
    
    // Send updated count via socket (which is now 0)
    socketService.emitToUser(userId, "unread_notifications_count", { count: 0 });
    
    return res.status(200).json({
      message: "All notifications marked as read",
      count: updateResult.count
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      message: "An error occurred while updating notifications",
      error: error.message
    });
  }
};

// Mark all hostel owner notifications as read
exports.markAllHostelOwnerNotificationsAsRead = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (req.user.role !== 'HOSTEL_OWNER') {
      return res.status(403).json({ message: "Access denied. Hostel owner permissions required." });
    }
    
    const hostelOwnerId = req.user.id;
    
    // Update all unread notifications for the hostel owner
    const updateResult = await prisma.hostelOwnerNotification.updateMany({
      where: {
        hostelOwnerId: Number(hostelOwnerId),
        isRead: false
      },
      data: { isRead: true }
    });
    
    // Send updated count via socket (which is now 0)
    socketService.emitToHostelOwner(hostelOwnerId, "unread_notifications_count", { count: 0 });
    
    return res.status(200).json({
      message: "All notifications marked as read",
      count: updateResult.count
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({
      message: "An error occurred while updating notifications",
      error: error.message
    });
  }
};

// Delete a user notification
exports.deleteUserNotification = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: "Access denied. User permissions required." });
    }
    
    const userId = req.user.id;
    const { notificationId } = req.params;
    
    // Verify notification exists and belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id: Number(notificationId),
        userId: Number(userId)
      }
    });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Delete the notification
    await prisma.notification.delete({
      where: { id: Number(notificationId) }
    });
    
    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: Number(userId),
        isRead: false
      }
    });
    
    // Send updated count via socket
    socketService.emitToUser(userId, "unread_notifications_count", { count: unreadCount });
    
    return res.status(200).json({
      message: "Notification deleted successfully",
      unreadCount
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the notification",
      error: error.message
    });
  }
};

// Delete a hostel owner notification
exports.deleteHostelOwnerNotification = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (req.user.role !== 'HOSTEL_OWNER') {
      return res.status(403).json({ message: "Access denied. Hostel owner permissions required." });
    }
    
    const hostelOwnerId = req.user.id;
    const { notificationId } = req.params;
    
    // Verify notification exists and belongs to the hostel owner
    const notification = await prisma.hostelOwnerNotification.findFirst({
      where: {
        id: Number(notificationId),
        hostelOwnerId: Number(hostelOwnerId)
      }
    });
    
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Delete the notification
    await prisma.hostelOwnerNotification.delete({
      where: { id: Number(notificationId) }
    });
    
    // Get updated unread count
    const unreadCount = await prisma.hostelOwnerNotification.count({
      where: {
        hostelOwnerId: Number(hostelOwnerId),
        isRead: false
      }
    });
    
    // Send updated count via socket
    socketService.emitToHostelOwner(hostelOwnerId, "unread_notifications_count", { count: unreadCount });
    
    return res.status(200).json({
      message: "Notification deleted successfully",
      unreadCount
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the notification",
      error: error.message
    });
  }
};

// Delete all read user notifications
exports.deleteAllReadUserNotifications = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({ message: "Access denied. User permissions required." });
    }
    
    const userId = req.user.id;
    
    // Delete all read notifications for the user
    const deleteResult = await prisma.notification.deleteMany({
      where: {
        userId: Number(userId),
        isRead: true
      }
    });
    
    return res.status(200).json({
      message: "All read notifications deleted successfully",
      count: deleteResult.count
    });
  } catch (error) {
    console.error("Error deleting read notifications:", error);
    return res.status(500).json({
      message: "An error occurred while deleting notifications",
      error: error.message
    });
  }
};

// Delete all read hostel owner notifications
exports.deleteAllReadHostelOwnerNotifications = async (req, res) => {
  try {
    // Check if user has appropriate role
    if (req.user.role !== 'HOSTEL_OWNER') {
      return res.status(403).json({ message: "Access denied. Hostel owner permissions required." });
    }
    
    const hostelOwnerId = req.user.id;
    
    // Delete all read notifications for the hostel owner
    const deleteResult = await prisma.hostelOwnerNotification.deleteMany({
      where: {
        hostelOwnerId: Number(hostelOwnerId),
        isRead: true
      }
    });
    
    return res.status(200).json({
      message: "All read notifications deleted successfully",
      count: deleteResult.count
    });
  } catch (error) {
    console.error("Error deleting read notifications:", error);
    return res.status(500).json({
      message: "An error occurred while deleting notifications",
      error: error.message
    });
  }
};

// Create a broadcast notification (admin only)
exports.createBroadcastNotification = async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Access denied. Admin permissions required." });
    }
    
    const { title, message, receiverType, type, linkUrl, expiresAt } = req.body;
    
    // Validate required fields
    if (!title || !message || !receiverType || !type) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    
    // Validate receiver type
    if (!['USER', 'HOSTEL_OWNER', 'ALL'].includes(receiverType)) {
      return res.status(400).json({ message: "Invalid receiver type" });
    }
    
    // Create broadcast notification
    const result = await socketService.createBroadcastNotification(
      title,
      message,
      receiverType,
      type,
      linkUrl,
      expiresAt ? new Date(expiresAt) : null
    );
    
    if (!result) {
      return res.status(500).json({ message: "Failed to create broadcast notification" });
    }
    
    return res.status(201).json({
      message: "Broadcast notification created successfully",
      notification: result
    });
  } catch (error) {
    console.error("Error creating broadcast notification:", error);
    return res.status(500).json({
      message: "An error occurred while creating the broadcast notification",
      error: error.message
    });
  }
};

// Get notification statistics (admin only)
exports.getNotificationStats = async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: "Access denied. Admin permissions required." });
    }
    
    // Count user notifications by type
    const userNotificationsByType = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count 
      FROM Notification 
      GROUP BY type
    `;
    
    // Count hostel owner notifications by type
    const hostelOwnerNotificationsByType = await prisma.$queryRaw`
      SELECT type, COUNT(*) as count 
      FROM HostelOwnerNotification 
      GROUP BY type
    `;
    
    // Count read vs unread notifications
    const readStatus = await prisma.$queryRaw`
      SELECT 'USER' as userType, isRead, COUNT(*) as count
      FROM Notification
      GROUP BY isRead
      UNION
      SELECT 'HOSTEL_OWNER' as userType, isRead, COUNT(*) as count
      FROM HostelOwnerNotification
      GROUP BY isRead
    `;
    
    // Recent broadcast notifications
    const recentBroadcasts = await prisma.broadcastNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Convert BigInt values to regular numbers
    const processResults = (data) => {
      return data.map(item => {
        const processed = {};
        for (const [key, value] of Object.entries(item)) {
          processed[key] = typeof value === 'bigint' ? Number(value) : value;
        }
        return processed;
      });
    };
    
    return res.status(200).json({
      userNotificationsByType: processResults(userNotificationsByType),
      hostelOwnerNotificationsByType: processResults(hostelOwnerNotificationsByType),
      readStatus: processResults(readStatus),
      recentBroadcasts
    });
  } catch (error) {
    console.error("Error fetching notification statistics:", error);
    return res.status(500).json({
      message: "An error occurred while fetching notification statistics",
      error: error.message
    });
  }
};