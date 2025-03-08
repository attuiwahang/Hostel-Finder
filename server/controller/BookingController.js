const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new booking
exports.bookHostel = async (req, res) => {
  try {
    const {
      userId,
      hostelOwnerId,
      userName,
      email,
      phoneNumber,
      checkInDate,
      noOfPeople,
    } = req.body;

    console.log("Received request body:", req.body);

    // Validate required fields
    if (!userId || !hostelOwnerId || !userName || !email || !phoneNumber || !checkInDate || !noOfPeople) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Ensure checkInDate is a valid date
    const checkInDateObj = new Date(checkInDate);
    if (isNaN(checkInDateObj.getTime())) {
      return res.status(400).json({ message: "Invalid check-in date format" });
    }

    // Verify that the user exists
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify that the hostel exists
    const hostelOwner = await prisma.hostelOwner.findUnique({
      where: { id: Number(hostelOwnerId) }
    });

    if (!hostelOwner) {
      return res.status(404).json({ message: "Hostel not found" });
    }

    const newBooking = await prisma.booking.create({
      data: {
        userId: Number(userId),
        hostelOwnerId: Number(hostelOwnerId),
        userName,
        email,
        phoneNumber,
        checkInDate: checkInDateObj,
        noOfPeople: Number(noOfPeople),
        status: "PENDING",
      },
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
    });

  } catch (error) {
    console.error("Error booking hostel:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ message: "A booking with this email already exists" });
    }

    return res.status(500).json({
      message: "An error occurred while booking the hostel",
      error: error.message,
    });
  }
};

// Get all bookings (with optional filters)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, userId, hostelOwnerId, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (userId) {
      filter.userId = Number(userId);
    }
    
    if (hostelOwnerId) {
      filter.hostelOwnerId = Number(hostelOwnerId);
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get total count
    const totalBookings = await prisma.booking.count({
      where: filter
    });
    
    // Get bookings with pagination
    const bookings = await prisma.booking.findMany({
      where: filter,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            contact: true
          }
        },
        hostelOwner: {
          select: {
            hostelName: true,
            location: true,
            contact: true
          }
        },
        payments: true
      },
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json({
      bookings,
      pagination: {
        total: totalBookings,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalBookings / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({
      message: "An error occurred while fetching bookings",
      error: error.message
    });
  }
};

// Get booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            contact: true
          }
        },
        hostelOwner: {
          select: {
            hostelName: true,
            location: true,
            contact: true,
            address: true
          }
        },
        payments: true
      }
    });
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    return res.status(200).json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return res.status(500).json({
      message: "An error occurred while fetching the booking",
      error: error.message
    });
  }
};

