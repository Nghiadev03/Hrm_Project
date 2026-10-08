# Giải thích toàn bộ code dự án HRM

Tài liệu này đi từ tổng thể đến chi tiết. Nên đọc theo thứ tự và mở file tương ứng bên cạnh để đối chiếu. Phần cuối có một lộ trình đọc code và danh sách thuật ngữ.

## 1. Bức tranh chung

Dự án gồm hai chương trình chạy riêng, nói chuyện với nhau qua HTTP:

```
Trình duyệt                         Máy chủ
┌──────────────────────┐   HTTP    ┌──────────────────────┐   SQL   ┌────────────┐
│ Frontend (React)     │ ────────► │ Backend (Express)    │ ──────► │ PostgreSQL │
│ cổng 5173            │ ◄──────── │ cổng 5000            │ ◄────── │            │
│ vẽ giao diện         │   JSON    │ kiểm tra quyền,      │         │ 3 bảng     │
│                      │           │ áp quy tắc, đọc/ghi  │         │            │
└──────────────────────┘           └──────────────────────┘         └────────────┘
```

- **Frontend** chỉ lo hiển thị và gửi request. Nó không bao giờ chạm trực tiếp vào database.
- **Backend** là nơi duy nhất quyết định ai được làm gì và dữ liệu nào hợp lệ. Mọi kiểm tra ở frontend chỉ để người dùng thấy lỗi sớm; backend luôn kiểm tra lại.
- **Database** có 3 bảng: `departments` (phòng ban), `employees` (nhân viên, kiêm luôn tài khoản đăng nhập), `leave_requests` (đơn nghỉ phép).

Quan hệ giữa các bảng: một phòng ban có nhiều nhân viên, một nhân viên có nhiều đơn nghỉ.

## 2. Backend

### 2.1. Một request đi qua những đâu

Mọi request đều đi theo một đường:

```
request ─► app.js ─► route ─► middleware ─► controller ─► model ─► database
                                                │
response ◄──────────────────────────────────────┘
```

| Lớp | Thư mục | Việc của nó |
|-----|---------|-------------|
| Route | `backend/src/routes/` | Khai báo đường dẫn nào gọi hàm nào, và ai được gọi |
| Middleware | `backend/src/middlewares/` | Chạy trước controller: kiểm tra token và vai trò |
| Controller | `backend/src/controllers/` | Kiểm tra dữ liệu gửi lên, áp quy tắc nghiệp vụ, trả kết quả |
| Model | `backend/src/models/` | Mô tả bảng để Sequelize đọc/ghi thay cho việc viết SQL |
| Utils | `backend/src/utils/` | Hàm dùng chung cho nhiều controller |

Chia lớp như vậy để mỗi file chỉ làm một việc: muốn biết ai được gọi API thì mở route, muốn biết quy tắc thì mở controller, muốn biết cột trong bảng thì mở model.

### 2.2. Khởi động: `server.js` và `app.js`

`backend/src/server.js` là file chạy đầu tiên khi gõ `npm run dev`. Nó làm 3 việc: nạp biến môi trường từ `.env`, thử kết nối database, rồi mở cổng.

```js
require("dotenv").config();          // đọc backend/.env vào process.env

const app = require("./app");
const { sequelize } = require("./models");

await sequelize.authenticate();      // kết nối thử, lỗi thì dừng
app.listen(PORT, ...);               // bắt đầu nhận request
```

`backend/src/app.js` tạo ứng dụng Express và gắn mọi thứ vào:

```js
app.use(cors());                     // cho phép frontend ở cổng khác gọi vào
app.use(express.json());             // đọc body JSON thành req.body

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/dashboard", dashboardRoutes);
```

`app.use("/api/departments", departmentRoutes)` nghĩa là: mọi đường dẫn bắt đầu bằng `/api/departments` được giao cho file route đó. Trong file route chỉ cần viết phần đuôi (`/`, `/:id`).

