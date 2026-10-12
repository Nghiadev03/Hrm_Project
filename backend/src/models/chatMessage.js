const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Một lượt hỏi đáp với chatbot tài liệu
const ChatMessage = sequelize.define(
    "ChatMessage",
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

        question: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        answer: {
            type: DataTypes.TEXT,
            allowNull: false,
        },

        // [{ document_id, title, page_number }]
        citations: {
            type: DataTypes.JSONB,
            allowNull: false,
            defaultValue: [],
        },

        model: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
    },
    {
        tableName: "chat_messages",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = ChatMessage;
