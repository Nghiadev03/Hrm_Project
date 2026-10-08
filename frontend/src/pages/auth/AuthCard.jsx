// Khung chung cho các trang chưa đăng nhập
export default function AuthCard({ title, subtitle, children }) {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card__logo">HR</div>
                <h1 className="auth-card__title">{title}</h1>
                {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
                {children}
            </div>
        </div>
    );
}