Hai đoạn cuối của `app.js` bắt các trường hợp còn lại: đường dẫn không tồn tại trả 404, lỗi chưa ai bắt trả 500.

### 2.3. Kết nối database: `config/database.js`

File này tạo một đối tượng `sequelize` duy nhất, dùng chung cho cả dự án. Thông tin kết nối lấy từ `.env` để mật khẩu database không nằm trong code.

Đoạn `pg.types.setTypeParser(...)` ở đầu file sửa một lỗi múi giờ: cột `created_at`/`updated_at` trong database không lưu múi giờ, Sequelize ghi vào theo giờ UTC nhưng khi đọc ra lại bị hiểu là giờ Việt Nam, nên lệch 7 tiếng. Đoạn code này ép đọc lại theo UTC.

### 2.4. Model: mô tả bảng

Mỗi file trong `models/` mô tả một bảng. Ví dụ rút gọn từ `models/department.js`:

```js
const Department = sequelize.define(
    "Department",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
        description: { type: DataTypes.TEXT, allowNull: true },
    },
    {
        tableName: "departments",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
```

Sau khi khai báo, thay vì viết SQL ta gọi hàm:

| Hàm Sequelize | SQL tương đương |
|---------------|-----------------|
| `Department.findAll()` | `SELECT * FROM departments` |
| `Department.findByPk(3)` | `SELECT ... WHERE id = 3` |
| `Department.create({ name })` | `INSERT INTO departments ...` |
| `department.update({ name })` | `UPDATE departments SET ...` |
| `department.destroy()` | `DELETE FROM departments ...` |
| `Department.findAndCountAll({ limit, offset })` | lấy một trang + đếm tổng |

Lưu ý quan trọng: **model không tạo bảng**. Bảng đã được tạo sẵn bằng SQL; model chỉ mô tả lại cho khớp. Muốn thêm cột thì phải thêm trong database trước (xem `backend/sql/`), rồi mới thêm vào model.

**`models/employee.js`** có hai cơ chế bảo vệ mật khẩu:

- `defaultScope` loại 3 trường bí mật (`password_hash`, `reset_token_hash`, `reset_token_expires_at`) khỏi mọi câu truy vấn thông thường. Chỉ khi cần so mật khẩu mới gọi `Employee.scope("withPassword")`.
- `toJSON` được viết lại để luôn xoá 3 trường đó trước khi gửi ra ngoài, kể cả khi đã nạp chúng. Đây là lớp phòng hộ thứ hai.

**`models/leaveRequest.js`** có trường ảo `days`: không tồn tại trong database, được tính mỗi lần đọc từ `start_date` và `end_date`. Nhờ vậy API luôn trả về số ngày làm việc mà không phải lưu thêm cột.

**`models/index.js`** nạp cả 3 model và khai báo quan hệ:

```js
Department.hasMany(Employee, { foreignKey: "department_id", as: "employees" });
Employee.belongsTo(Department, { foreignKey: "department_id", as: "department" });
```

Chữ `as` là tên dùng khi muốn lấy kèm dữ liệu liên quan. Ví dụ `Employee.findAll({ include: [{ model: Department, as: "department" }] })` trả về mỗi nhân viên kèm một trường `department`.

Mọi file khác đều lấy model qua `require("../models")` chứ không lấy thẳng từng file, để quan hệ luôn được khai báo trước khi dùng.

### 2.5. Xác thực: đăng nhập và token

Có hai khái niệm cần phân biệt:

- **Xác thực** (authentication): bạn là ai?
- **Phân quyền** (authorization): bạn có được làm việc này không?

**Mật khẩu** không bao giờ lưu dạng gốc. Khi tạo tài khoản, mật khẩu được băm bằng bcrypt thành một chuỗi không thể dịch ngược, lưu vào `password_hash`. Khi đăng nhập, bcrypt băm mật khẩu vừa nhập rồi so với chuỗi đã lưu (`utils/password.js`).

