const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all staff for a hostel owner
exports.getAllStaff = async (req, res) => {
  try {
    const hostelOwnerId = req.user.id;

    const staff = await prisma.staff.findMany({
      where: { hostelOwnerId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching staff",
      error: error.message
    });
  }
};

// GET a single staff member by ID
exports.getStaffById = async (req, res) => {
  try {
    const hostelOwnerId = req.user.id;
    const { staffId } = req.params;

    // Validate staffId
    const id = parseInt(staffId);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID"
      });
    }

    // Find staff member
    const staff = await prisma.staff.findFirst({
      where: {
        id,
        hostelOwnerId
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found or you don't have permission to view"
      });
    }

    return res.status(200).json({
      success: true,
      staff
    });
  } catch (error) {
    console.error("Error fetching staff member:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching staff member",
      error: error.message
    });
  }
};

// CREATE a new staff member
exports.createStaff = async (req, res) => {
  try {
    const hostelOwnerId = req.user.id;
    const {
      name,
      role,
      shift,
      contact,
      email,
      status,
      joiningDate
    } = req.body;

    // Validate required fields
    if (!name || !role || !shift || !contact) {
      return res.status(400).json({
        success: false,
        message: "Name, role, shift, and contact are required"
      });
    }

    // Set photo from file upload if available
    let photo = null;
    if (req.file) {
      photo = process.env.IMAGE_URL + req.file.filename;
    }

    // Create staff member
    const newStaff = await prisma.staff.create({
      data: {
        hostelOwnerId,
        name,
        role,
        shift,
        contact,
        email,
        status: status || 'ON_DUTY',
        photo,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date()
      }
    });

    return res.status(201).json({
      success: true,
      message: "Staff member added successfully",
      staff: newStaff
    });
  } catch (error) {
    console.error("Error adding staff member:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while adding staff member",
      error: error.message
    });
  }
};

// UPDATE a staff member
exports.updateStaff = async (req, res) => {
  try {
    const hostelOwnerId = req.user.id;
    const { staffId } = req.params;
    const {
      name,
      role,
      shift,
      contact,
      email,
      status,
      joiningDate
    } = req.body;

    // Validate staffId
    const id = parseInt(staffId);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID"
      });
    }

    // Check if staff exists and belongs to this hostel owner
    const existingStaff = await prisma.staff.findFirst({
      where: {
        id,
        hostelOwnerId
      }
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found or you don't have permission to update"
      });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (shift) updateData.shift = shift;
    if (contact) updateData.contact = contact;
    if (email !== undefined) updateData.email = email;
    if (status) updateData.status = status;
    if (joiningDate) updateData.joiningDate = new Date(joiningDate);

    // Set photo from file upload if available
    if (req.file) {
      updateData.photo = process.env.IMAGE_URL + req.file.filename;
    }

    // Update staff member
    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: updateData
    });

    return res.status(200).json({
      success: true,
      message: "Staff member updated successfully",
      staff: updatedStaff
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating staff member",
      error: error.message
    });
  }
};

// DELETE a staff member
exports.deleteStaff = async (req, res) => {
  try {
    const hostelOwnerId = req.user.id;
    const { staffId } = req.params;

    // Validate staffId
    const id = parseInt(staffId);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID"
      });
    }

    // Check if staff exists and belongs to this hostel owner
    const staff = await prisma.staff.findFirst({
      where: {
        id,
        hostelOwnerId
      }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found or you don't have permission to delete"
      });
    }

    // Delete staff member
    await prisma.staff.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Staff member deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting staff member",
      error: error.message
    });
  }
};

// GET staff counts by role
exports.getStaffStats = async (req, res) => {
  try {
    const hostelOwnerId = req.user.id;

    // Get total staff count
    const totalStaff = await prisma.staff.count({
      where: { hostelOwnerId }
    });

    // Get staff on duty count
    const onDutyStaff = await prisma.staff.count({
      where: { 
        hostelOwnerId,
        status: 'ON_DUTY'
      }
    });

    // Get staff on leave count
    const onLeaveStaff = await prisma.staff.count({
      where: { 
        hostelOwnerId,
        status: 'ON_LEAVE'
      }
    });

    // Get staff counts by role
    const staffByRole = await prisma.staff.groupBy({
      by: ['role'],
      where: { hostelOwnerId },
      _count: true
    });

    // Format the role counts
    const roleStats = {};
    staffByRole.forEach(item => {
      roleStats[item.role] = item._count;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalStaff,
        onDutyStaff,
        onLeaveStaff,
        byRole: roleStats
      }
    });
  } catch (error) {
    console.error("Error fetching staff statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching staff statistics",
      error: error.message
    });
  }
};