const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Tài liệu admin tải lên kho File Search của Gemini
const Document = sequelize.define(
    "Document",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },

        original_filename: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },

        mime_type: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },

        size_bytes: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        gemini_operation_name: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        gemini_document_name: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: "PROCESSING",
            validate: {
                isIn: [["PROCESSING", "READY", "FAILED"]],
            },
        },

        error_message: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        uploaded_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    },
    {
        tableName: "documents",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = Document;
