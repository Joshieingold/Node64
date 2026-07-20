import "./PlayerShowcase.css";
export default function PlayerShowcase({ name = "??", elo = "??", color }) {
    if (name == "") {
        name = "??";
    }
    if (elo == null) {
        elo = "??";
    }
    return (
        <div className="player-showcase">
            <p className="name-text">{name}</p>
            <div className="bottom-showcase">
                <p>Elo: {elo}</p>
                <div className={`color-circle ${color}`}></div>
            </div>
        </div>
    );
}
