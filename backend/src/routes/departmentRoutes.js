const express = require("express");

const {
    getDepartments,
    getDepartmentById,
    createDepartment,
    updateDepartment,
    deleteDepartment,
} = require("../controllers/departmentController");

const { authenticate, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

module.exports = router;