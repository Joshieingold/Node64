import "./Notation.css";

function getPly(node) {
    let ply = 0;
    let n = node;
    while (n.parent) {
        ply++;
        n = n.parent;
    }
    return ply;
}

function VariationLine({ node, data, onMoveClick }) {
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
export default function Notation({ data, update }) {
    const handleClick = (node) => {
        data.goToNode(node);
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
                                />
                                )
                            </div>
                        ))}
                </div>
            ))}
        </div>
    );
}
