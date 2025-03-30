const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to handle errors
const handleError = (res, error, message = "An error occurred") => {
  console.error(`Error: ${message}`, error);
  return res.status(500).json({ success: false, message, error: error.message });
};

exports.createRoom = async (req, res) => {
  try {
    const {
      hostelOwnerId,
      roomNumber,
      roomType,
      floorNumber,
      monthlyPrice,
      securityDeposit,
      description,
      totalBeds,
      availableBeds,
      amenityIds,
      photos
    } = req.body;

    // Input validation
    if (!hostelOwnerId || !roomType || !monthlyPrice || !totalBeds) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing: hostelOwnerId, roomType, monthlyPrice, and totalBeds are required"
      });
    }

    // Verify hostel owner exists
    const hostelOwner = await prisma.hostelOwner.findUnique({
      where: { id: Number(hostelOwnerId) }
    });

    if (!hostelOwner) {
      return res.status(404).json({ success: false, message: "Hostel owner not found" });
    }

    // Create room with transaction to ensure all related data is created
    const room = await prisma.$transaction(async (prisma) => {
      // Create the room
      const newRoom = await prisma.room.create({
        data: {
          hostelOwnerId: Number(hostelOwnerId),
          roomNumber,
          roomType,
          floorNumber,
          monthlyPrice: parseFloat(monthlyPrice),
          securityDeposit: securityDeposit ? parseFloat(securityDeposit) : null,
          description,
          totalBeds: Number(totalBeds),
          availableBeds: Number(availableBeds || totalBeds)
        }
      });

      // Create room amenities if provided
      if (amenityIds && amenityIds.length > 0) {
        await Promise.all(
          amenityIds.map(amenityId =>
            prisma.roomAmenity.create({
              data: {
                roomId: newRoom.id,
                amenityId: Number(amenityId)
              }
            })
          )
        );
      }

      // Create room photos if provided
      if (photos && photos.length > 0) {
        await Promise.all(
          photos.map(photo =>
            prisma.roomPhoto.create({
              data: {
                roomId: newRoom.id,
                photoUrl: photo.url,
                caption: photo.caption
              }
            })
          )
        );
      }

      // Create beds for the room
      const beds = [];
      for (let i = 1; i <= totalBeds; i++) {
        beds.push({
          roomId: newRoom.id,
          bedNumber: `${roomNumber || 'R'}-${i}`,
          bedType: 'SINGLE' // Default type, can be customized
        });
      }

      await prisma.bed.createMany({
        data: beds
      });

      return newRoom;
    });

    // Fetch the complete room data with relationships
    const createdRoom = await prisma.room.findUnique({
      where: { id: room.id },
      include: {
        amenities: {
          include: {
            amenity: true
          }
        },
        photos: true,
        beds: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      room: createdRoom
    });

  } catch (error) {
    return handleError(res, error, "Error creating room");
  }
};

