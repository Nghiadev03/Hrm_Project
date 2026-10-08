const express = require("express");

const { getAdminDashboard, getMyDashboard } = require("../controllers/dashboardController");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authenticate);

router.get("/admin", authorize("ADMIN"), getAdminDashboard);
router.get("/me", getMyDashboard);

module.exports = router;
