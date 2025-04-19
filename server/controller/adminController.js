const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Get pending hostel owner approval requests
exports.getPendingHostelOwnerRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get total count of pending requests
    const totalPendingRequests = await prisma.hostelOwner.count({
      where: { isApproved: false }
    });
    
    // Get pending hostel owner requests with pagination
    const pendingRequests = await prisma.hostelOwner.findMany({
      where: { isApproved: false },
      select: {
        id: true,
        hostelName: true,
        ownerName: true,
        email: true,
        contact: true,
        location: true,
        address: true,
        mainPhoto: true,
        description: true,
        createdAt: true,
        isVerified: true
      },
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json({
      pendingRequests,
      pagination: {
        total: totalPendingRequests,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalPendingRequests / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching pending hostel owner requests:", error);
    return res.status(500).json({
      message: "An error occurred while fetching pending hostel owner requests",
      error: error.message
    });
  }
};

// Get hostel owner details by ID
exports.getHostelOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const hostelOwner = await prisma.hostelOwner.findUnique({
      where: { id: Number(id) },
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        },
        rooms: {
          include: {
            photos: true,
            amenities: {
              include: {
                amenity: true
              }
            }
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                profileImage: true
              }
            }
          },
          take: 3,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!hostelOwner) {
      return res.status(404).json({ message: "Hostel owner not found" });
    }
    
    return res.status(200).json({ hostelOwner });
  } catch (error) {
    console.error("Error fetching hostel owner details:", error);
    return res.status(500).json({
      message: "An error occurred while fetching hostel owner details",
      error: error.message
    });
  }
};

// Approve or reject hostel owner
exports.updateHostelOwnerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved, rejectionReason } = req.body;
    
    // Validate required fields
    if (isApproved === undefined) {
      return res.status(400).json({ message: "isApproved field is required" });
    }
    
    // If rejecting, reason should be provided
    if (isApproved === false && !rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }
    
    // Check if hostel owner exists
    const hostelOwner = await prisma.hostelOwner.findUnique({
      where: { id: Number(id) }
    });
    
    if (!hostelOwner) {
      return res.status(404).json({ message: "Hostel owner not found" });
    }
    
    // Update hostel owner approval status
    const updatedHostelOwner = await prisma.hostelOwner.update({
      where: { id: Number(id) },
      data: { isApproved }
    });
    
    // Create notification for hostel owner
    await prisma.hostelOwnerNotification.create({
      data: {
        hostelOwnerId: Number(id),
        title: isApproved ? "Hostel Registration Approved" : "Hostel Registration Rejected",
        message: isApproved 
          ? `Congratulations! Your hostel "${hostelOwner.hostelName}" has been approved.` 
          : `Your hostel "${hostelOwner.hostelName}" registration was rejected. Reason: ${rejectionReason}`,
        type: "SYSTEM",
        isRead: false,
        hostelOwner: {
          connect: { id: Number(id) }
        }
      }
    });
    
    return res.status(200).json({
      message: isApproved 
        ? "Hostel owner approved successfully" 
        : "Hostel owner rejected successfully",
      hostelOwner: updatedHostelOwner
    });
  } catch (error) {
    console.error("Error updating hostel owner approval:", error);
    return res.status(500).json({
      message: "An error occurred while updating hostel owner approval",
      error: error.message
    });
  }
};

// Update hostel owner verification status
exports.updateHostelOwnerVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    
    // Validate required fields
    if (isVerified === undefined) {
      return res.status(400).json({ message: "isVerified field is required" });
    }
    
    // Check if hostel owner exists
    const hostelOwner = await prisma.hostelOwner.findUnique({
      where: { id: Number(id) }
    });
    
    if (!hostelOwner) {
      return res.status(404).json({ message: "Hostel owner not found" });
    }
    
    // Update hostel owner verification status
    const updatedHostelOwner = await prisma.hostelOwner.update({
      where: { id: Number(id) },
      data: { isVerified }
    });
    
    // Create notification for hostel owner
    await prisma.hostelOwnerNotification.create({
      data: {
        hostelOwnerId: Number(id),
        title: isVerified ? "Hostel Verified" : "Hostel Verification Removed",
        message: isVerified 
          ? `Congratulations! Your hostel "${hostelOwner.hostelName}" has been verified.` 
          : `Your hostel "${hostelOwner.hostelName}" verification status has been removed.`,
        type: "SYSTEM",
        isRead: false,
        hostelOwner: {
          connect: { id: Number(id) }
        }
      }
    });
    
    return res.status(200).json({
      message: isVerified 
        ? "Hostel owner verified successfully" 
        : "Hostel owner verification removed successfully",
      hostelOwner: updatedHostelOwner
    });
  } catch (error) {
    console.error("Error updating hostel owner verification:", error);
    return res.status(500).json({
      message: "An error occurred while updating hostel owner verification",
      error: error.message
    });
  }
};

