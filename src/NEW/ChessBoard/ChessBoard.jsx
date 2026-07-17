import { useReducer, useRef, useState, useCallback } from "react";
import "./ChessBoard.css";

export default function ChessBoard({ tabDocument, inWidth = 700 }) {
    const [, bump] = useReducer((c) => c + 1, 0);
    const notify = useCallback(() => bump(), []);
    const [dragInfo, setDragInfo] = useState(null);

    const boardDimensions = Math.max(inWidth - 45, 0);
    const squareDimensions = boardDimensions / 8;

    return (
        <div className="chess-board">
            <PieceLayer
                tabDocument={tabDocument}
                inWidth={inWidth}
                notify={notify}
                dragSquare={dragInfo?.square ?? null}
                setDragInfo={setDragInfo}
            />
            <BoardBackground
                inWidth={inWidth}
                legalMoves={tabDocument.chessDocument.legalMoves}
                selectedSquare={tabDocument.chessDocument.selectedSquare}
                lastMove={tabDocument.chessDocument.lastMove}
            />
            <Frame inWidth={inWidth} />
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

function PieceLayer({ tabDocument, inWidth, notify, dragSquare, setDragInfo }) {
    const chessDocument = tabDocument.chessDocument;
    const boardDimensions = Math.max(inWidth - 45, 0);
    const squareDimensions = boardDimensions / 8;
    const board = chessDocument.game.board();
    const boardRender = [];

    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const piece = board[y][x];
            const square = "abcdefgh"[x] + (8 - y);
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

function BoardBackground({ inWidth, legalMoves, selectedSquare, lastMove }) {
    const boardDimensions = Math.max(inWidth - 45, 0);
    const squareDimensions = boardDimensions / 8;

    const squares = [];
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const square = "abcdefgh"[x] + (8 - y);
            const isLastMove =
                lastMove &&
                (square === lastMove.from || square === lastMove.to);
            const classes = [
                "square",
                (x + y) % 2 === 0 ? "light" : "dark",
                legalMoves.includes(square) ? "legal-move" : "",
                selectedSquare === square ? "selected-square" : "",
                isLastMove ? "last-move" : "",
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

function Frame({ inWidth }) {
    return (
        <div
            className="chess-frame"
            style={{ width: `${inWidth}px`, height: `${inWidth}px` }}
        >
            <div className="spacer outer-spacer" />
            <div className="inner-frame">
                <div className="spacer rank-container inner-spacer">
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
            <div className="spacer file-container outer-spacer">
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
