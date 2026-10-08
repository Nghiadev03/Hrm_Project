// Kiểm tra toàn bộ API trên server thật + database trong .env.
//   npm test
// Cần 2 tài khoản mẫu (admin@hrm.local / employee@hrm.local, mật khẩu 123456)
// và ít nhất 1 phòng ban; database mới thì chạy "npm run db:init -- --sample" trước.
// Mọi dữ liệu do script tạo ra đều có tiền tố "e2e" và được xoá khi kết thúc.
require("dotenv").config();

const path = require("path");
const { spawn } = require("child_process");
const { Op } = require("sequelize");
const { sequelize, Department, Employee } = require("../src/models");

const PORT = process.env.TEST_PORT || "5055";
const BASE = `http://localhost:${PORT}`;
// Đã đổi email / mật khẩu tài khoản mẫu thì đặt 4 biến TEST_* này trong .env
const ADMIN = {
    email: process.env.TEST_ADMIN_EMAIL || "admin@hrm.local",
    password: process.env.TEST_ADMIN_PASSWORD || "123456",
};
const SAMPLE_EMPLOYEE = {
    email: process.env.TEST_EMPLOYEE_EMAIL || "employee@hrm.local",
    password: process.env.TEST_EMPLOYEE_PASSWORD || "123456",
};

const suffix = Date.now();
const TEMP_EMAIL = `e2e-${suffix}@hrm.local`;
const TEMP_CODE = `E2E${suffix}`;
const TEMP_DEPARTMENT = `e2e-department-${suffix}`;

const results = [];
let serverLog = "";

const check = (name, got, want) => {
    const pass = JSON.stringify(got) === JSON.stringify(want);

    results.push({ pass, name });
    console.log(`${pass ? "PASS" : "FAIL"}  ${name}${pass ? "" : `  -> nhận ${JSON.stringify(got)}, mong đợi ${JSON.stringify(want)}`}`);
};

const call = async (method, url, { token, body } = {}) => {
    const response = await fetch(BASE + url, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });

    let json = null;

    try {
        json = await response.json();
    } catch (error) {
        // body không phải JSON
    }

    return { status: response.status, json: json || {} };
};

const login = async ({ email, password }) => {
    const response = await call("POST", "/api/auth/login", { body: { email, password } });

    return response.json.token;
};

const startServer = async () => {
    const server = spawn(process.execPath, ["src/server.js"], {
        cwd: path.resolve(__dirname, ".."),
        env: { ...process.env, PORT },
    });

    server.stdout.on("data", (data) => (serverLog += data));
    server.stderr.on("data", (data) => (serverLog += data));

    for (let i = 0; i < 60 && !serverLog.includes("Server running"); i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
    }

    if (!serverLog.includes("Server running")) {
        server.kill();
        throw new Error(`Server did not start:\n${serverLog}`);
    }

    return server;
};

// Thứ hai đầu tiên của tháng 3 năm sau, để không đụng dữ liệu thật của năm nay
const leaveYear = new Date().getFullYear() + 1;
const firstMonday = new Date(Date.UTC(leaveYear, 2, 1));

while (firstMonday.getUTCDay() !== 1) {
    firstMonday.setUTCDate(firstMonday.getUTCDate() + 1);
}

const day = (offset) => {
    const date = new Date(firstMonday);

    date.setUTCDate(date.getUTCDate() + offset);

    return date.toISOString().slice(0, 10);
};

const cleanup = async () => {
    await Employee.destroy({ where: { email: { [Op.like]: "e2e-%@hrm.local" } } });
    await Department.destroy({ where: { name: { [Op.like]: "e2e-department-%" } } });
};

