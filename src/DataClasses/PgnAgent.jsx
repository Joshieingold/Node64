import PgnHead from "./PgnHead";

// To Be implemented..
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
