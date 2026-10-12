const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const documentRoutes = require("./routes/documentRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "HRM API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

// Đường dẫn không tồn tại
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
    });
});

// Lỗi chưa được controller bắt (ví dụ body JSON sai cú pháp)
app.use((error, req, res, next) => {
    const status = error.status || 500;

    res.status(status).json({
        message: status === 500 ? "Internal server error" : error.message,
    });
});

module.exports = app;
