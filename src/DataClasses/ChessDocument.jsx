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

        // STOCKFISH STUFF
        this.stockfishOn = null;
        this.analyzing = false;
        this.analysisTimeout = null;
        this.session = 0;
        this.onSessionChange = null;
    }

    // Notifies Components to update
    notify() {
        if (this.onChange) this.onChange();
    }

    rebuildBoard() {
        this.game = new Chess();

        for (let i = 0; i <= this.currentMove; i++) {
            this.game.move(this.history[i]);
        }

        this.clearSelection();
    }

    // Handles if a square is selected to try to move a piece there or select.
    handleSquareClick(square) {
        if (this.selectedSquare) {
            this.movePiece(this.selectedSquare, square);
        } else {
            this.selectSquare(square);
        }
    }

    // Finds a piece at a given square
    getPiece(square) {
        return this.game.get(square);
    }

    // Finds Legal Moves for a piece at a square.
    getLegalMoves(square) {
        return this.game.moves({ square, verbose: true });
    }

    // Sets a square to be the one that is trying to be moved.
    selectSquare(square) {
        const piece = this.getPiece(square);
        if (!piece) return;

        this.selectedSquare = square;
        this.legalMoves = this.getLegalMoves(square).map((m) => m.to);
        this.notify();
    }

    // Clears selection..
    clearSelection() {
        this.selectedSquare = null;
        this.legalMoves = [];
    }

    // Removes last move from history
    undo() {
        if (this.history.length === 0) return;

        this.history.pop();
        this.currentMove--;
        this.rebuildBoard();
        this.notify();
    }

    // Handles moving a piece
    movePiece(from, to) {
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

    ////////////////
    // UI Helpers //
    ////////////////

    // Tells UI the square of a checked king.
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

    isSelected(square) {
        return this.selectedSquare === square;
    }

    isLegal(square) {
        return this.legalMoves.includes(square);
    }

    ////////////////
    // Navigation //
    ////////////////

    // Brings the board to the index the board is referring to.
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

    // Brings board to start of the game.
    goToStart() {
        this.goToMove(-1);
    }

    // Brings board to end of the game.
    goToEnd() {
        this.goToMove(this.history.length - 1);
    }

    /////////////////////////
    // Backend Integration //
    /////////////////////////
    requestStockFish() {
        return {
            bestMove: "e4",
            evaluation: "+1",
        };
    }
}
