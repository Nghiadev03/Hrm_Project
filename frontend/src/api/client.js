import axios from "axios";

const TOKEN_KEY = "hrm_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// AuthContext đăng ký hàm này để đăng xuất khi token hết hạn
let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
    onUnauthorized = handler;
};

client.interceptors.request.use((config) => {
    const token = getToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

client.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const status = error.response ? error.response.status : null;
        const isLogin = error.config && error.config.url.includes("/auth/login");

        if (status === 401 && !isLogin && getToken() && onUnauthorized) {
            onUnauthorized();
        }

        return Promise.reject(error);
    }
);

export default client;
