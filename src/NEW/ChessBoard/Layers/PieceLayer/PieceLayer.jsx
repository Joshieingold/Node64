import "./PieceLayer.css";
import { transformXY, squareToXY } from "../LayerFunctions";
export default function PieceLayer({ doc, drag, flipped }) {
    const board = doc.game.board();
    const pieces = [];
    const hiding =
        drag && drag.isDraggablePiece && drag.moved
            ? squareToXY(drag.square)
            : null;

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const piece = board[y][x];
            if (!piece) continue;
            if (hiding && hiding.x === x && hiding.y === y) continue;
            const t = transformXY(x, y, flipped);
            pieces.push(
                <img
                    key={`${piece.color}${piece.type}-${x}-${y}`}
                    className="piece"
                    src={`/pieces/${piece.color}${piece.type}.svg`}
                    draggable={false}
                    style={{ left: `${t.x * 12.5}%`, top: `${t.y * 12.5}%` }}
                />,
            );
        }
    }
    return <div className="piece-layer">{pieces}</div>;
}