**Token JWT** là một chuỗi do server ký bằng `JWT_SECRET`, bên trong chứa `{ id, role }` và hạn dùng. Người dùng không thể tự sửa nội dung vì chữ ký sẽ sai.

Luồng đăng nhập trong `controllers/authController.js`, hàm `login`:

1. Tìm nhân viên theo email, lấy kèm `password_hash`.
2. So mật khẩu. Sai email hay sai mật khẩu đều trả cùng một câu `Invalid email or password`, để kẻ xấu không dò được email nào tồn tại.
3. Tài khoản bị khoá (`INACTIVE`) thì trả 403.
4. Ký token và trả về `{ token, user }`.

Từ đó frontend gửi kèm header `Authorization: Bearer <token>` trong mọi request.

**`middlewares/auth.js`** có hai hàm:

```js
// 1. Bạn là ai?
const authenticate = async (req, res, next) => {
    // đọc token từ header, kiểm tra chữ ký và hạn dùng
    // nạp lại nhân viên từ database, gắn vào req.user
    // gọi next() để đi tiếp, hoặc trả 401 để dừng
};

// 2. Bạn có được làm không?
const authorize = (...roles) => (req, res, next) => {
    // req.user.role không nằm trong roles thì trả 403
};
```

`authenticate` nạp lại nhân viên từ database ở mỗi request thay vì tin hoàn toàn vào token. Nhờ vậy khi admin khoá một tài khoản, token cũ của người đó mất tác dụng ngay.

`next()` là cách một middleware nói "xong phần tôi, chuyển cho hàm kế tiếp". Không gọi `next()` thì request dừng ở đó.

### 2.6. Route: ai được gọi cái gì

Ví dụ `routes/departmentRoutes.js`:

```js
router.use(authenticate, authorize("ADMIN"));   // áp cho mọi route bên dưới

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.post("/", createDepartment);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);
```

`:id` là tham số, đọc trong controller bằng `req.params.id`.

`routes/leaveRequestRoutes.js` phức tạp hơn vì hai vai trò dùng chung một nhóm đường dẫn, nên quyền được gắn cho từng route:

```js
router.use(authenticate);

router.get("/me", authorize("EMPLOYEE"), getMyLeaveRequests);
router.post("/", authorize("EMPLOYEE"), createLeaveRequest);

router.get("/", authorize("ADMIN"), getLeaveRequests);
router.patch("/:id/approve", authorize("ADMIN"), approveLeaveRequest);
```

Thứ tự có ý nghĩa: route cố định như `/me` phải đặt trước route có tham số `/:id`, nếu không `me` sẽ bị hiểu là một `id`.

### 2.7. Controller: nơi chứa quy tắc

Mọi hàm controller có cùng một khung:

```js
const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body || {};      // 1. đọc dữ liệu gửi lên

        if (!name || !String(name).trim()) {               // 2. kiểm tra
            return res.status(400).json({ message: "Department name is required" });
        }

        const department = await Department.create({ ... }); // 3. ghi database

        res.status(201).json(department);                    // 4. trả kết quả
    } catch (error) {
        handleError(res, error, "Failed to create department"); // 5. lỗi bất ngờ
    }
};
```

Nguồn dữ liệu của một request:

| Lấy ở đâu | Ví dụ |
|-----------|-------|
| `req.body` | Dữ liệu JSON của POST/PUT/PATCH |
| `req.params` | Tham số trên đường dẫn: `/departments/5` → `req.params.id` |
| `req.query` | Phần sau dấu `?`: `?page=2&search=IT` |
| `req.user` | Người đang đăng nhập, do `authenticate` gắn vào |

Mã trạng thái dùng trong dự án: 200 thành công, 201 đã tạo, 400 dữ liệu sai, 401 chưa đăng nhập, 403 không đủ quyền, 404 không tìm thấy, 409 trùng dữ liệu, 500 lỗi server.

Từng controller:

