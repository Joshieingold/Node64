// NEEDS TO HANDLE GETTING THE PIECES LATER //
import "./PlayerShowcase.css";
export default function PlayerShowcase({ inWidth, docRef, color }) {
    let name = "";
    let elo = "";
    let title = "";
    const getTitle = (titleText) => {
        if (titleText == "None") return "";
        else if (titleText == "") return "";
        else if (titleText == null) return "";
        else return titleText;
    };
    if (color == "white") {
        name = docRef.chessDocument.pgnData.whiteName ?? "??";
        elo = docRef.chessDocument.pgnData.whiteElo ?? "??";
        title = getTitle(docRef.chessDocument.pgnData.whiteTitle);
    } else {
        name = docRef.chessDocument.pgnData.blackName ?? "??";
        elo = docRef.chessDocument.pgnData.blackElo ?? "??";
        title = getTitle(docRef.chessDocument.pgnData.blackTitle);
    }
    return (
        <div className="player-showcase" style={{ width: `${inWidth}px` }}>
            <div className="top-showcase">
                <div className={`title-text ${title == "" ? "hide" : ""}`}>
                    {title}
                </div>
                <div className="name-text">{name}</div>
            </div>
            <div className="elo-text">{elo}</div>
        </div>
    );
}
