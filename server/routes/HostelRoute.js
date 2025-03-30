const { getHostels, hostelDetails, getHostelInfo, updateHostelInfo, getAllAmenities } = require("../controller/HostelController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { multer, storage } = require("../Services/MulterConfig");
const upload = multer({ storage: storage });

const router = require("express").Router();

// router.post("/registerHostel", upload.single("images"), registerHostel);

router.get("/getHostels",getHostels);
router.get("/hostelInfo", authMiddleware, getHostelInfo);
router.get("/amenities", authMiddleware, getAllAmenities);
router.put("/update", authMiddleware, updateHostelInfo);
router.get("/getHostelDetail/:id", authMiddleware, hostelDetails);

module.exports = router;