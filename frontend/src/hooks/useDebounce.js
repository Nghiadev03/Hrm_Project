import { useEffect, useState } from "react";

// Trả về value sau khi người dùng ngừng gõ một khoảng delay
export function useDebounce(value, delay = 350) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
}
