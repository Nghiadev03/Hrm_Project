# HRM — Hệ thống quản lý nhân sự

Ứng dụng web quản lý nhân sự với 3 chức năng chính: quản lý phòng ban, quản lý nhân viên, xin nghỉ phép.

## Yêu cầu gốc

Hai vai trò, dùng chung một màn hình đăng nhập:

| Vai trò  | Màn hình |
|----------|----------|
| Chung    | Đăng nhập |
| Admin    | Tổng quan · Danh sách phòng ban · Danh sách nhân viên · Duyệt nghỉ phép |
| Employee | Tổng quan · Đơn nghỉ phép của tôi |

Bổ sung ngoài yêu cầu gốc (đã làm ở backend): đổi mật khẩu, quên mật khẩu, phân trang danh sách, quản lý số ngày phép còn lại.

## Công nghệ

- **Backend**: Node.js (CommonJS) + Express 5 + Sequelize 6 + PostgreSQL (`pg`)
- **Xác thực**: JWT (`jsonwebtoken`) + `bcrypt`
- **Frontend**: React 19 (JavaScript, không TypeScript) + Vite + React Router 7 + axios. **CSS thuần**, không dùng thư viện UI hay framework CSS

## Lệnh

Cần chạy cả hai cùng lúc, mỗi cái một terminal:

```powershell
cd backend
npm run dev                                   # nodemon src/server.js, mặc định cổng 5000
npm start                                     # node src/server.js
npm test                                      # kiểm tra toàn bộ API (75 trường hợp), xem mục Kiểm thử
npm run set-password -- <mật khẩu>            # đặt lại mật khẩu cho TẤT CẢ tài khoản
npm run set-password -- <mật khẩu> <email>    # đặt lại mật khẩu cho một tài khoản
npm run sql -- sql/<file>.sql                 # chạy một file SQL lên database
npm run db:init                               # tạo database + bảng + admin đầu tiên (chạy lại được)
npm run db:init -- --sample                   # như trên, thêm 3 phòng ban và 1 nhân viên mẫu
```

```powershell
cd frontend
npm run dev                                   # http://localhost:5173
npm run build                                 # đóng gói vào frontend/dist
npm run preview                               # chạy thử bản đã đóng gói
```

Frontend gọi API ở `http://localhost:5000/api`. Muốn đổi thì tạo `frontend/.env` với `VITE_API_URL` (xem `frontend/.env.example`).

Cấu hình trong `backend/.env` (không commit):

