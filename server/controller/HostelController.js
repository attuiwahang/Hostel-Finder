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
    });

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    return res.status(200).json({ success: true, hostel });

  } catch (error) {
    console.error("Error fetching hostel details:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
