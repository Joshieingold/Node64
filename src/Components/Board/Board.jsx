import "./Board.css";
import { useState, useEffect, useRef } from "react";

export default function ChessBoard({ data, update }) {
    const [flipped, setFlipped] = useState(false);
    const [drag, setDrag] = useState(null);
    const boardRef = useRef(null);

    // Keyboard Interactions
    useEffect(() => {
        const handleKeyDown = (event) => {
            const key = event.key;
            const isMod = event.ctrlKey || event.metaKey;
            if (key.toLowerCase() === "z" && isMod) {
                event.preventDefault();
                data.undo();
                update();
                return;
            }
            if (key.toLowerCase() === "f") {
                setFlipped((f) => !f);
                update();
                return;
            }
            switch (key) {
                case "ArrowLeft":
                    data.previousMove();
                    update();
                    break;
                case "ArrowUp":
                    event.preventDefault();
                    data.cycleVariation(-1);
                    update();
                    break;
                case "ArrowDown":
                    event.preventDefault();
                    data.cycleVariation(1);
                    update();
                    break;
                case "ArrowRight":
                    data.nextMove();
                    update();
                    break;
                case "Home":
                    data.goToStart();
                    update();
                    break;
                case "End":
                    data.goToEnd();
                    update();
                    break;
                default:
                    break;
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [data]);

    // Handling Piece Dragging
    useEffect(() => {
        if (!drag) return;
        const handlePointerMove = (e) => {
            setDrag((d) => {
                if (!d) return d;
                const dx = e.clientX - d.startX;
                const dy = e.clientY - d.startY;
                const moved = d.moved || Math.hypot(dx, dy) > 4;
                return { ...d, x: e.clientX, y: e.clientY, moved };
            });
        };
        const handlePointerUp = (e) => {
            setDrag((currentDrag) => {
                if (!currentDrag) return currentDrag;

                const { rect } = currentDrag;
                let x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
                let y = Math.floor((e.clientY - rect.top) / (rect.height / 8));
                x = Math.max(0, Math.min(7, x));
                y = Math.max(0, Math.min(7, y));
                if (flipped) {
                    x = 7 - x;
                    y = 7 - y;
                }
                const targetSquare = "abcdefgh"[x] + (8 - y);
                queueMicrotask(() => {
                    if (currentDrag.isDraggablePiece && currentDrag.moved) {
                        data.movePiece(currentDrag.square, targetSquare);
                    } else if (!currentDrag.isDraggablePiece) {
                        data.handleSquareClick(targetSquare);
                    }
                    update();
                });

                return null;
            });
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
        return () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
        };
    }, [drag, flipped, data]);

    // Flipping Board
    function transform(x, y) {
        if (!flipped) return { x, y };
        return { x: 7 - x, y: 7 - y };
    }
    function squareToXY(square) {
        const x = "abcdefgh".indexOf(square[0]);
        const y = 8 - Number(square[1]);
        return { x, y };
    }

    // Draws Chess Board
    function BoardLayer() {
        const squares = [];
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const square = "abcdefgh"[x] + (8 - y);
                const t = transform(x, y);
                squares.push(
                    <div
                        key={square}
                        className={`square ${(x + y) % 2 === 0 ? "light" : "dark"}`}
                        style={{
                            left: `${t.x * 12.5}%`,
                            top: `${t.y * 12.5}%`,
                        }}
                    />,
                );
            }
        }
        return <div className="board-layer">{squares}</div>;
    }

    // Draws highlight layer
    function HighlightLayer() {
        const highlights = [];
        const checkedKing = data.getCheckedKingSquare();
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const square = "abcdefgh"[x] + (8 - y);
                const t = transform(x, y);
                if (data.isSelected(square)) {
                    highlights.push(
                        <div
                            key={`selected-${square}`}
                            className="selected-square"
                            style={{
                                left: `${t.x * 12.5}%`,
                                top: `${t.y * 12.5}%`,
                            }}
                        />,
                    );
                }
                if (data.isLegal(square)) {
                    const piece = data.getPiece(square);
                    highlights.push(
                        <div
                            key={`legal-${square}`}
                            className={piece ? "legal-capture" : "legal-move"}
                            style={{
                                left: `${t.x * 12.5}%`,
                                top: `${t.y * 12.5}%`,
                            }}
                        />,
                    );
                }
                if (square === checkedKing) {
                    highlights.push(
                        <div
                            key={`check-${square}`}
                            className="check-square"
                            style={{
                                left: `${t.x * 12.5}%`,
                                top: `${t.y * 12.5}%`,
                            }}
                        />,
                    );
                }
            }
        }
        return <div className="highlight-layer">{highlights}</div>;
    }

    // Draws Pieces
    function PieceLayer() {
        const board = data.game.board();
        const pieces = [];
        const hiding =
            drag && drag.isDraggablePiece && drag.moved
                ? squareToXY(drag.square)
                : null;

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = board[y][x];
                if (!piece) continue;
                if (hiding && hiding.x === x && hiding.y === y) continue;
                const t = transform(x, y);
                pieces.push(
                    <img
                        key={`${piece.color}${piece.type}-${x}-${y}`}
                        className="piece"
                        src={`/pieces/${piece.color}${piece.type}.svg`}
                        alt={`${piece.color}${piece.type}`}
                        draggable={false}
                        style={{
                            left: `${t.x * 12.5}%`,
                            top: `${t.y * 12.5}%`,
                        }}
                    />,
                );
            }
        }
        return <div className="piece-layer">{pieces}</div>;
    }

    // Draws Ghost Layer
    function DragGhostLayer() {
        if (!drag || !drag.isDraggablePiece || !drag.moved) return null;
        const { rect, piece, x, y } = drag;
        const squareSize = rect.width / 8;
        return (
            <img
                className="piece dragging-piece"
                src={`/pieces/${piece.color}${piece.type}.svg`}
                alt={`${piece.color}${piece.type}`}
                draggable={false}
                style={{
                    position: "absolute",
                    left: `${x - rect.left - squareSize / 2}px`,
                    top: `${y - rect.top - squareSize / 2}px`,
                    width: `${squareSize}px`,
                    height: `${squareSize}px`,
                    pointerEvents: "none",
                    zIndex: 1000,
                }}
            />
        );
    }

    // Draws Last Move Highlight
    function LastMoveLayer() {
        if (!data.lastMove) return null;
        const { from, to } = data.lastMove;
        const squares = [from, to];
        return (
            <div className="last-move-layer">
                {squares.map((square) => {
                    const { x, y } = squareToXY(square);
                    const t = transform(x, y);
                    return (
                        <div
                            key={`lastmove-${square}`}
                            className="last-move-square"
                            style={{
                                left: `${t.x * 12.5}%`,
                                top: `${t.y * 12.5}%`,
                            }}
                        />
                    );
                })}
            </div>
        );
    }

    // Captures piece inputs
    function InputLayer() {
        const handlePointerDown = (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            const rect = boardRef.current.getBoundingClientRect();
            let x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
            let y = Math.floor((e.clientY - rect.top) / (rect.height / 8));
            if (flipped) {
                x = 7 - x;
                y = 7 - y;
            }
            const square = "abcdefgh"[x] + (8 - y);
            const piece = data.getPiece(square);
            const isTurnPiece = piece && piece.color === data.game.turn();

            let isDraggablePiece = false;
            if (
                isTurnPiece &&
                (!data.selectedSquare || data.selectedSquare === square)
            ) {
                if (!data.selectedSquare) {
                    data.selectSquare(square);
                    update();
                }
                isDraggablePiece = true;
            }

            setDrag({
                square,
                piece: isDraggablePiece ? piece : null,
                isDraggablePiece,
                startX: e.clientX,
                startY: e.clientY,
                x: e.clientX,
                y: e.clientY,
                moved: false,
                rect,
            });
        };

        return (
            <div
                className="input-layer"
                onPointerDown={handlePointerDown}
                style={{ touchAction: "none" }}
            />
        );
    }

    return (
        <div
            className="board-container"
            style={{ userSelect: drag ? "none" : "auto" }}
        >
            <div className="rank-container">
                <div className={`ranks ${flipped ? "flipped-rank" : ""}`}>
                    <div className="rank">8</div>
                    <div className="rank">7</div>
                    <div className="rank">6</div>
                    <div className="rank">5</div>
                    <div className="rank">4</div>
                    <div className="rank">3</div>
                    <div className="rank">2</div>
                    <div className="rank">1</div>
                </div>
                <div className="chess-board" ref={boardRef}>
                    <BoardLayer />
                    <LastMoveLayer />
                    <HighlightLayer />
                    <PieceLayer />
                    <InputLayer />
                    <DragGhostLayer />
                </div>
            </div>
            <div className="file-container">
                <div className={`files ${flipped ? "flipped-file" : ""}`}>
                    <div className="file">A</div>
                    <div className="file">B</div>
                    <div className="file">C</div>
                    <div className="file">D</div>
                    <div className="file">E</div>
                    <div className="file">F</div>
                    <div className="file">G</div>
                    <div className="file">H</div>
                </div>
            </div>
        </div>
    );
}
