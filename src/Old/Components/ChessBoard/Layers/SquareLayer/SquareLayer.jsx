import { transformXY } from "../LayerFunctions";
import "./SquareLayer.css";
export default function SquareLayer({ flipped }) {
    const squares = [];
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const square = "abcdefgh"[x] + (8 - y);
            const t = transformXY(x, y, flipped);
            squares.push(
                <div
                    key={square}
                    className={`square ${(x + y) % 2 === 0 ? "light" : "dark"}`}
                    style={{
                        left: `${t.x * 12.5}%`,
                        top: `${t.y * 12.5}%`,
                    }}
                />,
            );
        }
    }
    return <div className="square-layer">{squares}</div>;
}
