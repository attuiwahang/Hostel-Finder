const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
   
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (adminExists) {
      console.log("Admin user already exists.");
      return;
    }

  
    const hashedPassword = await bcrypt.hash("Admin123!", 10); 

  
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin123@gmail.com",
        password: hashedPassword,
        contact: "9815333510",
        role: "ADMIN",
      },
    });

    console.log("Admin user seeded successfully.");
  } catch (error) {
    console.error(" Error seeding admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}


seedAdmin();
