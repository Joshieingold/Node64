import Piece from "./Piece";

export default function Square({
    square,
    light,
    document,
    rerender,
    drag,
    hasDragged,
    startDrag,
    endDrag,
}) {
    const piece = document.getPiece(square);

    const selected = document.isSelected(square);
    const legal = document.isLegal(square);

    const isDraggingFromHere = drag && drag.from === square;

    // =========================
    // CLICK (NOW WORKS AGAIN)
    // =========================
    function handleClick() {
        // 🔥 only block click if a real drag happened
        if (hasDragged.current) {
            hasDragged.current = false;
            return;
        }

        if (document.selectedSquare) {
            document.movePiece(document.selectedSquare, square);
        } else {
            document.selectSquare(square);
        }

        rerender();
    }

    function onMouseDown(e) {
        if (!piece) return;
        startDrag(piece, square, e.clientX, e.clientY);
    }

    function onMouseUp() {
        if (drag) {
            endDrag(square);
        }
    }

    return (
        <div
            className={`
                square
                ${light ? "light" : "dark"}
                ${selected ? "selected" : ""}
            `}
            onClick={handleClick}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
        >
            {legal && <div className="legal-dot" />}

            {piece && !isDraggingFromHere && (
                <div className="piece">
                    <Piece piece={piece} />
                </div>
            )}
        </div>
    );
}
