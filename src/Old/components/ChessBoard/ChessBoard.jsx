import { useState, useRef } from "react";
import Square from "./Square";
import Piece from "./Piece";
import ChessDocument from "../../documents/ChessDocument";
import "./board.css";

const doc = new ChessDocument();
const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

export default function ChessBoard() {
    const [, setTick] = useState(0);
    const rerender = () => setTick((t) => t + 1);

    const [drag, setDrag] = useState(null);

    // 🔥 track if movement actually happened
    const hasDragged = useRef(false);

    function startDrag(piece, from, x, y) {
        doc.selectSquare(from);
        setDrag({ piece, from, x, y });
        hasDragged.current = false;
    }

    function updateDrag(x, y) {
        if (!drag) return;

        hasDragged.current = true;

        setDrag((d) => ({ ...d, x, y }));
    }

    function endDrag(to) {
        if (!drag) return;

        doc.movePiece(drag.from, to);

        setDrag(null);
        rerender();
    }

    const squares = [];

    for (let rank = 8; rank >= 1; rank--) {
        for (let file = 0; file < 8; file++) {
            const square = files[file] + rank;

            squares.push(
                <Square
                    key={square}
                    square={square}
                    light={(rank + file) % 2 === 1}
                    document={doc}
                    rerender={rerender}
                    drag={drag}
                    hasDragged={hasDragged}
                    startDrag={startDrag}
                    updateDrag={updateDrag}
                    endDrag={endDrag}
                />,
            );
        }
    }

    return (
        <div
            className="board"
            onMouseMove={(e) => updateDrag(e.clientX, e.clientY)}
            onMouseUp={() => setDrag(null)}
        >
            {squares}

            {drag && (
                <div
                    className="drag-piece"
                    style={{ left: drag.x, top: drag.y }}
                >
                    <Piece piece={drag.piece} />
                </div>
            )}
        </div>
    );
}
