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

    visit(nodeRef, 0, null);
    const positioned = new Map(nodes.map((n) => [n.node.id, n]));
    const edgePaths = edges.map((e) => ({
        ...e,
        from: positioned.get(e.from),
        to: positioned.get(e.to),
    }));
    const maxX = Math.max(...nodes.map((n) => n.x));
    const maxY = Math.max(...nodes.map((n) => n.y));
    return { nodes, edges: edgePaths, width: maxX + PAD_X * 2, height: maxY };
}

function ancestorChain(nodesById, id) {
    const chain = [];
    let cur = id;
    while (cur != null) {
        const entry = nodesById.get(cur);
        if (!entry) break;
        chain.push(cur);
        cur = entry.parentId;
    }
    return chain;
}

const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.5;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function RepertoireTree({ nodeRef, update }) {
    const { nodes, edges, width } = useMemo(() => layout(nodeRef), [nodeRef]);
    const nodesById = useMemo(
        () => new Map(nodes.map((n) => [n.node.id, n])),
        [nodes],
    );
    const [selectedNodeId, setSelectedNodeId] = useState(nodeData.id);
    const selected = nodesById.get(selectedNodeId)?.node ?? nodeData;

    // Positioning
    const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });

    // State
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);

    // Getters
    const getSelectedChain = useMemo(
        () => new Set(GetAncestorChain(nodesById, selectedNodeId)),
        [nodesById, selectedNodeId],
    );

    // Handlers
    const handleSelectNode = useCallback((id) => setSelectedNodeId(id), []);
    const zoomBy = useCallback((zoomFactor) => {
        setCurrentZoom((z) =>
            clamp(z * zoomFactor, MINIMUM_ZOOM, MAXIMUM_ZOOM),
        );
    }, []);
    const resetView = useCallback(() => {
        setCurrentZoom(DEFAULT_ZOOM);
        setPanPosition({ x: 0, y: 0 });
    }, []);
    const onWheelScroll = useCallback((e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        setCurrentZoom((z) =>
            clamp(z * zoomFactor, MINIMUM_ZOOM, MAXIMUM_ZOOM),
        );
    }, []);
    const onPointerDown = useCallback(
        (e) => {
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                panX: panPosition.x,
                panY: panPosition.y,
            };
            setIsDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
        },
        [panPosition],
    );
    const onPointerMove = useCallback((e) => {
        if (!dragRef.current) return;
        let dx = e.clientX - dragRef.current.startX;
        let dy = e.clientY - dragRef.current.startY;
        setPanPosition({
            x: dragRef.current.panX + dx,
            y: dragRef.current.panY + dy,
        });
    }, []);
    const onPointerUp = useCallback(() => {
        dragRef.current = null;
        setIsDragging(false);
    }, []);

    // RENDERING
    return (
        <div className="node-graph">
            <div className="control-container">
                <h3>Moves: {nodes.length}</h3>
                <div className="zoom-controls-container">
                    <div className="zoom-btn" onClick={() => zoomBy(1 / 1.25)}>
                        -
                    </div>
                    <div className="zoom-btn" onClick={resetView}>
                        {`${Math.round(currentZoom * 100)}%`}
                    </div>
                    <div className="zoom-btn" onClick={() => zoomBy(1.25)}>
                        +
                    </div>
                </div>
            </div>
            <div
                onWheel={onWheelScroll}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                className={`graph-content${isDragging ? " dragging" : ""}`}
            >
                <svg width="100%" height="100%">
                    <g
                        transform={`translate(${panPosition.x + 180}, ${panPosition.y + 20}) scale(${currentZoom})`}
                    >
                        <g
                            transform={`translate(${-width / 2 + PADDING_X}, 0)`}
                        >
                            {edges.map((obj, id) => {
                                const onPath =
                                    getSelectedChain.has(obj.from.node.id) &&
                                    getSelectedChain.has(obj.to.node.id);
                                const midY = (obj.from.y + obj.to.y) / 2;
                                return (
                                    <path
                                        key={id}
                                        d={`M ${obj.from.x} ${obj.from.y} C ${obj.from.x} ${midY}, ${obj.to.x} ${midY}, ${obj.to.x} ${obj.to.y}`}
                                        className={
                                            onPath ? "edge edge-active" : "edge"
                                        }
                                        strokeWidth={onPath ? 2.5 : 1.5}
                                    />
                                );
                            })}
                            {nodes.map(({ node, x, y }) => {
                                const isRoot = node.id === nodeData.id;
                                const isSelected = node.id === selectedNodeId;
                                const onPath = getSelectedChain.has(node.id);
                                const isBranch =
                                    node.children && node.children.length > 1;

                                const nodeClass = [
                                    "node",
                                    isRoot
                                        ? "root"
                                        : onPath
                                          ? "on-path"
                                          : isBranch
                                            ? "branch"
                                            : "default",
                                    isSelected ? "selected" : null,
                                ]
                                    .filter(Boolean)
                                    .join(" ");

                                return (
                                    <g
                                        className={nodeClass}
                                        key={node.id}
                                        transform={`translate(${x}, ${y})`}
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                        onClick={() =>
                                            handleSelectNode(node.id)
                                        }
                                    >
                                        <circle r={NODE_R} strokeWidth={2} />
                                        <text
                                            textAnchor="middle"
                                            dy="0.32em"
                                            fontSize={isRoot ? 9 : 11}
                                            fontWeight={isSelected ? 700 : 500}
                                        >
                                            {isRoot ? "Start" : getLabel(node)}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    </g>
                </svg>
            </div>
            <div className="node-details">
                <span>
                    {selectedNodeId === nodeData.id
                        ? "Starting Position"
                        : getLabel(selected)}
                </span>
                <span className="fen-span">{getFen(selected)}</span>
            </div>
        </div>
    );
}

// Visits all nodes and creates properly positioned data for them.
function GetNodeLayout(nodeData) {
    const COLUMN_WIDTH = 64; // Can Modify later
    const ROW_HEIGHT = 76; // Can Modify later
    let nodes = [];
    let edges = [];
    let leafCursor = 0; // x position of a node

    function visitNode(node, depth, parent) {
        let x;
        if (!node.children || node.children.length === 0) {
            x = leafCursor * COLUMN_WIDTH;
            leafCursor++;
        } else {
            let nextXs = node.children.map((curNode) =>
                visitNode(curNode, depth + 1, node),
            );
            x = (Math.min(...nextXs) + Math.max(...nextXs)) / 2;
        }
        let y = depth * ROW_HEIGHT;
        let newNode = {
            node,
            x,
            y,
            depth,
            parentId: parent ? parent.id : null,
        };
        nodes.push(newNode);
        if (parent) {
            let edge = {
                from: parent.id,
                to: node.id,
            };
            edges.push(edge);
        }
        return x;
    }

    visitNode(nodeData, 0, null);

    let positioned = new Map(nodes.map((n) => [n.node.id, n]));
    let edgePaths = edges.map((e) => ({
        ...e,
        from: positioned.get(e.from),
        to: positioned.get(e.to),
    }));

    const maxX = Math.max(...nodes.map((n) => n.x));
    const maxY = Math.max(...nodes.map((n) => n.y));

    return {
        nodes,
        edges: edgePaths,
        width: maxX + PADDING_X * 2,
        height: maxY,
    };
}

function GetAncestorChain(nodesById, id) {
    let chain = [];
    let current = id;
    while (current != null) {
        let entry = nodesById.get(current);
        if (!entry) break;
        chain.push(current);
        current = entry.parentId;
    }
    return chain;
}