exports.getAllRooms = async (req, res) => {
  try {
    const { hostelOwnerId, roomType, minPrice, maxPrice, available } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (hostelOwnerId) {
      filter.hostelOwnerId = Number(hostelOwnerId);
    }
    
    if (roomType) {
      filter.roomType = roomType;
    }
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.monthlyPrice = {};
      if (minPrice) filter.monthlyPrice.gte = parseFloat(minPrice);
      if (maxPrice) filter.monthlyPrice.lte = parseFloat(maxPrice);
    }
    
    // Availability filter
    if (available === 'true') {
      filter.availableBeds = { gt: 0 };
    }

    const rooms = await prisma.room.findMany({
      where: filter,
      include: {
        hostelOwner: {
          select: {
            hostelName: true,
            location: true
          }
        },
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        },
        beds: {
          where: {
            isOccupied: available === 'true' ? false : undefined
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      rooms
    });

  } catch (error) {
    return handleError(res, error, "Error fetching rooms");
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id: Number(id) },
      include: {
        hostelOwner: {
          select: {
            id: true,
            hostelName: true,
            location: true,
            address: true,
            contact: true,
            mainPhoto: true
          }
        },
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        },
        beds: true,
        bookings: {
          include: {
            booking: {
              select: {
                checkInDate: true,
                duration: true,
                status: true
              }
            }
          },
          where: {
            booking: {
              status: {
                in: ['CONFIRMED', 'ACTIVE']
              }
            }
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Calculate availability
    const availableBedsCount = room.beds.filter(bed => !bed.isOccupied).length;

    return res.status(200).json({
      success: true,
      room: {
        ...room,
        availableBedsCount
      }
    });

  } catch (error) {
    return handleError(res, error, "Error fetching room details");
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      roomNumber,
      roomType,
      floorNumber,
      monthlyPrice,
      securityDeposit,
      description,
      totalBeds,
      availableBeds,
      amenityIds,
      photos
    } = req.body;

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: Number(id) },
      include: {
        beds: true,
        amenities: true
      }
    });

    if (!existingRoom) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Update room with transaction to ensure all related data is updated consistently
    const updatedRoom = await prisma.$transaction(async (prisma) => {
      // Update the room basic details
      const roomData = {
        roomNumber,
        roomType,
        floorNumber,
        description
      };

      if (monthlyPrice) roomData.monthlyPrice = parseFloat(monthlyPrice);
      if (securityDeposit) roomData.securityDeposit = parseFloat(securityDeposit);
      if (availableBeds) roomData.availableBeds = Number(availableBeds);

      // Check if totalBeds is being changed
      if (totalBeds && Number(totalBeds) !== existingRoom.totalBeds) {
        const currentBedCount = existingRoom.beds.length;
        const newTotalBeds = Number(totalBeds);
        roomData.totalBeds = newTotalBeds;

        // If increasing beds
        if (newTotalBeds > currentBedCount) {
          const additionalBeds = [];
          for (let i = currentBedCount + 1; i <= newTotalBeds; i++) {
            additionalBeds.push({
              roomId: Number(id),
              bedNumber: `${roomNumber || existingRoom.roomNumber || 'R'}-${i}`,
              bedType: 'SINGLE'
            });
          }

          await prisma.bed.createMany({
            data: additionalBeds
          });

          // Update available beds count
          if (!roomData.availableBeds) {
            roomData.availableBeds = existingRoom.availableBeds + (newTotalBeds - currentBedCount);
          }
        }
        // If decreasing beds - make sure we don't remove occupied beds
        else if (newTotalBeds < currentBedCount) {
          // Get the beds sorted by occupation status (unoccupied first)
          const beds = await prisma.bed.findMany({
            where: { roomId: Number(id) },
            orderBy: { isOccupied: 'asc' }
          });

          // Calculate how many beds to remove
          const bedsToRemove = currentBedCount - newTotalBeds;
          const unoccupiedBeds = beds.filter(bed => !bed.isOccupied);

          if (unoccupiedBeds.length < bedsToRemove) {
            return res.status(400).json({
              success: false,
              message: "Cannot reduce beds: too many beds are currently occupied"
            });
          }

          // Delete the excess beds
          await prisma.bed.deleteMany({
            where: {
              id: {
                in: unoccupiedBeds.slice(0, bedsToRemove).map(bed => bed.id)
              }
            }
          });

          // Update available beds count
          if (!roomData.availableBeds) {
            roomData.availableBeds = Math.max(0, existingRoom.availableBeds - bedsToRemove);
          }
        }
      }

      // Update the room
      const room = await prisma.room.update({
        where: { id: Number(id) },
        data: roomData
      });

      // Update amenities if provided
      if (amenityIds && amenityIds.length > 0) {
        // Remove existing amenities
        await prisma.roomAmenity.deleteMany({
          where: { roomId: Number(id) }
        });

        // Add new amenities
        await Promise.all(
          amenityIds.map(amenityId =>
            prisma.roomAmenity.create({
              data: {
                roomId: Number(id),
                amenityId: Number(amenityId)
              }
            })
          )
        );
      }

      // Update photos if provided
      if (photos && photos.length > 0) {
        // Keep track of which existing photos to keep
        const existingPhotoIds = photos
          .filter(photo => photo.id)
          .map(photo => Number(photo.id));

        // Delete photos that are not in the new list
        await prisma.roomPhoto.deleteMany({
          where: {
            roomId: Number(id),
            id: {
              notIn: existingPhotoIds.length > 0 ? existingPhotoIds : [-1] // Use -1 for empty array case
            }
          }
        });

        // Add or update photos
        for (const photo of photos) {
          if (photo.id) {
            // Update existing photo
            await prisma.roomPhoto.update({
              where: { id: Number(photo.id) },
              data: {
                photoUrl: photo.url,
                caption: photo.caption
              }
            });
          } else {
            // Create new photo
            await prisma.roomPhoto.create({
              data: {
                roomId: Number(id),
                photoUrl: photo.url,
                caption: photo.caption
              }
            });
          }
        }
      }

      return room;
    });

    // Fetch the complete updated room data with relationships
    const completeRoom = await prisma.room.findUnique({
      where: { id: Number(id) },
      include: {
        amenities: {
          include: {
            amenity: true
          }
        },
        photos: true,
        beds: true
      }
    });

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      room: completeRoom
    });

  } catch (error) {
    return handleError(res, error, "Error updating room");
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: Number(id) },
      include: {
        bookings: true
      }
    });

    if (!existingRoom) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Check if room has active bookings
    const activeBookings = await prisma.bookingRoom.findMany({
      where: {
        roomId: Number(id),
        booking: {
          status: {
            in: ['PENDING', 'CONFIRMED', 'ACTIVE']
          }
        }
      }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete room with active bookings"
      });
    }

    // Delete room with transaction to ensure all related data is deleted properly
    await prisma.$transaction(async (prisma) => {
      // Delete related beds
      await prisma.bed.deleteMany({
        where: { roomId: Number(id) }
      });

      // Delete related amenities
      await prisma.roomAmenity.deleteMany({
        where: { roomId: Number(id) }
      });

      // Delete related photos
      await prisma.roomPhoto.deleteMany({
        where: { roomId: Number(id) }
      });

      // Delete the room
      await prisma.room.delete({
        where: { id: Number(id) }
      });
    });

    return res.status(200).json({
      success: true,
      message: "Room deleted successfully"
    });

  } catch (error) {
    return handleError(res, error, "Error deleting room");
  }
};

