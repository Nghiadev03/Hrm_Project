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
    const [showPassword, setShowPassword] = useState(false);
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
        <AuthCard title="Chào mừng trở lại" subtitle="Đăng nhập để tiếp tục làm việc">
            <form className="form" onSubmit={onSubmit}>
                {error && <div className="alert alert--error">{error}</div>}
                <div className="field">
                    <label className="field__label" htmlFor="login-email">
                        Email
                    </label>
                    <input
                        id="login-email"
                        className="input input--large"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="ten@congty.com"
                        autoComplete="username"
                        required
                        autoFocus
                    />
                </div>
                <div className="field">
                    <div className="field__row">
                        <label className="field__label" htmlFor="login-password">
                            Mật khẩu
                        </label>
                        <Link to="/forgot-password" className="field__link">
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <div className="input-group">
                        <input
                            id="login-password"
                            className="input input--large"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            className="input-group__action"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                            aria-pressed={showPassword}
                        >
                            {showPassword ? "Ẩn" : "Hiện"}
                        </button>
                    </div>
                </div>
                <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                    {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
            </form>
        </AuthCard>
    );
}
