import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api";
import { clearToken, getToken, setToken, setUnauthorizedHandler } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // loading = đang kiểm tra token còn lưu trong trình duyệt
    const [loading, setLoading] = useState(Boolean(getToken()));

    const logout = useCallback(() => {
        clearToken();
        setUser(null);
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(logout);

        if (!getToken()) {
            return;
        }

        authApi
            .me()
            .then(setUser)
            .catch(() => clearToken())
            .finally(() => setLoading(false));
    }, [logout]);

    const login = useCallback(async (email, password) => {
        const result = await authApi.login(email, password);

        setToken(result.token);
        setUser(result.user);

        return result.user;
    }, []);

    const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
