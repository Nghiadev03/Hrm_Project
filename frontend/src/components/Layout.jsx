import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../utils/format";
import ChangePasswordModal from "./ChangePasswordModal";
import Icon from "./Icon";

// Menu thanh bên theo vai trò, chia nhóm
const NAV_SECTIONS = {
    ADMIN: [
        {
            title: "Tổng quan",
            items: [{ to: "/admin", label: "Tổng quan", icon: "grid", end: true }],
        },
        {
            title: "Quản lý",
            items: [
                { to: "/admin/departments", label: "Phòng ban", icon: "building" },
                { to: "/admin/employees", label: "Nhân viên", icon: "users" },
                { to: "/admin/leave-requests", label: "Duyệt nghỉ phép", icon: "calendarCheck" },
                { to: "/admin/documents", label: "Tài liệu", icon: "book" },
            ],
        },
        {
            title: "Trợ lý",
            items: [{ to: "/admin/chat", label: "Hỏi đáp tài liệu", icon: "chat" }],
        },
    ],
    EMPLOYEE: [
        {
            title: "Tổng quan",
            items: [{ to: "/employee", label: "Tổng quan", icon: "grid", end: true }],
        },
        {
            title: "Nghỉ phép",
            items: [{ to: "/employee/leave-requests", label: "Đơn nghỉ phép của tôi", icon: "file" }],
        },
        {
            title: "Trợ lý",
            items: [{ to: "/employee/chat", label: "Hỏi đáp tài liệu", icon: "chat" }],
        },
    ],
};

const getInitials = (name) => {
    const words = name.trim().split(/\s+/);

    return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
};

// Mục menu ứng với đường dẫn đang mở, để hiện tên trang trên thanh trên
const findCurrentItem = (sections, pathname) => {
    const items = sections.flatMap((section) => section.items);

    return (
        items.find((item) => item.to === pathname) ||
        items.find((item) => !item.end && pathname.startsWith(item.to)) ||
        items[0]
    );
};

function UserMenu({ user, onChangePassword, onLogout }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const onMouseDown = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", onMouseDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <div className="user-menu" ref={ref}>
            <button
                type="button"
                className="user-menu__trigger"
                onClick={() => setOpen(!open)}
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <span className="avatar">{getInitials(user.full_name)}</span>
                <span className="user-menu__name">{user.full_name}</span>
                <Icon name="chevronDown" size={16} />
            </button>

            {open && (
                <div className="user-menu__dropdown" role="menu">
                    <div className="user-menu__header">
                        <span className="user-menu__fullname">{user.full_name}</span>
                        <span className="user-menu__email">{user.email}</span>
                        <span className="user-menu__role">{ROLE_LABELS[user.role]}</span>
                    </div>
                    <button
                        type="button"
                        className="user-menu__item"
                        role="menuitem"
                        onClick={() => {
                            setOpen(false);
                            onChangePassword();
                        }}
                    >
                        <Icon name="lock" size={16} />
                        Đổi mật khẩu
                    </button>
                    <button
                        type="button"
                        className="user-menu__item user-menu__item--danger"
                        role="menuitem"
                        onClick={onLogout}
                    >
                        <Icon name="logout" size={16} />
                        Đăng xuất
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Layout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const sections = NAV_SECTIONS[user.role];
    const current = findCurrentItem(sections, location.pathname);

    return (
        <div className="layout">
            {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

            <aside className={`sidebar ${menuOpen ? "sidebar--open" : ""}`}>
                <div className="sidebar__brand">
                    <span className="sidebar__logo">HR</span>
                    <span>Quản lý nhân sự</span>
                </div>

                <nav className="sidebar__nav">
                    {sections.map((section) => (
                        <div key={section.title} className="sidebar__section">
                            <span className="sidebar__section-title">{section.title}</span>
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    className={({ isActive }) =>
                                        `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                                    }
                                    onClick={() => setMenuOpen(false)}
                                >
                                    <Icon name={item.icon} />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
            </aside>

            <div className="layout__content">
                <header className="topbar">
                    <button
                        type="button"
                        className="topbar__menu"
                        onClick={() => setMenuOpen(true)}
                        aria-label="Mở menu"
                    >
                        <Icon name="menu" size={20} />
                    </button>
                    <div className="topbar__title">
                        <Icon name={current.icon} size={16} />
                        <span>{current.label}</span>
                    </div>
                    <UserMenu
                        user={user}
                        onChangePassword={() => setChangingPassword(true)}
                        onLogout={logout}
                    />
                </header>

                <main className="main">
                    <Outlet />
                </main>
            </div>

            {changingPassword && <ChangePasswordModal onClose={() => setChangingPassword(false)} />}
        </div>
    );
}
