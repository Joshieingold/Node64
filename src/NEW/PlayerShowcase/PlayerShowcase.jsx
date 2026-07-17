import "./PlayerShowcase.css";
export default function PlayerShowcase({
    inWidth,
    name = "??",
    elo = "??",
    color,
}) {
    if (name == "") {
        name = "??";
    }
    if (elo == null || elo == "") {
        elo = "??";
    }
    return (
        <div className="player-showcase" style={{ width: `${inWidth}px` }}>
            <div className="top-showcase">
                <div className={`color-circle ${color}`}></div>
                <div className="name-text">{name}</div>
            </div>
            <div className="elo-text">{elo}</div>
        </div>
    );
}
