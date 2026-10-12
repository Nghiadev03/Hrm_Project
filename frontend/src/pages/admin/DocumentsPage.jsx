import { useEffect, useState } from "react";
import { documentApi } from "../../api";
import { DocumentStatusBadge } from "../../components/Badge";
import ConfirmDialog from "../../components/ConfirmDialog";
import DataTable from "../../components/DataTable";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { useToast } from "../../context/ToastContext";
import { useDebounce } from "../../hooks/useDebounce";
import { usePagedList } from "../../hooks/usePagedList";
import { getErrorMessage } from "../../utils/errors";
import { DOCUMENT_STATUS_LABELS, formatDateTime, formatFileSize } from "../../utils/format";

const ACCEPT = ".pdf,.docx,.txt";
const ALLOWED_EXTENSIONS = ["pdf", "docx", "txt"];
// Còn tài liệu đang xử lý thì tự tải lại danh sách sau mỗi khoảng này
const REFRESH_INTERVAL_MS = 5000;

const getExtension = (filename) => filename.split(".").pop().toLowerCase();

function UploadForm({ onClose, onUploaded }) {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("");
    const [error, setError] = useState("");
    const [uploading, setUploading] = useState(false);

    const onFileChange = (event) => {
        const selected = event.target.files[0] || null;

        setError("");
        setFile(selected);

        // Chưa đặt tên thì lấy tên file (bỏ đuôi) làm gợi ý
        if (selected && !title) {
            setTitle(selected.name.replace(/\.[^.]+$/, ""));
        }
    };

    const onSubmit = async (event) => {
        event.preventDefault();

        if (!file) {
            setError("Vui lòng chọn file");
            return;
        }

        if (!ALLOWED_EXTENSIONS.includes(getExtension(file.name))) {
            setError("Chỉ hỗ trợ file PDF, DOCX và TXT");
            return;
        }

        const formData = new FormData();

        formData.append("file", file);
        formData.append("title", title.trim());

        setUploading(true);
        setError("");

        try {
            await documentApi.upload(formData);
            onUploaded();
        } catch (requestError) {
            setError(getErrorMessage(requestError));
            setUploading(false);
        }
    };

    return (
        <Modal
            title="Tải tài liệu lên"
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="btn" onClick={onClose} disabled={uploading}>
                        Huỷ bỏ
                    </button>
                    <button type="submit" form="upload-form" className="btn btn--primary" disabled={uploading}>
                        {uploading ? "Đang tải lên..." : "Tải lên"}
                    </button>
                </>
            }
        >
            <form id="upload-form" className="form" onSubmit={onSubmit}>
                {error && <div className="alert alert--error">{error}</div>}
                <label className="field">
                    <span className="field__label">
                        File <span className="field__required">*</span>
                    </span>
                    <input className="input" type="file" accept={ACCEPT} onChange={onFileChange} />
                    <span className="field__hint">PDF, DOCX hoặc TXT. Chỉ tải tài liệu mà mọi nhân viên đều được đọc.</span>
                </label>
                <label className="field">
                    <span className="field__label">Tên tài liệu</span>
                    <input
                        className="input"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={200}
                        placeholder="Ví dụ: Nội quy lao động 2026"
                    />
                    <span className="field__hint">Tên này hiện trong phần nguồn của câu trả lời</span>
                </label>
            </form>
        </Modal>
    );
}

