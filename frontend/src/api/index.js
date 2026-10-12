import client from "./client";

// Bỏ các tham số rỗng để không gửi ?status=&search= lên server
const cleanParams = (params = {}) => {
    const result = {};

    for (const [key, value] of Object.entries(params)) {
        if (value !== "" && value !== null && value !== undefined) {
            result[key] = value;
        }
    }

    return result;
};

export const authApi = {
    login: (email, password) => client.post("/auth/login", { email, password }),
    me: () => client.get("/auth/me"),
    changePassword: (current_password, new_password) =>
        client.post("/auth/change-password", { current_password, new_password }),
    forgotPassword: (email) => client.post("/auth/forgot-password", { email }),
    resetPassword: (token, new_password) =>
        client.post("/auth/reset-password", { token, new_password }),
};

export const departmentApi = {
    list: (params) => client.get("/departments", { params: cleanParams(params) }),
    create: (data) => client.post("/departments", data),
    update: (id, data) => client.put(`/departments/${id}`, data),
    remove: (id) => client.delete(`/departments/${id}`),
};

export const employeeApi = {
    list: (params) => client.get("/employees", { params: cleanParams(params) }),
    create: (data) => client.post("/employees", data),
    update: (id, data) => client.put(`/employees/${id}`, data),
    remove: (id) => client.delete(`/employees/${id}`),
};

export const leaveRequestApi = {
    list: (params) => client.get("/leave-requests", { params: cleanParams(params) }),
    listMine: (params) => client.get("/leave-requests/me", { params: cleanParams(params) }),
    balance: (year) => client.get("/leave-requests/balance", { params: cleanParams({ year }) }),
    create: (data) => client.post("/leave-requests", data),
    cancel: (id) => client.delete(`/leave-requests/${id}`),
    approve: (id, admin_note) => client.patch(`/leave-requests/${id}/approve`, { admin_note }),
    reject: (id, admin_note) => client.patch(`/leave-requests/${id}/reject`, { admin_note }),
};

export const documentApi = {
    list: (params) => client.get("/documents", { params: cleanParams(params) }),
    // formData gồm: file, title
    upload: (formData) => client.post("/documents", formData),
    remove: (id) => client.delete(`/documents/${id}`),
};

export const chatApi = {
    ask: (question) => client.post("/chat", { question }),
    history: (params) => client.get("/chat/history", { params: cleanParams(params) }),
};

export const dashboardApi = {
    admin: () => client.get("/dashboard/admin"),
    me: () => client.get("/dashboard/me"),
};
