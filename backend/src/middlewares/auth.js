const jwt = require("jsonwebtoken");
const { Employee } = require("../models");

// Kiểm tra token trong header "Authorization: Bearer <token>", gắn nhân viên vào req.user
const authenticate = async (req, res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            message: "Authentication required",
        });
    }

    let payload;

    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }

    try {
        const employee = await Employee.findByPk(payload.id);

        if (!employee || employee.status !== "ACTIVE") {
            return res.status(401).json({
                message: "Account not found or inactive",
            });
        }

        req.user = employee;
        next();
    } catch (error) {
        res.status(500).json({
            message: "Failed to authenticate",
            error: error.message,
        });
    }
};

// Dùng sau authenticate: authorize("ADMIN") hoặc authorize("ADMIN", "EMPLOYEE")
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "You do not have permission to perform this action",
            });
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize,
};