- **`authController.js`**: đăng nhập, lấy thông tin bản thân, đổi mật khẩu, quên và đặt lại mật khẩu.
- **`departmentController.js`**: thêm/sửa/xoá/xem phòng ban. Đây là file đơn giản nhất, nên đọc đầu tiên.
- **`employeeController.js`**: tương tự cho nhân viên, có thêm tìm kiếm và lọc. Hàm `pickEditableFields` chỉ lấy những trường được phép sửa từ `req.body`, để người gọi không thể chèn trường lạ như `password_hash`. Admin cũng không thể tự xoá, tự khoá hay tự hạ quyền chính mình.
- **`leaveRequestController.js`**: phần nhiều quy tắc nhất, giải thích ở mục 2.9.
- **`dashboardController.js`**: gom số liệu cho hai trang tổng quan. Dùng `Promise.all` để chạy nhiều câu truy vấn cùng lúc thay vì lần lượt.

### 2.8. Các hàm dùng chung trong `utils/`

**`pagination.js`**: `getPagination(req.query)` đọc `?page=&limit=` (mặc định trang 1, 10 dòng, tối đa 100) và tính `offset`. `paginate(rows, total, pagination)` đóng gói thành dạng trả về chung:

```json
{ "data": [], "pagination": { "page": 1, "limit": 10, "total": 0, "total_pages": 0 } }
```

**`handleError.js`**: đổi lỗi của Sequelize thành mã HTTP đúng. Trùng tên hoặc email (vi phạm ràng buộc unique) thành 409, dữ liệu không hợp lệ thành 400, tham chiếu tới bản ghi không tồn tại thành 400, còn lại 500.

**`password.js`**: băm, so sánh và kiểm tra độ dài mật khẩu (tối thiểu 6 ký tự).

**`mailer.js`**: nơi gửi email đặt lại mật khẩu. Hiện chỉ in link ra console của server vì chưa có dịch vụ gửi mail.

**`leaveDays.js`**: `countWorkingDays(start, end)` đếm số ngày từ thứ 2 đến thứ 6 trong một khoảng; `isValidDate` kiểm tra chuỗi ngày dạng `YYYY-MM-DD`.

**`leaveBalance.js`**: `getLeaveBalance(employee, year)` tính số ngày phép của một người trong một năm:

| Trường | Ý nghĩa |
|--------|---------|
| `total` | Số ngày được cấp (`annual_leave_days`) |
| `used` | Tổng ngày của các đơn phép năm đã duyệt |
| `pending` | Tổng ngày của các đơn phép năm đang chờ |
| `remaining` | `total - used` |
| `available` | `total - used - pending`, số ngày còn xin thêm được |

Số ngày phép không được lưu thành một con số trong database mà tính lại từ các đơn mỗi lần cần. Cách này không bao giờ bị lệch khi đơn bị huỷ hay từ chối.

### 2.9. Ví dụ đầy đủ: nhân viên tạo đơn nghỉ

Request: `POST /api/leave-requests` với body `{ leave_type: "ANNUAL", start_date: "2026-10-12", end_date: "2026-10-14" }`.

1. `app.js` thấy đường dẫn bắt đầu bằng `/api/leave-requests`, giao cho `leaveRequestRoutes.js`.
2. `authenticate` kiểm tra token, gắn nhân viên vào `req.user`.
3. `authorize("EMPLOYEE")` kiểm tra vai trò.
4. `createLeaveRequest` trong `leaveRequestController.js` lần lượt kiểm tra:
   - Loại nghỉ phải là `ANNUAL`, `SICK` hoặc `UNPAID`.
   - Hai ngày phải đúng định dạng, ngày kết thúc không trước ngày bắt đầu.
   - Phải có ít nhất một ngày làm việc (đơn chỉ gồm thứ 7, chủ nhật bị từ chối).
   - Không trùng với đơn đang chờ hoặc đã duyệt của chính người đó → 409.
   - Nếu là phép năm: số ngày xin phải không vượt `available` → 400.
