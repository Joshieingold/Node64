import { useEffect, useRef } from "react";
import "./ContextMenu.css";

export default function ContextMenu({ x, y, items, onClose }) {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };
        // capture phase so it fires before other click handlers
        document.addEventListener("mousedown", handleClickOutside, true);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("scroll", onClose, true);
        window.addEventListener("resize", onClose);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside, true);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("scroll", onClose, true);
            window.removeEventListener("resize", onClose);
        };
    }, [onClose]);

    return (
        <div ref={menuRef} className="context-menu" style={{ top: y, left: x }}>
            {items.map((item, i) =>
                item.divider ? (
                    <div key={i} className="context-menu-divider" />
                ) : (
                    <div
                        key={i}
                        className={`context-menu-item${item.danger ? " danger" : ""}`}
                        onClick={() => {
                            item.onClick();
                            onClose();
                        }}
                    >
                        {item.label}
                    </div>
                ),
            )}
        </div>
    );
}
