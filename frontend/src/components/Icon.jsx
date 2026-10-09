// Bộ biểu tượng nét mảnh vẽ bằng SVG, lấy màu theo chữ xung quanh (currentColor)
const ICONS = {
    grid: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
    ),
    building: (
        <>
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M9 8h1M14 8h1M9 12h1M14 12h1M10 21v-4h4v4" />
        </>
    ),
    users: (
        <>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
            <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.1.8 3.5 2.8 3.5 5.7" />
        </>
    ),
    calendarCheck: (
        <>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4" />
        </>
    ),
    file: (
        <>
            <path d="M6 3h8l4 4v14H6z" />
            <path d="M14 3v4h4M9 12h6M9 16h6" />
        </>
    ),
    clock: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </>
    ),
    checkCircle: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M8.5 12l2.5 2.5 4.5-5" />
        </>
    ),
    home: (
        <>
            <path d="M4 11l8-7 8 7v9H4z" />
            <path d="M10 20v-6h4v6" />
        </>
    ),
    lock: (
        <>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </>
    ),
    logout: <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    chevronDown: <path d="M6 9l6 6 6-6" />,
    arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
};

export default function Icon({ name, size = 18 }) {
    return (
        <svg
            className="icon"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {ICONS[name]}
        </svg>
    );
}
