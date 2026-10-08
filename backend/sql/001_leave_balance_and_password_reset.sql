-- Thêm số ngày phép năm và token đặt lại mật khẩu cho bảng employees.
-- Chạy lại nhiều lần không sao.

ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS annual_leave_days integer NOT NULL DEFAULT 12,
    ADD COLUMN IF NOT EXISTS reset_token_hash text,
    ADD COLUMN IF NOT EXISTS reset_token_expires_at timestamptz;

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_annual_leave_days_check;
ALTER TABLE employees
    ADD CONSTRAINT employees_annual_leave_days_check CHECK (annual_leave_days >= 0);
