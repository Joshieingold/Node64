import AnalysisDocument from "../Documents/AnalysisDocument";

export class Tab {
    constructor() {
        this.id = crypto.randomUUID();
        this.title = "";
        this.tabData = null;
        this.tabType = null;
        this.databaseRef = null;
        this.chessDocument = new AnalysisDocument();
    }
    createDefault(type) {
        this.title = `New ${type}`;
        this.tabType = type;
        switch (type) {
            case "Analysis":
                this.tabData = null; // to be implemented.
                break;
            case "Repertoire":
                this.tabData = null; // to be implemented.
                break;
            default:
                this.tabData = null; // to be implemented.
                console.log("Default Case: Creating null tab");
                break;
        }
    }
    requestOpeningExplorer() {
        return;
    }
    tryMove(from, to) {
        if (this.chessDocument.movePiece(from, to)) {
            console.log("doo I need update");
        }
        if (this.databaseRef == null) {
            console.log("No Database found");
            return;
        }
        this.requestOpeningExplorer();
        console.log("Asking opening explorer");
    }
}
