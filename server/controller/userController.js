const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken")

const prisma = new PrismaClient();

exports.registerUser = async (req, res) => {
  const { name, email, password, address, contact, role } = req.body;

  if (!name || !email || !password || !contact) {
    return res.status(400).json({ message: 'Name, email, password, and contact are required.' });
  }

  try {
   
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use. Please try another.' });
    }

 
    const hashedPassword = await bcrypt.hash(password, 10);

  
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        address: address || null,
        contact,
        role: role || 'STUDENT', 
      },
    });

  
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      contact: user.contact,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

exports.registerOwner = async (req, res) => {
  try {
    const {
      hostelName,
      ownerName,
      email,
      password,
      contact,
      location,
      address,
      latitude,
      longitude,
      description,
      gender,
    } = req.body;

    // Check that a file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Main photo is required" });
    }

    // Get the filename from multer (the file is stored in req.file)
    const filename = req.file.filename;
    console.log("Uploaded file:", req.file);
    console.log("Request body:", req.body);

    // Validate essential fields 
    if (
      !hostelName ||
      !ownerName ||
      !email ||
      !password ||
      !contact ||
      !location ||
      !address ||
      latitude === undefined ||
      longitude === undefined ||
      !description
    ) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Check for an existing user
    const existingUser = await prisma.hostelOwner.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default values for optional fields
    const genderPolicy = gender || 'COED';
    const startingPrice = 0; // Will be updated later

    // Create the new hostel owner with only essential fields
    const newHostelOwner = await prisma.hostelOwner.create({
      data: {
        hostelName,
        ownerName,
        email,
        password: hashedPassword,
        contact,
        location,
        address,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        description,
        mainPhoto: process.env.IMAGE_URL + filename,
        startingPrice,
        gender: genderPolicy,
        isApproved: false,
        isVerified: false,
        // Other fields like rules, checkInTime, checkOutTime, amenities, etc. 
        // will be updated later through separate endpoints
      },
    });

    res.status(201).json({
      message: "Hostel owner registered successfully",
      ownerId: newHostelOwner.id,
      email: newHostelOwner.email
    });
  } catch (error) {
    console.error("Error registering hostel owner:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
  }
  try {
     
      let user = await prisma.user.findUnique({ where: { email } });

      if (user) {
          const isPasswordMatched = await bcrypt.compare(password, user.password);
          if (!isPasswordMatched) {
              return res.status(401).json({ message: 'Invalid password.' });
          }

          
          const token = jwt.sign(
              { id: user.id, role: user.role },
              process.env.SECRETKEY,
              { expiresIn: '30d' }
          );

          return res.json({
              message: 'Login successful',
              token,
              role: user.role,
              info: user
          });
      }

      // If not a normal user, check if they are a hostel owner
      let owner = await prisma.hostelOwner.findUnique({ where: { email } });

      if (owner) {
          // Verify password
          const isPasswordMatched = await bcrypt.compare(password, owner.password);
          if (!isPasswordMatched) {
              return res.status(401).json({ message: 'Invalid password.' });
          }

          // Check approval status
          if (!owner.isApproved) {
              return res.status(401).json({ message: 'You are not approved yet.' });
          }

          // Generate token
          const token = jwt.sign(
              { id: owner.id, role: 'hostelOwner' },
              process.env.SECRETKEY,
              { expiresIn: '30d' }
          );

          return res.json({
              message: 'Login successful',
              token,
              role: 'hostelOwner',
              info: owner
          });
      }

      // If no user or hostel owner is found
      return res.status(404).json({ message: 'User not found.' });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

exports.getUserForVerification = async (req, res) => {
  try {
    const users = await prisma.hostelOwner.findMany({
      where: {
        isApproved: false,
      },
    });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error fetching unapproved users:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.verifyUser = async (req, res) => {
  const { id } = req.params; 

  try {
    if (!id) {
      return res.status(400).json({ success: false, message: "ID is required" });
    }

    const user = await prisma.hostelOwner.findFirst({
      where: {
        id: parseInt(id), 
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updatedUser = await prisma.hostelOwner.update({
      where: { id: parseInt(id) },
      data: { isApproved: true },
    });

    return res.status(200).json({ success: true, message: "User verified successfully", user: updatedUser });

  } catch (error) {
    console.error("Error verifying user:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.DeleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = Number(id);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const user = await prisma.hostelOwner.findFirst({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await prisma.hostelOwner.delete({
      where: { id: userId },
    });

    return res.status(200).json({ success: true, message: "User deleted successfully" });

  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
