import { Chess } from "chess.js";

export default class ChessDocument {
    constructor(onChange) {
        this.game = new Chess();
        this.onChange = onChange;

        this.selectedSquare = null;
        this.legalMoves = [];

        this.history = [];
        this.currentMove = -1;

        this.lastMove = null;
    }

    notify() {
        if (this.onChange) this.onChange();
    }

    // --------------------
    // GAME LOGIC
    // --------------------

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
        this.notify();
    }

    clearSelection() {
        this.selectedSquare = null;
        this.legalMoves = [];
    }

    movePiece(from, to) {
        // if we're in the middle of history, jump to end first
        if (this.currentMove !== this.history.length - 1) {
            this.goToEnd();
        }

        const piece = this.getPiece(from);
        if (!piece) return;

        const legal = this.getLegalMoves(from).map((m) => m.to);
        if (!legal.includes(to)) {
            this.clearSelection();
            this.notify();
            return;
        }

        const result = this.game.move({ from, to });
        if (!result) return;

        this.lastMove = result;
        this.history.push(result);
        this.currentMove++;

        this.clearSelection();
        this.notify();
    }

    // --------------------
    // CHECK
    // --------------------

    getCheckedKingSquare() {
        if (!this.game.inCheck()) return null;

        const board = this.game.board();
        const color = this.game.turn();

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const piece = board[y][x];

                if (piece && piece.type === "k" && piece.color === color) {
                    return "abcdefgh"[x] + (8 - y);
                }
            }
        }

        return null;
    }

    // --------------------
    // NAVIGATION
    // --------------------

    rebuildBoard() {
        this.game = new Chess();

        for (let i = 0; i <= this.currentMove; i++) {
            this.game.move(this.history[i]);
        }

        this.clearSelection();
    }

    goToMove(index) {
        if (index < -1) index = -1;
        if (index > this.history.length - 1) index = this.history.length - 1;

        this.currentMove = index;
        this.rebuildBoard();
        this.notify();
    }

    nextMove() {
        this.goToMove(this.currentMove + 1);
    }

    previousMove() {
        this.goToMove(this.currentMove - 1);
    }

    goToStart() {
        this.goToMove(-1);
    }

    goToEnd() {
        this.goToMove(this.history.length - 1);
    }

    // --------------------
    // UI HELPERS
    // --------------------

    isSelected(square) {
        return this.selectedSquare === square;
    }

    isLegal(square) {
        return this.legalMoves.includes(square);
    }
}
