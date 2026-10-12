const sequelize = require("../config/database");
const Department = require("./department");
const Employee = require("./employee");
const LeaveRequest = require("./leaveRequest");
const Document = require("./document");
const ChatMessage = require("./chatMessage");

Department.hasMany(Employee, {
    foreignKey: "department_id",
    as: "employees",
});

Employee.belongsTo(Department, {
    foreignKey: "department_id",
    as: "department",
});

Employee.hasMany(LeaveRequest, {
    foreignKey: "employee_id",
    as: "leave_requests",
});

LeaveRequest.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

Document.belongsTo(Employee, {
    foreignKey: "uploaded_by",
    as: "uploader",
});

Employee.hasMany(ChatMessage, {
    foreignKey: "employee_id",
    as: "chat_messages",
});

ChatMessage.belongsTo(Employee, {
    foreignKey: "employee_id",
    as: "employee",
});

module.exports = {
    sequelize,
    Department,
    Employee,
    LeaveRequest,
    Document,
    ChatMessage,
};
