import "./HighlightLayer.css";
import { transformXY } from "../LayerFunctions";
export default function HighlightLayer({ doc, flipped }) {
    const highlights = [];
    const checkedKing = doc.getCheckedKingSquare();
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const square = "abcdefgh"[x] + (8 - y);
            const t = transformXY(x, y, flipped);
            if (doc.isSelected(square)) {
                highlights.push(
                    <div
                        key={`selected-${square}`}
                        className="selected-square"
                        style={{
                            left: `${t.x * 12.5}%`,
                            top: `${t.y * 12.5}%`,
                        }}
                    />,
                );
            }
            if (doc.isLegal(square)) {
                const piece = doc.getPiece(square);
                highlights.push(
                    <div
                        key={`legal-${square}`}
                        className={piece ? "legal-capture" : "legal-move"}
                        style={{
                            left: `${t.x * 12.5}%`,
                            top: `${t.y * 12.5}%`,
                        }}
                    />,
                );
            }
            if (square === checkedKing) {
                highlights.push(
                    <div
                        key={`check-${square}`}
                        className="check-square"
                        style={{
                            left: `${t.x * 12.5}%`,
                            top: `${t.y * 12.5}%`,
                        }}
                    />,
                );
            }
        }
    }
    return <div className="highlight-layer">{highlights}</div>;
}
