const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
    } = req.body;

    console.log("Received request body:", req.body);

   
    if (!userId || !hostelOwnerId || !userName || !email || !phoneNumber || !checkInDate || !noOfPeople) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Ensure checkInDate is a valid date
    const checkInDateObj = new Date(checkInDate);
    if (isNaN(checkInDateObj.getTime())) {
      return res.status(400).json({ message: "Invalid check-in date format" });
    }


    const newBooking = await prisma.booking.create({
      data: {
        userId: Number(userId),
        hostelOwnerId: Number(hostelOwnerId),
        userName,
        email,
        phoneNumber,
        checkInDate: checkInDateObj,
        noOfPeople: Number(noOfPeople),
        status: "PENDING", 
      },
    });

    

    return res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking,
    });


  } catch (error) {
    console.error("Error booking hostel:", error);

    
    if (error.code === "P2002") {
      return res.status(400).json({ message: "A booking with this email already exists" });
    }

    return res.status(500).json({
      message: "An error occurred while booking the hostel",
      error: error.message,
    });
  }
};
