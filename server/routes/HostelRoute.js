const { getHostels, hostelDetails } = require("../controller/HostelController");
const { multer, storage } = require("../Services/MulterConfig");
const upload = multer({ storage: storage });

const router = require("express").Router();

// router.post("/registerHostel", upload.single("images"), registerHostel);

router.get("/getHostels",getHostels);
router.get("/getHostelDetail/:id",hostelDetails);

module.exports = router;