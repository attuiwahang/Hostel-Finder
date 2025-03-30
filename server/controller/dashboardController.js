const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get dashboard statistics for a hostel owner
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const hostelOwnerId = parseInt(req.params.id);
    
    // Verify the requesting user
    if (req.user.id !== hostelOwnerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this dashboard"
      });
    }

    // Get current date for calculations
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfPrevMonth = new Date(firstDayOfMonth);
    lastDayOfPrevMonth.setDate(lastDayOfPrevMonth.getDate() - 1);
    const firstDayOfPrevMonth = new Date(lastDayOfPrevMonth.getFullYear(), lastDayOfPrevMonth.getMonth(), 1);
    
    // Get 30 days ago for recent calculations
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Calculate revenue statistics
    const currentMonthRevenue = await prisma.booking.aggregate({
      where: {
        hostelOwnerId,
        createdAt: {
          gte: firstDayOfMonth
        },
        status: {
          in: ['CONFIRMED', 'ACTIVE', 'COMPLETED']
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    const prevMonthRevenue = await prisma.booking.aggregate({
      where: {
        hostelOwnerId,
        createdAt: {
          gte: firstDayOfPrevMonth,
          lt: firstDayOfMonth
        },
        status: {
          in: ['CONFIRMED', 'ACTIVE', 'COMPLETED']
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    // Get booking statistics
    const totalBookings = await prisma.booking.count({
      where: {
        hostelOwnerId
      }
    });

    const activeBookings = await prisma.booking.count({
      where: {
        hostelOwnerId,
        status: {
          in: ['CONFIRMED', 'ACTIVE']
        }
      }
    });

    const pendingBookings = await prisma.booking.count({
      where: {
        hostelOwnerId,
        status: 'PENDING'
      }
    });

    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        hostelOwnerId
      },
      _count: {
        status: true
      }
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: {
        hostelOwnerId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Get room occupancy statistics
    const totalRooms = await prisma.room.count({
      where: {
        hostelOwnerId
      }
    });

    const totalBeds = await prisma.room.aggregate({
      where: {
        hostelOwnerId
      },
      _sum: {
        totalBeds: true
      }
    });

    const occupiedBeds = await prisma.room.aggregate({
      where: {
        hostelOwnerId
      },
      _sum: {
        totalBeds: true
      },
      _sum: {
        availableBeds: true
      }
    });

    const occupancyRate = totalBeds._sum.totalBeds > 0 
      ? ((totalBeds._sum.totalBeds - occupiedBeds._sum.availableBeds) / totalBeds._sum.totalBeds) * 100 
      : 0;

    // Get room type distribution
    const roomTypeDistribution = await prisma.room.groupBy({
      by: ['roomType'],
      where: {
        hostelOwnerId
      },
      _count: {
        roomType: true
      }
    });

    // Get upcoming check-ins
    const upcomingCheckIns = await prisma.booking.findMany({
      where: {
        hostelOwnerId,
        checkInDate: {
          gte: today
        },
        status: 'CONFIRMED'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        checkInDate: 'asc'
      },
      take: 5
    });

    // Get reviews statistics
    const totalReviews = await prisma.review.count({
      where: {
        hostelOwnerId
      }
    });

    const avgRating = await prisma.review.aggregate({
      where: {
        hostelOwnerId
      },
      _avg: {
        rating: true
      }
    });

    const recentReviews = await prisma.review.findMany({
      where: {
        hostelOwnerId
      },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });

    // Get notification count
    const unreadNotifications = await prisma.hostelOwnerNotification.count({
      where: {
        hostelOwnerId,
        isRead: false
      }
    });

    // Get unread messages count
    const unreadMessages = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM Message m 
      JOIN Chat c ON m.chatId = c.id 
      WHERE c.hostelOwnerId = ${hostelOwnerId} 
      AND m.senderType = 'USER' 
      AND m.isRead = false
    `;

    // Get revenue trend data for the last 6 months
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start from the 1st day of the month

    // Format the date to match SQL format
    const formattedSixMonthsAgo = sixMonthsAgo.toISOString().slice(0, 10);

    const revenueTrend = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        SUM(totalAmount) as revenue
      FROM Booking
      WHERE hostelOwnerId = ${hostelOwnerId}
      AND createdAt >= ${formattedSixMonthsAgo}
      AND status IN ('CONFIRMED', 'ACTIVE', 'COMPLETED')
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `;

    // Get active staff count
    const activeStaff = await prisma.staff.count({
      where: {
        hostelOwnerId,
        status: 'ON_DUTY'
      }
    });

    // Format the dashboard data
    const dashboardData = {
      revenue: {
        currentMonth: currentMonthRevenue._sum.totalAmount || 0,
        previousMonth: prevMonthRevenue._sum.totalAmount || 0,
        percentChange: prevMonthRevenue._sum.totalAmount > 0 
          ? ((currentMonthRevenue._sum.totalAmount - prevMonthRevenue._sum.totalAmount) / prevMonthRevenue._sum.totalAmount) * 100 
          : 0,
        trend: revenueTrend
      },
      bookings: {
        total: totalBookings,
        active: activeBookings,
        pending: pendingBookings,
        byStatus: bookingsByStatus.map(item => ({
          status: item.status,
          count: item._count.status
        })),
        recent: recentBookings
      },
      occupancy: {
        totalRooms,
        totalBeds: totalBeds._sum.totalBeds || 0,
        occupiedBeds: (totalBeds._sum.totalBeds || 0) - (occupiedBeds._sum.availableBeds || 0),
        occupancyRate: parseFloat(occupancyRate.toFixed(2)),
        roomTypeDistribution: roomTypeDistribution.map(item => ({
          type: item.roomType,
          count: item._count.roomType
        }))
      },
      upcomingCheckIns,
      reviews: {
        total: totalReviews,
        averageRating: avgRating._avg.rating || 0,
        recent: recentReviews
      },
      notifications: {
        unread: unreadNotifications
      },
      messages: {
        unread: unreadMessages[0]?.count || 0
      },
      staff: {
        active: activeStaff
      }
    };

    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
};

/**
 * Get month-by-month booking stats
 */
exports.getBookingTrends = async (req, res) => {
  try {
    const hostelOwnerId = parseInt(req.params.id);
    
    // Verify the requesting user
    if (req.user.id !== hostelOwnerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this data"
      });
    }

    // Get the last 12 months of booking data
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setMonth(today.getMonth() - 11);
    twelveMonthsAgo.setDate(1); // Start from the 1st day of the month

    // Format the date to match SQL format
    const formattedTwelveMonthsAgo = twelveMonthsAgo.toISOString().slice(0, 10);

    const bookingTrends = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as count
      FROM Booking
      WHERE hostelOwnerId = ${hostelOwnerId}
      AND createdAt >= ${formattedTwelveMonthsAgo}
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC
    `;

    return res.status(200).json({
      success: true,
      data: bookingTrends
    });
  } catch (error) {
    console.error("Error fetching booking trends:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch booking trends",
      error: error.message
    });
  }
};

/**
 * Get occupancy details
 */
exports.getOccupancyDetails = async (req, res) => {
  try {
    const hostelOwnerId = parseInt(req.params.id);
    
    // Verify the requesting user
    if (req.user.id !== hostelOwnerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this data"
      });
    }

    // Get rooms with their occupancy details
    const rooms = await prisma.room.findMany({
      where: {
        hostelOwnerId
      },
      select: {
        id: true,
        roomNumber: true,
        roomType: true,
        floorNumber: true,
        totalBeds: true,
        availableBeds: true,
        monthlyPrice: true,
        beds: {
          select: {
            id: true,
            bedNumber: true,
            bedType: true,
            isOccupied: true
          }
        }
      },
      orderBy: [
        {
          floorNumber: 'asc'
        },
        {
          roomNumber: 'asc'
        }
      ]
    });

    // Calculate occupancy by floor
    const floorOccupancy = {};
    let totalBeds = 0;
    let occupiedBeds = 0;

    rooms.forEach(room => {
      const floor = room.floorNumber || 'Unspecified';
      
      if (!floorOccupancy[floor]) {
        floorOccupancy[floor] = {
          totalBeds: 0,
          occupiedBeds: 0
        };
      }
      
      floorOccupancy[floor].totalBeds += room.totalBeds;
      floorOccupancy[floor].occupiedBeds += (room.totalBeds - room.availableBeds);
      
      totalBeds += room.totalBeds;
      occupiedBeds += (room.totalBeds - room.availableBeds);
    });

    // Convert to array format for easier consumption
    const floorOccupancyArray = Object.keys(floorOccupancy).map(floor => ({
      floor,
      totalBeds: floorOccupancy[floor].totalBeds,
      occupiedBeds: floorOccupancy[floor].occupiedBeds,
      occupancyRate: floorOccupancy[floor].totalBeds > 0 
        ? (floorOccupancy[floor].occupiedBeds / floorOccupancy[floor].totalBeds) * 100 
        : 0
    }));

    return res.status(200).json({
      success: true,
      data: {
        rooms,
        overview: {
          totalRooms: rooms.length,
          totalBeds,
          occupiedBeds,
          occupancyRate: totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0
        },
        floorOccupancy: floorOccupancyArray
      }
    });
  } catch (error) {
    console.error("Error fetching occupancy details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch occupancy details",
      error: error.message
    });
  }
};

/**
 * Get financial summary
 */
exports.getFinancialSummary = async (req, res) => {
  try {
    const hostelOwnerId = parseInt(req.params.id);
    
    // Verify the requesting user
    if (req.user.id !== hostelOwnerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this data"
      });
    }

    // Get parameters for date range
    const { period = 'monthly', year, month } = req.query;
    
    const today = new Date();
    let startDate, endDate;
    
    // Set date range based on requested period
    if (period === 'yearly' && year) {
      startDate = new Date(parseInt(year), 0, 1);
      endDate = new Date(parseInt(year), 11, 31);
    } else if (period === 'monthly' && year && month) {
      startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      endDate = new Date(parseInt(year), parseInt(month) - 1, lastDay);
    } else {
      // Default to current month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    // Format dates for SQL
    const formattedStartDate = startDate.toISOString();
    const formattedEndDate = endDate.toISOString();

    // Get all payments in the date range
    const payments = await prisma.payment.findMany({
      where: {
        booking: {
          hostelOwnerId
        },
        paymentDate: {
          gte: formattedStartDate,
          lte: formattedEndDate
        }
      },
      include: {
        booking: {
          select: {
            id: true,
            userName: true,
            bookingDate: true,
            duration: true,
            status: true
          }
        }
      }
    });

    // Calculate totals by payment type
    const totalsByType = {};
    const totalsByStatus = {
      COMPLETED: 0,
      PENDING: 0,
      FAILED: 0,
      REFUNDED: 0
    };
    
    let totalRevenue = 0;
    
    payments.forEach(payment => {
      const type = payment.paymentType;
      const status = payment.paymentStatus;
      
      if (!totalsByType[type]) {
        totalsByType[type] = 0;
      }
      
      totalsByType[type] += payment.amount;
      
      if (status === 'COMPLETED') {
        totalRevenue += payment.amount;
      }
      
      totalsByStatus[status] += payment.amount;
    });

    // Get payment method distribution
    const paymentMethodDistribution = await prisma.payment.groupBy({
      by: ['paymentMethod'],
      where: {
        booking: {
          hostelOwnerId
        },
        paymentDate: {
          gte: formattedStartDate,
          lte: formattedEndDate
        },
        paymentStatus: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });

    // Format for easier consumption
    const methodDistribution = paymentMethodDistribution.map(item => ({
      method: item.paymentMethod,
      amount: item._sum.amount || 0
    }));

    // Get daily revenue trend within the period
    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE(p.paymentDate) as date,
        SUM(p.amount) as amount
      FROM Payment p
      JOIN Booking b ON p.bookingId = b.id
      WHERE b.hostelOwnerId = ${hostelOwnerId}
      AND p.paymentStatus = 'COMPLETED'
      AND p.paymentDate >= ${formattedStartDate}
      AND p.paymentDate <= ${formattedEndDate}
      GROUP BY DATE(p.paymentDate)
      ORDER BY date ASC
    `;

    return res.status(200).json({
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate
        },
        summary: {
          totalRevenue,
          totalsByType,
          totalsByStatus
        },
        paymentMethodDistribution: methodDistribution,
        recentPayments: payments.slice(0, 10), // Just return the 10 most recent
        dailyRevenue
      }
    });
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch financial summary",
      error: error.message
    });
  }
};

/**
 * Get guest insights (users who have booked)
 */
exports.getGuestInsights = async (req, res) => {
  try {
    const hostelOwnerId = parseInt(req.params.id);
    
    // Verify the requesting user
    if (req.user.id !== hostelOwnerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this data"
      });
    }

    // Get unique users who have booked
    const uniqueGuestCount = await prisma.booking.count({
      where: {
        hostelOwnerId
      },
      distinct: ['userId']
    });

    // Get repeat booking statistics
    const repeatBookingStats = await prisma.$queryRaw`
      SELECT 
        userId,
        COUNT(*) as bookingCount
      FROM Booking
      WHERE hostelOwnerId = ${hostelOwnerId}
      GROUP BY userId
      HAVING COUNT(*) > 1
    `;

    const repeatBookerCount = repeatBookingStats.length;
    
    // Calculate average stay duration (in months)
    const durationStats = await prisma.booking.aggregate({
      where: {
        hostelOwnerId,
        status: {
          in: ['CONFIRMED', 'ACTIVE', 'COMPLETED']
        }
      },
      _avg: {
        duration: true
      },
      _max: {
        duration: true
      },
      _min: {
        duration: true
      }
    });

    // Get booking status distribution 
    const statusDistribution = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        hostelOwnerId
      },
      _count: {
        status: true
      }
    });

    // Format for easier consumption
    const formattedStatusDistribution = statusDistribution.map(item => ({
      status: item.status,
      count: item._count.status
    }));

    // Get top 5 guests by total booking amount
    const topGuests = await prisma.$queryRaw`
      SELECT 
        b.userId,
        u.name,
        u.email,
        u.profileImage,
        COUNT(b.id) as bookingCount,
        SUM(b.totalAmount) as totalSpent
      FROM Booking b
      JOIN User u ON b.userId = u.id
      WHERE b.hostelOwnerId = ${hostelOwnerId}
      GROUP BY b.userId, u.name, u.email, u.profileImage
      ORDER BY totalSpent DESC
      LIMIT 5
    `;

    return res.status(200).json({
      success: true,
      data: {
        guestCount: uniqueGuestCount,
        repeatBookers: repeatBookerCount,
        stayDuration: {
          average: durationStats._avg.duration || 0,
          min: durationStats._min.duration || 0,
          max: durationStats._max.duration || 0
        },
        statusDistribution: formattedStatusDistribution,
        topGuests
      }
    });
  } catch (error) {
    console.error("Error fetching guest insights:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch guest insights",
      error: error.message
    });
  }
};

module.exports = exports;