export default function DocumentsPage() {
    const showToast = useToast();
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const debouncedSearch = useDebounce(search);
    const list = usePagedList(documentApi.list, { search: debouncedSearch, status });
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [deleteState, setDeleteState] = useState({ loading: false, error: "" });

    const hasProcessing = list.rows.some((row) => row.status === "PROCESSING");
    const notConfigured = list.response && list.response.chatbot_configured === false;
    const { reload } = list;

    // Google xử lý tài liệu mất từ vài giây đến vài phút; tự làm mới cho đến khi xong
    useEffect(() => {
        if (!hasProcessing) {
            return undefined;
        }

        const timer = setInterval(reload, REFRESH_INTERVAL_MS);

        return () => clearInterval(timer);
    }, [hasProcessing, reload]);

    const onUploaded = () => {
        setUploading(false);
        showToast("Đã tải lên, tài liệu đang được xử lý");
        list.reload();
    };

    const closeDelete = () => {
        setDeleting(null);
        setDeleteState({ loading: false, error: "" });
    };

    const onDelete = async () => {
        setDeleteState({ loading: true, error: "" });

        try {
            await documentApi.remove(deleting.id);
            closeDelete();
            showToast("Đã xoá tài liệu");
            list.reload();
        } catch (requestError) {
            setDeleteState({ loading: false, error: getErrorMessage(requestError) });
        }
    };

    const columns = [
        {
            key: "title",
            title: "Tài liệu",
            className: "table__wrap",
            render: (row) => (
                <>
                    <strong>{row.title}</strong>
                    <div className="table__sub">{row.original_filename}</div>
                </>
            ),
        },
        { key: "size_bytes", title: "Dung lượng", render: (row) => formatFileSize(row.size_bytes) },
        {
            key: "status",
            title: "Trạng thái",
            render: (row) => (
                <>
                    <DocumentStatusBadge status={row.status} />
                    {row.status === "FAILED" && row.error_message && (
                        <div className="table__sub">{row.error_message}</div>
                    )}
                </>
            ),
        },
        {
            key: "uploader",
            title: "Người tải lên",
            render: (row) => (row.uploader ? row.uploader.full_name : "—"),
        },
        { key: "created_at", title: "Ngày tải lên", render: (row) => formatDateTime(row.created_at) },
        {
            key: "actions",
            title: "",
            className: "table__actions",
            render: (row) => (
                <button
                    type="button"
                    className="btn btn--small btn--danger-outline"
                    onClick={() => setDeleting(row)}
                    disabled={row.status === "PROCESSING"}
                    title={row.status === "PROCESSING" ? "Chờ xử lý xong rồi hãy xoá" : undefined}
                >
                    Xoá
                </button>
            ),
        },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Tài liệu</h1>
                    <p className="page-subtitle">Tài liệu chatbot dùng để trả lời câu hỏi của nhân viên</p>
                </div>
                <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => setUploading(true)}
                    disabled={notConfigured}
                >
                    + Tải tài liệu lên
                </button>
            </div>

            {notConfigured && (
                <div className="alert alert--error">
                    Chatbot chưa được cấu hình: thiếu <code>GEMINI_API_KEY</code> hoặc <code>GEMINI_STORE_NAME</code>{" "}
                    trong <code>backend/.env</code>. Chạy <code>npm run chat:init</code> trong thư mục backend rồi khởi
                    động lại server.
                </div>
            )}

            <div className="card">
                <div className="toolbar">
                    <input
                        className="input toolbar__search"
                        type="search"
                        placeholder="Tìm theo tên tài liệu..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        aria-label="Tìm tài liệu"
                    />
                    <select
                        className="input toolbar__select"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        aria-label="Lọc theo trạng thái"
                    >
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
                <DataTable
                    columns={columns}
                    rows={list.rows}
                    loading={list.loading && !hasProcessing}
                    error={list.error}
                    emptyText={
                        debouncedSearch || status ? "Không tìm thấy tài liệu phù hợp" : "Chưa có tài liệu nào"
                    }
                />
                <Pagination pagination={list.pagination} onChange={list.setPage} />
            </div>

            {uploading && <UploadForm onClose={() => setUploading(false)} onUploaded={onUploaded} />}

            {deleting && (
                <ConfirmDialog
                    title="Xoá tài liệu"
                    message={`Xoá tài liệu "${deleting.title}"? Chatbot sẽ không còn dùng tài liệu này để trả lời.`}
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
