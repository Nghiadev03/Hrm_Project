export const ROLE_LABELS = {
    ADMIN: "Quản trị",
    EMPLOYEE: "Nhân viên",
};

export const EMPLOYEE_STATUS_LABELS = {
    ACTIVE: "Đang làm việc",
    INACTIVE: "Đã khoá",
};

export const LEAVE_TYPE_LABELS = {
    ANNUAL: "Nghỉ phép năm",
    SICK: "Nghỉ ốm",
    UNPAID: "Nghỉ không lương",
};

export const LEAVE_STATUS_LABELS = {
    PENDING: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
};

// "2026-10-05" -> "05/10/2026"
export const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    const [year, month, day] = String(value).slice(0, 10).split("-");

    return `${day}/${month}/${year}`;
};

// Chuỗi ISO có giờ -> ngày theo giờ máy người dùng
export const formatDateTime = (value) => {
    if (!value) {
        return "—";
    }

    return new Date(value).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export const formatDateRange = (start, end) => {
    return start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`;
};

// Đếm ngày làm việc (thứ 2 - thứ 6), cùng cách tính với backend
export const countWorkingDays = (start, end) => {
    if (!start || !end || end < start) {
        return 0;
    }

    const current = new Date(`${start}T00:00:00Z`);
    const last = new Date(`${end}T00:00:00Z`);
    let days = 0;

    while (current <= last) {
        const weekday = current.getUTCDay();

        if (weekday !== 0 && weekday !== 6) {
            days += 1;
        }

        current.setUTCDate(current.getUTCDate() + 1);
    }

    return days;
};

export const homePath = (user) => (user.role === "ADMIN" ? "/admin" : "/employee");

export const DOCUMENT_STATUS_LABELS = {
    PROCESSING: "Đang xử lý",
    READY: "Sẵn sàng",
    FAILED: "Lỗi",
};

// 1536000 -> "1,5 MB"
export const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) {
        return "—";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 0 })} KB`;
    }

    return `${(bytes / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
};
