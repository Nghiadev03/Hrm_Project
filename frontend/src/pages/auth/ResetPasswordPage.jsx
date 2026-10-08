import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../../api";
import { getErrorMessage } from "../../utils/errors";
import AuthCard from "./AuthCard";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();

        if (password.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        if (password !== confirm) {
            setError("Mật khẩu nhập lại không khớp");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            await authApi.resetPassword(token, password);
            setDone(true);
        } catch (requestError) {
            setError(getErrorMessage(requestError));
        } finally {
            setSubmitting(false);
        }
    };

    if (!token) {
        return (
            <AuthCard title="Đặt lại mật khẩu">
                <div className="form">
                    <div className="alert alert--error">Liên kết đặt lại mật khẩu không hợp lệ.</div>
                    <Link to="/forgot-password" className="btn btn--primary btn--block">
                        Yêu cầu liên kết mới
                    </Link>
                </div>
            </AuthCard>
        );
    }

    return (
        <AuthCard title="Đặt lại mật khẩu" subtitle="Nhập mật khẩu mới cho tài khoản của bạn">
            {done ? (
                <div className="form">
                    <div className="alert alert--success">
                        Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
                    </div>
                    <Link to="/login" className="btn btn--primary btn--block">
                        Đăng nhập
                    </Link>
                </div>
            ) : (
                <form className="form" onSubmit={onSubmit}>
                    {error && <div className="alert alert--error">{error}</div>}
                    <label className="field">
                        <span className="field__label">Mật khẩu mới</span>
                        <input
                            className="input"
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="new-password"
                            required
                            autoFocus
                        />
                        <span className="field__hint">Ít nhất 6 ký tự</span>
                    </label>
                    <label className="field">
                        <span className="field__label">Nhập lại mật khẩu mới</span>
                        <input
                            className="input"
                            type="password"
                            value={confirm}
                            onChange={(event) => setConfirm(event.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </label>
                    <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
                        {submitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
                    </button>
                    <Link to="/forgot-password" className="auth-link">
                        Yêu cầu liên kết mới
                    </Link>
                </form>
            )}
        </AuthCard>
    );
}
