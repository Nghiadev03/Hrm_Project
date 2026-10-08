import { useState } from "react";
import { departmentApi } from "../../api";
import ConfirmDialog from "../../components/ConfirmDialog";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagedList } from "../../hooks/usePagedList";
import { getErrorMessage } from "../../utils/errors";
import { formatDateTime } from "../../utils/format";

function DepartmentForm({ department, onClose, onSaved }) {
    const [form, setForm] = useState({
        name: department ? department.name : "",
        description: department ? department.description || "" : "",
    });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const onChange = (event) => {
        setForm({ ...form, [event.target.name]: event.target.value });
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            if (department) {
                await departmentApi.update(department.id, form);
            } else {
                await departmentApi.create(form);
            }

            onSaved(department ? "Đã cập nhật phòng ban" : "Đã thêm phòng ban");
        } catch (requestError) {
            setError(getErrorMessage(requestError));
            setSaving(false);
        }
    };

    return (
        <Modal
            title={department ? "Sửa phòng ban" : "Thêm phòng ban"}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn" onClick={onClose} disabled={saving}>
                        Huỷ bỏ
                    </button>
                    <button type="submit" form="department-form" className="btn btn--primary" disabled={saving}>
                        {saving ? "Đang lưu..." : "Lưu"}
                    </button>
                </>
            }
        >
            <form id="department-form" className="form" onSubmit={onSubmit}>
                {error && <div className="alert alert--error">{error}</div>}
                <label className="field">
                    <span className="field__label">
                        Tên phòng ban <span className="field__required">*</span>
                    </span>
                    <input
                        className="input"
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        maxLength={100}
                        required
                        autoFocus
                    />
                </label>
                <label className="field">
                    <span className="field__label">Mô tả</span>
                    <textarea
                        className="input"
                        name="description"
                        rows={3}
                        value={form.description}
                        onChange={onChange}
                    />
                </label>
            </form>
        </Modal>
    );
}

export default function DepartmentsPage() {
    const showToast = useToast();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const list = usePagedList(departmentApi.list, { search: debouncedSearch });
    // editing: undefined = đóng, null = thêm mới, object = sửa
    const [editing, setEditing] = useState(undefined);
    const [deleting, setDeleting] = useState(null);
    const [deleteState, setDeleteState] = useState({ loading: false, error: "" });

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
            await departmentApi.remove(deleting.id);
            closeDelete();
            showToast("Đã xoá phòng ban");
            list.reload();
        } catch (requestError) {
            setDeleteState({ loading: false, error: getErrorMessage(requestError) });
        }
    };

    const columns = [
        { key: "name", title: "Tên phòng ban", render: (row) => <strong>{row.name}</strong> },
        { key: "description", title: "Mô tả", render: (row) => row.description || "—" },
        { key: "created_at", title: "Ngày tạo", render: (row) => formatDateTime(row.created_at) },
        {
            key: "actions",
            title: "",
            className: "table__actions",
            render: (row) => (
                <>
                    <button type="button" className="btn btn--small" onClick={() => setEditing(row)}>
                        Sửa
                    </button>
                    <button type="button" className="btn btn--small btn--danger-outline" onClick={() => setDeleting(row)}>
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
                    <h1 className="page-title">Phòng ban</h1>
                    <p className="page-subtitle">Quản lý danh sách phòng ban của công ty</p>
                </div>
                <button type="button" className="btn btn--primary" onClick={() => setEditing(null)}>
                    + Thêm phòng ban
                </button>
            </div>

            <div className="card">
                <div className="toolbar">
                    <input
                        className="input toolbar__search"
                        type="search"
                        placeholder="Tìm theo tên phòng ban..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Tìm phòng ban"
                    />
                </div>
                <DataTable
                    columns={columns}
                    rows={list.rows}
                    loading={list.loading}
                    error={list.error}
                    emptyText={debouncedSearch ? "Không tìm thấy phòng ban phù hợp" : "Chưa có phòng ban nào"}
                />
                <Pagination pagination={list.pagination} onChange={list.setPage} />
            </div>

            {editing !== undefined && (
                <DepartmentForm department={editing} onClose={() => setEditing(undefined)} onSaved={onSaved} />
            )}

            {deleting && (
                <ConfirmDialog
                    title="Xoá phòng ban"
                    message={`Xoá phòng ban "${deleting.name}"? Nhân viên thuộc phòng ban này sẽ không còn phòng ban.`}
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
