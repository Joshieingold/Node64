import { useState, useMemo, useCallback, useRef, useEffect } from "react";
const getLabel = (node) => node.move?.san ?? node.id;
const getFen = (node) =>
    node.move?.after ?? node.move?.before ?? "(starting position)";

const COL_W = 64;
const ROW_H = 76;
const NODE_R = 18;
const PAD_X = 40;

function layout(nodeRef) {
    const nodes = [];
    const edges = [];
    let leafCursor = 0;

    function visit(node, depth, parent) {
        let x;
        if (!node.children || node.children.length === 0) {
            x = leafCursor * COL_W;
            leafCursor += 1;
        } else {
            const childXs = node.children.map((c) => visit(c, depth + 1, node));
            x = (Math.min(...childXs) + Math.max(...childXs)) / 2;
        }
        const y = depth * ROW_H;
        nodes.push({ node, x, y, depth, parentId: parent ? parent.id : null });
        if (parent) edges.push({ from: parent.id, to: node.id });
        return x;
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
    useEffect(() => {
        return () => {
            update();
        };
    });
    const [selectedId, setSelectedId] = useState(nodeRef.id);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const dragRef = useRef(null);

    const selectedChain = useMemo(
        () => new Set(ancestorChain(nodesById, selectedId)),
        [nodesById, selectedId],
    );
    const selected = nodesById.get(selectedId)?.node ?? nodeRef;

    const handleSelect = useCallback((id) => setSelectedId(id), []);

    const zoomBy = useCallback((factor) => {
        setZoom((z) => clamp(z * factor, MIN_ZOOM, MAX_ZOOM));
    }, []);

    const resetView = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    const onWheel = useCallback((e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
        setZoom((z) => clamp(z * factor, MIN_ZOOM, MAX_ZOOM));
    }, []);

    const onPointerDown = useCallback(
        (e) => {
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                panX: pan.x,
                panY: pan.y,
            };
            setDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
        },
        [pan],
    );

    const onPointerMove = useCallback((e) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
    }, []);

    const onPointerUp = useCallback(() => {
        dragRef.current = null;
        setDragging(false);
    }, []);

    return (
        <div>
            <div>
                <div>
                    <div style={{ fontSize: 17 }}>Repertoire tree</div>
                    <div>
                        {nodes.length} node{nodes.length === 1 ? "" : "s"}
                    </div>
                </div>
                <div>
                    <ZoomButton onClick={() => zoomBy(1 / 1.25)} label="−" />
                    <ZoomButton
                        onClick={resetView}
                        label={`${Math.round(zoom * 100)}%`}
                        wide
                    />
                    <ZoomButton onClick={() => zoomBy(1.25)} label="+" />
                </div>
            </div>

            <div
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
            >
                <svg width="100%" height="100%">
                    <g
                        transform={`translate(${pan.x + 180}, ${pan.y + 20}) scale(${zoom})`}
                    >
                        <g transform={`translate(${-width / 2 + PAD_X}, 0)`}>
                            {edges.map((e, i) => {
                                const onPath =
                                    selectedChain.has(e.from.node.id) &&
                                    selectedChain.has(e.to.node.id);
                                const midY = (e.from.y + e.to.y) / 2;
                                return (
                                    <path
                                        key={i}
                                        d={`M ${e.from.x} ${e.from.y} C ${e.from.x} ${midY}, ${e.to.x} ${midY}, ${e.to.x} ${e.to.y}`}
                                        fill="none"
                                        stroke={onPath ? "#c98a4b" : "#3c443b"}
                                        strokeWidth={onPath ? 2.5 : 1.5}
                                    />
                                );
                            })}

                            {nodes.map(({ node, x, y }) => {
                                const isRoot = node.id === nodeRef.id;
                                const isSelected = node.id === selectedId;
                                const onPath = selectedChain.has(node.id);
                                const isBranch =
                                    node.children && node.children.length > 1;
                                const fill = isRoot
                                    ? "#8a8672"
                                    : onPath
                                      ? "#c98a4b"
                                      : isBranch
                                        ? "#5c6b57"
                                        : "#3c443b";
                                return (
                                    <g
                                        key={node.id}
                                        transform={`translate(${x}, ${y})`}
                                        onPointerDown={(e) =>
                                            e.stopPropagation()
                                        }
                                        onClick={() => handleSelect(node.id)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <circle
                                            r={NODE_R}
                                            fill={fill}
                                            stroke={
                                                isSelected
                                                    ? "#e9e4d8"
                                                    : "transparent"
                                            }
                                            strokeWidth={2}
                                        />
                                        <text
                                            textAnchor="middle"
                                            dy="0.32em"
                                            fontSize={isRoot ? 9 : 11}
                                            fontFamily="ui-monospace, monospace"
                                            fill="#1f2420"
                                            fontWeight={isSelected ? 700 : 500}
                                        >
                                            {isRoot ? "start" : getLabel(node)}
                                        </text>
                                    </g>
                                );
                            })}
                        </g>
                    </g>
                </svg>
            </div>

            <div>
                <div>
                    <span>
                        {selected.id === nodeRef.id
                            ? "Starting position"
                            : getLabel(selected)}
                    </span>
                    <span>{selected.children?.length ?? 0} cont.</span>
                </div>
                <div>{getFen(selected)}</div>
            </div>
        </div>
    );
}

function ZoomButton({ onClick, label, wide }) {
    return <button onClick={onClick}>{label}</button>;
}
