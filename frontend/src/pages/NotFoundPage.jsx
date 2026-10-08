import { Link } from "react-router-dom";
import AuthCard from "./auth/AuthCard";

export default function NotFoundPage() {
    return (
        <AuthCard title="Không tìm thấy trang" subtitle="Đường dẫn bạn mở không tồn tại.">
            <Link to="/" className="btn btn--primary btn--block">
                Về trang chủ
            </Link>
        </AuthCard>
    );
}