5. Qua hết thì `LeaveRequest.create(...)` ghi vào database với trạng thái `PENDING`.
6. Trả về 201 kèm đơn vừa tạo, trong đó có trường ảo `days`.

Chú ý `employee_id` lấy từ `req.user.id` chứ không lấy từ body. Nếu lấy từ body, một người có thể tạo đơn dưới tên người khác.

Khi admin duyệt (`PATCH /api/leave-requests/:id/approve`), hàm `reviewLeaveRequest` kiểm tra đơn còn `PENDING`, kiểm tra lại số ngày phép, rồi mới đổi trạng thái. Duyệt và từ chối dùng chung một hàm, chỉ khác tham số `status`.

### 2.10. Quên mật khẩu

1. `POST /api/auth/forgot-password` với email. Server sinh một token ngẫu nhiên, lưu **bản băm** của token và hạn 30 phút vào database, rồi "gửi" link chứa token thật (hiện là in ra console).
2. Dù email có tồn tại hay không, server luôn trả cùng một câu, để không lộ danh sách email.
3. Người dùng mở link, nhập mật khẩu mới. Frontend gọi `POST /api/auth/reset-password` với token.
4. Server băm token nhận được, tìm bản ghi khớp và còn hạn. Đúng thì đổi mật khẩu và xoá token, nên mỗi link chỉ dùng được một lần.

Chỉ lưu bản băm để nếu database bị lộ, kẻ xấu cũng không dùng được token.

### 2.11. Các phần còn lại của backend

- `backend/sql/`: các file SQL thay đổi cấu trúc bảng, đánh số theo thứ tự. Chạy bằng `npm run sql -- sql/<file>.sql`.
- `backend/src/scripts/setPassword.js`: đặt lại mật khẩu từ dòng lệnh.
- `backend/tests/e2e.js`: bộ kiểm tra tự động (`npm test`). Nó bật server, gọi API thật 75 lần và so kết quả với mong đợi. Đọc file này là cách nhanh để biết mỗi API phải hành xử thế nào.

## 3. Frontend

### 3.1. Vài khái niệm React cần biết trước

- **Component**: một hàm trả về giao diện (viết bằng JSX, trông giống HTML). Cả ứng dụng là các component lồng nhau.
- **Props**: dữ liệu component cha truyền xuống con, giống tham số của hàm.
- **State** (`useState`): dữ liệu của riêng component. Khi state đổi, React vẽ lại component đó.
- **Effect** (`useEffect`): code chạy sau khi vẽ xong, dùng để gọi API.
- **Context**: dữ liệu dùng chung cho cả ứng dụng mà không phải truyền qua từng tầng props. Dự án dùng cho "ai đang đăng nhập" và "hiện thông báo".
- **Hook**: hàm tên bắt đầu bằng `use`, đóng gói logic có state để nhiều component dùng lại.

### 3.2. Khởi động: `main.jsx` và `App.jsx`

`frontend/index.html` có một thẻ `<div id="root">` trống. `frontend/src/main.jsx` gắn toàn bộ ứng dụng vào đó:

```jsx
<BrowserRouter>          {/* cho phép điều hướng theo đường dẫn */}
    <AuthProvider>       {/* ai đang đăng nhập */}
        <ToastProvider>  {/* thông báo góc màn hình */}
            <App />
        </ToastProvider>
    </AuthProvider>
</BrowserRouter>
```

`frontend/src/App.jsx` là bản đồ của ứng dụng: đường dẫn nào hiện trang nào.

```jsx
<Route element={<ProtectedRoute role="ADMIN" />}>
    <Route path="/admin" element={<Layout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        ...
```

Các route lồng nhau: muốn vào `/admin/departments` phải qua `ProtectedRoute` (kiểm tra quyền), rồi `Layout` (vẽ thanh bên), rồi `DepartmentsPage` hiện vào chỗ `<Outlet />` của `Layout`.

