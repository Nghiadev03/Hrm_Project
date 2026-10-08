const express = require("express");

const {
    getLeaveRequests,
    getMyLeaveRequests,
    getMyLeaveBalance,
    createLeaveRequest,
    cancelLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
} = require("../controllers/leaveRequestController");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authenticate);

// Nhân viên
router.get("/me", authorize("EMPLOYEE"), getMyLeaveRequests);
router.get("/balance", authorize("EMPLOYEE"), getMyLeaveBalance);
router.post("/", authorize("EMPLOYEE"), createLeaveRequest);
router.delete("/:id", authorize("EMPLOYEE"), cancelLeaveRequest);

// Admin
router.get("/", authorize("ADMIN"), getLeaveRequests);
router.patch("/:id/approve", authorize("ADMIN"), approveLeaveRequest);
router.patch("/:id/reject", authorize("ADMIN"), rejectLeaveRequest);

module.exports = router;
