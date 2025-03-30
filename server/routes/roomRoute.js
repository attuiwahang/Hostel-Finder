const express = require('express');
const router = express.Router();
const roomController = require('../controller/roomController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes
router.get('/types', roomController.getRoomTypes);
router.get('/available', roomController.getAvailableRooms);
router.get('/:id', roomController.getRoomById);
router.get('/', roomController.getAllRooms);

// Protected routes (hostel owner only)
router.post('/',authMiddleware, roomController.createRoom);
router.put('/:id',authMiddleware, roomController.updateRoom);
router.delete('/:id',authMiddleware, roomController.deleteRoom);
router.patch('/beds/:bedId',authMiddleware, roomController.toggleBedStatus);
router.post('/assign',authMiddleware, roomController.assignRoomToBooking);

module.exports = router;