// Get all hostel owners with filters
exports.getAllHostelOwners = async (req, res) => {
  try {
    const { 
      name, 
      location, 
      isApproved, 
      isVerified, 
      sortBy = 'createdAt', 
      order = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (name) {
      filter.OR = [
        { hostelName: { contains: name } },
        { ownerName: { contains: name } }
      ];
    }
    
    if (location) {
      filter.location = { contains: location };
    }
    
    if (isApproved !== undefined) {
      filter.isApproved = isApproved === 'true';
    }
    
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get total count
    const totalHostelOwners = await prisma.hostelOwner.count({
      where: filter
    });
    
    // Get hostel owners with pagination and sorting
    const hostelOwners = await prisma.hostelOwner.findMany({
      where: filter,
      select: {
        id: true,
        hostelName: true,
        ownerName: true,
        location: true,
        contact: true,
        email: true,
        avgRating: true,
        totalRatings: true,
        startingPrice: true,
        mainPhoto: true,
        isApproved: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            rooms: true,
            reviews: true
          }
        }
      },
      skip,
      take: Number(limit),
      orderBy: {
        [sortBy]: order.toLowerCase()
      }
    });
    
    return res.status(200).json({
      hostelOwners,
      pagination: {
        total: totalHostelOwners,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalHostelOwners / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching hostel owners:", error);
    return res.status(500).json({
      message: "An error occurred while fetching hostel owners",
      error: error.message
    });
  }
};

// Get all users with filters
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      role, 
      sortBy = 'createdAt', 
      order = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (name) {
      filter.name = { contains: name };
    }
    
    if (email) {
      filter.email = { contains: email };
    }
    
    if (role) {
      filter.role = role;
    }
    
    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get total count
    const totalUsers = await prisma.user.count({
      where: filter
    });
    
    // Get users with pagination and sorting
    const users = await prisma.user.findMany({
      where: filter,
      select: {
        id: true,
        name: true,
        email: true,
        contact: true,
        profileImage: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            reviews: true
          }
        }
      },
      skip,
      take: Number(limit),
      orderBy: {
        [sortBy]: order.toLowerCase()
      }
    });
    
    return res.status(200).json({
      users,
      pagination: {
        total: totalUsers,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(totalUsers / Number(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      message: "An error occurred while fetching users",
      error: error.message
    });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await prisma.user.count();
    const totalHostelOwners = await prisma.hostelOwner.count();
    const activeBookings = await prisma.booking.count({
      where: {
        status: {
          in: ['CONFIRMED', 'ACTIVE']
        }
      }
    });
    const pendingApprovals = await prisma.hostelOwner.count({
      where: { isApproved: false }
    });
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUserRegistrations = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    const recentHostelRegistrations = await prisma.hostelOwner.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    // Get booking statistics
    const bookingStats = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM Booking 
      GROUP BY status
    `;
    
    // Get monthly booking trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyBookings = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as bookingCount
      FROM Booking
      WHERE createdAt >= ${sixMonthsAgo}
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `;
    
    // Get top 5 hostels by booking count
    const topHostels = await prisma.$queryRaw`
      SELECT 
        h.id, 
        h.hostelName, 
        h.location, 
        COUNT(b.id) as bookingCount,
        SUM(b.totalAmount) as totalRevenue
      FROM HostelOwner h
      JOIN Booking b ON h.id = b.hostelOwnerId
      GROUP BY h.id, h.hostelName, h.location
      ORDER BY bookingCount DESC
      LIMIT 5
    `;
    
    // Get top 5 locations
    const topLocations = await prisma.$queryRaw`
      SELECT 
        location, 
        COUNT(*) as hostelCount
      FROM HostelOwner
      GROUP BY location
      ORDER BY hostelCount DESC
      LIMIT 5
    `;
    
    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
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
            location: true
          }
        }
      }
    });
    
    // Process BigInt values
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
      counts: {
        users: totalUsers,
        hostelOwners: totalHostelOwners,
        activeBookings,
        pendingApprovals,
        recentUserRegistrations,
        recentHostelRegistrations
      },
      bookingStats: processResults(bookingStats),
      monthlyBookings: processResults(monthlyBookings),
      topHostels: processResults(topHostels),
      topLocations: processResults(topLocations),
      recentBookings
    });
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    return res.status(500).json({
      message: "An error occurred while fetching dashboard statistics",
      error: error.message
    });
  }
};

