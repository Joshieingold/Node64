import "./Board.css";
import { useState, useEffect } from "react";

export default function ChessBoard({ data, update }) {
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const key = event.key;

            const isMod = event.ctrlKey || event.metaKey;

            // Undo
            if (key.toLowerCase() === "z" && isMod) {
                event.preventDefault();
                data.undo();
                update();
                return;
            }

            // Flip board
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

    // ---------------------------
    // TRANSFORM (FLIP LOGIC)
    // ---------------------------
    function transform(x, y) {
        if (!flipped) return { x, y };
        return { x: 7 - x, y: 7 - y };
    }

    function squareToCoords(square) {
        const file = square[0];
        const rank = square[1];

        const x = "abcdefgh".indexOf(file);
        const y = 8 - parseInt(rank);

        return { x, y };
    }

    // ---------------------------
    // BOARD LAYER
    // ---------------------------
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

    // ---------------------------
    // HIGHLIGHTS
    // ---------------------------
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

    // ---------------------------
    // PIECES
    // ---------------------------
    function PieceLayer() {
        const board = data.game.board();

        const pieces = [];

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = board[y][x];
                if (!piece) continue;

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

    // ---------------------------
    // INPUT
    // ---------------------------
    function InputLayer() {
        const handleClick = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();

            let x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
            let y = Math.floor((e.clientY - rect.top) / (rect.height / 8));

            if (flipped) {
                x = 7 - x;
                y = 7 - y;
            }

            const square = "abcdefgh"[x] + (8 - y);

            data.handleSquareClick(square);
            update();
        };

        return <div className="input-layer" onClick={handleClick} />;
    }

    // ---------------------------
    // RENDER
    // ---------------------------
    return (
        <div className="board-container">
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

                <div className="chess-board">
                    <BoardLayer />
                    <HighlightLayer />
                    <PieceLayer />
                    <InputLayer />
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