### 3.3. Gọi API: thư mục `api/`

**`api/client.js`** tạo một bản axios cấu hình sẵn, có hai "trạm kiểm soát" (interceptor):

- Trước khi gửi: tự gắn token vào header, nên các trang không phải lo việc này.
- Sau khi nhận: trả thẳng phần dữ liệu (`response.data`); nếu gặp 401 thì tự đăng xuất, vì token đã hết hạn hoặc tài khoản bị khoá.

Token lưu trong `localStorage` của trình duyệt với khoá `hrm_token`, nên tải lại trang vẫn còn đăng nhập.

**`api/index.js`** gom mọi lời gọi API thành các hàm có tên:

```js
export const departmentApi = {
    list: (params) => client.get("/departments", { params: cleanParams(params) }),
    create: (data) => client.post("/departments", data),
    update: (id, data) => client.put(`/departments/${id}`, data),
    remove: (id) => client.delete(`/departments/${id}`),
};
```

Các trang chỉ gọi `departmentApi.list(...)`, không biết gì về đường dẫn. Nếu backend đổi đường dẫn thì chỉ sửa một chỗ.

### 3.4. Đăng nhập phía frontend: `context/AuthContext.jsx`

`AuthProvider` giữ `user` (người đang đăng nhập) và cung cấp `login`, `logout` cho mọi component qua `useAuth()`.

- Khi mở trang: nếu trong `localStorage` còn token thì gọi `/auth/me` để lấy lại thông tin người dùng. Trong lúc chờ, `loading` là `true`.
- `login(email, password)`: gọi API, lưu token, đặt `user`.
- `logout()`: xoá token, đặt `user` về `null`.

**`components/RouteGuards.jsx`** dùng `useAuth()` để chặn cửa:

- `ProtectedRoute`: chưa đăng nhập thì chuyển về `/login`; sai vai trò thì chuyển về trang chủ của vai trò đó.
- `GuestRoute`: đã đăng nhập rồi thì không cho vào trang đăng nhập nữa.

Việc chặn ở frontend chỉ để trải nghiệm mượt. Thứ thật sự bảo vệ dữ liệu là `authenticate` và `authorize` ở backend.

### 3.5. Hai hook nạp dữ liệu

**`hooks/usePagedList.js`** dùng cho mọi trang có bảng:

```js
const list = usePagedList(departmentApi.list, { search: debouncedSearch });
// list.rows, list.pagination, list.loading, list.error
// list.setPage(2)   chuyển trang
// list.reload()     nạp lại sau khi thêm/sửa/xoá
```

Nó tự gọi lại API khi bộ lọc hoặc số trang đổi, tự quay về trang 1 khi đổi bộ lọc, và tự lùi một trang nếu xoá hết dòng của trang cuối. Biến `cancelled` trong hook để bỏ qua kết quả của một lời gọi cũ khi người dùng đã chuyển sang bộ lọc khác.

**`hooks/useFetch.js`** là bản đơn giản cho API trả về một đối tượng, dùng ở hai trang tổng quan.

**`hooks/useDebounce.js`** hoãn giá trị ô tìm kiếm 350ms, để chỉ gọi API khi người dùng ngừng gõ chứ không gọi sau mỗi phím.

### 3.6. Component dùng chung trong `components/`

| File | Việc của nó |
|------|-------------|
| `Layout.jsx` | Thanh bên và vùng nội dung. Menu lấy từ `NAV_ITEMS` theo vai trò |
| `DataTable.jsx` | Bảng. Nhận danh sách cột và dòng, tự hiện "Đang tải", lỗi, hoặc "Chưa có dữ liệu" |
| `Pagination.jsx` | Thanh phân trang |
| `Modal.jsx` | Hộp thoại nổi, đóng bằng nút ×, phím Esc hoặc bấm ra ngoài |
| `ConfirmDialog.jsx` | Hộp thoại xác nhận trước khi xoá |
| `Badge.jsx` | Nhãn màu cho trạng thái đơn, trạng thái nhân viên, vai trò |
| `ChangePasswordModal.jsx` | Hộp thoại đổi mật khẩu |
| `LeaveBalanceCards.jsx` | 4 thẻ số ngày phép |

