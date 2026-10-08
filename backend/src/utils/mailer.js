// Chưa cấu hình dịch vụ gửi mail: link đặt lại mật khẩu được in ra console của server.
// Khi có SMTP, chỉ cần thay phần thân hàm này.
const sendPasswordResetEmail = async (employee, resetLink) => {
    console.log(`[password-reset] ${employee.email} -> ${resetLink}`);
};

module.exports = {
    sendPasswordResetEmail,
};
