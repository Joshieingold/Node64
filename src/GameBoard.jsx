// components/Board/GameBoard.jsx
import { useState, useMemo, useCallback } from "react";
import { Chess } from "chess.js";
import { ChessgroundBoard } from "./ChessGround";

// chess.js -> chessground dest map
function computeDests(chess) {
    const dests = new Map();
    chess.moves({ verbose: true }).forEach((m) => {
        if (!dests.has(m.from)) dests.set(m.from, []);
        dests.get(m.from).push(m.to);
    });
    return dests;
}

export function GameBoard() {
    const [chess] = useState(() => new Chess());
    const [fen, setFen] = useState(chess.fen());
    const [orientation, setOrientation] = useState("white");

    const dests = useMemo(() => computeDests(chess), [fen]);
    const turnColor = chess.turn() === "w" ? "white" : "black";

    const handleMove = useCallback(
        (from, to) => {
            // handle promotion later — for now assume queen
            const move = chess.move({ from, to, promotion: "q" });
            if (move) setFen(chess.fen());
            // if move is null (shouldn't happen since dests already filtered legal moves)
        },
        [chess],
    );

    return (
        <ChessgroundBoard
            fen={fen}
            orientation={orientation}
            turnColor={turnColor}
            dests={dests}
            onMove={handleMove}
        />
    );
}
