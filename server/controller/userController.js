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


exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
  
    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
  
    try {
      // Find user by email
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res
          .status(404)
          .json({ message: 'User with that email does not exist.' });
      }
  
      // Compare provided password with stored hashed password
      const isPasswordMatched = await bcrypt.compare(password, user.password);
      if (!isPasswordMatched) {
        return res.status(401).json({ message: 'Invalid password.' });
      }
  
      // Generate JWT token (ensure SECRETKEY is set in your environment)
      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.SECRETKEY,
        { expiresIn: '30d' }
      );
  
      res.json({
        message: 'Login successful',
        token,
        role: user.role,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: 'Server error. Please try again later.' });
    }
  };