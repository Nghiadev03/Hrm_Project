import Icon from "./Icon";

// 4 thẻ số ngày phép năm, dùng ở trang Tổng quan và trang Đơn nghỉ phép của nhân viên
export default function LeaveBalanceCards({ balance }) {
    return (
        <div className="stat-grid">
            <div className="stat-card">
                <div className="stat-card__top">
                    <span className="stat-card__label">Phép năm {balance.year}</span>
                    <span className="stat-card__icon">
                        <Icon name="calendarCheck" />
                    </span>
                </div>
                <span className="stat-card__value">{balance.total}</span>
                <span className="stat-card__note">ngày được cấp</span>
            </div>
            <div className="stat-card">
                <div className="stat-card__top">
                    <span className="stat-card__label">Đã dùng</span>
                    <span className="stat-card__icon stat-card__icon--info">
                        <Icon name="checkCircle" />
                    </span>
                </div>
                <span className="stat-card__value">{balance.used}</span>
                <span className="stat-card__note">ngày đã được duyệt</span>
            </div>
            <div className="stat-card">
                <div className="stat-card__top">
                    <span className="stat-card__label">Đang chờ duyệt</span>
                    <span className="stat-card__icon stat-card__icon--warning">
                        <Icon name="clock" />
                    </span>
                </div>
                <span className="stat-card__value">{balance.pending}</span>
                <span className="stat-card__note">ngày</span>
            </div>
            <div className="stat-card">
                <div className="stat-card__top">
                    <span className="stat-card__label">Còn có thể xin</span>
                    <span className="stat-card__icon">
                        <Icon name="home" />
                    </span>
                </div>
                <span className="stat-card__value stat-card__value--accent">{Math.max(balance.available, 0)}</span>
                <span className="stat-card__note">ngày</span>
            </div>
        </div>
    );
}
