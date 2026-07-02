import "./Board.css";
import { useState } from "react";

export default function ChessBoard({ data, onChange }) {
    const [, forceUpdate] = useState(0);

    function BoardLayer() {
        const squares = [];

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const square = "abcdefgh"[x] + (8 - y);

                squares.push(
                    <div
                        key={square}
                        className={`square ${(x + y) % 2 === 0 ? "light" : "dark"}`}
                        style={{
                            left: `${x * 12.5}%`,
                            top: `${y * 12.5}%`,
                        }}
                    />,
                );
            }
        }

        return <div className="board-layer">{squares}</div>;
    }

    function HighlightLayer() {
        const highlights = [];

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const square = "abcdefgh"[x] + (8 - y);

                if (data.isSelected(square)) {
                    highlights.push(
                        <div
                            key={`selected-${square}`}
                            className="selected-square"
                            style={{
                                left: `${x * 12.5}%`,
                                top: `${y * 12.5}%`,
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
                                left: `${x * 12.5}%`,
                                top: `${y * 12.5}%`,
                            }}
                        />,
                    );
                }
            }
        }

        return <div className="highlight-layer">{highlights}</div>;
    }

    function PieceLayer() {
        const board = data.game.board();

        const pieces = [];

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = board[y][x];

                if (!piece) continue;

                pieces.push(
                    <Piece
                        key={`${piece.color}${piece.type}-${x}-${y}`}
                        piece={piece}
                        x={x}
                        y={y}
                    />,
                );
            }
        }

        return <div className="piece-layer">{pieces}</div>;
    }

    function Piece({ piece, x, y }) {
        return (
            <img
                className="piece"
                src={`/pieces/${piece.color}${piece.type}.svg`}
                alt={`${piece.color}${piece.type}`}
                draggable={false}
                style={{
                    left: `${x * 12.5}%`,
                    top: `${y * 12.5}%`,
                }}
            />
        );
    }

    function InputLayer() {
        const handleClick = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();

            const x = Math.floor((e.clientX - rect.left) / (rect.width / 8));

            const y = Math.floor((e.clientY - rect.top) / (rect.height / 8));

            const square = "abcdefgh"[x] + (8 - y);

            data.handleSquareClick(square);

            forceUpdate((v) => v + 1);
            onChange();
        };

        return <div className="input-layer" onClick={handleClick} />;
    }

    return (
        <div className="chess-board">
            <BoardLayer />
            <HighlightLayer />
            <PieceLayer />
            <InputLayer />
        </div>
    );
}
