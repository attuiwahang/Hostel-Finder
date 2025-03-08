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
    updatePaymentStatus
  } = require("../controller/BookingController");
  
  const { 
    Payment, 
    confirmPayment 
  } = require("../controller/PaymentController");
  
  const router = require("express").Router();
  
  // Booking routes
  router.post("/", bookHostel);
  router.get("/", getAllBookings);
  router.get("/stats", getBookingStats);
  router.get("/:id", getBookingById);
  router.patch("/:id/status", updateBookingStatus);
  router.delete("/:id", deleteBooking);
  
  // User-specific booking routes
  router.get("/user/:userId", getUserBookings);
  
  // Hostel owner-specific booking routes
  router.get("/hostel/:hostelOwnerId", getHostelOwnerBookings);
  
  // Payment routes (from original controller)
  router.post('/payment', Payment);
  router.get('/confirmpayment', confirmPayment);
  
  // New payment routes (from expanded controller)
  router.post('/:bookingId/payment', createPayment);
  router.patch('/payment/:pidx/status', updatePaymentStatus);
  
  module.exports = router;