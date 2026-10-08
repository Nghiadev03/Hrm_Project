# HRM — Hệ thống quản lý nhân sự

Ứng dụng web quản lý phòng ban, nhân viên và đơn nghỉ phép, với hai vai trò Admin và Nhân viên.

- **Backend**: Node.js, Express 5, Sequelize 6, PostgreSQL, JWT
- **Frontend**: React 19, Vite, React Router 7, CSS thuần

## Yêu cầu

- Node.js 22 trở lên (dự án được phát triển trên Node 24)
- PostgreSQL đang chạy, có một tài khoản được phép tạo database

## Cài đặt

### 1. Backend

```powershell
cd backend
npm install
copy .env.example .env
```

Mở `backend/.env`, điền `DB_USER`, `DB_PASSWORD` và `JWT_SECRET`.

### 2. Khởi tạo database

```powershell
npm run db:init -- --sample
```

Lệnh này làm 4 việc, và chạy lại nhiều lần không sao (thứ gì đã có thì bỏ qua):

1. Tạo database `DB_NAME` nếu chưa có.
2. Tạo bảng bằng cách chạy lần lượt các file trong `backend/sql/`.
3. Tạo tài khoản admin đầu tiên, nếu hệ thống chưa có admin nào.
4. Với `--sample`: thêm 3 phòng ban và 1 nhân viên mẫu. Bỏ `--sample` nếu chỉ cần bảng và admin.

Tài khoản sau khi khởi tạo:

| Email | Mật khẩu | Vai trò | Ghi chú |
|-------|----------|---------|---------|
| `admin@hrm.local` | `123456` | ADMIN | Đổi bằng `ADMIN_EMAIL`, `ADMIN_PASSWORD` trong `.env` trước khi chạy `db:init` |
| `employee@hrm.local` | `123456` | EMPLOYEE | Chỉ có khi dùng `--sample` |

### 3. Chạy

Mở hai terminal:

```powershell
cd backend
npm run dev          # API tại http://localhost:5000
```

```powershell
cd frontend
npm install
npm run dev          # giao diện tại http://localhost:5173
```

## Tài khoản admin được tạo như thế nào

Hệ thống không có chức năng tự đăng ký; mọi tài khoản do admin tạo. Vì vậy admin đầu tiên phải được tạo từ ngoài giao diện, bằng `npm run db:init` (`backend/src/scripts/initDb.js`):

- Script chỉ tạo admin khi bảng `employees` chưa có dòng nào mang vai trò `ADMIN`, nên không bao giờ ghi đè tài khoản đang dùng.
- Email, mật khẩu, tên lấy từ `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` trong `.env`; không đặt thì dùng `admin@hrm.local` / `123456`.
- Mật khẩu được băm bằng bcrypt trước khi lưu vào cột `password_hash`. Database không chứa mật khẩu gốc.

Từ đó admin đăng nhập và tạo các tài khoản khác ở màn hình **Nhân viên**.

Quên mật khẩu admin thì đặt lại từ dòng lệnh:

```powershell
npm run set-password -- <mật khẩu mới> <email>
```

## Kiểm thử API

```powershell
cd backend
npm test
```

Bộ kiểm thử tự bật server ở cổng 5055, gọi API thật 75 trường hợp và tự xoá dữ liệu nó tạo ra. Nó cần database đã khởi tạo với `--sample`. Nếu đã đổi email hoặc mật khẩu của hai tài khoản mẫu, đặt các biến `TEST_*` trong `.env` (xem `.env.example`).

Để thử bằng tay, nhập `docs/HRM.postman_collection.json` vào Postman: 27 request mẫu, đăng nhập xong token tự được dùng cho các request còn lại.

## Tài liệu khác

- `CLAUDE.md`: bảng API đầy đủ, cấu trúc thư mục, quy tắc nghiệp vụ, quy ước code.
- `giải thích.md`: giải thích code từ tổng thể đến chi tiết.
