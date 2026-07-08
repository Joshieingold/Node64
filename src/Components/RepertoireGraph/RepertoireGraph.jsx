import { useMemo } from "react";

export default function RepertoireViewer({ repertoire, chessDocument }) {
    const nodeRadius = 30;

    const verticalGap = 130;
    const horizontalGap = 150;

    const layout = useMemo(() => {
        const root = repertoire.nodeCollection.find(
            (node) => node.prev.length === 0,
        );

        const levels = [];
        const depthMap = new Map();

        function assignDepth(node, depth = 0) {
            if (depthMap.has(node.id) && depthMap.get(node.id) <= depth) {
                return;
            }

            depthMap.set(node.id, depth);

            if (!levels[depth]) {
                levels[depth] = [];
            }

            if (!levels[depth].includes(node)) {
                levels[depth].push(node);
            }

            for (const child of node.next) {
                assignDepth(child, depth + 1);
            }
        }

        assignDepth(root);

        const positions = new Map();

        levels.forEach((level, depth) => {
            level.forEach((node, index) => {
                positions.set(node.id, {
                    x: index * horizontalGap + 100,

                    y: depth * verticalGap + 80,
                });
            });
        });

        return {
            positions,

            width:
                Math.max(...levels.map((l) => l.length)) * horizontalGap + 200,

            height: levels.length * verticalGap + 200,
        };
    }, [repertoire]);

    function clickNode(node) {
        if (!node.sourceNode) return;

        chessDocument.goToNode(node.sourceNode);
    }

    return (
        <div
            style={{
                width: "100%",
                height: "800px",
                overflow: "auto",
                border: "1px solid gray",
            }}
        >
            <svg width={layout.width} height={layout.height}>
                {/* Connections */}

                {repertoire.nodeCollection.map((node) =>
                    node.next.map((child) => {
                        const a = layout.positions.get(node.id);

                        const b = layout.positions.get(child.id);

                        if (!a || !b) return null;

                        return (
                            <line
                                key={node.id + child.id}

                                x1={a.x}

                                y1={a.y + nodeRadius}

                                x2={b.x}

                                y2={b.y - nodeRadius}

                                stroke="black"
                            />
                        );
                    }),
                )}

                {/* Nodes */}

                {repertoire.nodeCollection.map((node) => {
                    const pos = layout.positions.get(node.id);

                    if (!pos) return null;

                    return (
                        <g
                            key={node.id}

                            onClick={() => clickNode(node)}

                            style={{
                                cursor: "pointer",
                            }}
                        >
                            <circle
                                cx={pos.x}

                                cy={pos.y}

                                r={nodeRadius}

                                fill="white"

                                stroke="black"
                            />

                            <text
                                x={pos.x}

                                y={pos.y + 5}

                                textAnchor="middle"

                                fontSize="14"
                            >
                                {node.san ?? "Start"}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
