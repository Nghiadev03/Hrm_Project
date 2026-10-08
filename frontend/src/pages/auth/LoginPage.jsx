import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../utils/errors";
import { homePath } from "../../utils/format";
import AuthCard from "./AuthCard";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            const user = await login(email.trim(), password);
            const from = location.state && location.state.from;
            const home = homePath(user);

            // Chỉ quay lại trang cũ nếu trang đó thuộc đúng vai trò vừa đăng nhập
            navigate(from && from.startsWith(home) ? from : home, { replace: true });
        } catch (requestError) {
            setError(getErrorMessage(requestError));
            setSubmitting(false);
        }
    };

    return (
        <AuthCard title="Đăng nhập" subtitle="Hệ thống quản lý nhân sự">
            <form className="form" onSubmit={onSubmit}>
                {error && <div className="alert alert--error">{error}</div>}
                <label className="field">
                    <span className="field__label">Email</span>
                    <input
                        className="input"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="ten@congty.com"
                        autoComplete="username"
                        required
                        autoFocus
                    />
                </label>
                <label className="field">
                    <span className="field__label">Mật khẩu</span>
                    <input
                        className="input"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </label>
                <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                    {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
                <Link to="/forgot-password" className="auth-link">
                    Quên mật khẩu?
                </Link>
            </form>
        </AuthCard>
    );
}
