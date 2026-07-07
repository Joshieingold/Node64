import PgnHead from "./PgnHead";

export default class PgnAgent {
    constructor(onChange) {
        this.onChange = onChange;

        this.head = new PgnHead();
        this.fileLocation = "";
        this.fileName = "";
    }
    notify() {
        if (this.onChange) {
            this.onChange();
        }
    }
}
