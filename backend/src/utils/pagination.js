const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Đọc ?page=&limit= từ query string
const getPagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(
        Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1),
        MAX_LIMIT
    );

    return {
        page,
        limit,
        offset: (page - 1) * limit,
    };
};

// Dạng trả về chung của mọi API danh sách
const paginate = (rows, total, { page, limit }) => {
    return {
        data: rows,
        pagination: {
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit),
        },
    };
};

module.exports = {
    getPagination,
    paginate,
};
