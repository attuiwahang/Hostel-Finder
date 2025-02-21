const { registerUser, loginUser, registerOwner,getUserForVerification, verifyUser, DeleteUser } = require("../controller/userController");
const { multer, storage } = require("../Services/MulterConfig");
const upload = multer({ storage: storage });

const router = require("express").Router();

router.post("/registerUser", registerUser);
router.post("/registerOwner", upload.single("mainPhoto"), registerOwner);
router.post("/login", loginUser);

router.get("/getUsersForVerification", getUserForVerification);
router.post("/verifyUser/:id", verifyUser);
router.post("/deleteUser/:id", DeleteUser);


module.exports = router;
