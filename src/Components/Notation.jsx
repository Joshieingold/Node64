import "./Notation.css";
export default function Notation({ data, update }) {
    const moves = data.history;

    const rows = [];

    const rerender = () => {
        forceUpdate((v) => v + 1);
        update();
    };

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
                    <span
                        className={
                            data.currentMove === (row.moveNumber - 1) * 2
                                ? "notation-move active"
                                : "notation-move"
                        }
                        onClick={() => {
                            data.goToMove((row.moveNumber - 1) * 2);
                            version();
                            update();
                        }}
                    >
                        {row.white.san}
                    </span>
                    <span
                        className={
                            data.currentMove === (row.moveNumber - 1) * 2 + 1
                                ? "notation-move active"
                                : "notation-move"
                        }
                        onClick={() => {
                            data.goToMove((row.moveNumber - 1) * 2 + 1);
                            version();
                            update();
                        }}
                    >
                        {row.black?.san}
                    </span>
                </div>
            ))}
        </div>
    );
}
