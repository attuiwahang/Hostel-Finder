const { 
    bookHostel,
    getAllBookings,
    getBookingById,
    getUserBookings,
    getHostelOwnerBookings,
    updateBookingStatus,
    deleteBooking,
    getBookingStats,
    createPayment,
    updatePaymentStatus,createBookingByHostelOwner
  } = require("../controller/BookingController");
  const { authMiddleware } = require("../middleware/authMiddleware");
  const { 
    Payment, 
    confirmPayment 
  } = require("../controller/PaymentController");
  
  const router = require("express").Router();
  
  // Booking routes
  router.post("/", bookHostel);
  router.get("/", getAllBookings);
  router.get("/stats", getBookingStats);
  router.get("/singleBooking/:id", getBookingById);
  router.put("/:id", updateBookingStatus);
  router.delete("/:id", deleteBooking);
  
  // User-specific booking routes
  router.get("/userBookings", authMiddleware, getUserBookings);
  
  // Hostel owner-specific booking routes
  router.get("/:hostelOwnerId", getHostelOwnerBookings);
  router.post("/direct-booking", authMiddleware, createBookingByHostelOwner); // New endpoint for hostel owners

  
  // Payment routes (from original controller)
  router.post('/payment', Payment);
  router.get('/confirmpayment', confirmPayment);
  
  // New payment routes (from expanded controller)
  router.post('/:bookingId/payment', createPayment);
  router.patch('/payment/:pidx/status', updatePaymentStatus);
  
  module.exports = router;