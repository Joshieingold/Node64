import { useReducer, useRef, useState, useCallback, useEffect } from "react";
import "./ChessBoard.css";

export default function ChessBoard({
    tabDocument,
    inWidth = 700,
    onFlip = null,
}) {
    const [, bump] = useReducer((c) => c + 1, 0);
    const notify = useCallback(() => bump(), []);
    const [dragInfo, setDragInfo] = useState(null);
    const [flipped, setFlipped] = useState(false);

    const boardDimensions = Math.max(inWidth - 45, 0);
    const squareDimensions = boardDimensions / 8;

    useEffect(() => {
        const handleKeyDown = (event) => {
            // Get Keys
            const key = event.key;
            const isMod = event.ctrlKey || event.metaKey;

            // Undo Move //
            if (key.toLowerCase() === "z" && isMod) {
                event.preventDefault();
                tabDocument.chessDocument.chessData.undo();
                return;
            }
            // Flip Board //
            if (key.toLowerCase() === "f") {
                setFlipped((f) => !f);
                if (onFlip) {
                    onFlip();
                }
                return;
            }
            switch (key) {
                // Go back a move //
                case "ArrowLeft":
                    tabDocument.chessDocument.chessData.previousMove();
                    break;
                // Go forward a move //
                case "ArrowRight":
                    tabDocument.chessDocument.chessData.nextMove();
                    break;
                // Cycle Variations //
                case "ArrowUp":
                    event.preventDefault();
                    tabDocument.chessDocument.chessData.cycleVariation(-1);
                    break;
                // Cycle Variations //
                case "ArrowDown":
                    event.preventDefault();
                    tabDocument.chessDocument.chessData.cycleVariation(1);
                    break;
                // Go to Move One //
                case "Home":
                    tabDocument.chessDocument.chessData.goToStart();
                    break;
                // Go to last Move //
                case "End":
                    tabDocument.chessDocument.chessData.goToEnd();
                    break;
                default:
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [tabDocument]);
    return (
        <div className="chess-board">
            <PieceLayer
                tabDocument={tabDocument}
                inWidth={inWidth}
                notify={notify}
                dragSquare={dragInfo?.square ?? null}
                setDragInfo={setDragInfo}
                flipped={flipped}
            />
            <BoardBackground
                inWidth={inWidth}
                legalMoves={tabDocument.chessDocument.legalMoves}
                selectedSquare={tabDocument.chessDocument.selectedSquare}
                lastMove={tabDocument.chessDocument.lastMove}
                checkedSquare={tabDocument.chessDocument.getCheckedKingSquare()}
                flipped={flipped}
            />
            <Frame inWidth={inWidth} isFlipped={flipped} />
            {dragInfo && (
                <DragGhost
                    piece={dragInfo.piece}
                    x={dragInfo.x}
                    y={dragInfo.y}
                    size={squareDimensions}
                />
            )}
        </div>
    );
}

function PieceLayer({
    tabDocument,
    inWidth,
    notify,
    dragSquare,
    setDragInfo,
    flipped,
}) {
    const chessDocument = tabDocument.chessDocument;
    const boardDimensions = Math.max(inWidth - 45, 0);
    const squareDimensions = boardDimensions / 8;
    const board = chessDocument.game.board();
    const boardRender = [];

    for (let sy = 0; sy < 8; sy++) {
        for (let sx = 0; sx < 8; sx++) {
            const { row, col } = screenToBoardIndex(sy, sx, flipped);
            const piece = board[row][col];
            const square = "abcdefgh"[col] + (8 - row);

            boardRender.push(
                <Square
                    key={square}
                    square={square}
                    piece={piece}
                    isDragging={square === dragSquare}
                    squareDimensions={squareDimensions}
                    tabDocument={tabDocument}
                    notify={notify}
                    setDragInfo={setDragInfo}
                    isLegal={chessDocument.legalMoves.includes(square)}
                />,
            );
        }
    }

    return (
        <div
            className="piece-layer"
            style={{
                width: `${boardDimensions}px`,
                height: `${boardDimensions}px`,
            }}
        >
            {boardRender}
        </div>
    );
}
function Square({
    square,
    piece,
    isDragging,
    squareDimensions,
    tabDocument,
    notify,
    setDragInfo,
    isLegal,
}) {
    const chessDocument = tabDocument.chessDocument;
    const pointerState = useRef(null);

    const resolveClick = () => {
        const selected = chessDocument.selectedSquare;
        if (selected === null) {
            if (piece) chessDocument.selectSquare(square);
        } else if (selected === square) {
            chessDocument.clearSelection();
        } else if (chessDocument.legalMoves.includes(square)) {
            tabDocument.tryMove(selected, square);
        } else if (piece) {
            chessDocument.clearSelection();
            chessDocument.selectSquare(square);
        } else {
            chessDocument.clearSelection();
        }
        notify();
    };

    const handlePointerDown = (e) => {
        if (!piece) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        pointerState.current = {
            startX: e.clientX,
            startY: e.clientY,
            dragging: false,
        };
    };

    const handlePointerMove = (e) => {
        const state = pointerState.current;
        if (!state) return;
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        if (!state.dragging && Math.hypot(dx, dy) > 4) {
            state.dragging = true;
            chessDocument.selectSquare(square); // shows legal-move highlights
        }
        if (state.dragging) {
            setDragInfo({ square, piece, x: e.clientX, y: e.clientY });
        }
    };

    const handlePointerUp = (e) => {
        const state = pointerState.current;
        pointerState.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);

        if (state && state.dragging) {
            setDragInfo(null);
            const dropEl = document.elementFromPoint(e.clientX, e.clientY);
            const dropSquare = dropEl
                ?.closest("[data-square]")
                ?.getAttribute("data-square");
            if (dropSquare && dropSquare !== square) {
                tabDocument.tryMove(square, dropSquare);
            } else {
                chessDocument.clearSelection();
            }
            notify();
        } else {
            resolveClick();
        }
    };

    const handlePointerCancel = () => {
        pointerState.current = null;
        setDragInfo(null);
        chessDocument.clearSelection();
        notify();
    };

    const handleEmptySquareClick = () => {
        resolveClick();
    };

    const classNames = [
        "grid-slot",
        piece ? "piece" : "empty",
        isLegal ? "legal-target" : "",
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div
            data-square={square}
            className={classNames}
            style={{
                width: `${squareDimensions}px`,
                height: `${squareDimensions}px`,
            }}
            onClick={piece ? undefined : handleEmptySquareClick}
        >
            {piece && (
                <img
                    className="piece-img"
                    src={`/pieces/${piece.color}${piece.type}.svg`}
                    draggable={false}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    style={{
                        width: "100%",
                        height: "100%",
                        opacity: isDragging ? 0 : 1,
                        touchAction: "none",
                    }}
                />
            )}
            {isLegal && piece && <div className="legal-capture-ring" />}
            {isLegal && !piece && <div className="legal-dot" />}
        </div>
    );
}

function DragGhost({ piece, x, y, size }) {
    return (
        <img
            className="piece-drag-ghost"
            src={`/pieces/${piece.color}${piece.type}.svg`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                transform: `translate(${x - size / 2}px, ${y - size / 2}px)`,
            }}
        />
    );
}

function BoardBackground({
    inWidth,
    legalMoves,
    selectedSquare,
    lastMove,
    checkedSquare,
    flipped,
}) {
    const boardDimensions = Math.max(inWidth - 45, 0);
    const squareDimensions = boardDimensions / 8;

    const squares = [];
    for (let sy = 0; sy < 8; sy++) {
        for (let sx = 0; sx < 8; sx++) {
            const { row, col } = screenToBoardIndex(sy, sx, flipped);
            const square = "abcdefgh"[col] + (8 - row);

            const isLastMove =
                lastMove &&
                (square === lastMove.from || square === lastMove.to);
            const classes = [
                "square",
                (col + row) % 2 === 0 ? "light" : "dark",
                legalMoves.includes(square) ? "legal-move" : "",
                isLastMove ? "last-move" : "",
                selectedSquare === square ? "selected-square" : "",
                checkedSquare === square ? "in-check" : "",
            ]
                .filter(Boolean)
                .join(" ");

            squares.push(
                <div
                    key={square}
                    data-square={square}
                    className={classes}
                    style={{
                        width: `${squareDimensions}px`,
                        height: `${squareDimensions}px`,
                    }}
                ></div>,
            );
        }
    }

    return (
        <div
            className="board-background"
            style={{
                width: `${boardDimensions}px`,
                height: `${boardDimensions}px`,
            }}
        >
            {squares}
        </div>
    );
}

function Frame({ inWidth, isFlipped }) {
    return (
        <div
            className="chess-frame"
            style={{ width: `${inWidth}px`, height: `${inWidth}px` }}
        >
            <div className="spacer outer-spacer" />
            <div className="inner-frame">
                <div
                    className={`spacer rank-container inner-spacer ${isFlipped ? "flip-rank" : ""}`}
                >
                    <div className="engraving">8</div>
                    <div className="engraving">7</div>
                    <div className="engraving">6</div>
                    <div className="engraving">5</div>
                    <div className="engraving">4</div>
                    <div className="engraving">3</div>
                    <div className="engraving">2</div>
                    <div className="engraving">1</div>
                </div>
                <div className="board"></div>
                <div className="spacer inner-spacer" />
            </div>
            <div
                className={`spacer file-container outer-spacer ${isFlipped ? "flip-file" : ""}`}
            >
                <div className="engraving">A</div>
                <div className="engraving">B</div>
                <div className="engraving">C</div>
                <div className="engraving">D</div>
                <div className="engraving">E</div>
                <div className="engraving">F</div>
                <div className="engraving">G</div>
                <div className="engraving">H</div>
            </div>
        </div>
    );
}
function screenToBoardIndex(sy, sx, flipped) {
    return flipped ? { row: 7 - sy, col: 7 - sx } : { row: sy, col: sx };
}
