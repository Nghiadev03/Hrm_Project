-- Tạo 3 bảng gốc của hệ thống. Chạy lại nhiều lần không sao (bảng đã có thì bỏ qua).

CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Vừa là hồ sơ nhân viên, vừa là tài khoản đăng nhập
CREATE TABLE IF NOT EXISTS employees (
    id            SERIAL PRIMARY KEY,
    department_id INTEGER,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    full_name     VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone         VARCHAR(30),
    position      VARCHAR(100),
    date_of_birth DATE,
    hire_date     DATE,
    role          VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT employees_role_check CHECK (role IN ('ADMIN', 'EMPLOYEE')),
    CONSTRAINT employees_status_check CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT fk_employee_department FOREIGN KEY (department_id)
        REFERENCES departments (id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id          SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    leave_type  VARCHAR(30) NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    reason      TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    admin_note  TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT leave_requests_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CONSTRAINT chk_leave_date CHECK (end_date >= start_date),
    CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON UPDATE CASCADE ON DELETE CASCADE
);
