import { useState } from "react";
import ContextMenu from "../../../Old/ReusableComponents/ContextMenu";
import "./NotationPanel.css";
export default function NotationPanel({ tabDoc }) {
    const handleClick = (node) => {
        tabDoc.chessDocument.chessData.goToNode(node);
    };
    const [contextMenu, setContextMenu] = useState(null);

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };
    const closeContextMenu = () => {
        setContextMenu(null);
    };
    const handleMakeMainLine = (node) => {
        tabDoc.chessDocument.chessData.promoteVariation(node);
        update();
    };
    const handleDeleteBranch = (node) => {
        tabDoc.chessDocument.chessData.deleteVariation(node);
        update();
    };
    const rows = [];
    let node = tabDoc.chessDocument.chessData.root.children[0] || null;
    while (node) {
        const white = node;
        const black = node.children[0] || null;
        rows.push({ white, black });
        node = black ? black.children[0] || null : null;
    }
    return (
        <div className="notation-panel">
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
            {rows.map((row, index) => (
                <div key={row.white.id} className="notation-row-block">
                    <div className="notation-row">
                        <span className="notation-number">{index + 1}.</span>
                        <span
                            className={
                                tabDoc.chessDocument.chessData.currentNode ==
                                row.white
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
                                row.black &&
                                tabDoc.chessDocument.chessData.currentNode ===
                                    row.black
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
                                    data={tabDoc.chessDocument.chessData}
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
                                    data={tabDoc.chessDocument.chessData}
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
