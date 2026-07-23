import AnalysisDocument from "./AnalysisDocument";
import DatabaseDocument from "./DatabaseDocument";

export class Tab {
    constructor() {
        this.id = crypto.randomUUID();
        this.title = "";
        this.tabData = null;
        this.tabType = null;
        this.chessDocument = new AnalysisDocument();
        this.databaseRef = new DatabaseDocument();
        this.setDatabaseReference();
    }

    setDatabaseReference() {
        // bind so `this` inside notify() still refers to chessDocument
        this.databaseRef.setChanger(
            this.chessDocument.notify.bind(this.chessDocument),
        );
    }

    async __initDatabase() {
        if (this.databaseRef.currentDatabase) return; // already open

        if (!this.databaseRef.databasesDir) {
            await this.databaseRef.init(); // resolves dir + refreshes list
        } else {
            await this.databaseRef.refreshDatabaseList();
        }

        if (this.databaseRef.currentDatabase) return; // init() found one already open
        if (this.databaseRef.databases.length === 0) {
            console.log("No databases found to open");
            return;
        }
        await this.databaseRef.openDatabase(this.databaseRef.databases[0].name);
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

    async requestOpeningExplorer() {
        await this.__initDatabase();
        if (!this.databaseRef.currentDatabase) return; // still nothing to query
        await this.databaseRef.loadExplorer(
            this.chessDocument.chessData.getMoveSequence(),
        );
    }

    tryMove(from, to) {
        const moved = this.chessDocument.movePiece(from, to);
        if (this.databaseRef == null) {
            console.log("No Database found");
            return;
        }
        this.requestOpeningExplorer();
    }
}
