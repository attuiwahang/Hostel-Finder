const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

// User notification routes
router.get('/user', authMiddleware, notificationController.getUserNotifications);
router.put('/user/:notificationId/read', authMiddleware, notificationController.markUserNotificationAsRead);
router.put('/user/read-all', authMiddleware, notificationController.markAllUserNotificationsAsRead);
router.delete('/user/:notificationId', authMiddleware, notificationController.deleteUserNotification);
router.delete('/user/read', authMiddleware, notificationController.deleteAllReadUserNotifications);

// Hostel owner notification routes
router.get('/hostel-owner', authMiddleware, notificationController.getHostelOwnerNotifications);
router.put('/hostel-owner/:notificationId/read', authMiddleware, notificationController.markHostelOwnerNotificationAsRead);
router.put('/hostel-owner/read-all', authMiddleware, notificationController.markAllHostelOwnerNotificationsAsRead);
router.delete('/hostel-owner/:notificationId', authMiddleware, notificationController.deleteHostelOwnerNotification);
router.delete('/hostel-owner/read', authMiddleware, notificationController.deleteAllReadHostelOwnerNotifications);

// Admin notification routes
router.post('/broadcast', authMiddleware, notificationController.createBroadcastNotification);
router.get('/stats', authMiddleware, notificationController.getNotificationStats);

module.exports = router;