const express = require("express");

const { askQuestion, getHistory } = require("../controllers/chatController");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

// Cả admin lẫn nhân viên đều hỏi được
router.use(authenticate);

router.get("/history", getHistory);
router.post("/", askQuestion);

module.exports = router;
