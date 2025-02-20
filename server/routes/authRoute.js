const {registerUser,loginUser} = require("../controller/userController");

const router = require("express").Router()

router.route("/register").post(registerUser)
router.post('/login', loginUser);


module.exports = router