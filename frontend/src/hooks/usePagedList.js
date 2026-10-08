import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../utils/errors";

// Nạp một API danh sách có phân trang. Đổi bộ lọc thì tự quay về trang 1.
export function usePagedList(fetcher, filters = {}, limit = 10) {
    const filterKey = JSON.stringify(filters);
    const [page, setPage] = useState(1);
    const [activeFilterKey, setActiveFilterKey] = useState(filterKey);
    const [reloadKey, setReloadKey] = useState(0);
    const [state, setState] = useState({
        rows: [],
        pagination: null,
        loading: true,
        error: "",
    });

    if (activeFilterKey !== filterKey) {
        setActiveFilterKey(filterKey);
        setPage(1);
    }

    useEffect(() => {
        let cancelled = false;

        setState((current) => ({ ...current, loading: true, error: "" }));

        fetcher({ ...JSON.parse(filterKey), page, limit })
            .then((result) => {
                if (cancelled) {
                    return;
                }

                // Xoá hết dòng của trang cuối thì lùi về trang trước
                if (result.data.length === 0 && page > 1) {
                    setPage(page - 1);
                    return;
                }

                setState({
                    rows: result.data,
                    pagination: result.pagination,
                    loading: false,
                    error: "",
                });
            })
            .catch((error) => {
                if (!cancelled) {
                    setState({
                        rows: [],
                        pagination: null,
                        loading: false,
                        error: getErrorMessage(error),
                    });
                }
            });

        return () => {
            cancelled = true;
        };
        // fetcher là hàm cố định của api, không cần theo dõi
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey, page, limit, reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    return { ...state, page, setPage, reload };
}
