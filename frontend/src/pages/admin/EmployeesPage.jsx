import { useEffect, useState } from "react";
import { departmentApi, employeeApi } from "../../api";
import { EmployeeStatusBadge, RoleBadge } from "../../components/Badge";
import ConfirmDialog from "../../components/ConfirmDialog";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagedList } from "../../hooks/usePagedList";
import { getErrorMessage } from "../../utils/errors";
import { EMPLOYEE_STATUS_LABELS, ROLE_LABELS, formatDate } from "../../utils/format";

const EMPTY_FORM = {
    employee_code: "",
    full_name: "",
    email: "",
    password: "",
    phone: "",
    position: "",
    department_id: "",
    date_of_birth: "",
    hire_date: "",
    role: "EMPLOYEE",
    status: "ACTIVE",
    annual_leave_days: 12,
};

const toForm = (employee) => {
    const form = { ...EMPTY_FORM };

    for (const key of Object.keys(EMPTY_FORM)) {
        if (employee[key] !== null && employee[key] !== undefined) {
            form[key] = employee[key];
        }
    }

    return form;
};

function EmployeeForm({ employee, departments, isSelf, onClose, onSaved }) {
    const [form, setForm] = useState(employee ? toForm(employee) : EMPTY_FORM);
    // Khi sửa, ô mật khẩu chỉ hiện sau khi bấm "Đặt lại mật khẩu",
    // để trình duyệt tự điền hay gõ nhầm không âm thầm đổi mật khẩu của nhân viên
    const [settingPassword, setSettingPassword] = useState(!employee);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const onChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        if (settingPassword && form.password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        setSaving(true);
        setError("");

        const payload = {
            ...form,
            annual_leave_days: Number(form.annual_leave_days),
        };

        if (!settingPassword) {
            delete payload.password;
        }

        try {
            if (employee) {
                await employeeApi.update(employee.id, payload);
            } else {
                await employeeApi.create(payload);
            }

            onSaved(employee ? "Đã cập nhật nhân viên" : "Đã thêm nhân viên");
        } catch (requestError) {
            setError(getErrorMessage(requestError));
            setSaving(false);
        }
    };

    return (
        <Modal
            title={employee ? "Sửa nhân viên" : "Thêm nhân viên"}
            size="lg"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn" onClick={onClose} disabled={saving}>
                        Huỷ bỏ
                    </button>
                    <button type="submit" form="employee-form" className="btn btn--primary" disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </>
            }
        >
            <form id="employee-form" className="form" onSubmit={onSubmit}>
                {error && <div className="alert alert--error">{error}</div>}

                <div className="form__grid">
                    <label className="field">
                        <span className="field__label">
                            Mã nhân viên <span className="field__required">*</span>
                        </span>
                        <input
                            className="input"
                            name="employee_code"
                            value={form.employee_code}
                            onChange={onChange}
                            placeholder="EMP003"
                            required
                            autoFocus
                        />
                    </label>
                    <label className="field">
                        <span className="field__label">
                            Họ và tên <span className="field__required">*</span>
                        </span>
                        <input className="input" name="full_name" value={form.full_name} onChange={onChange} required />
                    </label>
                    <label className="field">
                        <span className="field__label">
                            Email <span className="field__required">*</span>
                        </span>
                        <input
                            className="input"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={onChange}
                            autoComplete="off"
                            required
                        />
                    </label>
                    {settingPassword ? (
                        <label className="field">
                            <span className="field__label">
                                {employee ? "Mật khẩu mới" : "Mật khẩu"} <span className="field__required">*</span>
                            </span>
                            <input
                                className="input"
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={onChange}
                                autoComplete="new-password"
                                required
                            />
                            <span className="field__hint">
                                Ít nhất 6 ký tự.
                                {employee && (
                                    <>
                                        {" "}
                                        <button
                                            type="button"
                                            className="link-button"
                                            onClick={() => {
                                                setSettingPassword(false);
                                                setForm({ ...form, password: "" });
                                            }}
                                        >
                                            Không đổi mật khẩu
                                        </button>
                                    </>
                                )}
                            </span>
                        </label>
                    ) : (
                        <div className="field">
                            <span className="field__label">Mật khẩu</span>
                            <button type="button" className="btn" onClick={() => setSettingPassword(true)}>
                                Đặt lại mật khẩu
                            </button>
                            <span className="field__hint">Mật khẩu hiện tại được giữ nguyên</span>
                        </div>
                    )}
                    <label className="field">
                        <span className="field__label">Số điện thoại</span>
                        <input className="input" name="phone" value={form.phone} onChange={onChange} />
                    </label>
                    <label className="field">
                        <span className="field__label">Chức vụ</span>
                        <input className="input" name="position" value={form.position} onChange={onChange} />
                    </label>
                    <label className="field">
                        <span className="field__label">Phòng ban</span>
                        <select className="input" name="department_id" value={form.department_id} onChange={onChange}>
                            <option value="">— Chưa có phòng ban —</option>
                            {departments.map((department) => (
                                <option key={department.id} value={department.id}>
                                    {department.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field">
                        <span className="field__label">Số ngày phép năm</span>
                        <input
                            className="input"
                            type="number"
                            name="annual_leave_days"
                            min={0}
                            max={365}
                            value={form.annual_leave_days}
                            onChange={onChange}
                            required
                        />
                    </label>
                    <label className="field">
                        <span className="field__label">Ngày sinh</span>
                        <input
                            className="input"
                            type="date"
                            name="date_of_birth"
                            value={form.date_of_birth}
                            onChange={onChange}
                        />
                    </label>
                    <label className="field">
                        <span className="field__label">Ngày vào làm</span>
                        <input className="input" type="date" name="hire_date" value={form.hire_date} onChange={onChange} />
                    </label>
                    <label className="field">
                        <span className="field__label">Vai trò</span>
                        <select className="input" name="role" value={form.role} onChange={onChange} disabled={isSelf}>
                            {Object.entries(ROLE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field">
                        <span className="field__label">Trạng thái</span>
                        <select className="input" name="status" value={form.status} onChange={onChange} disabled={isSelf}>
                            {Object.entries(EMPLOYEE_STATUS_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                {isSelf && (
                    <p className="field__hint">Bạn không thể tự đổi vai trò hoặc khoá tài khoản của chính mình.</p>
                )}
            </form>
        </Modal>
    );
}

export default function EmployeesPage() {
    const { user } = useAuth();
    const showToast = useToast();
    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [status, setStatus] = useState("");
    const debouncedSearch = useDebounce(search);
    const list = usePagedList(employeeApi.list, {
        search: debouncedSearch,
        department_id: departmentId,
        status,
    });
    const [departments, setDepartments] = useState([]);
    // editing: undefined = đóng, null = thêm mới, object = sửa
    const [editing, setEditing] = useState(undefined);
    const [deleting, setDeleting] = useState(null);
    const [deleteState, setDeleteState] = useState({ loading: false, error: "" });

    useEffect(() => {
        departmentApi
            .list({ limit: 100 })
            .then((result) => setDepartments(result.data))
            .catch(() => setDepartments([]));
    }, []);

    const onSaved = (message) => {
        setEditing(undefined);
        showToast(message);
        list.reload();
    };

    const closeDelete = () => {
        setDeleting(null);
        setDeleteState({ loading: false, error: "" });
    };

    const onDelete = async () => {
        setDeleteState({ loading: true, error: "" });

        try {
            await employeeApi.remove(deleting.id);
            closeDelete();
            showToast("Đã xoá nhân viên");
            list.reload();
        } catch (requestError) {
            setDeleteState({ loading: false, error: getErrorMessage(requestError) });
        }
    };

    const hasFilter = Boolean(debouncedSearch || departmentId || status);

    const columns = [
        { key: "employee_code", title: "Mã NV" },
        {
            key: "full_name",
            title: "Nhân viên",
            render: (row) => (
                <>
                    <strong>{row.full_name}</strong>
                    <div className="table__sub">{row.email}</div>
                </>
            ),
        },
        { key: "department", title: "Phòng ban", render: (row) => (row.department ? row.department.name : "—") },
        { key: "position", title: "Chức vụ", render: (row) => row.position || "—" },
        { key: "hire_date", title: "Ngày vào làm", render: (row) => formatDate(row.hire_date) },
        { key: "role", title: "Vai trò", render: (row) => <RoleBadge role={row.role} /> },
        { key: "status", title: "Trạng thái", render: (row) => <EmployeeStatusBadge status={row.status} /> },
        {
            key: "actions",
            title: "",
            className: "table__actions",
            render: (row) => (
                <>
                    <button type="button" className="btn btn--small" onClick={() => setEditing(row)}>
                        Sửa
                    </button>
                    <button
                        type="button"
                        className="btn btn--small btn--danger-outline"
                        onClick={() => setDeleting(row)}
                        disabled={row.id === user.id}
                        title={row.id === user.id ? "Không thể xoá tài khoản của chính mình" : undefined}
                    >
                        Xoá
                    </button>
                </>
            ),
        },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Nhân viên</h1>
                    <p className="page-subtitle">Quản lý hồ sơ và tài khoản nhân viên</p>
                </div>
                <button type="button" className="btn btn--primary" onClick={() => setEditing(null)}>
                    + Thêm nhân viên
                </button>
            </div>

            <div className="card">
                <div className="toolbar">
                    <input
                        className="input toolbar__search"
                        type="search"
                        placeholder="Tìm theo tên, email, mã nhân viên..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Tìm nhân viên"
                    />
                    <select
                        className="input toolbar__select"
                        value={departmentId}
                        onChange={(event) => setDepartmentId(event.target.value)}
                        aria-label="Lọc theo phòng ban"
                    >
                        <option value="">Tất cả phòng ban</option>
                        {departments.map((department) => (
                            <option key={department.id} value={department.id}>
                                {department.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input toolbar__select"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        aria-label="Lọc theo trạng thái"
                    >
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(EMPLOYEE_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <DataTable
                    columns={columns}
                    rows={list.rows}
                    loading={list.loading}
                    error={list.error}
                    emptyText={hasFilter ? "Không tìm thấy nhân viên phù hợp" : "Chưa có nhân viên nào"}
                />
                <Pagination pagination={list.pagination} onChange={list.setPage} />
            </div>

            {editing !== undefined && (
                <EmployeeForm
                    employee={editing}
                    departments={departments}
                    isSelf={Boolean(editing) && editing.id === user.id}
                    onClose={() => setEditing(undefined)}
                    onSaved={onSaved}
                />
            )}

            {deleting && (
                <ConfirmDialog
                    title="Xoá nhân viên"
                    message={`Xoá nhân viên "${deleting.full_name}"? Toàn bộ đơn nghỉ phép của người này cũng sẽ bị xoá.`}
                    confirmLabel="Xoá"
                    danger
                    loading={deleteState.loading}
                    error={deleteState.error}
                    onConfirm={onDelete}
                    onClose={closeDelete}
                />
            )}
        </>
    );
}