| Biến | Ý nghĩa |
|------|---------|
| `PORT` | Cổng server, mặc định 5000 |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Kết nối PostgreSQL |
| `JWT_SECRET` | Khoá ký token |
| `JWT_EXPIRES_IN` | Thời hạn token, đang là `1d` |
| `FRONTEND_URL` | (chưa đặt) Gốc của link đặt lại mật khẩu, mặc định `http://localhost:5173` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | (tuỳ chọn) Admin đầu tiên do `db:init` tạo |
| `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, `TEST_EMPLOYEE_EMAIL`, `TEST_EMPLOYEE_PASSWORD` | (tuỳ chọn) Tài khoản `npm test` dùng để đăng nhập |

Mẫu đầy đủ ở `backend/.env.example`; thêm biến mới thì thêm vào đó. Hướng dẫn cài đặt cho người mới ở `README.md`.

Chưa có linter.

## Khởi tạo database và tài khoản

`npm run db:init` (`src/scripts/initDb.js`) dựng mọi thứ từ một máy trống, và chạy lại không ghi đè gì:

1. Tạo database `DB_NAME` nếu chưa có (kết nối tạm vào database `postgres`)
2. Chạy lần lượt mọi file `backend/sql/*.sql` theo thứ tự tên
3. Tạo admin đầu tiên **chỉ khi chưa có nhân viên nào mang vai trò `ADMIN`**; lấy từ `ADMIN_*` trong `.env`, mặc định `admin@hrm.local` / `123456`, mã `EMP001`
4. Với `--sample`: thêm phòng ban IT, HR, Finance và nhân viên `employee@hrm.local` / `123456`

Đã kiểm tra trên một database trống: cấu trúc tạo ra trùng khớp hoàn toàn với database đang dùng, và `npm test` đạt 75/75 trên đó.

Tài khoản mặc định của một database mới khởi tạo:

| Email | Mật khẩu | Vai trò | Mã NV |
|-------|----------|---------|-------|
| `admin@hrm.local` | `123456` | ADMIN | EMP001 |
| `employee@hrm.local` | `123456` | EMPLOYEE | EMP002 (chỉ có với `--sample`) |

Database trên máy phát triển hiện tại đã được đổi sang `admin@gmail.com` và `employee@gmail.com`, và mật khẩu admin cũng đã đổi. Muốn chạy `npm test` trên database này phải đặt các biến `TEST_*` trong `.env`.

## Cấu trúc

```
backend/
  .env.example                 # mẫu cấu hình, không chứa giá trị thật
  sql/                         # toàn bộ schema, đánh số tăng dần; db:init chạy hết theo thứ tự
    000_init_schema.sql        # 3 bảng gốc
    001_leave_balance_and_password_reset.sql
  tests/
    e2e.js                     # npm test
  src/
    server.js                  # điểm vào: nạp .env, kết nối DB, listen
    app.js                     # khởi tạo express, gắn route, xử lý 404 và lỗi chung
    config/database.js         # instance Sequelize + sửa cách đọc timestamp
    models/
      index.js                 # nạp mọi model + khai báo quan hệ; luôn require từ đây
      department.js
      employee.js
      leaveRequest.js
    controllers/               # xử lý request, 1 file / tài nguyên
      authController.js
      departmentController.js
      employeeController.js
      leaveRequestController.js
      dashboardController.js
    routes/                    # khai báo route + phân quyền, gắn dưới /api/<tài nguyên>
      authRoutes.js
      departmentRoutes.js
      employeeRoutes.js
      leaveRequestRoutes.js
      dashboardRoutes.js
    middlewares/
      auth.js                  # authenticate, authorize(...roles)
    utils/
      pagination.js            # getPagination(query), paginate(rows, total, pagination)
      handleError.js           # đổi lỗi Sequelize thành 409 / 400 / 500
      password.js              # isValidPassword, hashPassword, comparePassword
      mailer.js                # sendPasswordResetEmail (hiện chỉ in ra console)
      leaveDays.js             # LEAVE_TYPES, isValidDate, countWorkingDays, todayString
      leaveBalance.js          # getLeaveBalance(employee, year)
    scripts/
      initDb.js                # npm run db:init
      setPassword.js
      runSql.js
docs/
  HRM.postman_collection.json  # 27 request mẫu để gửi cho người test API; thêm/đổi API thì cập nhật file này
frontend/
  index.html
  vite.config.js
  public/favicon.svg
  src/
    main.jsx                   # gắn Router, AuthProvider, ToastProvider, nạp CSS
    App.jsx                    # toàn bộ khai báo route
    api/
      client.js                # axios instance: tự gắn token, 401 thì tự đăng xuất
      index.js                 # authApi, departmentApi, employeeApi, leaveRequestApi, dashboardApi
    context/
      AuthContext.jsx          # useAuth(): { user, loading, login, logout }
      ToastContext.jsx         # useToast(): showToast(message, type)
    hooks/
      usePagedList.js          # nạp API danh sách có phân trang + bộ lọc
      useFetch.js              # nạp API trả về một đối tượng
      useDebounce.js
    components/
      Layout.jsx               # thanh bên (menu chia nhóm theo vai trò) + thanh trên (tên trang, menu người dùng)
      Icon.jsx                 # <Icon name="users" />: biểu tượng SVG nét mảnh, thêm biểu tượng mới vào ICONS
      RouteGuards.jsx          # ProtectedRoute, GuestRoute, HomeRedirect
      Modal.jsx, ConfirmDialog.jsx, DataTable.jsx, Pagination.jsx, Badge.jsx
      ChangePasswordModal.jsx, LeaveBalanceCards.jsx
    pages/
      auth/                    # LoginPage, ForgotPasswordPage, ResetPasswordPage, AuthCard
      admin/                   # AdminDashboardPage, DepartmentsPage, EmployeesPage, LeaveRequestsPage
      employee/                # EmployeeDashboardPage, MyLeaveRequestsPage
      NotFoundPage.jsx
    utils/
      errors.js                # getErrorMessage: dịch thông báo lỗi của backend sang tiếng Việt
      format.js                # nhãn tiếng Việt, formatDate, countWorkingDays, homePath
    styles/
      base.css                 # biến màu (:root), reset, kiểu chữ
      components.css           # nút, form, bảng, hộp thoại, nhãn, phân trang, thẻ thống kê
      layout.css               # thanh bên, vùng nội dung, trang đăng nhập, màn hình hẹp
```

## Hiện trạng

Cả backend lẫn frontend đã xong cho 7 màn hình trong yêu cầu gốc và 4 tính năng bổ sung.

- Backend: `npm test` đạt 75/75 trường hợp
- Frontend: `npm run build` thành công; đã bấm thử bằng trình duyệt thật (Edge điều khiển tự động) 45 trường hợp trên mọi màn hình, không có lỗi console. Kịch bản bấm thử này không nằm trong dự án

Chưa có: `git init`, gửi email thật, test tự động cho frontend, linter.

## Thiết kế dữ liệu (schema thật trong PostgreSQL)

```
departments
  id, name (unique, not null), description, created_at, updated_at

employees                       # vừa là hồ sơ nhân viên, vừa là tài khoản đăng nhập
  id, employee_code (unique, not null), full_name (not null),
  email (unique, not null), password_hash (not null),
  role   CHECK IN ('ADMIN', 'EMPLOYEE'),    mặc định 'EMPLOYEE'
  status CHECK IN ('ACTIVE', 'INACTIVE'),   mặc định 'ACTIVE'
  department_id -> departments.id (nullable, ON DELETE SET NULL),
  phone, position, date_of_birth, hire_date,
  annual_leave_days (integer, not null, mặc định 12, CHECK >= 0),   # thêm bởi sql/001
  reset_token_hash (text), reset_token_expires_at (timestamptz),    # thêm bởi sql/001
  created_at, updated_at

leave_requests
  id, employee_id -> employees.id (not null, ON DELETE CASCADE),
  leave_type (not null, không có CHECK trong DB; code chỉ nhận 'ANNUAL' | 'SICK' | 'UNPAID'),
  start_date, end_date (not null, CHECK end_date >= start_date), reason,
  status CHECK IN ('PENDING', 'APPROVED', 'REJECTED'), mặc định 'PENDING',
  admin_note,
  created_at, updated_at
```

Quan hệ (alias dùng trong `include`): Department `employees` ↔ Employee `department`; Employee `leave_requests` ↔ LeaveRequest `employee`.

Lưu ý về schema:
- Các giá trị `role`, `status`, `leave_type` viết HOA toàn bộ
- Schema nằm trong các file `backend/sql/`, không dùng `sequelize.sync()` hay công cụ migration. Muốn đổi schema: viết file mới (đánh số tiếp theo, viết sao cho chạy lại được vì `db:init` chạy lại mọi file mỗi lần), chạy bằng `npm run sql`, rồi sửa model cho khớp
- `created_at`/`updated_at` là `timestamp` không múi giờ và lưu theo UTC. `config/database.js` có đoạn ép `pg` đọc kiểu này theo UTC; bỏ đoạn đó thì thời gian trả ra API lệch 7 tiếng. Cột thời gian mới nên dùng `timestamptz`
- `LeaveRequest` có trường ảo `days` (số ngày làm việc của đơn), không lưu trong DB

## Xác thực và phân quyền

- Đăng nhập: `POST /api/auth/login` với `{ email, password }` → `{ token, user }`. `user` kèm `department: { id, name }`
- Các request sau gửi header `Authorization: Bearer <token>`
- Payload của token: `{ id, role }`, hết hạn theo `JWT_EXPIRES_IN`
- `authenticate` kiểm tra token rồi nạp lại nhân viên từ DB vào `req.user` (instance `Employee`). Tài khoản bị xoá hoặc `INACTIVE` thì token cũ bị từ chối ngay
- `authorize("ADMIN")` đặt sau `authenticate` để giới hạn vai trò
- Gắn cho cả router: `router.use(authenticate, authorize("ADMIN"))`; gắn cho từng route: `router.get("/me", authenticate, getMe)`
- Sai email và sai mật khẩu trả cùng một thông báo `Invalid email or password`
- Model `Employee` có `defaultScope` loại 3 trường bí mật (`password_hash`, `reset_token_hash`, `reset_token_expires_at`) và `toJSON` luôn xoá chúng. Chỉ khi cần so khớp mật khẩu / token mới dùng `Employee.scope("withPassword")`

Đổi mật khẩu và quên mật khẩu:
- Mật khẩu tối thiểu 6 ký tự (`utils/password.js`)
- `POST /api/auth/change-password` yêu cầu mật khẩu hiện tại; sai thì trả 400 (không phải 401, để frontend không tự đăng xuất)
- `POST /api/auth/forgot-password` luôn trả 200 với cùng một câu, dù email có tồn tại hay không. Nếu email thuộc tài khoản `ACTIVE`: sinh token ngẫu nhiên, lưu bản băm SHA-256 vào `reset_token_hash`, hạn 30 phút
- **Chưa gửi email thật**: link `${FRONTEND_URL}/reset-password?token=...` được in ra console của server, dòng bắt đầu bằng `[password-reset]`. Khi có SMTP chỉ cần sửa `utils/mailer.js`
- `POST /api/auth/reset-password` với `{ token, new_password }`; token chỉ dùng được một lần
- Admin cũng đặt lại được mật khẩu cho nhân viên bằng cách gửi `password` trong `PUT /api/employees/:id`
- Đổi mật khẩu không làm mất hiệu lực các token JWT đã cấp trước đó

## API

Tất cả đều cần token trừ 3 route công khai của `/api/auth`.

| Method | Đường dẫn | Quyền | Mô tả |
|--------|-----------|-------|-------|
| POST | `/api/auth/login` | công khai | `{ email, password }` → `{ token, user }` |
| POST | `/api/auth/forgot-password` | công khai | `{ email }` |
| POST | `/api/auth/reset-password` | công khai | `{ token, new_password }` |
| GET | `/api/auth/me` | đã đăng nhập | Người dùng hiện tại kèm phòng ban |
| POST | `/api/auth/change-password` | đã đăng nhập | `{ current_password, new_password }` |
| GET | `/api/departments` | admin | Phân trang; lọc `search` (theo tên) |
| GET | `/api/departments/:id` | admin | |
| POST | `/api/departments` | admin | `{ name, description }` |
| PUT | `/api/departments/:id` | admin | |
| DELETE | `/api/departments/:id` | admin | |
| GET | `/api/employees` | admin | Phân trang; lọc `search` (tên, email, mã NV), `department_id`, `role`, `status` |
| GET | `/api/employees/:id` | admin | |
| GET | `/api/employees/:id/leave-balance` | admin | Số ngày phép của nhân viên; `?year=` |
| POST | `/api/employees` | admin | Bắt buộc `employee_code`, `full_name`, `email`, `password` |
| PUT | `/api/employees/:id` | admin | Gửi `password` để đặt lại mật khẩu |
| DELETE | `/api/employees/:id` | admin | |
| GET | `/api/leave-requests` | admin | Phân trang; lọc `status`, `leave_type`, `employee_id`; kèm `employee` và phòng ban |
| PATCH | `/api/leave-requests/:id/approve` | admin | `{ admin_note }` tuỳ chọn |
| PATCH | `/api/leave-requests/:id/reject` | admin | `{ admin_note }` tuỳ chọn |
| GET | `/api/leave-requests/me` | employee | Phân trang; lọc `status` |
| GET | `/api/leave-requests/balance` | employee | Số ngày phép của tôi; `?year=` |
| POST | `/api/leave-requests` | employee | `{ leave_type, start_date, end_date, reason }` |
| DELETE | `/api/leave-requests/:id` | employee | Huỷ đơn của chính mình khi còn `PENDING` |
| GET | `/api/dashboard/admin` | admin | Xem bên dưới |
| GET | `/api/dashboard/me` | đã đăng nhập | Xem bên dưới |

Phân trang — mọi API danh sách nhận `?page=` (mặc định 1) và `?limit=` (mặc định 10, tối đa 100), trả về:

```json
{ "data": [], "pagination": { "page": 1, "limit": 10, "total": 0, "total_pages": 0 } }
```

Muốn lấy hết phòng ban cho ô chọn thì gọi `GET /api/departments?limit=100`.

Số ngày phép (`/balance`, `/leave-balance`, `leave_balance` trong dashboard):

```json
{ "year": 2026, "total": 12, "used": 3, "pending": 2, "remaining": 9, "available": 7 }
```

`GET /api/dashboard/admin` trả về: `total_departments`, `total_employees`, `active_employees`, `on_leave_today`, `leave_requests: { PENDING, APPROVED, REJECTED }`, `employees_by_department: [{ id, name, employee_count }]`, `recent_pending_requests` (5 đơn mới nhất).

`GET /api/dashboard/me` trả về: `profile` (kèm phòng ban), `leave_balance` (năm hiện tại), `leave_requests: { PENDING, APPROVED, REJECTED }`, `recent_requests` (5 đơn mới nhất).

Mã lỗi, luôn kèm `{ message }`:

| Mã | Khi nào |
|----|---------|
| 400 | Thiếu hoặc sai dữ liệu; sai mật khẩu hiện tại; token đặt lại mật khẩu sai/hết hạn; đơn không còn `PENDING`; không đủ ngày phép; tự xoá/khoá/hạ quyền chính mình |
| 401 | Chưa đăng nhập, token sai/hết hạn, sai email hoặc mật khẩu, tài khoản đã bị khoá |
| 403 | Sai vai trò; đăng nhập bằng tài khoản `INACTIVE` |
| 404 | Không tìm thấy bản ghi hoặc đường dẫn |
| 409 | Trùng `name` phòng ban, `email`, `employee_code` (kèm `field`); đơn nghỉ trùng ngày |
| 500 | Lỗi khác, kèm `error` |

## Quy tắc nghiệp vụ

Các quy tắc này do mình tự đặt vì yêu cầu gốc không nêu; cần người giao việc xác nhận.

Tài khoản:
- Admin tạo tài khoản cho nhân viên; không có tự đăng ký
- Admin không thể tự xoá, tự khoá hoặc tự hạ quyền chính mình
- Xoá phòng ban thì nhân viên thuộc phòng đó bị đặt `department_id = NULL`; xoá nhân viên thì xoá luôn đơn nghỉ của họ (theo khoá ngoại trong DB)

Đơn nghỉ:
- Chỉ vai trò EMPLOYEE tạo, xem và huỷ đơn của chính mình; ADMIN không tạo đơn
- `end_date >= start_date`, đơn phải có ít nhất 1 ngày làm việc
- Không được trùng ngày với đơn `PENDING` hoặc `APPROVED` khác của chính mình (409)
- Chỉ đơn `PENDING` mới được duyệt, từ chối hoặc huỷ. Huỷ là xoá hẳn đơn

Số ngày phép:
- Mỗi nhân viên có `annual_leave_days` ngày phép mỗi năm (mặc định 12, admin sửa được), không cộng dồn sang năm sau
- Số ngày của một đơn = số ngày thứ 2 đến thứ 6 trong khoảng nghỉ. **Chưa trừ ngày lễ**
- Chỉ loại `ANNUAL` bị trừ ngày phép; `SICK` và `UNPAID` không giới hạn
- Khi tạo đơn `ANNUAL`: số ngày xin phải ≤ `available` (đã trừ cả đơn đang chờ). Khi duyệt: kiểm tra lại với `remaining`
- Đơn vắt qua 2 năm thì tính riêng phần ngày rơi vào từng năm

## Kiểm thử

`npm test` chạy `backend/tests/e2e.js`: tự khởi động server trên cổng 5055 (`TEST_PORT`), gọi API thật trên database trong `.env`, kiểm tra 75 trường hợp (xác thực, phân quyền, CRUD, phân trang, đổi/quên mật khẩu, nghỉ phép, số ngày phép, tổng quan).

- Cần 2 tài khoản đăng nhập được (một ADMIN, một EMPLOYEE) và ít nhất 1 phòng ban. Mặc định dùng tài khoản của `db:init -- --sample`; đã đổi thì đặt biến `TEST_*`. Không đăng nhập được thì test dừng ngay với thông báo nêu rõ
- Dữ liệu test tự tạo đều có tiền tố `e2e` và được xoá khi kết thúc, kể cả khi test lỗi giữa chừng
- Đơn nghỉ test đặt vào tháng 3 năm sau để không đụng dữ liệu thật
- Thêm API mới thì thêm trường hợp vào file này

## Tồn đọng

- Chưa gửi email thật cho quên mật khẩu (xem `utils/mailer.js`)
- Chưa giới hạn số lần gọi `login` và `forgot-password`
- Chưa có danh sách ngày lễ khi đếm ngày nghỉ
- Duyệt đơn không khoá bản ghi: hai admin duyệt cùng lúc hai đơn của một người có thể vượt số ngày phép
- `npm audit`: 2 lỗ hổng mức moderate ở `uuid` (phụ thuộc của `sequelize`), chưa có bản sửa không gây vỡ; phần còn lại nằm ở công cụ dev
- Chưa `git init`
- Frontend chưa có test tự động và linter
- Mỗi request từ frontend kèm một request `OPTIONS` (CORS preflight) vì khác cổng; có thể giảm bằng `cors({ maxAge })` hoặc proxy của Vite
- `cors()` ở backend đang cho phép mọi nguồn; khi triển khai thật cần giới hạn về đúng địa chỉ frontend

## Frontend

Màn hình:

| Route | Vai trò | Nội dung | API |
|-------|---------|----------|-----|
| `/` | — | Chuyển về trang chủ theo vai trò, hoặc `/login` | |
| `/login` | khách | Form email + mật khẩu | `auth/login` |
| `/forgot-password` | khách | Nhập email | `auth/forgot-password` |
| `/reset-password?token=` | ai cũng vào được | Nhập mật khẩu mới | `auth/reset-password` |
| `/admin` | admin | Thẻ thống kê, nhân viên theo phòng ban, đơn chờ duyệt gần nhất | `dashboard/admin` |
| `/admin/departments` | admin | Bảng + tìm kiếm + thêm/sửa/xoá | `departments` |
| `/admin/employees` | admin | Bảng + tìm kiếm, lọc phòng ban và trạng thái + thêm/sửa/xoá | `employees` |
| `/admin/leave-requests` | admin | Tab theo trạng thái, duyệt/từ chối kèm ghi chú | `leave-requests` |
| `/employee` | employee | Số ngày phép, thông tin cá nhân, đơn gần đây | `dashboard/me` |
| `/employee/leave-requests` | employee | Số ngày phép, đơn của tôi, tạo đơn, huỷ đơn | `leave-requests/me`, `leave-requests/balance` |
| Đổi mật khẩu | cả hai | Hộp thoại mở từ thanh bên | `auth/change-password` |

Cách hoạt động:
- Token lưu trong `localStorage` với khoá `hrm_token`. Khi mở trang, `AuthContext` gọi `auth/me` để khôi phục phiên
- `api/client.js` trả thẳng `response.data`, nên `await departmentApi.list()` nhận được `{ data, pagination }`. Gặp 401 (trừ lúc đăng nhập) thì tự xoá token và về `/login`
- `ProtectedRoute role="ADMIN"`: chưa đăng nhập thì về `/login`, sai vai trò thì về trang chủ của vai trò đó
- Giao diện tiếng Việt. Backend trả lỗi tiếng Anh, `utils/errors.js` dịch lại; **thêm thông báo lỗi mới ở backend thì thêm bản dịch vào đây**, nếu không người dùng sẽ thấy câu tiếng Anh
- Đếm ngày làm việc có ở cả hai phía (`backend/src/utils/leaveDays.js` và `frontend/src/utils/format.js`), sửa quy tắc thì sửa cả hai
- Bố cục co giãn: dưới 860px thanh bên ẩn đi, mở bằng nút menu trên thanh trên
- Phong cách giao diện dựng theo mẫu dashboard "Haze": thanh bên xám đậm, màu nhấn xanh lục (`--color-primary: #059669`), thanh trên trắng, thẻ trắng bo góc 14px
- Đổi mật khẩu và Đăng xuất nằm trong menu người dùng ở góc phải thanh trên (`UserMenu` trong `Layout.jsx`), không còn ở thanh bên
- Thêm mục menu: sửa `NAV_SECTIONS` trong `Layout.jsx`; tên trang trên thanh trên tự lấy theo mục đang mở
- Hai trang tổng quan mở đầu bằng `.banner` thay cho `.page-header`. Các khối dùng lại được: `.stat-card` (kèm `.stat-card__icon`), `.panel`, `.bar` (thanh tiến độ), `.meter-list`, `.rate-row`, `.ring` (vòng phần trăm, đặt `--value`), `.rank-list`, `.timeline`

Mẫu cho một trang danh sách (xem `pages/admin/DepartmentsPage.jsx`): `usePagedList(api.list, { bộ lọc })` → `<DataTable>` + `<Pagination>`; form thêm/sửa nằm trong `<Modal>`, xoá dùng `<ConfirmDialog>`; lưu xong gọi `showToast(...)` và `list.reload()`.

## Lộ trình

1. ~~Dọn nền backend~~ — xong
2. ~~Nhân viên + xác thực~~ — xong
3. ~~CRUD nhân viên~~ — xong
4. ~~Nghỉ phép~~ — xong
5. ~~Tổng quan~~ — xong
6. ~~Bổ sung: đổi mật khẩu, quên mật khẩu, phân trang, số ngày phép~~ — xong
7. ~~Khởi tạo frontend~~ — xong
8. ~~Màn hình~~ — xong

Việc còn lại nằm ở mục Tồn đọng.

## Quy ước code

Backend:

- Backend dùng CommonJS (`require`/`module.exports`), thụt lề 4 dấu cách, chuỗi nháy kép
- Tên file model dạng camelCase chữ đầu thường (`department.js`, `leaveRequest.js`); controller và route require model qua `../models` (file `index.js`), không require thẳng từng file
- Model: `tableName` viết thường, `timestamps: true, createdAt: "created_at", updatedAt: "updated_at"`, tên thuộc tính `snake_case` trùng tên cột
- Tên bảng và cột dạng `snake_case`, số nhiều cho tên bảng. Tên trường trong JSON request/response cũng `snake_case`
- Controller bọc `try/catch`, trong `catch` gọi `handleError(res, error, "Failed to ...")`. Thông báo lỗi viết bằng tiếng Anh, chú thích trong code viết bằng tiếng Việt
- Đọc body bằng `req.body || {}` (Express 5 để `req.body` là `undefined` khi request không có body)
- API danh sách luôn dùng `getPagination` + `findAndCountAll` + `paginate`; có `include` quan hệ 1—n thì thêm `distinct: true`
- Trong file route, đặt route cố định (`/me`, `/balance`) trước route có tham số (`/:id`)
- Không bao giờ trả `password_hash` hay token đặt lại mật khẩu ra API
- Thêm tài nguyên mới theo thứ tự: model → khai báo quan hệ trong `models/index.js` → controller → route → gắn vào `app.js` → thêm trường hợp vào `tests/e2e.js`

Frontend:
- ES module, file component đuôi `.jsx`, mỗi file một component chính `export default`; thụt lề 4 dấu cách, chuỗi nháy kép
- Chỉ dùng CSS thuần trong `src/styles/`, không CSS-in-JS, không thư viện UI. Tên lớp kiểu BEM: `khối__phần--biến-thể` (`btn btn--primary`, `modal__header`)
- Màu, bo góc, đổ bóng lấy từ biến trong `styles/base.css` (`var(--color-primary)`), không viết mã màu trực tiếp trong thành phần mới
- Kiểu dùng lại được đặt trong `components.css`; `layout.css` chỉ chứa bố cục. Tận dụng lớp có sẵn (`btn`, `input`, `field`, `card`, `toolbar`, `table`, `badge`, `stat-card`, `panel`, `alert`) trước khi viết lớp mới
- Mọi lời gọi API đi qua `src/api/index.js`, không gọi `axios` trực tiếp trong trang
- Lỗi hiển thị bằng `getErrorMessage(error)`; nhãn của `role`, `status`, `leave_type` lấy từ `utils/format.js`, không viết cứng trong trang
- Ngày hiển thị dạng `DD/MM/YYYY` qua `formatDate` / `formatDateTime`