`DataTable` nhận cột dưới dạng mảng, mỗi cột có thể có hàm `render` để tự quyết định cách hiển thị một ô:

```jsx
const columns = [
    { key: "name", title: "Tên phòng ban", render: (row) => <strong>{row.name}</strong> },
    { key: "created_at", title: "Ngày tạo", render: (row) => formatDateTime(row.created_at) },
];
```

### 3.7. Các trang trong `pages/`

Mọi trang danh sách đều theo một mẫu. Lấy `pages/admin/DepartmentsPage.jsx` làm ví dụ, file có hai component:

- `DepartmentForm`: form trong hộp thoại, dùng cho cả thêm và sửa. Nếu nhận prop `department` thì là sửa, không thì là thêm.
- `DepartmentsPage`: trang chính, giữ các state:

| State | Ý nghĩa |
|-------|---------|
| `search` | Chữ trong ô tìm kiếm |
| `editing` | `undefined` = hộp thoại đóng, `null` = đang thêm mới, một đối tượng = đang sửa đối tượng đó |
| `deleting` | Phòng ban đang chờ xác nhận xoá, hoặc `null` |

Các trang khác:

- `EmployeesPage.jsx`: giống trên, thêm hai ô lọc và form nhiều trường hơn. Nạp danh sách phòng ban một lần để đổ vào ô chọn.
- `LeaveRequestsPage.jsx` (admin): các tab lọc theo trạng thái, hộp thoại `ReviewModal` dùng chung cho duyệt và từ chối.
- `MyLeaveRequestsPage.jsx` (nhân viên): form tạo đơn tự đếm số ngày làm việc khi chọn ngày, để người dùng biết trước sẽ bị trừ bao nhiêu.
- `AdminDashboardPage.jsx`, `EmployeeDashboardPage.jsx`: chỉ đọc và hiển thị số liệu.
- `auth/`: 3 trang chưa đăng nhập, dùng chung khung `AuthCard`.

### 3.8. `utils/`

- `errors.js`: backend trả lỗi bằng tiếng Anh, `getErrorMessage(error)` dịch sang tiếng Việt. Nếu không kết nối được server thì báo riêng.
- `format.js`: nhãn tiếng Việt cho các giá trị như `PENDING` → "Chờ duyệt", hàm định dạng ngày thành `DD/MM/YYYY`, và `countWorkingDays` (bản sao của hàm ở backend).

### 3.9. CSS

Dự án dùng CSS thuần, chia 3 file trong `styles/`:

| File | Nội dung |
|------|----------|
| `base.css` | Biến màu trong `:root`, reset mặc định của trình duyệt, kiểu chữ |
| `components.css` | Nút, ô nhập, bảng, hộp thoại, nhãn, phân trang, thẻ thống kê |
| `layout.css` | Thanh bên, vùng nội dung, trang đăng nhập, phần co giãn cho màn hình hẹp |

Màu được khai báo một lần dưới dạng biến rồi dùng lại khắp nơi:

```css
:root { --color-primary: #2563eb; }
.btn--primary { background: var(--color-primary); }
```

Muốn đổi màu chủ đạo của cả ứng dụng chỉ cần sửa một dòng trong `base.css`.

Tên lớp theo quy ước BEM: `khối__phần--biến-thể`. Ví dụ `modal` là khối, `modal__header` là một phần của nó, `btn--primary` là một biến thể của `btn`. Nhìn tên lớp là biết nó thuộc thành phần nào.

Phần `@media (max-width: 860px)` trong `layout.css` áp dụng cho màn hình hẹp: thanh bên trượt ra ngoài, thay bằng thanh trên có nút menu.

