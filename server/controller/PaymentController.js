const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

exports.Payment = async (req, res) => {
  const { hostelOwnerId, price, userId } = req.body;

  try {
   
    const booking = await prisma.booking.findFirst({
      where: {
        userId: Number(userId),
        hostelOwnerId: Number(hostelOwnerId),
        status: "PENDING"
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!booking) {
      return res.status(404).json({ 
        success: false,
        message: "No pending booking found" 
      });
    }

    // Prepare payment data
    const paymentData = {
      return_url: 'http://localhost:5173/success',
      website_url: 'http://localhost:5173',
      amount: price * 100, // Convert to paisa
      purchase_order_id: booking.id,
      purchase_order_name: "Booking Payment",
      customer_info: {
        name: booking.userName,
        email: booking.email,
      }
    };

   
    const response = await axios({
      method: 'post',
      url: 'https://a.khalti.com/api/v2/epayment/initiate/',
      headers: {
        'Authorization': 'Key fb8be6f6ad2d458f834a4e6bcb9561a5',
        'Content-Type': 'application/json'
      },
      data: paymentData
    });

   
    if (response.data && response.data.payment_url) {
      return res.status(200).json({
        success: true,
        data: response.data
      });
    }

    throw new Error('Invalid response from payment gateway');

  } catch (error) {
    console.error('Error initiating payment:', error);

  
    if (error.response) {
     
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.detail || 'Payment initiation failed',
        error: error.response.data
      });
    } else if (error.request) {
     
      return res.status(503).json({
        success: false,
        message: 'Payment service unavailable'
      });
    }

 
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const { pidx, amount, purchase_order_id } = req.query;

    console.log(pidx,amount,purchase_order_id)

    if (!pidx || !amount || !purchase_order_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters"
      });
    }

   
    const pendingBooking = await prisma.booking.findFirst({
      where: {
        id: Number(purchase_order_id),
        status: "PENDING"
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!pendingBooking) {
      console.log("yaha xa problem")
      return res.status(404).json({
        success: false,
        message: "No pending booking found"
      });

     
      
    }

   
    const [payment, updatedBooking] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          bookingId: Number(purchase_order_id),
          amount: Number(amount) / 100, 
          paymentDate: new Date(),
          paymentStatus: 'COMPLETED',
          pidx: pidx
        }
      }),
      prisma.booking.update({
        where: { id: Number(purchase_order_id) },
        data: { status: "CONFIRMED", updatedAt: new Date() }
      })
    ]);

    return res.status(200).json({
      success: true,
      message: "Payment confirmed successfully",
      data: { payment, booking: updatedBooking }
    });

  } catch (error) {
    console.error("Payment confirmation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message
    });
  }
};

