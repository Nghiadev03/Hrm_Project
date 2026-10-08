import { useState } from "react";
import { leaveRequestApi } from "../../api";
import { LeaveStatusBadge } from "../../components/Badge";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";
import { usePagedList } from "../../hooks/usePagedList";
import { getErrorMessage } from "../../utils/errors";
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS, formatDateRange } from "../../utils/format";

const STATUS_TABS = [
    { value: "PENDING", label: LEAVE_STATUS_LABELS.PENDING },
    { value: "APPROVED", label: LEAVE_STATUS_LABELS.APPROVED },
    { value: "REJECTED", label: LEAVE_STATUS_LABELS.REJECTED },
    { value: "", label: "Tất cả" },
];

function ReviewModal({ request, action, onClose, onDone }) {
    const isApprove = action === "approve";
    const [note, setNote] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const onSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (isApprove) {
                await leaveRequestApi.approve(request.id, note.trim() || undefined);
            } else {
                await leaveRequestApi.reject(request.id, note.trim() || undefined);
            }

            onDone(isApprove ? "Đã duyệt đơn nghỉ phép" : "Đã từ chối đơn nghỉ phép");
        } catch (requestError) {
            setError(getErrorMessage(requestError));
            setSaving(false);
        }
    };

    return (
        <Modal
            title={isApprove ? "Duyệt đơn nghỉ phép" : "Từ chối đơn nghỉ phép"}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn" onClick={onClose} disabled={saving}>
                        Huỷ bỏ
                    </button>
                    <button
                        type="submit"
                        form="review-form"
                        className={`btn ${isApprove ? "btn--primary" : "btn--danger"}`}
                        disabled={saving}
                    >
                        {saving ? "Đang xử lý..." : isApprove ? "Duyệt" : "Từ chối"}
                    </button>
                </>
            }
        >
            <form id="review-form" className="form" onSubmit={onSubmit}>
                {error && <div className="alert alert--error">{error}</div>}
                <dl className="detail-list">
                    <dt>Nhân viên</dt>
                    <dd>
                        {request.employee.full_name} ({request.employee.employee_code})
                    </dd>
                    <dt>Loại nghỉ</dt>
                    <dd>{LEAVE_TYPE_LABELS[request.leave_type] || request.leave_type}</dd>
                    <dt>Thời gian</dt>
                    <dd>
                        {formatDateRange(request.start_date, request.end_date)} · {request.days} ngày làm việc
                    </dd>
                    <dt>Lý do</dt>
                    <dd>{request.reason || "—"}</dd>
                </dl>
                <label className="field">
                    <span className="field__label">Ghi chú của người duyệt</span>
                    <textarea
                        className="input"
                        rows={3}
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        placeholder={isApprove ? "Không bắt buộc" : "Lý do từ chối (không bắt buộc)"}
                        autoFocus
                    />
                </label>
            </form>
        </Modal>
    );
}

export default function LeaveRequestsPage() {
    const showToast = useToast();
    const [status, setStatus] = useState("PENDING");
    const list = usePagedList(leaveRequestApi.list, { status });
    const [review, setReview] = useState(null);

    const onDone = (message) => {
        setReview(null);
        showToast(message);
        list.reload();
    };

    const columns = [
        {
            key: "employee",
            title: "Nhân viên",
            render: (row) => (
                <>
                    <strong>{row.employee.full_name}</strong>
                    <div className="table__sub">
                        {row.employee.employee_code}
                        {row.employee.department ? ` · ${row.employee.department.name}` : ""}
                    </div>
                </>
            ),
        },
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
        {
            key: "actions",
            title: "",
            className: "table__actions",
            render: (row) =>
                row.status === "PENDING" ? (
                    <>
                        <button
                            type="button"
                            className="btn btn--small btn--primary"
                            onClick={() => setReview({ request: row, action: "approve" })}
                        >
                            Duyệt
                        </button>
                        <button
                            type="button"
                            className="btn btn--small btn--danger-outline"
                            onClick={() => setReview({ request: row, action: "reject" })}
                        >
                            Từ chối
                        </button>
                    </>
                ) : null,
        },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Duyệt nghỉ phép</h1>
                    <p className="page-subtitle">Xem và xử lý đơn nghỉ phép của nhân viên</p>
                </div>
            </div>

            <div className="card">
                <div className="tabs" role="tablist">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value || "ALL"}
                            type="button"
                            role="tab"
                            aria-selected={status === tab.value}
                            className={`tabs__tab ${status === tab.value ? "tabs__tab--active" : ""}`}
                            onClick={() => setStatus(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <DataTable
                    columns={columns}
                    rows={list.rows}
                    loading={list.loading}
                    error={list.error}
                    emptyText={status === "PENDING" ? "Không có đơn nào đang chờ duyệt" : "Không có đơn nào"}
                />
                <Pagination pagination={list.pagination} onChange={list.setPage} />
            </div>

            {review && (
                <ReviewModal
                    request={review.request}
                    action={review.action}
                    onClose={() => setReview(null)}
                    onDone={onDone}
                />
            )}
        </>
    );
}
