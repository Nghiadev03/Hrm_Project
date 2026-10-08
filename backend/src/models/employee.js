const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const SECRET_FIELDS = ["password_hash", "reset_token_hash", "reset_token_expires_at"];

const Employee = sequelize.define(
    "Employee",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        department_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        employee_code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        password_hash: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        position: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        date_of_birth: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },

        hire_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },

        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "EMPLOYEE",
            validate: {
                isIn: [["ADMIN", "EMPLOYEE"]],
            },
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "ACTIVE",
            validate: {
                isIn: [["ACTIVE", "INACTIVE"]],
            },
        },

        // Số ngày phép năm được cấp
        annual_leave_days: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 12,
            validate: {
                isInt: true,
                min: 0,
            },
        },

        reset_token_hash: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        reset_token_expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "employees",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        defaultScope: {
            attributes: { exclude: SECRET_FIELDS },
        },
        scopes: {
            // chỉ dùng khi cần so khớp mật khẩu hoặc token đặt lại mật khẩu
            withPassword: {},
        },
    }
);

// Các trường bí mật không bao giờ được trả ra API, kể cả khi đã nạp bằng scope withPassword
Employee.prototype.toJSON = function () {
    const values = { ...this.get() };

    for (const field of SECRET_FIELDS) {
        delete values[field];
    }

    return values;
};

module.exports = Employee;
