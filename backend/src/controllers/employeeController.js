const { Op } = require("sequelize");
const { Employee, Department } = require("../models");
const { getPagination, paginate } = require("../utils/pagination");
const handleError = require("../utils/handleError");
const { MIN_PASSWORD_LENGTH, isValidPassword, hashPassword } = require("../utils/password");
const { getLeaveBalance } = require("../utils/leaveBalance");

const includeDepartment = {
    model: Department,
    as: "department",
    attributes: ["id", "name"],
};

// Các trường admin được phép gửi lên khi tạo / sửa nhân viên (mật khẩu xử lý riêng)
const EDITABLE_FIELDS = [
    "employee_code",
    "full_name",
    "email",
    "phone",
    "position",
    "date_of_birth",
    "hire_date",
    "department_id",
    "role",
    "status",
    "annual_leave_days",
];

const pickEditableFields = (body) => {
    const values = {};

    for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) {
            // chuỗi rỗng từ form coi như bỏ trống
            values[field] = body[field] === "" ? null : body[field];
        }
    }

    return values;
};

// GET /api/employees?page=&limit=&search=&department_id=&role=&status=
const getEmployees = async (req, res) => {
    try {
        const pagination = getPagination(req.query);
        const { search, department_id, role, status } = req.query;
        const where = {};

        if (search) {
            where[Op.or] = [
                { full_name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { employee_code: { [Op.iLike]: `%${search}%` } },
            ];
        }

        if (department_id) {
            where.department_id = department_id;
        }

        if (role) {
            where.role = role;
        }

        if (status) {
            where.status = status;
        }

        const { rows, count } = await Employee.findAndCountAll({
            where,
            include: [includeDepartment],
            order: [["id", "ASC"]],
            limit: pagination.limit,
            offset: pagination.offset,
        });

        res.json(paginate(rows, count, pagination));
    } catch (error) {
        handleError(res, error, "Failed to get employees");
    }
};

// GET /api/employees/:id
const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id, {
            include: [includeDepartment],
        });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found",
            });
        }

        res.json(employee);
    } catch (error) {
        handleError(res, error, "Failed to get employee");
    }
};

// GET /api/employees/:id/leave-balance?year=
const getEmployeeLeaveBalance = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found",
            });
        }

        const year = parseInt(req.query.year, 10) || new Date().getFullYear();

        res.json(await getLeaveBalance(employee, year));
    } catch (error) {
        handleError(res, error, "Failed to get leave balance");
    }
};

// POST /api/employees
const createEmployee = async (req, res) => {
    try {
        const body = req.body || {};
        const values = pickEditableFields(body);

        if (!values.employee_code || !values.full_name || !values.email) {
            return res.status(400).json({
                message: "Employee code, full name and email are required",
            });
        }

        if (!isValidPassword(body.password)) {
            return res.status(400).json({
                message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            });
        }

        const employee = await Employee.create({
            ...values,
            password_hash: await hashPassword(body.password),
        });

        res.status(201).json(
            await Employee.findByPk(employee.id, { include: [includeDepartment] })
        );
    } catch (error) {
        handleError(res, error, "Failed to create employee");
    }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found",
            });
        }

        const body = req.body || {};
        const values = pickEditableFields(body);

        for (const field of ["employee_code", "full_name", "email"]) {
            if (field in values && !values[field]) {
                return res.status(400).json({
                    message: "Employee code, full name and email cannot be empty",
                });
            }
        }

        // Admin không tự khoá hoặc tự hạ quyền chính mình
        if (employee.id === req.user.id) {
            const demoted = values.role !== undefined && values.role !== "ADMIN";
            const deactivated = values.status !== undefined && values.status !== "ACTIVE";

            if (demoted || deactivated) {
                return res.status(400).json({
                    message: "You cannot change your own role or deactivate your own account",
                });
            }
        }

        // Có gửi password thì đặt lại mật khẩu cho nhân viên
        if (body.password !== undefined && body.password !== "") {
            if (!isValidPassword(body.password)) {
                return res.status(400).json({
                    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
                });
            }

            values.password_hash = await hashPassword(body.password);
        }

        await employee.update(values);

        res.json(
            await Employee.findByPk(employee.id, { include: [includeDepartment] })
        );
    } catch (error) {
        handleError(res, error, "Failed to update employee");
    }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.params.id);

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found",
            });
        }

        if (employee.id === req.user.id) {
            return res.status(400).json({
                message: "You cannot delete your own account",
            });
        }

        await employee.destroy();

        res.json({
            message: "Employee deleted successfully",
        });
    } catch (error) {
        handleError(res, error, "Failed to delete employee");
    }
};

module.exports = {
    getEmployees,
    getEmployeeById,
    getEmployeeLeaveBalance,
    createEmployee,
    updateEmployee,
    deleteEmployee,
};
