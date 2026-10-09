// Thêm 10 nhân viên mẫu để thử nghiệm (tìm kiếm, lọc, phân trang).
// Chạy lại nhiều lần không sao: nhân viên nào đã có (theo email) thì bỏ qua.
//   npm run db:seed
// Mật khẩu của tất cả là 123456. Nhân viên được chia đều vào các phòng ban đang có.
require("dotenv").config();

const { sequelize, Department, Employee } = require("../models");
const { hashPassword } = require("../utils/password");

const SAMPLE_PASSWORD = "123456";

const SAMPLE_EMPLOYEES = [
    { employee_code: "EMP101", full_name: "Trần Thị Bình", email: "binh.tran@hrm.local", phone: "0901000101", position: "Chuyên viên nhân sự", date_of_birth: "1995-03-12", hire_date: "2022-06-01" },
    { employee_code: "EMP102", full_name: "Lê Minh Cường", email: "cuong.le@hrm.local", phone: "0901000102", position: "Lập trình viên Backend", date_of_birth: "1997-08-25", hire_date: "2023-01-15" },
    { employee_code: "EMP103", full_name: "Phạm Thu Dung", email: "dung.pham@hrm.local", phone: "0901000103", position: "Kế toán tổng hợp", date_of_birth: "1993-11-02", hire_date: "2021-09-10" },
    { employee_code: "EMP104", full_name: "Hoàng Văn Em", email: "em.hoang@hrm.local", phone: "0901000104", position: "Kiểm thử viên", date_of_birth: "1998-01-30", hire_date: "2024-03-04" },
    { employee_code: "EMP105", full_name: "Vũ Ngọc Giang", email: "giang.vu@hrm.local", phone: "0901000105", position: "Lập trình viên Frontend", date_of_birth: "1996-05-17", hire_date: "2023-07-20" },
    { employee_code: "EMP106", full_name: "Đặng Quốc Huy", email: "huy.dang@hrm.local", phone: "0901000106", position: "Trưởng nhóm kỹ thuật", date_of_birth: "1990-12-08", hire_date: "2020-02-17", annual_leave_days: 15 },
    { employee_code: "EMP107", full_name: "Bùi Thị Khánh", email: "khanh.bui@hrm.local", phone: "0901000107", position: "Chuyên viên tuyển dụng", date_of_birth: "1999-07-21", hire_date: "2024-08-12" },
    { employee_code: "EMP108", full_name: "Đỗ Thành Long", email: "long.do@hrm.local", phone: "0901000108", position: "Kế toán thanh toán", date_of_birth: "1994-04-05", hire_date: "2022-11-01" },
    { employee_code: "EMP109", full_name: "Ngô Thị Mai", email: "mai.ngo@hrm.local", phone: "0901000109", position: "Phân tích nghiệp vụ", date_of_birth: "1996-09-14", hire_date: "2023-04-03" },
    { employee_code: "EMP110", full_name: "Dương Văn Nam", email: "nam.duong@hrm.local", phone: "0901000110", position: "Thực tập sinh", date_of_birth: "2002-02-19", hire_date: "2025-06-02", status: "INACTIVE" },
];

async function main() {
    const departments = await Department.findAll({ order: [["id", "ASC"]] });
    const password_hash = await hashPassword(SAMPLE_PASSWORD);
    let created = 0;
    let skipped = 0;

    for (const [index, employee] of SAMPLE_EMPLOYEES.entries()) {
        const exists = await Employee.findOne({ where: { email: employee.email } });

        if (exists) {
            skipped += 1;
            continue;
        }

        // Chia vòng tròn vào các phòng ban đang có; chưa có phòng ban nào thì để trống
        const department = departments.length ? departments[index % departments.length] : null;

        try {
            await Employee.create({
                ...employee,
                department_id: department ? department.id : null,
                password_hash,
            });
            created += 1;
        } catch (error) {
            // Thường là mã nhân viên đã được dùng cho người khác
            skipped += 1;
            console.log(`Skipped ${employee.employee_code} (${employee.email}): ${error.message}`);
        }
    }

    console.log(`Created ${created} sample employee(s), skipped ${skipped}. Password: ${SAMPLE_PASSWORD}`);
    await sequelize.close();
}

main().catch((error) => {
    console.error("Failed to seed employees:");
    console.error(error.message);
    process.exit(1);
});
