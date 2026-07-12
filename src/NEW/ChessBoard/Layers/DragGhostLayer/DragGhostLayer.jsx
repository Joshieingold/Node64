import "./DragGhostLayer.css";
export default function DragGhostLayer({ drag }) {
    if (!drag || !drag.isDraggablePiece || !drag.moved) return null;
    const { rect, piece, x, y } = drag;
    const squareSize = rect.width / 8;
    return (
        <img
            className="piece dragging-piece"
            src={`/pieces/${piece.color}${piece.type}.svg`}
            alt={`${piece.color}${piece.type}`}
            draggable={false}
            style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: `${squareSize}px`,
                height: `${squareSize}px`,
                transform: `translate(${x - rect.left - squareSize / 2}px, ${y - rect.top - squareSize / 2}px)`,
                pointerEvents: "none",
                zIndex: 1000,
            }}
        />
    );
}