// Remove/delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        userId: Number(id),
        status: {
          in: ['CONFIRMED', 'ACTIVE', 'PENDING']
        }
      }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({ 
        message: "Cannot delete user with active bookings. Cancel all active bookings first." 
      });
    }
    
    // Delete related records
    // Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: Number(id) }
    });
    
    // Delete messages from chats
    const userChats = await prisma.chat.findMany({
      where: { userId: Number(id) }
    });
    
    for (const chat of userChats) {
      await prisma.message.deleteMany({
        where: { chatId: chat.id }
      });
    }
    
    // Delete chats
    await prisma.chat.deleteMany({
      where: { userId: Number(id) }
    });
    
    // Update the bookings and reviews to maintain referential integrity
    // (Optional: You can choose to delete them instead)
    await prisma.booking.updateMany({
      where: { userId: Number(id) },
      data: {
        status: 'CANCELLED'
      }
    });
    
    await prisma.review.updateMany({
      where: { userId: Number(id) },
      data: {
        isVisible: false
      }
    });
    
    // Finally delete the user
    await prisma.user.delete({
      where: { id: Number(id) }
    });
    
    return res.status(200).json({
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the user",
      error: error.message
    });
  }
};

// Delete hostel owner
exports.deleteHostelOwner = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if hostel owner exists
    const hostelOwner = await prisma.hostelOwner.findUnique({
      where: { id: Number(id) }
    });
    
    if (!hostelOwner) {
      return res.status(404).json({ message: "Hostel owner not found" });
    }
    
    // Check if hostel has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        hostelOwnerId: Number(id),
        status: {
          in: ['CONFIRMED', 'ACTIVE', 'PENDING']
        }
      }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({ 
        message: "Cannot delete hostel with active bookings. Cancel all active bookings first." 
      });
    }
    
    // Delete all related records
    // Note: Many related records will be deleted automatically due to the onDelete: Cascade setting in the schema
    
    // Delete bookings manually (if not cascaded)
    await prisma.booking.deleteMany({
      where: { hostelOwnerId: Number(id) }
    });
    
    // Delete notifications
    await prisma.hostelOwnerNotification.deleteMany({
      where: { hostelOwnerId: Number(id) }
    });
    
    // Delete reviews
    await prisma.review.deleteMany({
      where: { hostelOwnerId: Number(id) }
    });
    
    // Delete chats and messages
    const hostelChats = await prisma.chat.findMany({
      where: { hostelOwnerId: Number(id) }
    });
    
    for (const chat of hostelChats) {
      await prisma.message.deleteMany({
        where: { chatId: chat.id }
      });
    }
    
    await prisma.chat.deleteMany({
      where: { hostelOwnerId: Number(id) }
    });
    
    // Finally delete the hostel owner
    await prisma.hostelOwner.delete({
      where: { id: Number(id) }
    });
    
    return res.status(200).json({
      message: "Hostel owner deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting hostel owner:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the hostel owner",
      error: error.message
    });
  }
};

