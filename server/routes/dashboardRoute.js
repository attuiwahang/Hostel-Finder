const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const dashboardController = require("../controller/dashboardController");

// Main dashboard statistics endpoint
router.get("/hostel-owner/:id/stats", authMiddleware, dashboardController.getDashboardStats);

// Booking trends endpoint
router.get("/hostel-owner/:id/booking-trends", authMiddleware, dashboardController.getBookingTrends);

// Occupancy details endpoint
router.get("/hostel-owner/:id/occupancy", authMiddleware, dashboardController.getOccupancyDetails);

// Financial summary endpoint
router.get("/hostel-owner/:id/financials", authMiddleware, dashboardController.getFinancialSummary);

// Guest insights endpoint
router.get("/hostel-owner/:id/guest-insights", authMiddleware, dashboardController.getGuestInsights);

module.exports = router;