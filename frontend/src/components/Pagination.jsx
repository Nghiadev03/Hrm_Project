// Danh sách số trang hiển thị, dùng "..." khi có quá nhiều trang
const getPageItems = (page, totalPages) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) {
        items.push("left-gap");
    }

    for (let current = start; current <= end; current += 1) {
        items.push(current);
    }

    if (end < totalPages - 1) {
        items.push("right-gap");
    }

    items.push(totalPages);

    return items;
};

export default function Pagination({ pagination, onChange }) {
    if (!pagination || pagination.total === 0) {
        return null;
    }

    const { page, limit, total, total_pages: totalPages } = pagination;
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    return (
        <div className="pagination">
            <span className="pagination__info">
                Hiển thị {from}–{to} trong {total}
            </span>
            {totalPages > 1 && (
                <div className="pagination__pages">
                    <button
                        type="button"
                        className="pagination__btn"
                        onClick={() => onChange(page - 1)}
                        disabled={page <= 1}
                    >
                        Trước
                    </button>
                    {getPageItems(page, totalPages).map((item) =>
                        typeof item === "number" ? (
                            <button
                                key={item}
                                type="button"
                                className={`pagination__btn ${item === page ? "pagination__btn--active" : ""}`}
                                onClick={() => onChange(item)}
                                aria-current={item === page ? "page" : undefined}
                            >
                                {item}
                            </button>
                        ) : (
                            <span key={item} className="pagination__gap">
                                …
                            </span>
                        )
                    )}
                    <button
                        type="button"
                        className="pagination__btn"
                        onClick={() => onChange(page + 1)}
                        disabled={page >= totalPages}
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
}
