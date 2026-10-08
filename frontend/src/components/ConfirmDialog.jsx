import Modal from "./Modal";

export default function ConfirmDialog({
    title,
    message,
    confirmLabel = "Xác nhận",
    danger = false,
    loading = false,
    error = "",
    onConfirm,
    onClose,
}) {
    return (
        <Modal
            title={title}
            size="sm"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn" onClick={onClose} disabled={loading}>
                        Huỷ bỏ
                    </button>
                    <button
                        type="button"
                        className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : confirmLabel}
                    </button>
                </>
            }
        >
            {error && <div className="alert alert--error">{error}</div>}
            <p className="confirm-message">{message}</p>
        </Modal>
    );
}
