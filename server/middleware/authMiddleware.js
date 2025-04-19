const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Authentication middleware that extracts user ID and role from JWT token
 * Works for both regular users and hostel owners
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Check if authorization header exists
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }

    // Extract token and clean it from any quotation marks or whitespace
    let token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    } 

    // Remove any possible quotes and whitespace
    token = token.replace(/^["'](.*)["']$/, '$1').trim();
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRETKEY);
    } catch (tokenError) {
      console.error("Token verification error:", tokenError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Check if token has required fields
    if (!decoded.id || !decoded.role) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }

const role = decoded.role
    // Set basic user info from token
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    // Fetch additional user details based on role
    if (role === 'STUDENT' || role === 'ADMIN') {
      // For regular users
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      // Add additional user info to request
      req.user.name = user.name;
      req.user.email = user.email;
      
    } else if (role === 'hostelOwner') {
      // For hostel owners
      const hostelOwner = await prisma.hostelOwner.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          hostelName: true,
          ownerName: true,
          email: true,
          isApproved: true
        }
      });

      if (!hostelOwner) {
        return res.status(401).json({
          success: false,
          message: 'Hostel owner not found'
        });
      }

      // Check if hostel owner is approved
      if (!hostelOwner.isApproved) {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending approval'
        });
      }

      // Add additional hostel owner info to request
      req.user.hostelName = hostelOwner.hostelName;
      req.user.ownerName = hostelOwner.ownerName;
      req.user.email = hostelOwner.email;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Invalid user role'
      });
    }

    // Continue to next middleware or route handler
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {string[]} roles - Array of allowed roles
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }

    next();
  };
};

module.exports = { authMiddleware, authorize };