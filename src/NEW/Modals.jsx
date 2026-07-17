export class Tab {
    constructor() {
        this.id = crypto.randomUUID();
        this.title = "";
        this.tabData = null;
        this.tabType = null;
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
}