// Get system-wide booking statistics
exports.getSystemBookingStats = async (req, res) => {
  try {
    // Get date range parameters
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    }
    
    // Get total booking value
    const totalBookingValue = await prisma.booking.aggregate({
      where: dateFilter,
      _sum: {
        totalAmount: true
      }
    });
    
    // Get bookings by status
    const bookingsByStatus = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count, SUM(totalAmount) as totalValue
      FROM Booking
      ${Object.keys(dateFilter).length > 0 ? 
        `WHERE createdAt >= ${new Date(startDate)} AND createdAt <= ${new Date(endDate)}` : 
        ''}
      GROUP BY status
    `;
    
    // Get bookings by month
    const bookingsByMonth = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(totalAmount) as totalValue
      FROM Booking
      ${Object.keys(dateFilter).length > 0 ? 
        `WHERE createdAt >= ${new Date(startDate)} AND createdAt <= ${new Date(endDate)}` : 
        ''}
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `;
    
    // Get average booking value
    const averageBookingValue = await prisma.booking.aggregate({
      where: dateFilter,
      _avg: {
        totalAmount: true
      }
    });
    
    // Process BigInt values
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
      totalBookingValue: totalBookingValue._sum.totalAmount || 0,
      averageBookingValue: averageBookingValue._avg.totalAmount || 0,
      bookingsByStatus: processResults(bookingsByStatus),
      bookingsByMonth: processResults(bookingsByMonth)
    });
  } catch (error) {
    console.error("Error fetching system booking statistics:", error);
    return res.status(500).json({
      message: "An error occurred while fetching system booking statistics",
      error: error.message
    });
  }
};

// Manage amenities
exports.getAllAmenities = async (req, res) => {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: {
        category: 'asc'
      }
    });
    
    return res.status(200).json({ amenities });
  } catch (error) {
    console.error("Error fetching amenities:", error);
    return res.status(500).json({
      message: "An error occurred while fetching amenities",
      error: error.message
    });
  }
};

exports.createAmenity = async (req, res) => {
  try {
    const { name, icon, category } = req.body;
    
    // Validate required fields
    if (!name || !category) {
      return res.status(400).json({ message: "Name and category are required" });
    }
    
    // Check if amenity already exists
    const existingAmenity = await prisma.amenity.findFirst({
      where: { name }
    });
    
    if (existingAmenity) {
      return res.status(400).json({ message: "Amenity with this name already exists" });
    }
    
    // Create amenity
    const newAmenity = await prisma.amenity.create({
      data: {
        name,
        icon,
        category
      }
    });
    
    return res.status(201).json({
      message: "Amenity created successfully",
      amenity: newAmenity
    });
  } catch (error) {
    console.error("Error creating amenity:", error);
    return res.status(500).json({
      message: "An error occurred while creating the amenity",
      error: error.message
    });
  }
};

exports.updateAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, category } = req.body;
    
    // Check if amenity exists
    const existingAmenity = await prisma.amenity.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingAmenity) {
      return res.status(404).json({ message: "Amenity not found" });
    }
    
    // Update amenity
    const updatedAmenity = await prisma.amenity.update({
      where: { id: Number(id) },
      data: {
        name: name || existingAmenity.name,
        icon: icon || existingAmenity.icon,
        category: category || existingAmenity.category
      }
    });
    
    return res.status(200).json({
      message: "Amenity updated successfully",
      amenity: updatedAmenity
    });
  } catch (error) {
    console.error("Error updating amenity:", error);
    return res.status(500).json({
      message: "An error occurred while updating the amenity",
      error: error.message
    });
  }
};

exports.deleteAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if amenity exists
    const existingAmenity = await prisma.amenity.findUnique({
      where: { id: Number(id) }
    });
    
    if (!existingAmenity) {
      return res.status(404).json({ message: "Amenity not found" });
    }
    
    // Check if amenity is in use
    const hostelAmenityCount = await prisma.hostelAmenity.count({
      where: { amenityId: Number(id) }
    });
    
    const roomAmenityCount = await prisma.roomAmenity.count({
      where: { amenityId: Number(id) }
    });
    
    if (hostelAmenityCount > 0 || roomAmenityCount > 0) {
      return res.status(400).json({
        message: "Cannot delete amenity that is in use by hostels or rooms"
      });
    }
    
    // Delete amenity
    await prisma.amenity.delete({
      where: { id: Number(id) }
    });
    
    return res.status(200).json({
      message: "Amenity deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting amenity:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the amenity",
      error: error.message
    });
  }
};