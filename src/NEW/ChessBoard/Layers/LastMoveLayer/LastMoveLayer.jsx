import { squareToXY, transformXY } from "../LayerFunctions";
import "./LastMoveLayer.css";
export default function LastMoveLayer({ doc, flipped }) {
    if (!doc.lastMove) return null;
    const { from, to } = doc.lastMove;
    const squares = [from, to];
    return (
        <div className="last-move-layer">
            {squares.map((square) => {
                const { x, y } = squareToXY(square);
                const t = transformXY(x, y, flipped);
                return (
                    <div
                        key={`lastmove-${square}`}
                        className="last-move-square"
                        style={{
                            left: `${t.x * 12.5}%`,
                            top: `${t.y * 12.5}%`,
                        }}
                    />
                );
            })}
        </div>
    );
}
