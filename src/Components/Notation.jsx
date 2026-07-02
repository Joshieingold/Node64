import "./Notation.css";
export default function Notation({ data, version }) {
    const moves = data.game.history();

    const rows = [];

    for (let i = 0; i < moves.length; i += 2) {
        rows.push({
            moveNumber: i / 2 + 1,
            white: moves[i],
            black: moves[i + 1],
        });
    }

    return (
        <div className="notation">
            {rows.map((row) => (
                <div key={row.moveNumber} className="notation-row">
                    <span className="notation-number">{row.moveNumber}.</span>
                    <span className="notation-move">{row.white}</span>
                    <span className="notation-move">{row.black}</span>
                </div>
            ))}
        </div>
    );
}
