// Đổi lỗi Sequelize thành mã HTTP phù hợp; còn lại trả 500
const handleError = (res, error, message) => {
    if (error.name === "SequelizeUniqueConstraintError") {
        const field =
            (error.errors && error.errors[0] && error.errors[0].path) ||
            Object.keys(error.fields || {})[0] ||
            "value";

        return res.status(409).json({
            message: `${field} already exists`,
            field,
        });
    }

    if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
            message: error.errors.map((item) => item.message).join(", "),
        });
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
        return res.status(400).json({
            message: "Related record not found",
        });
    }

    res.status(500).json({
        message,
        error: error.message,
    });
};

module.exports = handleError;
