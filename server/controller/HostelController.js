const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getHostels = async (req, res) => {
  try {
    const hostels = await prisma.hostelOwner.findMany({
      where: {
        isApproved: true,
      },
    });

    return res.status(200).json({ success: true, hostels });
  } catch (error) {
    console.error("Error fetching hostels:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.hostelDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const hostel = await prisma.hostelOwner.findFirst({
      where: {
        id: parseInt(id), 
        isApproved: true,
      },
      include: {
        // Include related photos
        photos: true,
        
        // Include amenities with their details
        amenities: {
          include: {
            amenity: true
          }
        },
        
        // Include rooms with their details
        rooms: {
          include: {
            photos: true,
            amenities: {
              include: {
                amenity: true
              }
            },
            beds: true
          }
        },
        
        // Include reviews
        reviews: {
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
          take: 5 // Get 5 most recent reviews by default
        },
        
        // Include staff information if needed
        staff: {
          where: {
            status: 'ON_DUTY'
          }
        }
      }
    });

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    // Calculate additional info like availability
    const roomsWithAvailability = hostel.rooms.map(room => {
      const totalBedsAvailable = room.beds.filter(bed => !bed.isOccupied).length;
      return {
        ...room,
        availability: totalBedsAvailable,
        bedsAvailable: totalBedsAvailable
      };
    });

    // Format amenities for easier frontend use
    const formattedAmenities = hostel.amenities.map(item => ({
      id: item.amenity.id,
      name: item.amenity.name,
      icon: item.amenity.icon,
      category: item.amenity.category
    }));

    // Restructure the response
    const hostelDetails = {
      ...hostel,
      rooms: roomsWithAvailability,
      formattedAmenities
    };

    return res.status(200).json({ 
      success: true, 
      hostel: hostelDetails
    });

  } catch (error) {
    console.error("Error fetching hostel details:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


// Controller to GET hostel information
exports.getHostelInfo = async (req, res) => {
  try {
    const  hostelId  = req.user.id;
    
    // Validate hostel ID
    const id = parseInt(hostelId);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hostel ID"
      });
    }
    
    // Fetch hostel information with all related details
    const hostel = await prisma.hostelOwner.findUnique({
      where: { id },
      select: {
        id: true,
        hostelName: true,
        ownerName: true,
        contact: true,
        location: true,
        address: true,
        latitude: true,
        longitude: true,
        description: true,
        mainPhoto: true,
        startingPrice: true,
        gender: true,
        rules: true,
        checkInTime: true,
        checkOutTime: true,
        isVerified: true,
        photos: {
          select: {
            id: true,
            photoUrl: true,
            caption: true
          }
        },
        amenities: {
          select: {
            amenity: {
              select: {
                id: true,
                name: true,
                icon: true,
                category: true
              }
            }
          }
        }
      }
    });
    
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: "Hostel not found"
      });
    }
    
    // Format amenities for easier consumption
    const formattedHostel = {
      ...hostel,
      amenities: hostel.amenities.map(item => item.amenity)
    };
    
    // Group amenities by category
    const amenitiesByCategory = {};
    formattedHostel.amenities.forEach(amenity => {
      if (!amenitiesByCategory[amenity.category]) {
        amenitiesByCategory[amenity.category] = [];
      }
      amenitiesByCategory[amenity.category].push(amenity);
    });
    
    formattedHostel.amenitiesByCategory = amenitiesByCategory;
    
    return res.status(200).json({
      success: true,
      hostel: formattedHostel
    });
  } catch (error) {
    console.error("Error fetching hostel information:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while retrieving hostel information",
      error: error.message
    });
  }
};

// Controller to UPDATE hostel information
exports.updateHostelInfo = async (req, res) => {
  try {
    const hostelOwnerId = req.user.id;
    
    // Get data from request body
    const {
      contact,
      location,
      address,
      latitude,
      longitude,
      description,
      startingPrice,
      rules,
      checkInTime,
      checkOutTime,
      amenityIds,
      gender
    } = req.body;
    
    // Prepare basic data for update
    const updateData = {};
    
    if (contact) updateData.contact = contact;
    if (location) updateData.location = location;
    if (address) updateData.address = address;
    if (latitude) updateData.latitude = parseFloat(latitude);
    if (longitude) updateData.longitude = parseFloat(longitude);
    if (description) updateData.description = description;
    if (startingPrice) updateData.startingPrice = parseFloat(startingPrice);
    if (rules !== undefined) updateData.rules = rules;
    if (checkInTime) updateData.checkInTime = checkInTime;
    if (checkOutTime) updateData.checkOutTime = checkOutTime;
    if (gender) updateData.gender = gender;
    
    // Use transaction to update everything atomically
    await prisma.$transaction(async (tx) => {
      // 1. Update basic hostel information
      await tx.hostelOwner.update({
        where: { id: hostelOwnerId },
        data: updateData
      });
      
      // 2. Update amenities if provided
      if (amenityIds && Array.isArray(amenityIds)) {
        // Remove existing amenities
        await tx.hostelAmenity.deleteMany({
          where: { hostelOwnerId }
        });
        
        // Add new amenities
        if (amenityIds.length > 0) {
          const amenityData = amenityIds.map(amenityId => ({
            hostelOwnerId,
            amenityId: parseInt(amenityId)
          }));
          
          await tx.hostelAmenity.createMany({
            data: amenityData
          });
        }
      }
    });
    
    // Fetch updated hostel with all related information
    const updatedHostel = await prisma.hostelOwner.findUnique({
      where: { id: hostelOwnerId },
      select: {
        contact: true,
        location: true,
        address: true,
        latitude: true,
        longitude: true,
        description: true,
        startingPrice: true,
        gender: true,
        rules: true,
        checkInTime: true,
        checkOutTime: true,
        amenities: {
          select: {
            amenity: {
              select: {
                id: true,
                name: true,
                icon: true,
                category: true
              }
            }
          }
        }
      }
    });
    
    // Format amenities for easier consumption
    const formattedResponse = {
      ...updatedHostel,
      amenities: updatedHostel.amenities.map(item => item.amenity)
    };
    
    // Group amenities by category
    const amenitiesByCategory = {};
    formattedResponse.amenities.forEach(amenity => {
      if (!amenitiesByCategory[amenity.category]) {
        amenitiesByCategory[amenity.category] = [];
      }
      amenitiesByCategory[amenity.category].push(amenity);
    });
    
    formattedResponse.amenitiesByCategory = amenitiesByCategory;
    
    return res.status(200).json({
      success: true,
      message: "Hostel information updated successfully",
      hostel: formattedResponse
    });
  } catch (error) {
    console.error("Error updating hostel information:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating hostel information",
      error: error.message
    });
  }
};

// Controller to GET all available amenities
exports.getAllAmenities = async (req, res) => {
  try {
    // Fetch all amenities from the database
    const amenities = await prisma.amenity.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    // Group amenities by category for easier frontend consumption
    const categorizedAmenities = {};
    amenities.forEach(amenity => {
      if (!categorizedAmenities[amenity.category]) {
        categorizedAmenities[amenity.category] = [];
      }
      categorizedAmenities[amenity.category].push(amenity);
    });
    
    return res.status(200).json({
      success: true,
      amenities,
      categorizedAmenities
    });
  } catch (error) {
    console.error("Error fetching amenities:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching amenities",
      error: error.message
    });
  }
};