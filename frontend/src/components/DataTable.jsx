// Bảng dùng chung: tự hiển thị trạng thái đang tải, lỗi và rỗng.
// columns: [{ key, title, render?(row), className? }]
export default function DataTable({ columns, rows, loading, error, emptyText = "Chưa có dữ liệu" }) {
    let message = null;

    if (error) {
        message = <span className="table__message--error">{error}</span>;
    } else if (loading && rows.length === 0) {
        message = "Đang tải...";
    } else if (rows.length === 0) {
        message = emptyText;
    }

    return (
        <div className="table-wrapper">
            <table className={`table ${loading ? "table--loading" : ""}`}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} className={column.className}>
                                {column.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {message ? (
                        <tr>
                            <td colSpan={columns.length} className="table__message">
                                {message}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr key={row.id}>
                                {columns.map((column) => (
                                    <td key={column.key} className={column.className}>
                                        {column.render ? column.render(row) : row[column.key] ?? "—"}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
