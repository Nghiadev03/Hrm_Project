import { DOCUMENT_STATUS_LABELS, EMPLOYEE_STATUS_LABELS, LEAVE_STATUS_LABELS, ROLE_LABELS } from "../utils/format";

const LEAVE_STATUS_TONES = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
};

export function LeaveStatusBadge({ status }) {
    return (
        <span className={`badge badge--${LEAVE_STATUS_TONES[status] || "neutral"}`}>
            {LEAVE_STATUS_LABELS[status] || status}
        </span>
    );
}

export function EmployeeStatusBadge({ status }) {
    return (
        <span className={`badge badge--${status === "ACTIVE" ? "success" : "neutral"}`}>
            {EMPLOYEE_STATUS_LABELS[status] || status}
        </span>
    );
}

export function RoleBadge({ role }) {
    return (
        <span className={`badge badge--${role === "ADMIN" ? "info" : "neutral"}`}>
            {ROLE_LABELS[role] || role}
        </span>
    );
}

const DOCUMENT_STATUS_TONES = {
    PROCESSING: "warning",
    READY: "success",
    FAILED: "danger",
};

export function DocumentStatusBadge({ status }) {
    return (
        <span className={`badge badge--${DOCUMENT_STATUS_TONES[status] || "neutral"}`}>
            {DOCUMENT_STATUS_LABELS[status] || status}
        </span>
    );
}
