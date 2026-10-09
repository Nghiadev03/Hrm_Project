import Icon from "../../components/Icon";

const FEATURES = [
    {
        icon: "users",
        title: "Phòng ban và nhân viên",
        text: "Hồ sơ, chức vụ và tài khoản của mọi người ở cùng một nơi.",
    },
    {
        icon: "calendarCheck",
        title: "Duyệt nghỉ phép nhanh",
        text: "Nhân viên gửi đơn, quản trị duyệt hoặc từ chối kèm ghi chú.",
    },
    {
        icon: "clock",
        title: "Theo dõi ngày phép",
        text: "Số ngày đã dùng, đang chờ và còn lại luôn được tính sẵn.",
    },
];

// Khung chung cho các trang chưa đăng nhập: bên trái giới thiệu, bên phải là nội dung trang
export default function AuthCard({ title, subtitle, children }) {
    return (
        <div className="auth">
            <aside className="auth__brand">
                <div className="auth__brand-name">
                    <span className="auth__logo">HR</span>
                    <span>Quản lý nhân sự</span>
                </div>

                <div className="auth__intro">
                    <h2 className="auth__headline">Mọi việc nhân sự, gọn trong một màn hình</h2>
                    <p className="auth__lead">
                        Quản lý phòng ban, hồ sơ nhân viên và đơn nghỉ phép mà không cần bảng tính rời rạc.
                    </p>
                    <ul className="auth__features">
                        {FEATURES.map((feature) => (
                            <li key={feature.title} className="auth__feature">
                                <span className="auth__feature-icon">
                                    <Icon name={feature.icon} />
                                </span>
                                <div>
                                    <div className="auth__feature-title">{feature.title}</div>
                                    <div className="auth__feature-text">{feature.text}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            <main className="auth__main">
                <div className="auth__panel">
                    <div className="auth__brand-name auth__brand-name--mobile">
                        <span className="auth__logo">HR</span>
                        <span>Quản lý nhân sự</span>
                    </div>
                    <h1 className="auth__title">{title}</h1>
                    {subtitle && <p className="auth__subtitle">{subtitle}</p>}
                    <div className="auth__body">{children}</div>
                </div>
            </main>
        </div>
    );
}
