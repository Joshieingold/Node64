export default class PgnDocument {
    constructor() {
        this.whiteName = "";
        this.whiteElo = null;
        this.whiteFideId = "";
        this.whiteNationalId = "";
        this.whiteTitle = "";
        this.blackName = "";
        this.blackElo = null;
        this.blackFideId = "";
        this.blackNationalId = "";
        this.blackTitle = "";
        this.timeControl = "";
        this.date = "";
        this.result = "";
        this.termination = "";
        this.site = "";
        this.event = "";
        this.round = "";
        this.board = "";
        this.annotator = "";
        this.gameId = "";
    }

    clone() {
        const copy = new PgnDocument();
        Object.assign(copy, this);
        return copy;
    }

    setHeaders(fields) {
        Object.assign(this, fields);
    }

    toPgn(moves = "") {
        const tag = (name, value) => `[${name} "${value ?? ""}"]`;
        const lines = [
            tag("Event", this.event || "?"),
            tag("Site", this.site || "?"),
            tag("Date", this.date || "????.??.??"),
            tag("Round", this.round || "?"),
            tag("White", this.whiteName || "?"),
            tag("Black", this.blackName || "?"),
            tag("Result", this.result || "*"),
            tag("WhiteElo", this.whiteElo ?? ""),
            tag("BlackElo", this.blackElo ?? ""),
            tag("WhiteTitle", this.whiteTitle),
            tag("BlackTitle", this.blackTitle),
            tag("WhiteFideId", this.whiteFideId),
            tag("BlackFideId", this.blackFideId),
            tag("WhiteNationalId", this.whiteNationalId),
            tag("BlackNationalId", this.blackNationalId),
            tag("TimeControl", this.timeControl),
            tag("Termination", this.termination),
            tag("Board", this.board),
            tag("Annotator", this.annotator),
            tag("GameId", this.gameId),
        ];
        const requiredCount = 7;
        const filtered = lines.filter((line, i) => {
            if (i < requiredCount) return true;
            return !line.endsWith('""]');
        });
        return `${filtered.join("\n")}\n\n${moves || "*"}\n`;
    }
}
