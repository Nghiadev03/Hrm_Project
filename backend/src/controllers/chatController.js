const { Op } = require("sequelize");
const { ChatMessage, Document } = require("../models");
const { getPagination, paginate } = require("../utils/pagination");
const handleError = require("../utils/handleError");
const gemini = require("../utils/gemini");
const answerCache = require("../utils/answerCache");

const MAX_QUESTION_LENGTH = 1000;
const DEFAULT_DAILY_LIMIT = 30;
// Giá trị cột model của câu trả lời lấy lại từ bộ nhớ đệm; loại này không tính vào lượt hỏi
const CACHED_MODEL = "cache";

const getDailyLimit = () => parseInt(process.env.CHAT_DAILY_LIMIT, 10) || DEFAULT_DAILY_LIMIT;

// 0 giờ hôm nay theo giờ máy chủ
const startOfToday = () => {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const countToday = (employeeId) => {
    return ChatMessage.count({
        where: {
            employee_id: employeeId,
            created_at: { [Op.gte]: startOfToday() },
            [Op.or]: [{ model: null }, { model: { [Op.ne]: CACHED_MODEL } }],
        },
    });
};

// POST /api/chat   { question }
const askQuestion = async (req, res) => {
    try {
        const question = String((req.body && req.body.question) || "").trim();

        if (!question) {
            return res.status(400).json({
                message: "Question is required",
            });
        }

        if (question.length > MAX_QUESTION_LENGTH) {
            return res.status(400).json({
                message: `Question must be at most ${MAX_QUESTION_LENGTH} characters`,
            });
        }

        if (!gemini.isConfigured()) {
            return res.status(503).json({
                message: "Chatbot is not configured",
            });
        }

        const dailyLimit = getDailyLimit();
        const usedToday = await countToday(req.user.id);
        const cached = answerCache.get(question);

        // Câu hỏi đã có người hỏi (từ lần tài liệu thay đổi gần nhất): trả lời ngay, không tốn lượt
        if (cached) {
            const message = await ChatMessage.create({
                employee_id: req.user.id,
                question,
                answer: cached.answer,
                citations: cached.citations,
                model: CACHED_MODEL,
            });

            return res.status(201).json({
                ...message.toJSON(),
                remaining_today: Math.max(dailyLimit - usedToday, 0),
            });
        }

        if (usedToday >= dailyLimit) {
            return res.status(429).json({
                message: "Daily question limit reached",
            });
        }

        const readyDocuments = await Document.count({ where: { status: "READY" } });

        if (readyDocuments === 0) {
            return res.status(400).json({
                message: "No documents available",
            });
        }

        const result = await gemini.askQuestion(question);

        answerCache.set(question, { answer: result.answer, citations: result.citations });

        const message = await ChatMessage.create({
            employee_id: req.user.id,
            question,
            answer: result.answer,
            citations: result.citations,
            model: result.model,
        });

        res.status(201).json({
            ...message.toJSON(),
            remaining_today: Math.max(dailyLimit - usedToday - 1, 0),
        });
    } catch (error) {
        if (error instanceof gemini.GeminiError) {
            return res.status(error.status).json({
                message: error.message,
            });
        }

        handleError(res, error, "Failed to answer question");
    }
};

// GET /api/chat/history?page=&limit=   (mới nhất trước)
const getHistory = async (req, res) => {
    try {
        const pagination = getPagination(req.query);

        const [{ rows, count }, usedToday] = await Promise.all([
            ChatMessage.findAndCountAll({
                where: { employee_id: req.user.id },
                order: [["created_at", "DESC"], ["id", "DESC"]],
                limit: pagination.limit,
                offset: pagination.offset,
            }),
            countToday(req.user.id),
        ]);

        const dailyLimit = getDailyLimit();

        res.json({
            ...paginate(rows, count, pagination),
            daily_limit: dailyLimit,
            remaining_today: Math.max(dailyLimit - usedToday, 0),
            chatbot_configured: gemini.isConfigured(),
        });
    } catch (error) {
        handleError(res, error, "Failed to get chat history");
    }
};

module.exports = {
    askQuestion,
    getHistory,
};
