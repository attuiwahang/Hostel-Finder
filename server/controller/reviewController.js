const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Review Controller
 * Handles all operations related to hostel reviews
 */
class ReviewController {
  /**
   * Create a new review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createReview(req, res) {
    try {
      const { userId, hostelOwnerId, rating, comment, photos } = req.body;

      // Validate required fields
      if (!userId || !hostelOwnerId || !rating) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: userId, hostelOwnerId, and rating are required' 
        });
      }

      // Validate rating is between 1 and 5
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rating must be between 1 and 5' 
        });
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Check if hostel owner exists
      const hostelOwner = await prisma.hostelOwner.findUnique({
        where: { id: hostelOwnerId }
      });

      if (!hostelOwner) {
        return res.status(404).json({ 
          success: false, 
          message: 'Hostel owner not found' 
        });
      }

      // Optional: Check if user has a booking with this hostel
      const userBooking = await prisma.booking.findFirst({
        where: {
          userId,
          hostelOwnerId,
          OR: [
            { status: 'ACTIVE' },
            { status: 'COMPLETED' }
          ]
        }
      });

      if (!userBooking) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only review hostels you have booked' 
        });
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          userId,
          hostelOwnerId,
          rating,
          comment,
          photos: photos ? JSON.stringify(photos) : null
        }
      });

      // Update hostel's average rating and total ratings
      await updateHostelRating(hostelOwnerId);

      // Create notification for hostel owner
      await prisma.hostelOwnerNotification.create({
        data: {
          hostelOwnerId,
          title: 'New Review',
          message: `${user.name} has left a ${rating}-star review for your hostel.`,
          type: 'SYSTEM'
        }
      });

      return res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review
      });
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create review',
        error: error.message
      });
    }
  }

  /**
   * Get all reviews for a specific hostel
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHostelReviews(req, res) {
    try {
      const { hostelOwnerId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalReviews = await prisma.review.count({
        where: {
          hostelOwnerId: parseInt(hostelOwnerId),
          isVisible: true
        }
      });

      // Get reviews with user information
      const reviews = await prisma.review.findMany({
        where: {
          hostelOwnerId: parseInt(hostelOwnerId),
          isVisible: true
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });

      // Process photos string back to array
      const processedReviews = reviews.map(review => ({
        ...review,
        photos: review.photos ? JSON.parse(review.photos) : null
      }));

      return res.status(200).json({
        success: true,
        message: 'Hostel reviews retrieved successfully',
        data: processedReviews,
        pagination: {
          total: totalReviews,
          page,
          limit,
          pages: Math.ceil(totalReviews / limit)
        }
      });
    } catch (error) {
      console.error('Error retrieving hostel reviews:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve hostel reviews',
        error: error.message
      });
    }
  }

  /**
   * Get all reviews by a specific user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserReviews(req, res) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalReviews = await prisma.review.count({
        where: {
          userId: parseInt(userId)
        }
      });

      // Get reviews with hostel information
      const reviews = await prisma.review.findMany({
        where: {
          userId: parseInt(userId)
        },
        include: {
          hostelOwner: {
            select: {
              id: true,
              hostelName: true,
              mainPhoto: true,
              location: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      });

      // Process photos string back to array
      const processedReviews = reviews.map(review => ({
        ...review,
        photos: review.photos ? JSON.parse(review.photos) : null
      }));

      return res.status(200).json({
        success: true,
        message: 'User reviews retrieved successfully',
        data: processedReviews,
        pagination: {
          total: totalReviews,
          page,
          limit,
          pages: Math.ceil(totalReviews / limit)
        }
      });
    } catch (error) {
      console.error('Error retrieving user reviews:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user reviews',
        error: error.message
      });
    }
  }

  /**
   * Update an existing review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment, photos } = req.body;
      const userId = req.user.id; // Assuming req.user is set by auth middleware

      // Find the review
      const review = await prisma.review.findUnique({
        where: { id: parseInt(id) }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Check if user owns the review
      if (review.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only update your own reviews'
        });
      }

      // Validate rating if provided
      if (rating && (rating < 1 || rating > 5)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }

      // Update the review
      const updatedReview = await prisma.review.update({
        where: { id: parseInt(id) },
        data: {
          rating: rating || review.rating,
          comment: comment !== undefined ? comment : review.comment,
          photos: photos ? JSON.stringify(photos) : review.photos,
          updatedAt: new Date()
        }
      });

      // Update hostel's average rating if rating changed
      if (rating && rating !== review.rating) {
        await updateHostelRating(review.hostelOwnerId);
      }

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: {
          ...updatedReview,
          photos: updatedReview.photos ? JSON.parse(updatedReview.photos) : null
        }
      });
    } catch (error) {
      console.error('Error updating review:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update review',
        error: error.message
      });
    }
  }

  /**
   * Delete a review
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id; // Assuming req.user is set by auth middleware

      // Find the review
      const review = await prisma.review.findUnique({
        where: { id: parseInt(id) }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Check if user owns the review or is admin
      if (review.userId !== userId && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own reviews'
        });
      }

      // Delete the review
      await prisma.review.delete({
        where: { id: parseInt(id) }
      });

      // Update hostel's average rating
      await updateHostelRating(review.hostelOwnerId);

      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete review',
        error: error.message
      });
    }
  }

  /**
   * Toggle review visibility (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async toggleReviewVisibility(req, res) {
    try {
      const { id } = req.params;

      // Check if user is admin
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can toggle review visibility'
        });
      }

      // Find the review
      const review = await prisma.review.findUnique({
        where: { id: parseInt(id) }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Toggle visibility
      const updatedReview = await prisma.review.update({
        where: { id: parseInt(id) },
        data: {
          isVisible: !review.isVisible
        }
      });

      // Update hostel's average rating if visibility changed
      await updateHostelRating(review.hostelOwnerId);

      return res.status(200).json({
        success: true,
        message: `Review is now ${updatedReview.isVisible ? 'visible' : 'hidden'}`,
        data: updatedReview
      });
    } catch (error) {
      console.error('Error toggling review visibility:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to toggle review visibility',
        error: error.message
      });
    }
  }

  /**
   * Get review statistics for a hostel
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHostelReviewStats(req, res) {
    try {
      const { hostelOwnerId } = req.params;

      // Get total reviews count
      const totalReviews = await prisma.review.count({
        where: {
          hostelOwnerId: parseInt(hostelOwnerId),
          isVisible: true
        }
      });

      // Get rating distribution
      const ratingDistribution = await prisma.$queryRaw`
        SELECT FLOOR(rating) as stars, COUNT(*) as count 
        FROM Review 
        WHERE hostelOwnerId = ${parseInt(hostelOwnerId)} 
        AND isVisible = true 
        GROUP BY FLOOR(rating) 
        ORDER BY stars DESC
      `;

      // Calculate average rating
      const avgRatingResult = await prisma.review.aggregate({
        where: {
          hostelOwnerId: parseInt(hostelOwnerId),
          isVisible: true
        },
        _avg: {
          rating: true
        }
      });

      const avgRating = avgRatingResult._avg.rating || 0;

      return res.status(200).json({
        success: true,
        message: 'Hostel review statistics retrieved successfully',
        data: {
          totalReviews,
          avgRating,
          ratingDistribution
        }
      });
    } catch (error) {
      console.error('Error retrieving hostel review stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve hostel review statistics',
        error: error.message
      });
    }
  }
}

/**
 * Helper function to update hostel's average rating and total ratings
 * @param {number} hostelOwnerId - ID of the hostel owner
 */
async function updateHostelRating(hostelOwnerId) {
  try {
    // Get all visible reviews for the hostel
    const reviews = await prisma.review.findMany({
      where: {
        hostelOwnerId,
        isVisible: true
      },
      select: {
        rating: true
      }
    });

    // Calculate new average
    const totalRatings = reviews.length;
    const avgRating = totalRatings > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalRatings
      : 0;

    // Update hostel
    await prisma.hostelOwner.update({
      where: { id: hostelOwnerId },
      data: {
        avgRating,
        totalRatings
      }
    });
  } catch (error) {
    console.error('Error updating hostel rating:', error);
    throw error;
  }
}

module.exports = new ReviewController();