import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../utils/errors";

// Nạp một API trả về một đối tượng (không phân trang)
export function useFetch(fetcher) {
    const [reloadKey, setReloadKey] = useState(0);
    const [state, setState] = useState({ data: null, loading: true, error: "" });

    useEffect(() => {
        let cancelled = false;

        fetcher()
            .then((data) => {
                if (!cancelled) {
                    setState({ data, loading: false, error: "" });
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    setState({ data: null, loading: false, error: getErrorMessage(error) });
                }
            });

        return () => {
            cancelled = true;
        };
        // fetcher là hàm cố định của api, không cần theo dõi
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reloadKey]);

    const reload = useCallback(() => setReloadKey((key) => key + 1), []);

    return { ...state, reload };
}
