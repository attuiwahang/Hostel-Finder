const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const socketService = require("../config/socketConfig"); 

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
      duration,
      totalAmount,
      specialRequests
    } = req.body;

    // Validate required fields
    if (!userId || !hostelOwnerId || !email || !phoneNumber || !checkInDate) {
      return res.status(400).json({ message: "All required fields must be provided" });
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

    // Create the booking with proper relations
    const newBooking = await prisma.booking.create({
      data: {
        userName: userName || user.name,
        email,
        phoneNumber,
        checkInDate: checkInDateObj,
        duration: Number(duration) || 1,
        specialRequests,
        status: "PENDING",
        paymentStatus: "PENDING",
        totalAmount: totalAmount || hostelOwner.startingPrice,
        // Use connect to establish relationship with existing records
        user: {
          connect: { id: Number(userId) }
        },
        hostelOwner: {
          connect: { id: Number(hostelOwnerId) }
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        hostelOwner: {
          select: {
            hostelName: true,
            ownerName: true
          }
        }
      }
    });

    // Send notification to hostel owner about new booking
    await socketService.createHostelOwnerNotification(
      Number(hostelOwnerId),
      "New Booking Request",
      `${userName || user.name} has requested to book your hostel for ${duration} days starting on ${checkInDateObj.toLocaleDateString()}.`,
      "BOOKING",
      `/bookings/${newBooking.id}`
    );

    // Send confirmation notification to the student/user
    await socketService.createUserNotification(
      Number(userId),
      "Booking Request Submitted",
      `Your request to book ${hostelOwner.hostelName} has been submitted and is awaiting approval from the hostel owner.`,
      "BOOKING",
      `/bookings/${newBooking.id}`
    );

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: newBooking,
    });

  } catch (error) {
    console.error("Error booking hostel:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "A booking with this information already exists" });
    }

    return res.status(500).json({
      success: false,
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
    const userId = req.user.id;
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
            mainPhoto: true,
            email: true
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
    if (!status || !['PENDING', 'CONFIRMED', 'CANCELLED', 'ACTIVE', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        hostelOwner: {
          select: {
            id: true,
            hostelName: true,
            ownerName: true
          }
        }
      }
    });
    
    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        user: true,
        hostelOwner: true
      }
    });
    
    // Create notifications based on the status update
    let studentMessage = '';
    let notificationType = 'BOOKING';
    
    switch(status) {
      case 'CONFIRMED':
        studentMessage = `Good news! Your booking at ${existingBooking.hostelOwner.hostelName} has been confirmed. Check-in date: ${new Date(existingBooking.checkInDate).toLocaleDateString()}.`;
        break;
      case 'CANCELLED':
        studentMessage = `Your booking at ${existingBooking.hostelOwner.hostelName} has been cancelled. Please contact the hostel owner for more information.`;
        break;
      case 'ACTIVE':
        studentMessage = `Your booking at ${existingBooking.hostelOwner.hostelName} is now active. Enjoy your stay!`;
        break;
      case 'COMPLETED':
        studentMessage = `Thank you for staying at ${existingBooking.hostelOwner.hostelName}. Your booking is now marked as completed. We hope you enjoyed your stay!`;
        break;
      default:
        studentMessage = `Your booking status for ${existingBooking.hostelOwner.hostelName} has been updated to ${status}.`;
    }
    
    // Send notification to the student/user
    await socketService.createUserNotification(
      existingBooking.user.id,
      `Booking ${status}`,
      studentMessage,
      notificationType,
      `/bookings/${id}`
    );
    
    // Notification for the hostel owner
    const hostelOwnerMessage = `You have ${status.toLowerCase()} the booking for ${existingBooking.user.name} (${existingBooking.user.email}). Check-in date: ${new Date(existingBooking.checkInDate).toLocaleDateString()}.`;
    
    await socketService.createHostelOwnerNotification(
      existingBooking.hostelOwner.id,
      `Booking ${status}`,
      hostelOwnerMessage,
      'BOOKING',
      `/bookings/${id}`
    );
    
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
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        hostelOwner: {
          select: {
            id: true,
            hostelName: true
          }
        }
      }
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
    
    // Send notification to student/user
    await socketService.createUserNotification(
      existingBooking.user.id,
      "Booking Deleted",
      `Your booking for ${existingBooking.hostelOwner.hostelName} has been deleted. If you didn't request this, please contact the hostel owner.`,
      "BOOKING",
      "/bookings"
    );
    
    // Send notification to hostel owner
    await socketService.createHostelOwnerNotification(
      existingBooking.hostelOwner.id,
      "Booking Deleted",
      `The booking for ${existingBooking.user.name} has been deleted.`,
      "BOOKING",
      "/bookings"
    );
    
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
      bookingsByStatus: processResults(bookingsByStatus),
      recentBookings: processResults(recentBookings),
      topHostels: processResults(topHostels)
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
    const { amount, pidx, paymentMethod = 'ONLINE', paymentType = 'BOOKING_PAYMENT' } = req.body;
    
    // Validate required fields
    if (!amount || !pidx) {
      return res.status(400).json({ message: "Amount and pidx are required" });
    }
    
    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        hostelOwner: {
          select: {
            id: true,
            hostelName: true
          }
        }
      }
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
        paymentMethod,
        paymentType,
        paymentStatus: "PENDING"
      }
    });
    
    // Send notification to student/user
    await socketService.createUserNotification(
      booking.user.id,
      "Payment Initiated",
      `Your payment of Rs. ${amount} for ${booking.hostelOwner.hostelName} has been initiated and is being processed.`,
      "PAYMENT",
      `/bookings/${bookingId}`
    );
    
    // Send notification to hostel owner
    await socketService.createHostelOwnerNotification(
      booking.hostelOwner.id,
      "Payment Initiated",
      `${booking.user.name} has initiated a payment of Rs. ${amount} for their booking.`,
      "PAYMENT",
      `/bookings/${bookingId}`
    );
    
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
    if (!status || !['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }
    
    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { pidx },
      include: { 
        booking: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            },
            hostelOwner: {
              select: {
                id: true,
                hostelName: true
              }
            }
          }
        } 
      }
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
    let bookingUpdate = null;
    if (status === 'COMPLETED') {
      bookingUpdate = await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED', paymentStatus: 'COMPLETED' }
      });
      
      // Send payment success notification to student/user
      await socketService.createUserNotification(
        payment.booking.user.id,
        "Payment Successful",
        `Your payment of Rs. ${payment.amount} for ${payment.booking.hostelOwner.hostelName} has been successfully processed. Your booking is now confirmed!`,
        "PAYMENT",
        `/bookings/${payment.bookingId}`
      );
      
      // Send payment received notification to hostel owner
      await socketService.createHostelOwnerNotification(
        payment.booking.hostelOwner.id,
        "Payment Received",
        `You've received a payment of Rs. ${payment.amount} from ${payment.booking.user.name}. Their booking is now confirmed.`,
        "PAYMENT",
        `/bookings/${payment.bookingId}`
      );
    } else if (status === 'FAILED') {
      // Send payment failed notification to student/user
      await socketService.createUserNotification(
        payment.booking.user.id,
        "Payment Failed",
        `Your payment of Rs. ${payment.amount} for ${payment.booking.hostelOwner.hostelName} couldn't be processed. Please try again or contact support.`,
        "PAYMENT",
        `/bookings/${payment.bookingId}`
      );
      
      // Send payment failed notification to hostel owner
      await socketService.createHostelOwnerNotification(
        payment.booking.hostelOwner.id,
        "Payment Failed",
        `The payment of Rs. ${payment.amount} from ${payment.booking.user.name} has failed to process.`,
        "PAYMENT",
        `/bookings/${payment.bookingId}`
      );
    } else if (status === 'REFUNDED') {
      // Send refund notification to student/user
      await socketService.createUserNotification(
        payment.booking.user.id,
        "Payment Refunded",
        `Your payment of Rs. ${payment.amount} for ${payment.booking.hostelOwner.hostelName} has been refunded to your original payment method.`,
        "PAYMENT",
        `/bookings/${payment.bookingId}`
      );
      
      // Send refund notification to hostel owner
      await socketService.createHostelOwnerNotification(
        payment.booking.hostelOwner.id,
        "Payment Refunded",
        `A refund of Rs. ${payment.amount} has been processed for ${payment.booking.user.name}'s booking.`,
        "PAYMENT",
        `/bookings/${payment.bookingId}`
      );
    }
    
    return res.status(200).json({
      message: `Payment status updated to ${status}`,
      payment: updatedPayment,
      bookingUpdated: bookingUpdate !== null
    });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({
      message: "An error occurred while updating the payment status",
      error: error.message
    });
  }
};

