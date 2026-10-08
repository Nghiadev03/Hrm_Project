import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../utils/format";
import ChangePasswordModal from "./ChangePasswordModal";

const NAV_ITEMS = {
    ADMIN: [
        { to: "/admin", label: "Tổng quan", end: true },
        { to: "/admin/departments", label: "Phòng ban" },
        { to: "/admin/employees", label: "Nhân viên" },
        { to: "/admin/leave-requests", label: "Duyệt nghỉ phép" },
    ],
    EMPLOYEE: [
        { to: "/employee", label: "Tổng quan", end: true },
        { to: "/employee/leave-requests", label: "Đơn nghỉ phép của tôi" },
    ],
};

const getInitials = (name) => {
    const words = name.trim().split(/\s+/);

    return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

export default function Layout() {
    const { user, logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    return (
        <div className="layout">
            <header className="topbar">
                <button
                    type="button"
                    className="topbar__menu"
                    onClick={() => setMenuOpen(true)}
                    aria-label="Mở menu"
                >
                    ☰
                </button>
                <span className="topbar__brand">HRM</span>
            </header>

            {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

            <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
                <div className="sidebar__brand">
                    <span className="sidebar__logo">HR</span>
                    <span>Quản lý nhân sự</span>
                </div>

                <nav className="sidebar__nav">
                    {NAV_ITEMS[user.role].map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                            }
                            onClick={() => setMenuOpen(false)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar__user">
                    <div className="sidebar__profile">
                        <span className="avatar">{getInitials(user.full_name)}</span>
                        <div className="sidebar__identity">
                            <span className="sidebar__name">{user.full_name}</span>
                            <span className="sidebar__role">{ROLE_LABELS[user.role]}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="sidebar__action"
                        onClick={() => {
                            setMenuOpen(false);
                            setChangingPassword(true);
                        }}
                    >
                        Đổi mật khẩu
                    </button>
                    <button type="button" className="sidebar__action" onClick={logout}>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <main className="main">
                <Outlet />
            </main>

            {changingPassword && <ChangePasswordModal onClose={() => setChangingPassword(false)} />}
        </div>
    );
}
