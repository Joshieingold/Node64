export default class SelectionManager {
    constructor() {
        this.selectedSquare = null;
        this.legalMoves = [];
    }

    clear() {
        this.selectedSquare = null;
        this.legalMoves = [];
    }

    select(square, legalMoves) {
        this.selectedSquare = square;
        this.legalMoves = legalMoves;
    }

    isSelected(square) {
        return this.selectedSquare === square;
    }

    isLegal(square) {
        return this.legalMoves.includes(square);
    }
}
