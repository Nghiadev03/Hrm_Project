const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const { LEAVE_TYPES, countWorkingDays } = require("../utils/leaveDays");

const LeaveRequest = sequelize.define(
    "LeaveRequest",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        employee_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        leave_type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [LEAVE_TYPES],
            },
        },

        start_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        end_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },

        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "PENDING",
            validate: {
                isIn: [["PENDING", "APPROVED", "REJECTED"]],
            },
        },

        admin_note: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        // Số ngày làm việc của đơn, tính từ start_date và end_date (không lưu trong DB)
        days: {
            type: DataTypes.VIRTUAL,
            get() {
                if (!this.start_date || !this.end_date) {
                    return null;
                }

                return countWorkingDays(this.start_date, this.end_date);
            },
        },
    },
    {
        tableName: "leave_requests",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = LeaveRequest;
