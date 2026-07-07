// To Be implemented..
export default class StockfishAgent {
    constructor(onChange) {
        this.onChange = onChange;

        this.stockfishOn = null;
        this.stockfish = null;

        // Offline | Loading | Ready | Thinking
        this.engineStatus = "Offline";
        this.engineInfo = {
            depth: 0,
            evaluation: "--",
            bestMove: "--",
            pv: [],
        };
    }
    notify() {
        if (this.onChange) {
            this.onChange();
        }
    }
}
