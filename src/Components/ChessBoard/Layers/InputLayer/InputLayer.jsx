import "./InputLayer.css";
export default function InputLayer({ doc, flipped, boardRef, setDrag }) {
    const handlePointerDown = (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        const rect = boardRef.current.getBoundingClientRect();
        let x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
        let y = Math.floor((e.clientY - rect.top) / (rect.height / 8));
        if (flipped) {
            x = 7 - x;
            y = 7 - y;
        }
        const square = "abcdefgh"[x] + (8 - y);
        const piece = doc.getPiece(square);
        const isTurnPiece = piece && piece.color === doc.game.turn();

        let isDraggablePiece = false;
        if (
            isTurnPiece &&
            (!doc.selectedSquare || doc.selectedSquare === square)
        ) {
            if (!doc.selectedSquare) {
                doc.selectSquare(square);
            }
            isDraggablePiece = true;
        }

        setDrag({
            square,
            piece: isDraggablePiece ? piece : null,
            isDraggablePiece,
            startX: e.clientX,
            startY: e.clientY,
            x: e.clientX,
            y: e.clientY,
            moved: false,
            rect,
        });
    };

    return (
        <div
            className="input-layer"
            onPointerDown={handlePointerDown}
            style={{ touchAction: "none" }}
        />
    );
}
