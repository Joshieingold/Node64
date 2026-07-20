import {
    useRef,
    useMemo,
    useCallback,
    useState,
    useEffect,
    useSyncExternalStore,
} from "react";
import "./RepertoireGraph.css";
import ContextMenu from "../../ReusableComponents/ContextMenu";

const COLUMN_WIDTH = 64;
const PADDING_X = 40;
const getLabel = (node) => node.move?.san ?? node.id;
const getFen = (node) =>
    node.move?.after ?? node.move?.before ?? "(starting position)";

export default function RepertoireGraph({ data, updateRef }) {
    // Subscribe to document mutations so this component re-renders on every move.
    const version = useSyncExternalStore(
        useCallback((callback) => data.subscribe(callback), [data]),
        () => data.version,
    );
    // Handles the context menu
    const [contextMenu, setContextMenu] = useState(null);

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };
    const handleMakeMainLine = (node) => {
        data.chessData.promoteVariation(node);
        updateRef();
    };
    const handleDeleteBranch = (node) => {
        data.chessData.deleteVariation(node);
        updateRef();
    };
    const closeContextMenu = () => {
        setContextMenu(null);
    };

    // Constants
    const nodeData = data.root;
    const NODE_R = 18;
    const MINIMUM_ZOOM = 0.35;
    const MAXIMUM_ZOOM = 2.5;
    const DEFAULT_ZOOM = (MAXIMUM_ZOOM + MINIMUM_ZOOM) / 2;
    const clamp = (vertical, low, high) =>
        Math.min(high, Math.max(low, vertical));
    // Layout — recompute whenever the doc mutates.
    const { nodes, edges, width } = useMemo(
        () => GetNodeLayout(nodeData, updateRef),
        [nodeData, version],
    );
    const nodesById = useMemo(
        () => new Map(nodes.map((n) => [n.node.id, n])),
        [nodes],
    );
    const selectedNodeId = data.currentNode.id;
    const selected = nodesById.get(selectedNodeId)?.node ?? nodeData;
    // Positioning
    const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    // State
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);
    const containerRef = useRef(null);
    // Keep a live copy of zoom that centering can read without depending on it,
    // so changing zoom manually doesn't trigger a recenter.
    const zoomRef = useRef(currentZoom);
    zoomRef.current = currentZoom;
    // Getters
    const getSelectedChain = useMemo(
        () => new Set(GetAncestorChain(nodesById, selectedNodeId)),
        [nodesById, selectedNodeId],
    );
    // Center the camera on a node, given its layout coords and the current graph width.
    const centerOnNode = useCallback((nodeX, nodeY, layoutWidth) => {
        const container = containerRef.current;
        if (!container) return;
        const { clientWidth, clientHeight } = container;
        const zoom = zoomRef.current;
        // Mirrors the transforms applied in the SVG: outer translate(180,20) scale(zoom),
        // then inner translate(-width/2 + PADDING_X, 0).
        const localX = nodeX + (-layoutWidth / 2 + PADDING_X);
        const localY = nodeY;
        setPanPosition({
            x: clientWidth / 2 - 180 - zoom * localX,
            y: clientHeight / 2 - 20 - zoom * localY,
        });
    }, []);
    // Whenever the selected node (or the layout it lives in) changes, pan to center it.
    useEffect(() => {
        const entry = nodesById.get(selectedNodeId);
        if (entry) {
            centerOnNode(entry.x, entry.y, width);
        }
        // Intentionally not depending on centerOnNode/currentZoom — we only want
        // this to fire on selection or layout changes, not on manual zoom.
    }, [selectedNodeId, nodesById, width]);
    // Handlers
    const handleSelectNode = useCallback(
        (node) => {
            data.goToNode(node); // moves the board + triggers notify() for all subscribers
        },
        [data],
    );
    const zoomBy = useCallback((zoomFactor) => {
        setCurrentZoom((z) =>
            clamp(z * zoomFactor, MINIMUM_ZOOM, MAXIMUM_ZOOM),
        );
    }, []);
    const resetView = useCallback(() => {
        setCurrentZoom(DEFAULT_ZOOM);
        const entry = nodesById.get(selectedNodeId);
        if (entry) {
            centerOnNode(entry.x, entry.y, width);
        } else {
            setPanPosition({ x: 0, y: 0 });
        }
    }, [nodesById, selectedNodeId, width, centerOnNode]);
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
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={closeContextMenu}
                    items={[
                        {
                            label: "Delete from here",
                            onClick: () => handleDeleteBranch(contextMenu.item),
                        },
                        {
                            label: "Promote Variation",
                            onClick: () => handleMakeMainLine(contextMenu.item),
                        },
                    ]}
                />
            )}
            <div className="control-container">
                <h3>Moves: {nodes.length}</h3>
                <h3>Lines: {(width / COLUMN_WIDTH).toFixed(0)}</h3>
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
                ref={containerRef}
                onWheel={onWheelScroll}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                className={`graph-content${isDragging ? " dragging" : ""}`}
            >
                <svg width="100%" height="100%">
                    <g
                        style={{
                            transition: isDragging
                                ? "none"
                                : "transform 0.25s ease",
                        }}
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
                                const moveColor = node.move?.color; // "w" | "b" | undefined for root
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
                                    !isRoot && moveColor === "w"
                                        ? "white-move"
                                        : null,
                                    !isRoot && moveColor === "b"
                                        ? "black-move"
                                        : null,
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
                                        onContextMenu={(e) =>
                                            handleContextMenu(e, node)
                                        }
                                        onClick={() => handleSelectNode(node)}
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
    const ROW_HEIGHT = 76;
    let nodes = [];
    let edges = [];
    let leafCursor = 0;
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
