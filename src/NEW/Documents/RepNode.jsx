export default class RepNode {
    constructor(fen, ucn, san = null) {
        this.id = crypto.randomUUID();
        this.fen = fen;
        this.prev = [];
        this.next = [];
        this.ucn = ucn;
        this.san = san;
    }
}
