export default class ChessDocument {
    constructor() {
        this.pieces = new Map([
            ["e2", "wp"],
            ["e7", "bp"],
        ]);
    }

    getPiece(square) {
        return this.pieces.get(square);
    }
}