// Create a booking by hostel owner
exports.createBookingByHostelOwner = async (req, res) => {
  try {
    const {
      userName,
      email,
      phoneNumber,
      checkInDate,
      duration,
      specialRequests,
      totalAmount
    } = req.body;

    const hostelOwnerId = req.user.id;

    // Validate required fields
    if (!hostelOwnerId || !userName || !email || !phoneNumber || !checkInDate || !duration || !totalAmount) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Ensure checkInDate is a valid date
    const checkInDateObj = new Date(checkInDate);
    if (isNaN(checkInDateObj.getTime())) {
      return res.status(400).json({ message: "Invalid check-in date format" });
    }

    // Verify that the hostel owner exists
    const hostelOwner = await prisma.hostelOwner.findUnique({
      where: { id: Number(hostelOwnerId) }
    });

    if (!hostelOwner) {
      return res.status(404).json({ message: "Hostel owner not found" });
    }

    // Find or create user by email
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create a new user with generated password
      const tempPassword = generateTemporaryPassword();
      user = await prisma.user.create({
        data: {
          name: userName,
          email,
          password: tempPassword, // In production, should hash this password
          contact: phoneNumber,
          role: "STUDENT"
        }
      });
      
      // Here you might want to send an email to the user with their credentials
    }

    // Generate a unique booking number in the format "BK-XXXX"
    const lastBooking = await prisma.booking.findFirst({
      orderBy: { id: 'desc' }
    });
    
    const nextId = lastBooking ? lastBooking.id + 1 : 1;
    const bookingNumber = `BK-${nextId.toString().padStart(4, '0')}`;

    // Create booking data
    const bookingData = {
      userId: user.id,
      hostelOwnerId: Number(hostelOwnerId),
      bookingNumber,
      userName,
      email,
      phoneNumber,
      checkInDate: checkInDateObj,
      duration: Number(duration),
      specialRequests: specialRequests || "",
      status: "CONFIRMED", // Direct bookings are automatically confirmed
      totalAmount: parseFloat(totalAmount),
      paymentStatus: "PENDING" // Default payment status
    };

    // Create the booking
    const newBooking = await prisma.booking.create({
      data: bookingData,
      include: {
        hostelOwner: {
          select: {
            hostelName: true
          }
        }
      }
    });

    // Send notification to the student/user
    await socketService.createUserNotification(
      user.id,
      "Booking Confirmed",
      `${hostelOwner.hostelName} has directly booked a stay for you starting on ${checkInDateObj.toLocaleDateString()} for ${duration} days. View the details in your bookings.`,
      "BOOKING",
      `/bookings/${newBooking.id}`
    );

    return res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
    });

  } catch (error) {
    console.error("Error creating booking:", error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002' && error.meta?.target?.includes('bookingNumber')) {
      return res.status(400).json({ 
        message: "A booking with this number already exists. Please try again." 
      });
    }

    return res.status(500).json({
      message: "An error occurred while creating the booking",
      error: error.message,
    });
  }
};

// Helper function to generate a unique booking number
function generateBookingNumber() {
  const prefix = 'BK';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

// Helper function to generate a temporary password
function generateTemporaryPassword() {
  return Math.random().toString(36).slice(-8);
}

// Helper function to get or create a special "walk-in" user
async function getOrCreateWalkInUser() {
  const walkInEmail = "walk-in@hostel-system.com";
  
  let walkInUser = await prisma.user.findUnique({
    where: { email: walkInEmail }
  });
  
  if (!walkInUser) {
    walkInUser = await prisma.user.create({
      data: {
        name: "Walk-in Customer",
        email: walkInEmail,
        password: "walk-in-user-password", // Should be a secure password in production
        contact: "N/A",
        role: "STUDENT"
      }
    });
  }
  
  return walkInUser;
}