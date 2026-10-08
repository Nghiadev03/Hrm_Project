import { useEffect } from "react";

export default function Modal({ title, onClose, children, footer, size = "md" }) {
    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [onClose]);

    return (
        <div className="modal-overlay" onMouseDown={onClose}>
            <div
                className={`modal modal--${size}`}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="modal__header">
                    <h2 className="modal__title">{title}</h2>
                    <button type="button" className="modal__close" onClick={onClose} aria-label="Đóng">
                        ×
                    </button>
                </div>
                <div className="modal__body">{children}</div>
                {footer && <div className="modal__footer">{footer}</div>}
            </div>
        </div>
    );
}