// Get bookings for a specific user
exports.getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { userId: Number(userId) };
    
    if (status) {
      filter.status = status;
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get total count
    const totalBookings = await prisma.booking.count({
      where: filter
    });
    
    // Get bookings with pagination
    const bookings = await prisma.booking.findMany({
      where: filter,
      include: {
        hostelOwner: {
          select: {
            hostelName: true,
            location: true,
            contact: true,
            mainPhoto: true
          }
        },
        payments: true
      },
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json({
      bookings,
      pagination: {
        total: totalBookings,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalBookings / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return res.status(500).json({
      message: "An error occurred while fetching user bookings",
      error: error.message
    });
  }
};

// Get bookings for a specific hostel owner
exports.getHostelOwnerBookings = async (req, res) => {
  try {
    const { hostelOwnerId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = { hostelOwnerId: Number(hostelOwnerId) };
    
    if (status) {
      filter.status = status;
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get total count
    const totalBookings = await prisma.booking.count({
      where: filter
    });
    
    // Get bookings with pagination
    const bookings = await prisma.booking.findMany({
      where: filter,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            contact: true
          }
        },
        payments: true
      },
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Group by booking status
    const bookingStats = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM Booking 
      WHERE hostelOwnerId = ${Number(hostelOwnerId)} 
      GROUP BY status
    `;
    
    return res.status(200).json({
      bookings,
      stats: bookingStats,
      pagination: {
        total: totalBookings,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalBookings / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching hostel owner bookings:", error);
    return res.status(500).json({
      message: "An error occurred while fetching hostel owner bookings",
      error: error.message
    });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!status || !['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        hostelOwner: {
          select: {
            hostelName: true
          }
        }
      }
    });
    
    // Here you could add notification logic (email, SMS, etc.)
    
    return res.status(200).json({
      message: `Booking status updated to ${status}`,
      booking: updatedBooking
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({
      message: "An error occurred while updating the booking status",
      error: error.message
    });
  }
};

// Delete booking
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check for related payments
    const relatedPayments = await prisma.payment.findMany({
      where: { bookingId: Number(id) }
    });
    
    // If there are completed payments, don't allow deletion
    if (relatedPayments.some(payment => payment.paymentStatus === 'COMPLETED')) {
      return res.status(400).json({
        message: "Cannot delete booking with completed payments"
      });
    }
    
    // Delete related payments first
    await prisma.payment.deleteMany({
      where: { bookingId: Number(id) }
    });
    
    // Delete the booking
    await prisma.booking.delete({
      where: { id: Number(id) }
    });
    
    return res.status(200).json({
      message: "Booking deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the booking",
      error: error.message
    });
  }
};

// Get booking statistics
exports.getBookingStats = async (req, res) => {
  try {
    // Count bookings by status
    const bookingsByStatus = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM Booking 
      GROUP BY status
    `;
    
    // Count bookings for the last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const recentBookings = await prisma.$queryRaw`
      SELECT DATE(createdAt) as date, COUNT(*) as count 
      FROM Booking 
      WHERE createdAt >= ${sevenDaysAgo} 
      GROUP BY DATE(createdAt) 
      ORDER BY date ASC
    `;
    
    // Get top hostels by booking count
    const topHostels = await prisma.$queryRaw`
      SELECT h.hostelName, COUNT(b.id) as bookingCount 
      FROM Booking b 
      JOIN HostelOwner h ON b.hostelOwnerId = h.id 
      GROUP BY h.id, h.hostelName 
      ORDER BY bookingCount DESC 
      LIMIT 5
    `;
    
    return res.status(200).json({
      bookingsByStatus,
      recentBookings,
      topHostels
    });
  } catch (error) {
    console.error("Error fetching booking statistics:", error);
    return res.status(500).json({
      message: "An error occurred while fetching booking statistics",
      error: error.message
    });
  }
};

// Create payment for a booking
exports.createPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount, pidx } = req.body;
    
    // Validate required fields
    if (!amount || !pidx) {
      return res.status(400).json({ message: "Amount and pidx are required" });
    }
    
    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) }
    });
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check if payment with pidx already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { pidx }
    });
    
    if (existingPayment) {
      return res.status(400).json({ message: "Payment with this pidx already exists" });
    }
    
    // Create the payment
    const payment = await prisma.payment.create({
      data: {
        bookingId: Number(bookingId),
        amount: Number(amount),
        pidx,
        paymentStatus: "PENDING"
      }
    });
    
    return res.status(201).json({
      message: "Payment created successfully",
      payment
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({
      message: "An error occurred while creating the payment",
      error: error.message
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { pidx } = req.params;
    const { status } = req.body;
    
    // Validate status
    if (!status || !['PENDING', 'COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { pidx },
      include: { booking: true }
    });
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { pidx },
      data: { paymentStatus: status }
    });
    
    // If payment is completed, update booking status to CONFIRMED
    if (status === 'COMPLETED') {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' }
      });
    }
    
    return res.status(200).json({
      message: `Payment status updated to ${status}`,
      payment: updatedPayment
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({
      message: "An error occurred while updating the payment status",
      error: error.message
    });
  }
};