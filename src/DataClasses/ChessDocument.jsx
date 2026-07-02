import { Chess } from "chess.js";

export default class ChessDocument {
    constructor() {
        this.game = new Chess();

        this.selectedSquare = null;
        this.legalMoves = [];

        this.lastMove = null;
        this.moves = [];
    }
    handleSquareClick(square) {
        if (this.selectedSquare) {
            this.movePiece(this.selectedSquare, square);
        } else {
            this.selectSquare(square);
        }
    }

    getPiece(square) {
        return this.game.get(square);
    }

    getLegalMoves(square) {
        return this.game.moves({ square, verbose: true });
    }

    selectSquare(square) {
        const piece = this.getPiece(square);
        if (!piece) return;

        this.selectedSquare = square;
        this.legalMoves = this.getLegalMoves(square).map((m) => m.to);
    }

    clearSelection() {
        this.selectedSquare = null;
        this.legalMoves = [];
    }

    movePiece(from, to) {
        const piece = this.getPiece(from);
        if (!piece) return;

        const legal = this.getLegalMoves(from).map((m) => m.to);
        if (!legal.includes(to)) {
            this.clearSelection();
            return;
        }

        const result = this.game.move({ from, to });

        if (result) {
            this.lastMove = result;
            this.moves.push(result);
        }

        this.clearSelection();
    }

    isSelected(square) {
        return this.selectedSquare === square;
    }

    isLegal(square) {
        return this.legalMoves.includes(square);
    }
}
