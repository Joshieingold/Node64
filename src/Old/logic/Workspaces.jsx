export default class Workspace {
    constructor() {
        this.documents = new Map();
        this.activeId = null;
    }

    createDocument(id, doc) {
        this.documents.set(id, doc);
        this.activeId = id;
    }

    get active() {
        return this.documents.get(this.activeId);
    }

    setActive(id) {
        this.activeId = id;
    }
}
