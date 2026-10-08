const LEAVE_TYPES = ["ANNUAL", "SICK", "UNPAID"];

// Chỉ loại ANNUAL bị trừ vào số ngày phép năm
const BALANCE_LEAVE_TYPE = "ANNUAL";

// Chuỗi ngày hợp lệ dạng YYYY-MM-DD
const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// Ngày hôm nay theo giờ máy chủ, dạng YYYY-MM-DD
const todayString = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${now.getFullYear()}-${month}-${day}`;
};

// Đếm ngày làm việc (thứ 2 - thứ 6) trong khoảng [start, end].
// Truyền year để chỉ đếm những ngày rơi vào năm đó. Chưa trừ ngày lễ.
const countWorkingDays = (start, end, year) => {
    const current = new Date(`${start}T00:00:00Z`);
    const last = new Date(`${end}T00:00:00Z`);
    let days = 0;

    while (current <= last) {
        const weekday = current.getUTCDay();
        const inYear = year === undefined || current.getUTCFullYear() === year;

        if (weekday !== 0 && weekday !== 6 && inYear) {
            days += 1;
        }

        current.setUTCDate(current.getUTCDate() + 1);
    }

    return days;
};

// Các năm mà khoảng [start, end] chạm tới
const yearsInRange = (start, end) => {
    const years = [];

    for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year += 1) {
        years.push(year);
    }

    return years;
};

module.exports = {
    LEAVE_TYPES,
    BALANCE_LEAVE_TYPE,
    isValidDate,
    todayString,
    countWorkingDays,
    yearsInRange,
};
