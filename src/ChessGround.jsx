// components/Board/ChessgroundBoard.jsx
import { Chessground } from "chessground";
import { useEffect, useRef } from "react";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

export function ChessgroundBoard({
    fen,
    orientation = "white",
    turnColor,
    dests,
    onMove,
    shapes = [],
}) {
    const el = useRef(null);
    const cg = useRef(null);

    // create once
    useEffect(() => {
        cg.current = Chessground(el.current, {
            fen,
            orientation,
            turnColor,
            movable: {
                free: false,
                color: turnColor, // only current side's pieces are draggable
                dests, // Map<string, string[]> of legal moves
                events: { after: (orig, dest) => onMove(orig, dest) },
            },
            drawable: { enabled: true, autoShapes: shapes },
        });
        return () => cg.current.destroy();
    }, []); // only on mount

    // sync on every relevant prop change
    useEffect(() => {
        cg.current?.set({
            fen,
            orientation,
            turnColor,
            movable: { color: turnColor, dests },
            drawable: { autoShapes: shapes },
        });
    }, [fen, orientation, turnColor, dests, shapes]);

    return <div ref={el} style={{ width: 480, height: 480 }} />;
}
