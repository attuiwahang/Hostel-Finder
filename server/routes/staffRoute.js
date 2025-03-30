const {getAllStaff,getStaffStats, getStaffById, createStaff,updateStaff,deleteStaff   }  = require("../controller/staffController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { multer, storage } = require("../Services/MulterConfig");
const upload = multer({ storage: storage });

const router = require("express").Router();

router.get('/getStaff', authMiddleware, getAllStaff);
router.get('/stats', authMiddleware, getStaffStats);
router.get('/:staffId', authMiddleware, getStaffById);
router.post('/addStaff', authMiddleware, upload.single('photo'), createStaff);
router.put('/:staffId', authMiddleware, upload.single('photo'), updateStaff);
router.delete('/:staffId', authMiddleware, deleteStaff);

module.exports = router;