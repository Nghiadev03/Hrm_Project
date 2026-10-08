import { Link } from "react-router-dom";
import { dashboardApi } from "../../api";
import { useFetch } from "../../hooks/useFetch";
import { LEAVE_TYPE_LABELS, formatDateRange } from "../../utils/format";

export default function AdminDashboardPage() {
    const { data, loading, error } = useFetch(dashboardApi.admin);

    if (loading) {
        return <div className="page-loading">Đang tải...</div>;
    }

    if (error) {
        return <div className="alert alert--error">{error}</div>;
    }

    const maxCount = Math.max(1, ...data.employees_by_department.map((item) => item.employee_count));

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tổng quan</h1>
                    <p className="page-subtitle">Tình hình nhân sự và nghỉ phép của công ty</p>
                </div>
            </div>

            <div className="stat-grid">
                <div className="stat-card">
                    <span className="stat-card__label">Phòng ban</span>
                    <span className="stat-card__value">{data.total_departments}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-card__label">Nhân viên</span>
                    <span className="stat-card__value">{data.total_employees}</span>
                    <span className="stat-card__note">{data.active_employees} đang làm việc</span>
                </div>
                <div className="stat-card stat-card--warning">
                    <span className="stat-card__label">Đơn chờ duyệt</span>
                    <span className="stat-card__value">{data.leave_requests.PENDING}</span>
                    <span className="stat-card__note">
                        {data.leave_requests.APPROVED} đã duyệt · {data.leave_requests.REJECTED} từ chối
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-card__label">Đang nghỉ hôm nay</span>
                    <span className="stat-card__value">{data.on_leave_today}</span>
                </div>
            </div>

            <div className="panel-grid">
                <section className="panel">
                    <div className="panel__header">
                        <h2 className="panel__title">Nhân viên theo phòng ban</h2>
                        <Link to="/admin/departments" className="panel__link">
                            Xem phòng ban
                        </Link>
                    </div>
                    {data.employees_by_department.length === 0 ? (
                        <p className="panel__empty">Chưa có phòng ban nào</p>
                    ) : (
                        <ul className="bar-list">
                            {data.employees_by_department.map((department) => (
                                <li key={department.id} className="bar-list__item">
                                    <span className="bar-list__label">{department.name}</span>
                                    <span className="bar-list__track">
                                        <span
                                            className="bar-list__fill"
                                            style={{ width: `${(department.employee_count / maxCount) * 100}%` }}
                                        />
                                    </span>
                                    <span className="bar-list__value">{department.employee_count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="panel">
                    <div className="panel__header">
                        <h2 className="panel__title">Đơn chờ duyệt gần nhất</h2>
                        <Link to="/admin/leave-requests" className="panel__link">
                            Xem tất cả
                        </Link>
                    </div>
                    {data.recent_pending_requests.length === 0 ? (
                        <p className="panel__empty">Không có đơn nào đang chờ duyệt</p>
                    ) : (
                        <ul className="item-list">
                            {data.recent_pending_requests.map((request) => (
                                <li key={request.id} className="item-list__item">
                                    <div>
                                        <div className="item-list__title">{request.employee.full_name}</div>
                                        <div className="item-list__meta">
                                            {LEAVE_TYPE_LABELS[request.leave_type] || request.leave_type} ·{" "}
                                            {formatDateRange(request.start_date, request.end_date)}
                                        </div>
                                    </div>
                                    <span className="item-list__value">{request.days} ngày</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
