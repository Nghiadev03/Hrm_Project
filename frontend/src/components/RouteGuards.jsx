import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homePath } from "../utils/format";

function FullPageLoading() {
    return <div className="page-loading">Đang tải...</div>;
}

// Chỉ cho người đã đăng nhập đúng vai trò; sai vai trò thì đưa về trang chủ của họ
export function ProtectedRoute({ role }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <FullPageLoading />;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    if (user.role !== role) {
        return <Navigate to={homePath(user)} replace />;
    }

    return <Outlet />;
}

// Trang đăng nhập / quên mật khẩu: đã đăng nhập rồi thì không vào nữa
export function GuestRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return <FullPageLoading />;
    }

    if (user) {
        return <Navigate to={homePath(user)} replace />;
    }

    return <Outlet />;
}

export function HomeRedirect() {
    const { user, loading } = useAuth();

    if (loading) {
        return <FullPageLoading />;
    }

    return <Navigate to={user ? homePath(user) : "/login"} replace />;
}
