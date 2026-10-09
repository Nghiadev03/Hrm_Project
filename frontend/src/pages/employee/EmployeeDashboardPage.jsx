import { Link } from "react-router-dom";
import { dashboardApi } from "../../api";
import { LeaveStatusBadge } from "../../components/Badge";
import Icon from "../../components/Icon";
import LeaveBalanceCards from "../../components/LeaveBalanceCards";
import { useFetch } from "../../hooks/useFetch";
import { LEAVE_TYPE_LABELS, formatDate, formatDateRange } from "../../utils/format";

const STATUS_TONES = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
};

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
            <section className="banner">
                <div>
                    <h1 className="banner__title">Xin chào, {profile.full_name}</h1>
                    <p className="banner__text">
                        Bạn còn <strong>{Math.max(balance.available, 0)} ngày phép</strong> có thể xin trong năm{" "}
                        {balance.year} và <strong>{counts.PENDING} đơn</strong> đang chờ duyệt
                    </p>
                </div>
                <Link to="/employee/leave-requests" className="banner__action">
                    Tạo đơn nghỉ phép
                    <Icon name="arrowRight" size={16} />
                </Link>
            </section>

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
                        <ul className="timeline">
                            {recent.map((request) => (
                                <li key={request.id} className="timeline__item">
                                    <span className={`timeline__dot timeline__dot--${STATUS_TONES[request.status]}`} />
                                    <div className="timeline__body">
                                        <div className="timeline__title">
                                            <strong>{LEAVE_TYPE_LABELS[request.leave_type] || request.leave_type}</strong>{" "}
                                            · {request.days} ngày
                                        </div>
                                        <div className="timeline__meta">
                                            {formatDateRange(request.start_date, request.end_date)}
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
