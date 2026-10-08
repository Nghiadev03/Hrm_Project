const { Op } = require("sequelize");
const { LeaveRequest } = require("../models");
const { BALANCE_LEAVE_TYPE, countWorkingDays } = require("./leaveDays");

// Số ngày phép năm của một nhân viên trong một năm.
//   total     - số ngày được cấp (employees.annual_leave_days)
//   used      - đã dùng (đơn ANNUAL đã APPROVED)
//   pending   - đang chờ duyệt (đơn ANNUAL còn PENDING)
//   remaining - total - used
//   available - total - used - pending (số ngày còn có thể xin thêm)
const getLeaveBalance = async (employee, year) => {
    const requests = await LeaveRequest.findAll({
        where: {
            employee_id: employee.id,
            leave_type: BALANCE_LEAVE_TYPE,
            status: { [Op.in]: ["PENDING", "APPROVED"] },
            start_date: { [Op.lte]: `${year}-12-31` },
            end_date: { [Op.gte]: `${year}-01-01` },
        },
    });

    let used = 0;
    let pending = 0;

    for (const request of requests) {
        const days = countWorkingDays(request.start_date, request.end_date, year);

        if (request.status === "APPROVED") {
            used += days;
        } else {
            pending += days;
        }
    }

    const total = employee.annual_leave_days;

    return {
        year,
        total,
        used,
        pending,
        remaining: total - used,
        available: total - used - pending,
    };
};

module.exports = {
    getLeaveBalance,
};
