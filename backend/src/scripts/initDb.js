// Khởi tạo database từ đầu: tạo database (nếu chưa có), tạo bảng, tạo tài khoản admin đầu tiên.
// Chạy lại nhiều lần không sao: thứ gì đã có thì bỏ qua, không ghi đè.
//   npm run db:init                 -> bảng + tài khoản admin
//   npm run db:init -- --sample     -> thêm dữ liệu mẫu (3 phòng ban, 1 nhân viên)
//
// Tài khoản admin lấy từ biến môi trường, không đặt thì dùng giá trị mặc định:
//   ADMIN_EMAIL (admin@hrm.local), ADMIN_PASSWORD (123456), ADMIN_NAME (System Admin)
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { sequelize, Department, Employee } = require("../models");
const { isValidPassword, hashPassword, MIN_PASSWORD_LENGTH } = require("../utils/password");

const SQL_DIR = path.resolve(__dirname, "../../sql");

const DEFAULT_ADMIN_PASSWORD = "123456";
const SAMPLE_DEPARTMENTS = [
    { name: "IT", description: "Information Technology Department" },
    { name: "HR", description: "Human Resources Department" },
    { name: "Finance", description: "Finance Department" },
];
const SAMPLE_EMPLOYEE = {
    employee_code: "EMP002",
    full_name: "Nguyen Van A",
    email: "employee@hrm.local",
    password: "123456",
    position: "Developer",
};

// Bước 1: tạo database nếu chưa có. Phải kết nối vào database "postgres" vì database đích chưa tồn tại.
async function ensureDatabase() {
    const name = process.env.DB_NAME;

    if (!/^[A-Za-z0-9_]+$/.test(name || "")) {
        throw new Error("DB_NAME is missing or contains invalid characters");
    }

    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: "postgres",
    });

    await client.connect();

    try {
        const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);

        if (result.rowCount === 0) {
            await client.query(`CREATE DATABASE "${name}"`);
            console.log(`Created database "${name}".`);
        } else {
            console.log(`Database "${name}" already exists.`);
        }
    } finally {
        await client.end();
    }
}

// Bước 2: chạy lần lượt mọi file trong backend/sql theo thứ tự tên
async function runSqlFiles() {
    const files = fs.readdirSync(SQL_DIR).filter((file) => file.endsWith(".sql")).sort();

    for (const file of files) {
        await sequelize.query(fs.readFileSync(path.join(SQL_DIR, file), "utf8"));
        console.log(`Executed sql/${file}`);
    }
}

// Bước 3: tạo tài khoản admin đầu tiên, chỉ khi hệ thống chưa có admin nào
async function ensureAdmin() {
    const existing = await Employee.findOne({ where: { role: "ADMIN" } });

    if (existing) {
        console.log(`Admin account already exists (${existing.email}), skipped.`);
        return;
    }

    const email = process.env.ADMIN_EMAIL || "admin@hrm.local";
    const password = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;

    if (!isValidPassword(password)) {
        throw new Error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    await Employee.create({
        employee_code: "EMP001",
        full_name: process.env.ADMIN_NAME || "System Admin",
        email,
        // Mật khẩu chỉ được lưu dưới dạng băm bcrypt
        password_hash: await hashPassword(password),
        role: "ADMIN",
        status: "ACTIVE",
    });

    console.log(`Created admin account: ${email}`);

    if (password === DEFAULT_ADMIN_PASSWORD) {
        console.log(`  Password is the default "${DEFAULT_ADMIN_PASSWORD}". Change it after the first login.`);
    }
}

// Bước 4 (tuỳ chọn): dữ liệu mẫu để thử nghiệm và để chạy npm test
async function seedSampleData() {
    for (const department of SAMPLE_DEPARTMENTS) {
        await Department.findOrCreate({
            where: { name: department.name },
            defaults: department,
        });
    }

    const { password, ...employee } = SAMPLE_EMPLOYEE;
    const department = await Department.findOne({ where: { name: SAMPLE_DEPARTMENTS[0].name } });
    const [, created] = await Employee.findOrCreate({
        where: { email: employee.email },
        defaults: {
            ...employee,
            department_id: department.id,
            password_hash: await hashPassword(password),
        },
    });

    console.log(
        created
            ? `Created sample data: ${SAMPLE_DEPARTMENTS.length} departments, employee ${employee.email} / ${password}`
            : "Sample data already exists, skipped."
    );
}

async function main() {
    const withSample = process.argv.includes("--sample");

    await ensureDatabase();
    await runSqlFiles();
    await ensureAdmin();

    if (withSample) {
        await seedSampleData();
    }

    await sequelize.close();
    console.log("Database is ready.");
}

main().catch((error) => {
    console.error("Failed to initialize database:");
    console.error(error.message);
    process.exit(1);
});