exports.getAvailableRooms = async (req, res) => {
  try {
    const { 
      hostelOwnerId, 
      checkInDate, 
      duration, 
      roomType, 
      minPrice, 
      maxPrice, 
      amenities 
    } = req.query;

    if (!hostelOwnerId) {
      return res.status(400).json({ 
        success: false, 
        message: "hostelOwnerId is required" 
      });
    }

    // Parse check-in date or use current date
    const parsedCheckInDate = checkInDate ? new Date(checkInDate) : new Date();
    
    // Calculate check-out date based on duration (in months)
    const parsedDuration = duration ? parseInt(duration) : 1;
    const checkOutDate = new Date(parsedCheckInDate);
    checkOutDate.setMonth(checkOutDate.getMonth() + parsedDuration);

    // Build base query
    let query = {
      where: {
        hostelOwnerId: Number(hostelOwnerId),
        availableBeds: { gt: 0 }
      },
      include: {
        photos: true,
        amenities: {
          include: {
            amenity: true
          }
        },
        beds: {
          where: {
            isOccupied: false
          }
        },
        bookings: {
          include: {
            booking: true
          }
        }
      }
    };

    // Add room type filter if provided
    if (roomType) {
      query.where.roomType = roomType;
    }

    // Add price range filter if provided
    if (minPrice || maxPrice) {
      query.where.monthlyPrice = {};
      if (minPrice) query.where.monthlyPrice.gte = parseFloat(minPrice);
      if (maxPrice) query.where.monthlyPrice.lte = parseFloat(maxPrice);
    }

    // Get all rooms matching the base criteria
    let rooms = await prisma.room.findMany(query);

    // Filter rooms by checking overlapping bookings
    const availableRooms = rooms.filter(room => {
      // Check if there are any overlapping bookings that would make the room unavailable
      const hasOverlappingBookings = room.bookings.some(bookingRoom => {
        const booking = bookingRoom.booking;
        
        // Skip if booking is not confirmed or active
        if (!['CONFIRMED', 'ACTIVE'].includes(booking.status)) {
          return false;
        }
        
        // Calculate booking end date
        const bookingEndDate = new Date(booking.checkInDate);
        bookingEndDate.setMonth(bookingEndDate.getMonth() + booking.duration);
        
        // Check for overlap
        return (
          (parsedCheckInDate <= bookingEndDate) && 
          (checkOutDate >= booking.checkInDate)
        );
      });

      // If the room has available beds and no overlapping bookings, it's available
      return room.availableBeds > 0 && !hasOverlappingBookings;
    });

    // Filter by amenities if provided
    let filteredRooms = availableRooms;
    if (amenities) {
      const amenityIds = amenities.split(',').map(id => Number(id));
      filteredRooms = availableRooms.filter(room => {
        // Check if the room has all the requested amenities
        return amenityIds.every(amenityId => 
          room.amenities.some(ra => ra.amenityId === amenityId)
        );
      });
    }

    // Clean up the response structure
    const formattedRooms = filteredRooms.map(room => ({
      id: room.id,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      floorNumber: room.floorNumber,
      monthlyPrice: room.monthlyPrice,
      securityDeposit: room.securityDeposit,
      description: room.description,
      totalBeds: room.totalBeds,
      availableBeds: room.availableBeds,
      photos: room.photos,
      amenities: room.amenities.map(ra => ra.amenity),
      availableBedCount: room.beds.length
    }));

    return res.status(200).json({
      success: true,
      count: formattedRooms.length,
      rooms: formattedRooms
    });

  } catch (error) {
    return handleError(res, error, "Error fetching available rooms");
  }
};

