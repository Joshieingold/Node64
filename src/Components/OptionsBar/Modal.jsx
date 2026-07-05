import { useEffect, useRef } from "react";
import "./Modal.css";

export default function Modal({ open, onClose, title, children, footer }) {
    const contentRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const handleOverlayClick = (e) => {
        if (contentRef.current && !contentRef.current.contains(e.target)) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={handleOverlayClick}>
            <div className="modal-content" ref={contentRef}>
                <div className="modal-top">
                    <h3>{title}</h3>
                    <div className="modal-close" onClick={onClose}>
                        ×
                    </div>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}
