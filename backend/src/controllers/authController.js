const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { Employee, Department } = require("../models");
const {
    MIN_PASSWORD_LENGTH,
    isValidPassword,
    hashPassword,
    comparePassword,
} = require("../utils/password");
const { sendPasswordResetEmail } = require("../utils/mailer");

const RESET_TOKEN_TTL_MINUTES = 30;

const includeDepartment = {
    model: Department,
    as: "department",
    attributes: ["id", "name"],
};

const hashResetToken = (token) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

// POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const employee = await Employee.scope("withPassword").findOne({
            where: { email },
            include: [includeDepartment],
        });

        // Sai email hay sai mật khẩu đều trả cùng một thông báo
        const isMatch = employee
            ? await comparePassword(password, employee.password_hash)
            : false;

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        if (employee.status !== "ACTIVE") {
            return res.status(403).json({
                message: "Account is inactive",
            });
        }

        const token = jwt.sign(
            { id: employee.id, role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
        );

        res.json({
            token,
            user: employee,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to login",
            error: error.message,
        });
    }
};

// GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const employee = await Employee.findByPk(req.user.id, {
            include: [includeDepartment],
        });

        res.json(employee);
    } catch (error) {
        res.status(500).json({
            message: "Failed to get current user",
            error: error.message,
        });
    }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body || {};

        if (!current_password || !new_password) {
            return res.status(400).json({
                message: "Current password and new password are required",
            });
        }

        if (!isValidPassword(new_password)) {
            return res.status(400).json({
                message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            });
        }

        const employee = await Employee.scope("withPassword").findByPk(req.user.id);
        const isMatch = await comparePassword(current_password, employee.password_hash);

        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
            });
        }

        await employee.update({
            password_hash: await hashPassword(new_password),
        });

        res.json({
            message: "Password changed successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to change password",
            error: error.message,
        });
    }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body || {};

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        const employee = await Employee.findOne({
            where: { email, status: "ACTIVE" },
        });

        if (employee) {
            const token = crypto.randomBytes(32).toString("hex");
            const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

            // Chỉ lưu bản băm của token, token thật chỉ nằm trong link gửi đi
            await employee.update({
                reset_token_hash: hashResetToken(token),
                reset_token_expires_at: new Date(
                    Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
                ),
            });

            await sendPasswordResetEmail(
                employee,
                `${frontendUrl}/reset-password?token=${token}`
            );
        }

        // Luôn trả cùng một câu để không lộ email nào có trong hệ thống
        res.json({
            message: "If the email exists, a password reset link has been sent",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to request password reset",
            error: error.message,
        });
    }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
    try {
        const { token, new_password } = req.body || {};

        if (!token || !new_password) {
            return res.status(400).json({
                message: "Token and new password are required",
            });
        }

        if (!isValidPassword(new_password)) {
            return res.status(400).json({
                message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            });
        }

        const employee = await Employee.scope("withPassword").findOne({
            where: {
                reset_token_hash: hashResetToken(String(token)),
                reset_token_expires_at: { [Op.gt]: new Date() },
            },
        });

        if (!employee) {
            return res.status(400).json({
                message: "Invalid or expired reset token",
            });
        }

        await employee.update({
            password_hash: await hashPassword(new_password),
            reset_token_hash: null,
            reset_token_expires_at: null,
        });

        res.json({
            message: "Password reset successfully",
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to reset password",
            error: error.message,
        });
    }
};

module.exports = {
    login,
    getMe,
    changePassword,
    forgotPassword,
    resetPassword,
};
