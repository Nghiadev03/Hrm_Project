-- Chatbot hỏi đáp tài liệu: tài liệu admin tải lên và lịch sử hỏi đáp.
-- Chạy lại nhiều lần không sao.

CREATE TABLE IF NOT EXISTS documents (
    id                    SERIAL PRIMARY KEY,
    title                 VARCHAR(200) NOT NULL,
    original_filename     VARCHAR(255) NOT NULL,
    mime_type             VARCHAR(150) NOT NULL,
    size_bytes            INTEGER NOT NULL,
    -- Việc xử lý trên Google chạy nền; lưu tên operation để kiểm tra lại sau
    gemini_operation_name TEXT,
    -- Tên tài liệu trong kho File Search, dùng khi xoá
    gemini_document_name  TEXT,
    status                VARCHAR(20) NOT NULL DEFAULT 'PROCESSING',
    error_message         TEXT,
    uploaded_by           INTEGER,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT documents_status_check CHECK (status IN ('PROCESSING', 'READY', 'FAILED')),
    CONSTRAINT fk_document_uploader FOREIGN KEY (uploaded_by)
        REFERENCES employees (id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id          SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    question    TEXT NOT NULL,
    answer      TEXT NOT NULL,
    citations   JSONB NOT NULL DEFAULT '[]'::jsonb,
    model       VARCHAR(100),
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chat_employee FOREIGN KEY (employee_id)
        REFERENCES employees (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Đếm số câu hỏi trong ngày và lấy lịch sử theo người dùng
CREATE INDEX IF NOT EXISTS idx_chat_messages_employee_created
    ON chat_messages (employee_id, created_at);
