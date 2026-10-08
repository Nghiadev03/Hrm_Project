// Backend trả thông báo lỗi bằng tiếng Anh; đổi sang tiếng Việt trước khi hiển thị.
const MESSAGES = {
    "Email and password are required": "Vui lòng nhập email và mật khẩu",
    "Invalid email or password": "Email hoặc mật khẩu không đúng",
    "Account is inactive": "Tài khoản đã bị khoá",
    "Authentication required": "Vui lòng đăng nhập",
    "Invalid or expired token": "Phiên đăng nhập đã hết hạn",
    "Account not found or inactive": "Tài khoản không tồn tại hoặc đã bị khoá",
    "You do not have permission to perform this action": "Bạn không có quyền thực hiện thao tác này",
    "Current password and new password are required": "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
    "Current password is incorrect": "Mật khẩu hiện tại không đúng",
    "Email is required": "Vui lòng nhập email",
    "Token and new password are required": "Thiếu mã đặt lại mật khẩu hoặc mật khẩu mới",
    "Invalid or expired reset token": "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn",
    "Department name is required": "Vui lòng nhập tên phòng ban",
    "Department not found": "Không tìm thấy phòng ban",
    "Employee not found": "Không tìm thấy nhân viên",
    "Employee code, full name and email are required": "Vui lòng nhập mã nhân viên, họ tên và email",
    "Employee code, full name and email cannot be empty": "Mã nhân viên, họ tên và email không được để trống",
    "You cannot change your own role or deactivate your own account": "Bạn không thể tự đổi vai trò hoặc khoá tài khoản của chính mình",
    "You cannot delete your own account": "Bạn không thể xoá tài khoản của chính mình",
    "Related record not found": "Dữ liệu liên quan không tồn tại",
    "Leave request not found": "Không tìm thấy đơn nghỉ phép",
    "Start date and end date must be valid dates (YYYY-MM-DD)": "Ngày bắt đầu và ngày kết thúc không hợp lệ",
    "End date must be on or after start date": "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu",
    "Leave request must include at least one working day": "Đơn nghỉ phải có ít nhất một ngày làm việc (thứ 2 - thứ 6)",
    "You already have a leave request in this period": "Bạn đã có đơn nghỉ trong khoảng thời gian này",
    "Only pending leave requests can be cancelled": "Chỉ huỷ được đơn đang chờ duyệt",
    "Only pending leave requests can be reviewed": "Đơn này đã được xử lý trước đó",
};

const FIELD_LABELS = {
    name: "Tên phòng ban",
    email: "Email",
    employee_code: "Mã nhân viên",
};

const translate = (message) => {
    if (MESSAGES[message]) {
        return MESSAGES[message];
    }

    let match = message.match(/^(\w+) already exists$/);

    if (match) {
        return `${FIELD_LABELS[match[1]] || match[1]} đã tồn tại`;
    }

    match = message.match(/must be at least (\d+) characters/);

    if (match) {
        return `Mật khẩu phải có ít nhất ${match[1]} ký tự`;
    }

    match = message.match(/^Not enough annual leave for (\d+): requested (\d+) day\(s\), (-?\d+) available$/);

    if (match) {
        return `Không đủ ngày phép năm ${match[1]}: xin ${match[2]} ngày, chỉ còn ${Math.max(Number(match[3]), 0)} ngày`;
    }

    return message;
};

export const getErrorMessage = (error) => {
    if (!error.response) {
        return "Không kết nối được máy chủ. Vui lòng kiểm tra backend đã chạy chưa.";
    }

    const message = error.response.data && error.response.data.message;

    return message ? translate(message) : "Đã có lỗi xảy ra, vui lòng thử lại";
};
