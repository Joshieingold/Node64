import "./Notation.css";
import ContextMenu from "../../ReusableComponents/ContextMenu";
import { useState } from "react";
export default function Notation({ data, update }) {
    const handleClick = (node) => {
        data.goToNode(node);
        update();
    };
    const [contextMenu, setContextMenu] = useState(null);
    const [targetNode, setTargetNode] = useState(null);

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };
    const closeContextMenu = () => {
        setContextMenu(null);
    };
    const handleMakeMainLine = (node) => {
        // Request to make data main line.
        console.log("I want to make", node, "the main line!");
        update();
    };
    const handleDeleteBranch = (node) => {
        console.log("I want to delete", node);
        // request to delete branch in data.
        update();
    };

    const rows = [];
    let node = data.root.children[0] || null;
    while (node) {
        const white = node;
        const black = node.children[0] || null;
        rows.push({ white, black });
        node = black ? black.children[0] || null : null;
    }

    return (
        <div className="notation">
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
                            label: "Make main line",
                            onClick: () => handleMakeMainLine(contextMenu.item),
                        },
                    ]}
                />
            )}
            {rows.map((row, idx) => (
                <div key={row.white.id} className="notation-row-block">
                    <div className="notation-row">
                        <span className="notation-number">{idx + 1}.</span>
                        <span
                            className={
                                data.currentNode === row.white
                                    ? "notation-move active"
                                    : "notation-move"
                            }
                            onClick={() => handleClick(row.white)}
                            onContextMenu={(e) =>
                                handleContextMenu(e, row.white)
                            }
                        >
                            {row.white.move.san}
                        </span>
                        <span
                            className={
                                row.black && data.currentNode === row.black
                                    ? "notation-move active"
                                    : "notation-move"
                            }
                            onClick={() => row.black && handleClick(row.black)}
                            onContextMenu={(e) =>
                                handleContextMenu(e, row.black)
                            }
                        >
                            {row.black?.move.san}
                        </span>
                    </div>

                    {row.white.children.length > 1 &&
                        row.white.children.slice(1).map((v) => (
                            <div
                                key={`var-${v.id}`}
                                className="notation-variation"
                            >
                                (
                                <VariationLine
                                    node={v}
                                    data={data}
                                    onContextMenu={handleContextMenu}
                                    onMoveClick={handleClick}
                                />
                                )
                            </div>
                        ))}

                    {row.black &&
                        row.black.children.length > 1 &&
                        row.black.children.slice(1).map((v) => (
                            <div
                                key={`var-${v.id}`}
                                className="notation-variation"
                            >
                                (
                                <VariationLine
                                    node={v}
                                    data={data}
                                    onMoveClick={handleClick}
                                    onContextMenu={handleContextMenu}
                                />
                                )
                            </div>
                        ))}
                </div>
            ))}
        </div>
    );
}

function VariationLine({ node, data, onMoveClick, onContextMenu }) {
    const elements = [];
    let current = node;
    let first = true;

    while (current) {
        const thisNode = current;
        const ply = getPly(thisNode);
        const moveNumber = Math.ceil(ply / 2);
        const isWhite = ply % 2 === 1;
        const showNumber = isWhite || first;
        const isActive = data.currentNode === thisNode;

        elements.push(
            <span key={thisNode.id}>
                {showNumber && (
                    <span className="notation-var-number">
                        {moveNumber}
                        {isWhite ? "." : "..."}{" "}
                    </span>
                )}
                <span
                    className={
                        isActive
                            ? "notation-var-move active"
                            : "notation-var-move"
                    }
                    onClick={() => onMoveClick(thisNode)}
                    onContextMenu={(e) => onContextMenu(e, thisNode)}
                >
                    {thisNode.move.san}{" "}
                </span>
            </span>,
        );

        if (thisNode.children.length > 1) {
            for (let i = 1; i < thisNode.children.length; i++) {
                elements.push(
                    <div
                        key={`var-${thisNode.children[i].id}`}
                        className="notation-variation nested"
                    >
                        (
                        <VariationLine
                            node={thisNode.children[i]}
                            data={data}
                            onMoveClick={onMoveClick}
                            onContextMenu={onContextMenu}
                        />
                        )
                    </div>,
                );
            }
        }

        current = thisNode.children[0] || null;
        first = false;
    }

    return <>{elements}</>;
}

function getPly(node) {
    let ply = 0;
    let n = node;
    while (n.parent) {
        ply++;
        n = n.parent;
    }
    return ply;
}
