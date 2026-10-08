import { Link } from "react-router-dom";
import { dashboardApi } from "../../api";
import { LeaveStatusBadge } from "../../components/Badge";
import LeaveBalanceCards from "../../components/LeaveBalanceCards";
import { useFetch } from "../../hooks/useFetch";
import { LEAVE_TYPE_LABELS, formatDate, formatDateRange } from "../../utils/format";

export default function EmployeeDashboardPage() {
    const { data, loading, error } = useFetch(dashboardApi.me);

    if (loading) {
        return <div className="page-loading">Đang tải...</div>;
    }

    if (error) {
        return <div className="alert alert--error">{error}</div>;
    }

    const { profile, leave_balance: balance, leave_requests: counts, recent_requests: recent } = data;

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Xin chào, {profile.full_name}</h1>
                    <p className="page-subtitle">Thông tin cá nhân và tình hình nghỉ phép của bạn</p>
                </div>
                <Link to="/employee/leave-requests" className="btn btn--primary">
                    + Tạo đơn nghỉ phép
                </Link>
            </div>

            <LeaveBalanceCards balance={balance} />

            <div className="panel-grid">
                <section className="panel">
                    <div className="panel__header">
                        <h2 className="panel__title">Thông tin cá nhân</h2>
                    </div>
                    <dl className="detail-list">
                        <dt>Mã nhân viên</dt>
                        <dd>{profile.employee_code}</dd>
                        <dt>Email</dt>
                        <dd>{profile.email}</dd>
                        <dt>Phòng ban</dt>
                        <dd>{profile.department ? profile.department.name : "—"}</dd>
                        <dt>Chức vụ</dt>
                        <dd>{profile.position || "—"}</dd>
                        <dt>Số điện thoại</dt>
                        <dd>{profile.phone || "—"}</dd>
                        <dt>Ngày sinh</dt>
                        <dd>{formatDate(profile.date_of_birth)}</dd>
                        <dt>Ngày vào làm</dt>
                        <dd>{formatDate(profile.hire_date)}</dd>
                    </dl>
                </section>

                <section className="panel">
                    <div className="panel__header">
                        <h2 className="panel__title">Đơn nghỉ phép gần đây</h2>
                        <Link to="/employee/leave-requests" className="panel__link">
                            Xem tất cả
                        </Link>
                    </div>
                    <p className="panel__summary">
                        {counts.PENDING} chờ duyệt · {counts.APPROVED} đã duyệt · {counts.REJECTED} từ chối
                    </p>
                    {recent.length === 0 ? (
                        <p className="panel__empty">Bạn chưa có đơn nghỉ phép nào</p>
                    ) : (
                        <ul className="item-list">
                            {recent.map((request) => (
                                <li key={request.id} className="item-list__item">
                                    <div>
                                        <div className="item-list__title">
                                            {LEAVE_TYPE_LABELS[request.leave_type] || request.leave_type}
                                        </div>
                                        <div className="item-list__meta">
                                            {formatDateRange(request.start_date, request.end_date)} · {request.days} ngày
                                        </div>
                                    </div>
                                    <LeaveStatusBadge status={request.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
