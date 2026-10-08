import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { GuestRoute, HomeRedirect, ProtectedRoute } from "./components/RouteGuards";
import NotFoundPage from "./pages/NotFoundPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import DepartmentsPage from "./pages/admin/DepartmentsPage";
import EmployeesPage from "./pages/admin/EmployeesPage";
import LeaveRequestsPage from "./pages/admin/LeaveRequestsPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import EmployeeDashboardPage from "./pages/employee/EmployeeDashboardPage";
import MyLeaveRequestsPage from "./pages/employee/MyLeaveRequestsPage";

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<HomeRedirect />} />

            <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute role="ADMIN" />}>
                <Route path="/admin" element={<Layout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="departments" element={<DepartmentsPage />} />
                    <Route path="employees" element={<EmployeesPage />} />
                    <Route path="leave-requests" element={<LeaveRequestsPage />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute role="EMPLOYEE" />}>
                <Route path="/employee" element={<Layout />}>
                    <Route index element={<EmployeeDashboardPage />} />
                    <Route path="leave-requests" element={<MyLeaveRequestsPage />} />
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
