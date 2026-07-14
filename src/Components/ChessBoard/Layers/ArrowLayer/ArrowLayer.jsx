import "./ArrowLayer.css";

const VB = 800;
const SQUARE = VB / 8;

const ARROW_COLOR_MAP = {
    G: "#15c15b",
    R: "#e6412b",
    B: "#2482e6",
    Y: "#e6c62b",
};

function squareToXY(square, flipped) {
    const file = square.charCodeAt(0) - "a".charCodeAt(0); // 0-7 (a-h)
    const rank = 8 - Number(square[1]); // 0-7, 0 = rank 8 (top row)
    const col = flipped ? 7 - file : file;
    const row = flipped ? 7 - rank : rank;
    return { x: col * SQUARE + SQUARE / 2, y: row * SQUARE + SQUARE / 2 };
}

export default function ArrowLayer({ doc, flipped, previewArrow = null }) {
    const node = doc.chessData.currentNode;
    const arrows = node?.arrows || [];
    const allArrows = previewArrow ? [...arrows, previewArrow] : arrows;
    if (allArrows.length === 0) return null;

    return (
        <svg
            className="arrow-layer"
            viewBox={`0 0 ${VB} ${VB}`}
            preserveAspectRatio="none"
        >
            <defs>
                {Object.entries(ARROW_COLOR_MAP).map(([code, color]) => (
                    <marker
                        key={code}
                        id={`arrowhead-${code}`}
                        viewBox="3 0 10 10"
                        refX="7"
                        refY="5"
                        markerWidth="6"
                        markerHeight="8"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
                    </marker>
                ))}
            </defs>
            {allArrows.map((arrow, i) => {
                if (arrow.from === arrow.to) return null;
                const from = squareToXY(arrow.from, flipped);
                const to = squareToXY(arrow.to, flipped);
                const color = ARROW_COLOR_MAP[arrow.color] || ARROW_COLOR_MAP.G;

                // Shorten the line so the arrowhead doesn't disappear
                // underneath the destination piece.
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const len = Math.hypot(dx, dy) || 1;
                const shrink = SQUARE * 0.34;
                const endX = to.x - (dx / len) * shrink;
                const endY = to.y - (dy / len) * shrink;

                return (
                    <line
                        key={`${arrow.from}-${arrow.to}-${i}`}
                        x1={from.x}
                        y1={from.y}
                        x2={endX}
                        y2={endY}
                        stroke={color}
                        strokeWidth={SQUARE * 0.16}
                        strokeLinecap="round"
                        opacity={arrow === previewArrow ? 0.5 : 0.85}
                        markerEnd={`url(#arrowhead-${arrow.color || "G"})`}
                    />
                );
            })}
        </svg>
    );
}
