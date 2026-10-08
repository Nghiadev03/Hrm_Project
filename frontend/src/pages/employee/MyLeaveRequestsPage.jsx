import { useState } from "react";
import { leaveRequestApi } from "../../api";
import { LeaveStatusBadge } from "../../components/Badge";
import ConfirmDialog from "../../components/ConfirmDialog";
import DataTable from "../../components/DataTable";
import LeaveBalanceCards from "../../components/LeaveBalanceCards";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";
import { useFetch } from "../../hooks/useFetch";
import { usePagedList } from "../../hooks/usePagedList";
import { getErrorMessage } from "../../utils/errors";
import {
    LEAVE_STATUS_LABELS,
    LEAVE_TYPE_LABELS,
    countWorkingDays,
    formatDateRange,
    formatDateTime,
} from "../../utils/format";

function LeaveRequestForm({ onClose, onSaved }) {
    const [form, setForm] = useState({
        leave_type: "ANNUAL",
        start_date: "",
        end_date: "",
        reason: "",
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const days = countWorkingDays(form.start_date, form.end_date);
    const hasDates = Boolean(form.start_date && form.end_date);

    const onChange = (event) => {
        const next = { ...form, [event.target.name]: event.target.value };

        // Chọn ngày bắt đầu sau ngày kết thúc thì kéo ngày kết thúc theo
        if (event.target.name === "start_date" && (!next.end_date || next.end_date < next.start_date)) {
            next.end_date = next.start_date;
        }

        setForm(next);
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        if (form.end_date < form.start_date) {
            setError("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu");
            return;
        }

        if (days === 0) {
            setError("Đơn nghỉ phải có ít nhất một ngày làm việc (thứ 2 - thứ 6)");
            return;
        }

        setSaving(true);
        setError("");

        try {
            await leaveRequestApi.create({ ...form, reason: form.reason.trim() || null });
            onSaved();
        } catch (requestError) {
            setError(getErrorMessage(requestError));
            setSaving(false);
        }
    };

    return (
        <Modal
            title="Tạo đơn nghỉ phép"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn" onClick={onClose} disabled={saving}>
                        Huỷ bỏ
                    </button>
                    <button type="submit" form="leave-form" className="btn btn--primary" disabled={saving}>
                        {saving ? "Đang gửi..." : "Gửi đơn"}
                    </button>
                </>
            }
        >
            <form id="leave-form" className="form" onSubmit={onSubmit}>
                {error && <div className="alert alert--error">{error}</div>}
                <label className="field">
                    <span className="field__label">
                        Loại nghỉ <span className="field__required">*</span>
                    </span>
                    <select className="input" name="leave_type" value={form.leave_type} onChange={onChange}>
                        {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    <span className="field__hint">Chỉ "Nghỉ phép năm" bị trừ vào số ngày phép.</span>
                </label>
                <div className="form__grid">
                    <label className="field">
                        <span className="field__label">
                            Từ ngày <span className="field__required">*</span>
                        </span>
                        <input
                            className="input"
                            type="date"
                            name="start_date"
                            value={form.start_date}
                            onChange={onChange}
                            required
                        />
                    </label>
                    <label className="field">
                        <span className="field__label">
                            Đến ngày <span className="field__required">*</span>
                        </span>
                        <input
                            className="input"
                            type="date"
                            name="end_date"
                            value={form.end_date}
                            min={form.start_date || undefined}
                            onChange={onChange}
                            required
                        />
                    </label>
                </div>
                {hasDates && (
                    <p className="field__hint">
                        Số ngày làm việc: <strong>{days}</strong> (không tính thứ 7, chủ nhật)
                    </p>
                )}
                <label className="field">
                    <span className="field__label">Lý do</span>
                    <textarea className="input" name="reason" rows={3} value={form.reason} onChange={onChange} />
                </label>
            </form>
        </Modal>
    );
}

export default function MyLeaveRequestsPage() {
    const showToast = useToast();
    const [status, setStatus] = useState("");
    const list = usePagedList(leaveRequestApi.listMine, { status });
    const balance = useFetch(() => leaveRequestApi.balance());
    const [creating, setCreating] = useState(false);
    const [cancelling, setCancelling] = useState(null);
    const [cancelState, setCancelState] = useState({ loading: false, error: "" });

    const refresh = () => {
        list.reload();
        balance.reload();
    };

    const onSaved = () => {
        setCreating(false);
        showToast("Đã gửi đơn nghỉ phép");
        refresh();
    };

    const closeCancel = () => {
        setCancelling(null);
        setCancelState({ loading: false, error: "" });
    };

    const onCancel = async () => {
        setCancelState({ loading: true, error: "" });

        try {
            await leaveRequestApi.cancel(cancelling.id);
            closeCancel();
            showToast("Đã huỷ đơn nghỉ phép");
            refresh();
        } catch (requestError) {
            setCancelState({ loading: false, error: getErrorMessage(requestError) });
        }
    };

    const columns = [
        { key: "leave_type", title: "Loại nghỉ", render: (row) => LEAVE_TYPE_LABELS[row.leave_type] || row.leave_type },
        {
            key: "dates",
            title: "Thời gian",
            render: (row) => (
                <>
                    {formatDateRange(row.start_date, row.end_date)}
                    <div className="table__sub">{row.days} ngày làm việc</div>
                </>
            ),
        },
        { key: "reason", title: "Lý do", className: "table__wrap", render: (row) => row.reason || "—" },
        {
            key: "status",
            title: "Trạng thái",
            render: (row) => (
                <>
                    <LeaveStatusBadge status={row.status} />
                    {row.admin_note && <div className="table__sub">Ghi chú: {row.admin_note}</div>}
                </>
            ),
        },
        { key: "created_at", title: "Ngày gửi", render: (row) => formatDateTime(row.created_at) },
        {
            key: "actions",
            title: "",
            className: "table__actions",
            render: (row) =>
                row.status === "PENDING" ? (
                    <button type="button" className="btn btn--small btn--danger-outline" onClick={() => setCancelling(row)}>
                        Huỷ đơn
                    </button>
                ) : null,
        },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Đơn nghỉ phép của tôi</h1>
                    <p className="page-subtitle">Tạo đơn mới và theo dõi trạng thái các đơn đã gửi</p>
                </div>
                <button type="button" className="btn btn--primary" onClick={() => setCreating(true)}>
                    + Tạo đơn nghỉ phép
                </button>
            </div>

            {balance.error && <div className="alert alert--error">{balance.error}</div>}
            {balance.data && <LeaveBalanceCards balance={balance.data} />}

            <div className="card">
                <div className="toolbar">
                    <select
                        className="input toolbar__select"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        aria-label="Lọc theo trạng thái"
                    >
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(LEAVE_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <DataTable
                    columns={columns}
                    rows={list.rows}
                    loading={list.loading}
                    error={list.error}
                    emptyText={status ? "Không có đơn nào ở trạng thái này" : "Bạn chưa có đơn nghỉ phép nào"}
                />
                <Pagination pagination={list.pagination} onChange={list.setPage} />
            </div>

            {creating && <LeaveRequestForm onClose={() => setCreating(false)} onSaved={onSaved} />}

            {cancelling && (
                <ConfirmDialog
                    title="Huỷ đơn nghỉ phép"
                    message={`Huỷ đơn nghỉ ${formatDateRange(cancelling.start_date, cancelling.end_date)}? Đơn sẽ bị xoá và không thể khôi phục.`}
                    confirmLabel="Huỷ đơn"
                    danger
                    loading={cancelState.loading}
                    error={cancelState.error}
                    onConfirm={onCancel}
                    onClose={closeCancel}
                />
            )}
        </>
    );
}
