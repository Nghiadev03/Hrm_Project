import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../api";
import { getErrorMessage } from "../../utils/errors";
import AuthCard from "./AuthCard";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            await authApi.forgotPassword(email.trim());
            setSent(true);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthCard title="Quên mật khẩu" subtitle="Nhập email của bạn để nhận liên kết đặt lại mật khẩu">
            {sent ? (
                <div className="form">
                    <div className="alert alert--success">
                        Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi. Liên kết có
                        hiệu lực trong 30 phút.
                    </div>
                    <Link to="/login" className="btn btn--primary btn--block">
                        Quay lại đăng nhập
                    </Link>
                </div>
            ) : (
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
                            required
                            autoFocus
                        />
                    </label>
                    <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                        {submitting ? "Đang gửi..." : "Gửi liên kết"}
                    </button>
                    <Link to="/login" className="auth-link">
                        Quay lại đăng nhập
                    </Link>
                </form>
            )}
        </AuthCard>
    );
}