### 3.10. Ví dụ đầy đủ: admin thêm một phòng ban

1. Bấm "+ Thêm phòng ban" → `setEditing(null)` → React vẽ lại, hiện `DepartmentForm`.
2. Gõ tên → mỗi phím gọi `onChange`, cập nhật state `form`.
3. Bấm "Lưu" → `onSubmit` gọi `departmentApi.create(form)`.
4. `client.js` gắn token vào header và gửi `POST /api/departments`.
5. Backend: `authenticate` → `authorize("ADMIN")` → `createDepartment` → ghi database → trả 201.
6. Thành công: `onSaved` đóng hộp thoại, hiện thông báo "Đã thêm phòng ban", gọi `list.reload()` để bảng nạp lại.
7. Thất bại (ví dụ trùng tên, backend trả 409): khối `catch` gọi `getErrorMessage`, hiện "Tên phòng ban đã tồn tại" ngay trong hộp thoại, và hộp thoại vẫn mở để sửa.

## 4. Nên đọc code theo thứ tự nào

Backend, từ đơn giản đến phức tạp:

1. `server.js` và `app.js`: cách ứng dụng khởi động.
2. `models/department.js` → `routes/departmentRoutes.js` → `controllers/departmentController.js`: một tài nguyên hoàn chỉnh, đơn giản nhất.
3. `middlewares/auth.js` và hàm `login` trong `authController.js`: cách đăng nhập hoạt động.
4. `employeeController.js`: giống phòng ban nhưng nhiều trường và có lọc.
5. `utils/leaveDays.js`, `utils/leaveBalance.js`, rồi `leaveRequestController.js`: phần nhiều quy tắc nhất.
6. `tests/e2e.js`: đọc để thấy mỗi API được mong đợi hành xử ra sao.

Frontend:

1. `main.jsx` và `App.jsx`: khung ứng dụng và bản đồ đường dẫn.
2. `api/client.js`, `api/index.js`, `context/AuthContext.jsx`: cách nói chuyện với backend.
3. `pages/auth/LoginPage.jsx`: một trang có form, ngắn và dễ theo.
4. `hooks/usePagedList.js` rồi `pages/admin/DepartmentsPage.jsx`: mẫu của mọi trang danh sách.
5. Các trang còn lại, vì chúng lặp lại cùng mẫu.

Cách học hiệu quả là vừa đọc vừa thử: mở tab Network trong công cụ lập trình của trình duyệt (F12), thao tác trên giao diện và xem request nào được gửi, backend trả về gì.

## 5. Thuật ngữ

| Thuật ngữ | Nghĩa |
|-----------|-------|
| API | Tập các đường dẫn backend cung cấp để frontend gọi |
| Endpoint | Một đường dẫn cụ thể của API, ví dụ `POST /api/auth/login` |
| Request / Response | Yêu cầu gửi đi / kết quả trả về |
| JSON | Định dạng dữ liệu dạng văn bản mà hai bên trao đổi |
| Middleware | Hàm chạy giữa lúc nhận request và lúc vào controller |
| ORM | Thư viện cho phép thao tác database bằng đối tượng thay vì SQL (ở đây là Sequelize) |
| Model | Mô tả một bảng trong code |
| JWT | Token đăng nhập có chữ ký của server |
| Hash (băm) | Biến đổi một chiều, không dịch ngược được; dùng cho mật khẩu |
| CORS | Cơ chế của trình duyệt chặn trang ở cổng này gọi server ở cổng khác, trừ khi server cho phép |
| Component | Một khối giao diện trong React |
| State | Dữ liệu của component; đổi thì giao diện vẽ lại |
| Hook | Hàm `use...` đóng gói logic có state |
| Context | Dữ liệu dùng chung cho nhiều component |
| CRUD | Thêm, xem, sửa, xoá (Create, Read, Update, Delete) |
| Phân trang | Chia danh sách dài thành nhiều trang nhỏ |
