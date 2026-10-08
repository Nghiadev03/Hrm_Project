const express = require("express");

const {
    getEmployees,
    getEmployeeById,
    getEmployeeLeaveBalance,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} = require("../controllers/employeeController");
const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", getEmployees);
router.get("/:id", getEmployeeById);
router.get("/:id/leave-balance", getEmployeeLeaveBalance);
router.post("/", createEmployee);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;
