const { bookHostel } = require("../controller/BookingController");
const { Payment } = require("../controller/PaymentController");


const router = require("express").Router();


router.post("/",bookHostel);
router.post('/payment',Payment)

module.exports = router;