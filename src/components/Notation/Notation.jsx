import { useState } from "react";

const doc = window.__CHESS_DOC__; // optional fallback if needed

export default function Notation({ document }) {
    const moves = document.moves;

    const lines = [];

    for (let i = 0; i < moves.length; i += 2) {
        lines.push({
            moveNumber: i / 2 + 1,
            white: moves[i],
            black: moves[i + 1],
        });
    }

    return (
        <div className="notation">
            {lines.map((line, i) => (
                <div key={i} className="notation-line">
                    <div className="move-number">{line.moveNumber}.</div>
                    <div className="move">{line.white?.san}</div>
                    <div className="move">{line.black?.san}</div>
                </div>
            ))}
        </div>
    );
}
