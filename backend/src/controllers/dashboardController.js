const { Op, fn, col } = require("sequelize");
const { Department, Employee, LeaveRequest } = require("../models");
const handleError = require("../utils/handleError");
const { getLeaveBalance } = require("../utils/leaveBalance");
const { todayString } = require("../utils/leaveDays");

const RECENT_LIMIT = 5;

// Đếm đơn theo trạng thái, luôn trả đủ 3 khoá
const countByStatus = async (where = {}) => {
    const rows = await LeaveRequest.findAll({
        where,
        attributes: ["status", [fn("COUNT", col("id")), "count"]],
        group: ["status"],
        raw: true,
    });

    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 };

    for (const row of rows) {
        counts[row.status] = Number(row.count);
    }

    return counts;
};

// GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
    try {
        const today = todayString();

        const [
            totalDepartments,
            totalEmployees,
            activeEmployees,
            leaveRequests,
            onLeaveToday,
            departments,
            recentPending,
        ] = await Promise.all([
            Department.count(),
            Employee.count(),
            Employee.count({ where: { status: "ACTIVE" } }),
            countByStatus(),
            LeaveRequest.count({
                where: {
                    status: "APPROVED",
                    start_date: { [Op.lte]: today },
                    end_date: { [Op.gte]: today },
                },
            }),
            Department.findAll({
                attributes: ["id", "name", [fn("COUNT", col("employees.id")), "employee_count"]],
                include: [{ model: Employee, as: "employees", attributes: [] }],
                group: ["Department.id"],
                order: [["name", "ASC"]],
                raw: true,
            }),
            LeaveRequest.findAll({
                where: { status: "PENDING" },
                include: [
                    {
                        model: Employee,
                        as: "employee",
                        attributes: ["id", "employee_code", "full_name"],
                    },
                ],
                order: [["created_at", "DESC"], ["id", "DESC"]],
                limit: RECENT_LIMIT,
            }),
        ]);

        res.json({
            total_departments: totalDepartments,
            total_employees: totalEmployees,
            active_employees: activeEmployees,
            on_leave_today: onLeaveToday,
            leave_requests: leaveRequests,
            employees_by_department: departments.map((department) => ({
                id: department.id,
                name: department.name,
                employee_count: Number(department.employee_count),
            })),
            recent_pending_requests: recentPending,
        });
    } catch (error) {
        handleError(res, error, "Failed to get dashboard");
    }
};

// GET /api/dashboard/me
const getMyDashboard = async (req, res) => {
    try {
        const [profile, leaveBalance, leaveRequests, recentRequests] = await Promise.all([
            Employee.findByPk(req.user.id, {
                include: [{ model: Department, as: "department", attributes: ["id", "name"] }],
            }),
            getLeaveBalance(req.user, new Date().getFullYear()),
            countByStatus({ employee_id: req.user.id }),
            LeaveRequest.findAll({
                where: { employee_id: req.user.id },
                order: [["created_at", "DESC"], ["id", "DESC"]],
                limit: RECENT_LIMIT,
            }),
        ]);

        res.json({
            profile,
            leave_balance: leaveBalance,
            leave_requests: leaveRequests,
            recent_requests: recentRequests,
        });
    } catch (error) {
        handleError(res, error, "Failed to get dashboard");
    }
};

module.exports = {
    getAdminDashboard,
    getMyDashboard,
};
