const express = require("express");
const multer = require("multer");

const { getDocuments, uploadDocument, deleteDocument } = require("../controllers/documentController");
const { authenticate, authorize } = require("../middlewares/auth");

const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB, 10) || 20;

// Giữ file trong bộ nhớ rồi đẩy thẳng lên Google, không lưu trên server
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
});

// Đổi lỗi của multer (file quá lớn, sai tên trường...) thành 400
const receiveFile = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (!error) {
            return next();
        }

        res.status(400).json({
            message:
                error.code === "LIMIT_FILE_SIZE"
                    ? `File must be at most ${MAX_UPLOAD_MB} MB`
                    : "Invalid file upload",
        });
    });
};

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/", getDocuments);
router.post("/", receiveFile, uploadDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
