import { Link } from "react-router-dom";
import { dashboardApi } from "../../api";
import Icon from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";
import { useFetch } from "../../hooks/useFetch";
import { LEAVE_STATUS_LABELS, LEAVE_TYPE_LABELS, formatDateRange } from "../../utils/format";

const LEAVE_STATUS_TONES = [
    { status: "PENDING", tone: "warning" },
    { status: "APPROVED", tone: "success" },
    { status: "REJECTED", tone: "danger" },
];

const percent = (part, total) => (total === 0 ? 0 : Math.round((part / total) * 100));

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const { data, loading, error } = useFetch(dashboardApi.admin);

    if (loading) {
        return <div className="page-loading">Đang tải...</div>;
    }

    if (error) {
        return <div className="alert alert--error">{error}</div>;
    }

    const counts = data.leave_requests;
    const totalRequests = counts.PENDING + counts.APPROVED + counts.REJECTED;
    const activePercent = percent(data.active_employees, data.total_employees);
    const departments = [...data.employees_by_department].sort(
        (a, b) => b.employee_count - a.employee_count || a.name.localeCompare(b.name)
    );
    const maxCount = Math.max(1, ...departments.map((item) => item.employee_count));

    return (
        <>
            <section className="banner">
                <div>
                    <h1 className="banner__title">Xin chào, {user.full_name}</h1>
                    <p className="banner__text">
                        Hiện có <strong>{counts.PENDING} đơn nghỉ phép</strong> đang chờ duyệt và{" "}
                        <strong>{data.on_leave_today} nhân viên</strong> nghỉ hôm nay
                    </p>
                </div>
                <Link to="/admin/leave-requests" className="banner__action">
                    Xem đơn chờ duyệt
                    <Icon name="arrowRight" size={16} />
                </Link>
            </section>

            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-card__top">
                        <span className="stat-card__label">Phòng ban</span>
                        <span className="stat-card__icon">
                            <Icon name="building" />
                        </span>
                    </div>
                    <span className="stat-card__value">{data.total_departments}</span>
                    <span className="stat-card__note">đang hoạt động</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card__top">
                        <span className="stat-card__label">Nhân viên</span>
                        <span className="stat-card__icon stat-card__icon--info">
                            <Icon name="users" />
                        </span>
                    </div>
                    <span className="stat-card__value">{data.total_employees}</span>
                    <span className="stat-card__note">{data.active_employees} đang làm việc</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card__top">
                        <span className="stat-card__label">Đơn chờ duyệt</span>
                        <span className="stat-card__icon stat-card__icon--warning">
                            <Icon name="clock" />
                        </span>
                    </div>
                    <span className="stat-card__value">{counts.PENDING}</span>
                    <span className="stat-card__note">trên tổng {totalRequests} đơn</span>
                </div>
                <div className="stat-card">
                    <div className="stat-card__top">
                        <span className="stat-card__label">Đang nghỉ hôm nay</span>
                        <span className="stat-card__icon stat-card__icon--danger">
                            <Icon name="home" />
                        </span>
                    </div>
                    <span className="stat-card__value">{data.on_leave_today}</span>
                    <span className="stat-card__note">nhân viên</span>
                </div>
            </div>

            <div className="panel-grid panel-grid--wide">
                <section className="panel">
                    <div className="panel__header">
                        <h2 className="panel__title">Tình trạng đơn nghỉ phép</h2>
                        <Link to="/admin/leave-requests" className="panel__link">
                            Xem tất cả
                        </Link>
                    </div>
                    <div className="panel__figure">{totalRequests}</div>
                    <p className="panel__summary">Tổng số đơn đã gửi</p>

                    <ul className="meter-list">
                        {LEAVE_STATUS_TONES.map(({ status, tone }) => (
                            <li key={status} className="meter-list__item">
                                <div className="meter-list__row">
                                    <span>{LEAVE_STATUS_LABELS[status]}</span>
                                    <strong>{counts[status]}</strong>
                                </div>
                                <span className="bar">
                                    <span
                                        className={`bar__fill bar__fill--${tone}`}
                                        style={{ width: `${percent(counts[status], totalRequests)}%` }}
                                    />
                                </span>
                            </li>
                        ))}
                    </ul>

                    <div className="rate-row">
                        {LEAVE_STATUS_TONES.map(({ status, tone }) => (
                            <div key={status} className="rate-row__item">
                                <span className="rate-row__label">{LEAVE_STATUS_LABELS[status]}</span>
                                <span className={`rate-row__value rate-row__value--${tone}`}>
                                    {percent(counts[status], totalRequests)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="panel panel--center">
                    <div className="ring" style={{ "--value": activePercent }}>
                        <span className="ring__label">{activePercent}%</span>
                    </div>
                    <h2 className="panel__title">Nhân viên đang làm việc</h2>
                    <p className="panel__summary">
                        {data.active_employees} trên {data.total_employees} tài khoản đang hoạt động
                    </p>
                </section>
            </div>

            <div className="panel-grid">
                <section className="panel">
                    <div className="panel__header">
                        <h2 className="panel__title">Nhân viên theo phòng ban</h2>
                        <Link to="/admin/departments" className="panel__link">
                            Xem phòng ban
                        </Link>
                    </div>
                    {departments.length === 0 ? (
                        <p className="panel__empty">Chưa có phòng ban nào</p>
                    ) : (
                        <ul className="rank-list">
                            {departments.map((department, index) => (
                                <li key={department.id} className="rank-list__item">
                                    <span className={`rank-badge ${index === 0 ? "rank-badge--top" : ""}`}>
                                        #{index + 1}
                                    </span>
                                    <div className="rank-list__body">
                                        <div className="rank-list__row">
                                            <span className="rank-list__name">{department.name}</span>
                                            <span className="rank-list__value">
                                                {department.employee_count} nhân viên
                                            </span>
                                        </div>
                                        <span className="bar">
                                            <span
                                                className="bar__fill"
                                                style={{ width: `${(department.employee_count / maxCount) * 100}%` }}
                                            />
                                        </span>
                                    </div>
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
                        <ul className="timeline">
                            {data.recent_pending_requests.map((request) => (
                                <li key={request.id} className="timeline__item">
                                    <span className="timeline__dot timeline__dot--warning" />
                                    <div className="timeline__body">
                                        <div className="timeline__title">
                                            <strong>{request.employee.full_name}</strong> xin{" "}
                                            {(LEAVE_TYPE_LABELS[request.leave_type] || request.leave_type).toLowerCase()}{" "}
                                            {request.days} ngày
                                        </div>
                                        <div className="timeline__meta">
                                            {request.employee.employee_code} ·{" "}
                                            {formatDateRange(request.start_date, request.end_date)}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}
