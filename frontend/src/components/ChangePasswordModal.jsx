import { useState } from "react";
import { authApi } from "../api";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../utils/errors";
import Modal from "./Modal";

export default function ChangePasswordModal({ onClose }) {
    const showToast = useToast();
    const [form, setForm] = useState({ current: "", next: "", confirm: "" });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const onChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        if (form.next.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        if (form.next !== form.confirm) {
            setError("Mật khẩu nhập lại không khớp");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await authApi.changePassword(form.current, form.next);
            showToast("Đổi mật khẩu thành công");
            onClose();
        } catch (requestError) {
            setError(getErrorMessage(requestError));
            setSaving(false);
        }
    };

    return (
        <Modal
            title="Đổi mật khẩu"
            size="sm"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn" onClick={onClose} disabled={saving}>
                        Huỷ bỏ
                    </button>
                    <button type="submit" form="change-password-form" className="btn btn--primary" disabled={saving}>
                        {saving ? "Đang lưu..." : "Đổi mật khẩu"}
                    </button>
                </>
            }
        >
            <form id="change-password-form" className="form" onSubmit={onSubmit}>
                {error && <div className="alert alert--error">{error}</div>}
                <label className="field">
                    <span className="field__label">Mật khẩu hiện tại</span>
                    <input
                        className="input"
                        type="password"
                        name="current"
                        value={form.current}
                        onChange={onChange}
                        autoComplete="current-password"
                        required
                        autoFocus
                    />
                </label>
                <label className="field">
                    <span className="field__label">Mật khẩu mới</span>
                    <input
                        className="input"
                        type="password"
                        name="next"
                        value={form.next}
                        onChange={onChange}
                        autoComplete="new-password"
                        required
                    />
                    <span className="field__hint">Ít nhất 6 ký tự</span>
                </label>
                <label className="field">
                    <span className="field__label">Nhập lại mật khẩu mới</span>
                    <input
                        className="input"
                        type="password"
                        name="confirm"
                        value={form.confirm}
                        onChange={onChange}
                        autoComplete="new-password"
                        required
                    />
                </label>
            </form>
        </Modal>
    );
}