exports.getRoomTypes = async (req, res) => {
  try {
    // Extract room types from enum
    const roomTypes = Object.keys({
      DORMITORY: 'Multiple beds for multiple people',
      SHARED_2: '2-bed room',
      SHARED_3: '3-bed room',
      SHARED_4: '4-bed room',
      SINGLE_ROOM: 'Private room with one bed',
      DOUBLE_ROOM: 'Private room with two beds'
    });

    return res.status(200).json({
      success: true,
      roomTypes
    });
  } catch (error) {
    return handleError(res, error, "Error fetching room types");
  }
};

exports.toggleBedStatus = async (req, res) => {
  try {
    const { bedId } = req.params;
    const { isOccupied } = req.body;

    if (isOccupied === undefined) {
      return res.status(400).json({
        success: false,
        message: "isOccupied status is required"
      });
    }

    // Check if bed exists
    const bed = await prisma.bed.findUnique({
      where: { id: Number(bedId) },
      include: { room: true }
    });

    if (!bed) {
      return res.status(404).json({ success: false, message: "Bed not found" });
    }

    // Update bed status with transaction to ensure room stats are updated
    const updatedBed = await prisma.$transaction(async (prisma) => {
      // Update bed status
      const result = await prisma.bed.update({
        where: { id: Number(bedId) },
        data: { isOccupied: Boolean(isOccupied) }
      });

      // Count available beds in the room
      const availableBeds = await prisma.bed.count({
        where: {
          roomId: bed.roomId,
          isOccupied: false
        }
      });

      // Update room's available beds count
      await prisma.room.update({
        where: { id: bed.roomId },
        data: { availableBeds }
      });

      return result;
    });

    return res.status(200).json({
      success: true,
      message: `Bed status updated to ${isOccupied ? 'occupied' : 'available'}`,
      bed: updatedBed
    });

  } catch (error) {
    return handleError(res, error, "Error updating bed status");
  }
};

exports.assignRoomToBooking = async (req, res) => {
  try {
    const { bookingId, roomId, bedIds } = req.body;

    if (!bookingId || !roomId || !bedIds || !bedIds.length) {
      return res.status(400).json({
        success: false,
        message: "bookingId, roomId, and bedIds are required"
      });
    }

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) }
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Verify room exists
    const room = await prisma.room.findUnique({
      where: { id: Number(roomId) }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Verify beds exist and are available
    const beds = await prisma.bed.findMany({
      where: { 
        id: { in: bedIds.map(id => Number(id)) },
        roomId: Number(roomId),
        isOccupied: false
      }
    });

    if (beds.length !== bedIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some beds do not exist or are already occupied"
      });
    }

    // Assign room and beds to booking with transaction
    await prisma.$transaction(async (prisma) => {
      // Create booking-room relationship
      await prisma.bookingRoom.create({
        data: {
          bookingId: Number(bookingId),
          roomId: Number(roomId)
        }
      });

      // Create booking-bed relationships
      await Promise.all(
        bedIds.map(bedId =>
          prisma.bookingBed.create({
            data: {
              bookingId: Number(bookingId),
              bedId: Number(bedId)
            }
          })
        )
      );

      // Mark beds as occupied
      await prisma.bed.updateMany({
        where: {
          id: { in: bedIds.map(id => Number(id)) }
        },
        data: {
          isOccupied: true
        }
      });

      // Update room's available beds count
      const availableBedCount = await prisma.bed.count({
        where: {
          roomId: Number(roomId),
          isOccupied: false
        }
      });

      await prisma.room.update({
        where: { id: Number(roomId) },
        data: {
          availableBeds: availableBedCount
        }
      });

      // Update booking status if needed
      if (booking.status === 'PENDING') {
        await prisma.booking.update({
          where: { id: Number(bookingId) },
          data: {
            status: 'CONFIRMED'
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Room and beds successfully assigned to booking"
    });

  } catch (error) {
    return handleError(res, error, "Error assigning room to booking");
  }
};

module.exports = exports;