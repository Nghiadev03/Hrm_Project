const { Op } = require("sequelize");
const { LeaveRequest, Employee, Department } = require("../models");
const { getPagination, paginate } = require("../utils/pagination");
const handleError = require("../utils/handleError");
const { getLeaveBalance } = require("../utils/leaveBalance");
const {
    LEAVE_TYPES,
    BALANCE_LEAVE_TYPE,
    isValidDate,
    countWorkingDays,
    yearsInRange,
} = require("../utils/leaveDays");

const includeEmployee = {
    model: Employee,
    as: "employee",
    attributes: ["id", "employee_code", "full_name", "email", "department_id"],
    include: [
        {
            model: Department,
            as: "department",
            attributes: ["id", "name"],
        },
    ],
};

// Kiểm tra đơn ANNUAL có vượt số ngày phép không. Trả về câu lỗi, hoặc null nếu đủ.
//   countPending = true  -> so với số ngày còn xin được (đã trừ các đơn đang chờ) - dùng khi tạo đơn
//   countPending = false -> so với số ngày còn lại - dùng khi duyệt (đơn đang duyệt vốn nằm trong pending)
const checkBalance = async (employee, start, end, countPending) => {
    for (const year of yearsInRange(start, end)) {
        const days = countWorkingDays(start, end, year);
        const balance = await getLeaveBalance(employee, year);
        const allowed = countPending ? balance.available : balance.remaining;

        if (days > allowed) {
            return `Not enough annual leave for ${year}: requested ${days} day(s), ${allowed} available`;
        }
    }

    return null;
};

// GET /api/leave-requests?page=&limit=&status=&leave_type=&employee_id=   (admin)
const getLeaveRequests = async (req, res) => {
    try {
        const pagination = getPagination(req.query);
        const { status, leave_type, employee_id } = req.query;
        const where = {};

        if (status) {
            where.status = status;
        }

        if (leave_type) {
            where.leave_type = leave_type;
        }

        if (employee_id) {
            where.employee_id = employee_id;
        }

        const { rows, count } = await LeaveRequest.findAndCountAll({
            where,
            include: [includeEmployee],
            order: [["created_at", "DESC"], ["id", "DESC"]],
            limit: pagination.limit,
            offset: pagination.offset,
            distinct: true,
        });

        res.json(paginate(rows, count, pagination));
    } catch (error) {
        handleError(res, error, "Failed to get leave requests");
    }
};

// GET /api/leave-requests/me?page=&limit=&status=
const getMyLeaveRequests = async (req, res) => {
    try {
        const pagination = getPagination(req.query);
        const where = { employee_id: req.user.id };

        if (req.query.status) {
            where.status = req.query.status;
        }

        const { rows, count } = await LeaveRequest.findAndCountAll({
            where,
            order: [["created_at", "DESC"], ["id", "DESC"]],
            limit: pagination.limit,
            offset: pagination.offset,
        });

        res.json(paginate(rows, count, pagination));
    } catch (error) {
        handleError(res, error, "Failed to get leave requests");
    }
};

// GET /api/leave-requests/balance?year=
const getMyLeaveBalance = async (req, res) => {
    try {
        const year = parseInt(req.query.year, 10) || new Date().getFullYear();

        res.json(await getLeaveBalance(req.user, year));
    } catch (error) {
        handleError(res, error, "Failed to get leave balance");
    }
};

// POST /api/leave-requests
const createLeaveRequest = async (req, res) => {
    try {
        const { leave_type, start_date, end_date, reason } = req.body || {};

        if (!LEAVE_TYPES.includes(leave_type)) {
            return res.status(400).json({
                message: `Leave type must be one of: ${LEAVE_TYPES.join(", ")}`,
            });
        }

        if (!isValidDate(start_date) || !isValidDate(end_date)) {
            return res.status(400).json({
                message: "Start date and end date must be valid dates (YYYY-MM-DD)",
            });
        }

        if (end_date < start_date) {
            return res.status(400).json({
                message: "End date must be on or after start date",
            });
        }

        if (countWorkingDays(start_date, end_date) === 0) {
            return res.status(400).json({
                message: "Leave request must include at least one working day",
            });
        }

        const overlapping = await LeaveRequest.findOne({
            where: {
                employee_id: req.user.id,
                status: { [Op.in]: ["PENDING", "APPROVED"] },
                start_date: { [Op.lte]: end_date },
                end_date: { [Op.gte]: start_date },
            },
        });

        if (overlapping) {
            return res.status(409).json({
                message: "You already have a leave request in this period",
            });
        }

        if (leave_type === BALANCE_LEAVE_TYPE) {
            const balanceError = await checkBalance(req.user, start_date, end_date, true);

            if (balanceError) {
                return res.status(400).json({
                    message: balanceError,
                });
            }
        }

        const leaveRequest = await LeaveRequest.create({
            employee_id: req.user.id,
            leave_type,
            start_date,
            end_date,
            reason,
        });

        res.status(201).json(leaveRequest);
    } catch (error) {
        handleError(res, error, "Failed to create leave request");
    }
};

// DELETE /api/leave-requests/:id   (huỷ đơn của chính mình khi còn PENDING)
const cancelLeaveRequest = async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest.findOne({
            where: {
                id: req.params.id,
                employee_id: req.user.id,
            },
        });

        if (!leaveRequest) {
            return res.status(404).json({
                message: "Leave request not found",
            });
        }

        if (leaveRequest.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending leave requests can be cancelled",
            });
        }

        await leaveRequest.destroy();

        res.json({
            message: "Leave request cancelled successfully",
        });
    } catch (error) {
        handleError(res, error, "Failed to cancel leave request");
    }
};

// Dùng chung cho duyệt và từ chối
const reviewLeaveRequest = (status) => async (req, res) => {
    try {
        const leaveRequest = await LeaveRequest.findByPk(req.params.id, {
            include: [{ model: Employee, as: "employee" }],
        });

        if (!leaveRequest) {
            return res.status(404).json({
                message: "Leave request not found",
            });
        }

        if (leaveRequest.status !== "PENDING") {
            return res.status(400).json({
                message: "Only pending leave requests can be reviewed",
            });
        }

        if (status === "APPROVED" && leaveRequest.leave_type === BALANCE_LEAVE_TYPE) {
            const balanceError = await checkBalance(
                leaveRequest.employee,
                leaveRequest.start_date,
                leaveRequest.end_date,
                false
            );

            if (balanceError) {
                return res.status(400).json({
                    message: balanceError,
                });
            }
        }

        const { admin_note } = req.body || {};

        await leaveRequest.update({
            status,
            admin_note: admin_note === undefined ? leaveRequest.admin_note : admin_note,
        });

        res.json(
            await LeaveRequest.findByPk(leaveRequest.id, { include: [includeEmployee] })
        );
    } catch (error) {
        handleError(res, error, "Failed to review leave request");
    }
};

// PATCH /api/leave-requests/:id/approve
const approveLeaveRequest = reviewLeaveRequest("APPROVED");

// PATCH /api/leave-requests/:id/reject
const rejectLeaveRequest = reviewLeaveRequest("REJECTED");

module.exports = {
    getLeaveRequests,
    getMyLeaveRequests,
    getMyLeaveBalance,
    createLeaveRequest,
    cancelLeaveRequest,
    approveLeaveRequest,
    rejectLeaveRequest,
};