const run = async () => {
    let r;

    // ---------- Xác thực ----------
    r = await call("POST", "/api/auth/login", { body: {} });
    check("login thiếu dữ liệu -> 400", r.status, 400);

    r = await call("POST", "/api/auth/login", { body: { email: ADMIN.email, password: "sai" } });
    check("login sai mật khẩu -> 401", r.status, 401);

    const adminToken = await login(ADMIN);
    const sampleToken = await login(SAMPLE_EMPLOYEE);
    check("login admin + employee mẫu", [!!adminToken, !!sampleToken], [true, true]);

    if (!adminToken || !sampleToken) {
        throw new Error(
            `Không đăng nhập được bằng ${ADMIN.email} / ${SAMPLE_EMPLOYEE.email}. ` +
                "Đặt TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_EMPLOYEE_EMAIL, TEST_EMPLOYEE_PASSWORD trong .env cho khớp tài khoản thật."
        );
    }

    r = await call("GET", "/api/auth/me", { token: adminToken });
    check("me -> 200, không lộ trường bí mật", [r.status, "password_hash" in r.json, "reset_token_hash" in r.json], [200, false, false]);

    r = await call("GET", "/api/auth/me");
    check("me không token -> 401", r.status, 401);

    r = await call("GET", "/api/khong-ton-tai");
    check("đường dẫn lạ -> 404", r.status, 404);

    // ---------- Phòng ban ----------
    r = await call("GET", "/api/departments", { token: sampleToken });
    check("departments bằng employee -> 403", r.status, 403);

    r = await call("POST", "/api/departments", { token: adminToken, body: { name: TEMP_DEPARTMENT, description: "tạm" } });
    check("tạo phòng ban -> 201", r.status, 201);
    const departmentId = r.json.id;

    r = await call("POST", "/api/departments", { token: adminToken, body: { name: TEMP_DEPARTMENT } });
    check("tạo phòng ban trùng tên -> 409", r.status, 409);

    r = await call("PUT", `/api/departments/${departmentId}`, { token: adminToken, body: { name: "  " } });
    check("sửa phòng ban tên rỗng -> 400", r.status, 400);

    r = await call("PUT", `/api/departments/${departmentId}`, { token: adminToken, body: { description: "đã sửa" } });
    check("sửa phòng ban -> 200, giữ nguyên tên", [r.status, r.json.name, r.json.description], [200, TEMP_DEPARTMENT, "đã sửa"]);

    r = await call("GET", "/api/departments?limit=2&page=1", { token: adminToken });
    check("phân trang phòng ban", [r.status, r.json.data.length, r.json.pagination.limit, r.json.pagination.total >= 2], [200, 2, 2, true]);

    r = await call("GET", `/api/departments?search=${TEMP_DEPARTMENT}`, { token: adminToken });
    check("tìm phòng ban theo tên", r.json.pagination.total, 1);

    // ---------- Nhân viên ----------
    const newEmployee = {
        employee_code: TEMP_CODE,
        full_name: `E2E Nhan Vien ${suffix}`,
        email: TEMP_EMAIL,
        password: "matkhau1",
        department_id: departmentId,
        position: "Tester",
        annual_leave_days: 5,
    };

    r = await call("POST", "/api/employees", { token: sampleToken, body: newEmployee });
    check("tạo nhân viên bằng employee -> 403", r.status, 403);

    r = await call("POST", "/api/employees", { token: adminToken, body: { ...newEmployee, password: "123" } });
    check("tạo nhân viên mật khẩu ngắn -> 400", r.status, 400);

    r = await call("POST", "/api/employees", { token: adminToken, body: newEmployee });
    check("tạo nhân viên -> 201", [r.status, r.json.role, r.json.status, r.json.department && r.json.department.id, "password_hash" in r.json], [201, "EMPLOYEE", "ACTIVE", departmentId, false]);
    const employeeId = r.json.id;

    r = await call("POST", "/api/employees", { token: adminToken, body: { ...newEmployee, employee_code: `${TEMP_CODE}X` } });
    check("tạo nhân viên trùng email -> 409", [r.status, r.json.field], [409, "email"]);

    r = await call("POST", "/api/employees", { token: adminToken, body: { ...newEmployee, employee_code: `${TEMP_CODE}Y`, email: `e2e-y-${suffix}@hrm.local`, department_id: 99999999 } });
    check("tạo nhân viên phòng ban không tồn tại -> 400", r.status, 400);

    r = await call("GET", `/api/employees?search=${TEMP_CODE}`, { token: adminToken });
    check("tìm nhân viên", [r.status, r.json.pagination.total, r.json.data[0] && r.json.data[0].email], [200, 1, TEMP_EMAIL]);

    r = await call("GET", `/api/employees?department_id=${departmentId}`, { token: adminToken });
    check("lọc nhân viên theo phòng ban", r.json.pagination.total, 1);

    r = await call("GET", "/api/employees?limit=1&page=2", { token: adminToken });
    check("phân trang nhân viên", [r.json.data.length, r.json.pagination.page, r.json.pagination.total >= 3], [1, 2, true]);

    r = await call("PUT", `/api/employees/${employeeId}`, { token: adminToken, body: { position: "Senior Tester", phone: "0900000000" } });
    check("sửa nhân viên -> 200", [r.status, r.json.position, r.json.phone, r.json.email], [200, "Senior Tester", "0900000000", TEMP_EMAIL]);

    r = await call("PUT", `/api/employees/${employeeId}`, { token: adminToken, body: { role: "GIAMDOC" } });
    check("sửa nhân viên role sai -> 400", r.status, 400);

    r = await call("GET", "/api/employees/99999999", { token: adminToken });
    check("nhân viên không tồn tại -> 404", r.status, 404);

    const me = await call("GET", "/api/auth/me", { token: adminToken });

    r = await call("DELETE", `/api/employees/${me.json.id}`, { token: adminToken });
    check("admin tự xoá mình -> 400", r.status, 400);

    r = await call("PUT", `/api/employees/${me.json.id}`, { token: adminToken, body: { status: "INACTIVE" } });
    check("admin tự khoá mình -> 400", r.status, 400);

    // ---------- Đổi mật khẩu ----------
    let tempToken = await login({ email: TEMP_EMAIL, password: "matkhau1" });
    check("nhân viên mới đăng nhập được", !!tempToken, true);

    r = await call("POST", "/api/auth/change-password", { token: tempToken, body: { current_password: "sai", new_password: "matkhau2" } });
    check("đổi mật khẩu, sai mật khẩu cũ -> 400", r.status, 400);

    r = await call("POST", "/api/auth/change-password", { token: tempToken, body: { current_password: "matkhau1", new_password: "123" } });
    check("đổi mật khẩu, mật khẩu mới quá ngắn -> 400", r.status, 400);

    r = await call("POST", "/api/auth/change-password", { token: tempToken, body: { current_password: "matkhau1", new_password: "matkhau2" } });
    check("đổi mật khẩu -> 200", r.status, 200);

    check("mật khẩu cũ hết dùng được, mật khẩu mới dùng được", [!!(await login({ email: TEMP_EMAIL, password: "matkhau1" })), !!(await login({ email: TEMP_EMAIL, password: "matkhau2" }))], [false, true]);

    // ---------- Quên mật khẩu ----------
    r = await call("POST", "/api/auth/forgot-password", { body: { email: "khong-co@hrm.local" } });
    check("quên mật khẩu, email lạ -> vẫn 200", r.status, 200);

    r = await call("POST", "/api/auth/forgot-password", { body: { email: TEMP_EMAIL } });
    check("quên mật khẩu -> 200", r.status, 200);

    await new Promise((resolve) => setTimeout(resolve, 300));
    const match = serverLog.match(new RegExp(`\\[password-reset\\] ${TEMP_EMAIL} -> \\S*token=([0-9a-f]+)`));
    const resetToken = match ? match[1] : null;
    check("link đặt lại mật khẩu được in ra console server", !!resetToken, true);
    check("email lạ không sinh link", serverLog.includes("khong-co@hrm.local"), false);

    r = await call("POST", "/api/auth/reset-password", { body: { token: "token-sai", new_password: "matkhau3" } });
    check("đặt lại mật khẩu, token sai -> 400", r.status, 400);

    r = await call("POST", "/api/auth/reset-password", { body: { token: resetToken, new_password: "matkhau3" } });
    check("đặt lại mật khẩu -> 200", r.status, 200);

    r = await call("POST", "/api/auth/reset-password", { body: { token: resetToken, new_password: "matkhau4" } });
    check("dùng lại token cũ -> 400", r.status, 400);

    tempToken = await login({ email: TEMP_EMAIL, password: "matkhau3" });
    check("đăng nhập bằng mật khẩu vừa đặt lại", !!tempToken, true);

    r = await call("PUT", `/api/employees/${employeeId}`, { token: adminToken, body: { password: "matkhau5" } });
    tempToken = await login({ email: TEMP_EMAIL, password: "matkhau5" });
    check("admin đặt lại mật khẩu cho nhân viên", [r.status, !!tempToken], [200, true]);

    // ---------- Nghỉ phép + số ngày phép (nhân viên tạm có 5 ngày phép năm) ----------
    r = await call("GET", `/api/leave-requests/balance?year=${leaveYear}`, { token: tempToken });
    check("số ngày phép ban đầu", r.json, { year: leaveYear, total: 5, used: 0, pending: 0, remaining: 5, available: 5 });

    r = await call("POST", "/api/leave-requests", { token: adminToken, body: { leave_type: "ANNUAL", start_date: day(0), end_date: day(0) } });
    check("admin tạo đơn -> 403", r.status, 403);

    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "NGHI_CHOI", start_date: day(0), end_date: day(2) } });
    check("loại nghỉ sai -> 400", r.status, 400);

    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "ANNUAL", start_date: "2027-02-30", end_date: day(2) } });
    check("ngày không hợp lệ -> 400", r.status, 400);

    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "ANNUAL", start_date: day(2), end_date: day(0) } });
    check("ngày kết thúc trước ngày bắt đầu -> 400", r.status, 400);

    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "ANNUAL", start_date: day(5), end_date: day(6) } });
    check("đơn chỉ gồm thứ 7 + chủ nhật -> 400", r.status, 400);

    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "ANNUAL", start_date: day(0), end_date: day(2), reason: "việc gia đình" } });
    check("tạo đơn ANNUAL thứ 2 - thứ 4 -> 201, 3 ngày, PENDING", [r.status, r.json.days, r.json.status], [201, 3, "PENDING"]);
    const annualId = r.json.id;

    r = await call("GET", `/api/leave-requests/balance?year=${leaveYear}`, { token: tempToken });
    check("số ngày phép sau khi tạo đơn", [r.json.used, r.json.pending, r.json.remaining, r.json.available], [0, 3, 5, 2]);

    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "SICK", start_date: day(2), end_date: day(3) } });
    check("đơn trùng ngày -> 409", r.status, 409);

    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "ANNUAL", start_date: day(3), end_date: day(7) } });
    check("đơn ANNUAL vượt số ngày còn lại (3 ngày làm việc, còn 2) -> 400", r.status, 400);

    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "SICK", start_date: day(3), end_date: day(7) } });
    check("đơn SICK không bị giới hạn ngày phép -> 201, bỏ qua cuối tuần", [r.status, r.json.days], [201, 3]);
    const sickId = r.json.id;

    r = await call("GET", "/api/leave-requests/me", { token: tempToken });
    check("đơn của tôi", [r.status, r.json.pagination.total], [200, 2]);

    r = await call("GET", "/api/leave-requests/me?limit=1", { token: tempToken });
    check("phân trang đơn của tôi", [r.json.data.length, r.json.pagination.total_pages], [1, 2]);

    r = await call("GET", "/api/leave-requests", { token: tempToken });
    check("employee xem tất cả đơn -> 403", r.status, 403);

    r = await call("DELETE", `/api/leave-requests/${annualId}`, { token: sampleToken });
    check("huỷ đơn của người khác -> 404", r.status, 404);

    r = await call("PATCH", `/api/leave-requests/${annualId}/approve`, { token: tempToken });
    check("employee tự duyệt -> 403", r.status, 403);

    r = await call("GET", `/api/leave-requests?employee_id=${employeeId}&status=PENDING`, { token: adminToken });
    check("admin lọc đơn theo nhân viên + trạng thái", [r.status, r.json.pagination.total, r.json.data[0].employee.email, r.json.data[0].employee.department.id], [200, 2, TEMP_EMAIL, departmentId]);

    r = await call("PATCH", `/api/leave-requests/${annualId}/approve`, { token: adminToken, body: { admin_note: "ok" } });
    check("admin duyệt -> 200", [r.status, r.json.status, r.json.admin_note], [200, "APPROVED", "ok"]);

    r = await call("PATCH", `/api/leave-requests/${annualId}/reject`, { token: adminToken });
    check("duyệt lại đơn đã xử lý -> 400", r.status, 400);

    r = await call("PATCH", `/api/leave-requests/${sickId}/reject`, { token: adminToken, body: { admin_note: "thiếu giấy khám" } });
    check("admin từ chối -> 200", [r.status, r.json.status, r.json.admin_note], [200, "REJECTED", "thiếu giấy khám"]);

    r = await call("GET", `/api/leave-requests/balance?year=${leaveYear}`, { token: tempToken });
    check("số ngày phép sau khi duyệt", [r.json.used, r.json.pending, r.json.remaining, r.json.available], [3, 0, 2, 2]);

    r = await call("GET", `/api/employees/${employeeId}/leave-balance?year=${leaveYear}`, { token: adminToken });
    check("admin xem số ngày phép của nhân viên", [r.status, r.json.remaining], [200, 2]);

    r = await call("DELETE", `/api/leave-requests/${annualId}`, { token: tempToken });
    check("huỷ đơn đã duyệt -> 400", r.status, 400);

    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "UNPAID", start_date: day(8), end_date: day(8) } });
    const unpaidId = r.json.id;
    r = await call("DELETE", `/api/leave-requests/${unpaidId}`, { token: tempToken });
    check("huỷ đơn đang chờ -> 200", r.status, 200);

    // Duyệt phải kiểm tra lại số ngày phép: tạo đơn 2 ngày, admin giảm số ngày phép xuống 3 (đã dùng 3), rồi duyệt
    r = await call("POST", "/api/leave-requests", { token: tempToken, body: { leave_type: "ANNUAL", start_date: day(9), end_date: day(10) } });
    const secondAnnualId = r.json.id;
    await call("PUT", `/api/employees/${employeeId}`, { token: adminToken, body: { annual_leave_days: 3 } });
    r = await call("PATCH", `/api/leave-requests/${secondAnnualId}/approve`, { token: adminToken });
    check("duyệt đơn vượt số ngày phép -> 400", [!!secondAnnualId, r.status], [true, 400]);

    // ---------- Tổng quan ----------
    r = await call("GET", "/api/dashboard/admin", { token: tempToken });
    check("tổng quan admin bằng employee -> 403", r.status, 403);

    r = await call("GET", "/api/dashboard/admin", { token: adminToken });
    const tempDepartment = (r.json.employees_by_department || []).find((item) => item.id === departmentId);
    check("tổng quan admin", [r.status, r.json.total_departments >= 1, r.json.total_employees >= 3, r.json.leave_requests.PENDING >= 1, typeof r.json.on_leave_today, tempDepartment && tempDepartment.employee_count, r.json.recent_pending_requests.length >= 1], [200, true, true, true, "number", 1, true]);

    r = await call("GET", "/api/dashboard/me", { token: tempToken });
    check("tổng quan của tôi", [r.status, r.json.profile.email, r.json.profile.department.id, r.json.leave_balance.total, r.json.leave_requests, r.json.recent_requests.length], [200, TEMP_EMAIL, departmentId, 3, { PENDING: 1, APPROVED: 1, REJECTED: 1 }, 3]);

    // ---------- Khoá tài khoản + xoá ----------
    r = await call("PUT", `/api/employees/${employeeId}`, { token: adminToken, body: { status: "INACTIVE" } });
    check("khoá tài khoản -> 200", r.status, 200);

    r = await call("GET", "/api/auth/me", { token: tempToken });
    check("token của tài khoản bị khoá -> 401", r.status, 401);

    r = await call("POST", "/api/auth/login", { body: { email: TEMP_EMAIL, password: "matkhau5" } });
    check("tài khoản bị khoá đăng nhập -> 403", r.status, 403);

    r = await call("DELETE", `/api/departments/${departmentId}`, { token: adminToken });
    check("xoá phòng ban -> 200", r.status, 200);

    r = await call("GET", `/api/employees/${employeeId}`, { token: adminToken });
    check("nhân viên của phòng ban bị xoá -> department_id = null", [r.status, r.json.department_id], [200, null]);

    r = await call("DELETE", `/api/employees/${employeeId}`, { token: adminToken });
    check("xoá nhân viên -> 200", r.status, 200);

    r = await call("GET", `/api/leave-requests?employee_id=${employeeId}`, { token: adminToken });
    check("đơn nghỉ của nhân viên bị xoá cũng mất", r.json.pagination.total, 0);
};

(async () => {
    let server;
    let crashed = false;

    try {
        server = await startServer();
        await run();
    } catch (error) {
        crashed = true;
        console.error("LỖI KHI CHẠY TEST:", error.stack || error.message);
    } finally {
        if (server) {
            server.kill();
        }

        await cleanup();
        await sequelize.close();
    }

    const failed = results.filter((item) => !item.pass);

    console.log(`\n${results.length - failed.length}/${results.length} đạt`);
    process.exit(failed.length || crashed ? 1 : 0);
})();
