const { bookHostel } = require("../controller/BookingController");
const { Payment, confirmPayment } = require("../controller/PaymentController");


const router = require("express").Router();


router.post("/",bookHostel);
router.post('/payment',Payment)
router.get('/confirmpayment', confirmPayment);

module.exports = router;