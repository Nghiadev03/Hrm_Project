const { Op } = require("sequelize");
const { Document, Employee } = require("../models");
const { getPagination, paginate } = require("../utils/pagination");
const handleError = require("../utils/handleError");
const gemini = require("../utils/gemini");
const answerCache = require("../utils/answerCache");

const ALLOWED_TYPES = {
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "text/plain": "TXT",
};
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

const includeUploader = {
    model: Employee,
    as: "uploader",
    attributes: ["id", "full_name"],
};

// Trình duyệt gửi tên file dạng UTF-8 nhưng multer đọc theo latin1, làm hỏng chữ tiếng Việt
const decodeFilename = (name) => Buffer.from(name, "latin1").toString("utf8");

// Hỏi Google tài liệu đã xử lý xong chưa và cập nhật DB. Trả về true nếu đã xong (thành công hoặc lỗi).
const refreshStatus = async (document) => {
    if (document.status !== "PROCESSING" || !document.gemini_operation_name) {
        return document.status !== "PROCESSING";
    }

    const result = await gemini.getUploadStatus(document.gemini_operation_name);

    if (!result.done) {
        return false;
    }

    if (result.error || !result.documentName) {
        await document.update({
            status: "FAILED",
            error_message: result.error || "Google did not return a document name",
        });
    } else {
        await document.update({
            status: "READY",
            gemini_document_name: result.documentName,
            error_message: null,
        });

        // Có tài liệu mới thì câu trả lời đã nhớ có thể không còn đúng
        answerCache.clear();
    }

    return true;
};

// Theo dõi nền cho đến khi Google xử lý xong. Nếu server khởi động lại giữa chừng,
// GET /api/documents vẫn tự kiểm tra lại các tài liệu còn PROCESSING.
const trackInBackground = (documentId) => {
    const startedAt = Date.now();

    const tick = async () => {
        try {
            const document = await Document.findByPk(documentId);

            if (!document || (await refreshStatus(document))) {
                return;
            }

            if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
                return;
            }

            setTimeout(tick, POLL_INTERVAL_MS);
        } catch (error) {
            console.error(`[documents] cannot check document ${documentId}:`, error.message);
            setTimeout(tick, POLL_INTERVAL_MS);
        }
    };

    setTimeout(tick, POLL_INTERVAL_MS);
};

// GET /api/documents?page=&limit=&search=&status=
const getDocuments = async (req, res) => {
    try {
        const pagination = getPagination(req.query);
        const where = {};

        if (req.query.search) {
            where.title = { [Op.iLike]: `%${req.query.search}%` };
        }

        if (req.query.status) {
            where.status = req.query.status;
        }

        const { rows, count } = await Document.findAndCountAll({
            where,
            include: [includeUploader],
            order: [["created_at", "DESC"], ["id", "DESC"]],
            limit: pagination.limit,
            offset: pagination.offset,
        });

        // Cập nhật các tài liệu đang xử lý; lỗi khi hỏi Google thì vẫn trả danh sách
        for (const document of rows) {
            if (document.status === "PROCESSING") {
                await refreshStatus(document).catch((error) =>
                    console.error(`[documents] cannot check document ${document.id}:`, error.message)
                );
            }
        }

        res.json({
            ...paginate(rows, count, pagination),
            chatbot_configured: gemini.isConfigured(),
        });
    } catch (error) {
        handleError(res, error, "Failed to get documents");
    }
};

// POST /api/documents   (multipart/form-data: file, title)
const uploadDocument = async (req, res) => {
    let document = null;

    try {
        if (!gemini.isConfigured()) {
            return res.status(503).json({
                message: "Chatbot is not configured",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "File is required",
            });
        }

        if (!ALLOWED_TYPES[req.file.mimetype]) {
            return res.status(400).json({
                message: "Only PDF, DOCX and TXT files are supported",
            });
        }

        const originalFilename = decodeFilename(req.file.originalname);
        const title = String((req.body && req.body.title) || "").trim() || originalFilename;

        if (title.length > 200) {
            return res.status(400).json({
                message: "Title must be at most 200 characters",
            });
        }

        document = await Document.create({
            title,
            original_filename: originalFilename,
            mime_type: req.file.mimetype,
            size_bytes: req.file.size,
            status: "PROCESSING",
            uploaded_by: req.user.id,
        });

        const operation = await gemini.uploadDocument({
            buffer: req.file.buffer,
            mimeType: req.file.mimetype,
            displayName: title,
            documentId: document.id,
        });

        await document.update({ gemini_operation_name: operation.name });

        if (operation.done) {
            await refreshStatus(document);
        } else {
            trackInBackground(document.id);
        }

        res.status(201).json(await Document.findByPk(document.id, { include: [includeUploader] }));
    } catch (error) {
        console.error("[documents] upload failed:", error.status || "", error.message);

        // Đã tạo dòng trong DB nhưng gửi lên Google thất bại
        if (document) {
            await document
                .update({ status: "FAILED", error_message: error.message })
                .catch(() => {});

            return res.status(502).json({
                message: "Failed to send document to AI service",
            });
        }

        handleError(res, error, "Failed to upload document");
    }
};

// DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
    try {
        const document = await Document.findByPk(req.params.id);

        if (!document) {
            return res.status(404).json({
                message: "Document not found",
            });
        }

        if (document.status === "PROCESSING") {
            return res.status(400).json({
                message: "Document is still processing",
            });
        }

        // Xoá trên Google trước; chỉ xoá DB thì AI vẫn đọc được tài liệu
        if (document.gemini_document_name) {
            try {
                await gemini.deleteDocument(document.gemini_document_name);
            } catch (error) {
                console.error("[documents] delete on Google failed:", error.status || "", error.message);

                return res.status(502).json({
                    message: "Failed to delete document from AI service",
                });
            }
        }

        await document.destroy();
        answerCache.clear();

        res.json({
            message: "Document deleted successfully",
        });
    } catch (error) {
        handleError(res, error, "Failed to delete document");
    }
};

module.exports = {
    ALLOWED_TYPES,
    getDocuments,
    uploadDocument,
    deleteDocument,
};
