import { Chess } from "chess.js";
import Observable from "../logic/Observable";
import SelectionManager from "../logic/SelectionManager";

export default class ChessDocument extends Observable {
    constructor() {
        super();

        this.game = new Chess();

        this.selection = new SelectionManager();

        this.lastMove = null;
    }

    // =========================
    // GETTERS
    // =========================

    get fen() {
        return this.game.fen();
    }

    get turn() {
        return this.game.turn();
    }

    get history() {
        return this.game.history();
    }

    board() {
        return this.game.board();
    }

    getPiece(square) {
        return this.game.get(square);
    }

    getLegalMoves(square) {
        return this.game.moves({
            square,
            verbose: true,
        });
    }

    // =========================
    // MOVES
    // =========================

    move(move) {
        const result = this.game.move(move);

        if (result) {
            this.lastMove = result;

            this.notify();
        }

        return result;
    }

    undo() {
        const result = this.game.undo();

        this.selection.clear();

        this.notify();

        return result;
    }

    reset() {
        this.game.reset();

        this.selection.clear();

        this.lastMove = null;

        this.notify();
    }

    // =========================
    // USER INTERACTION
    // =========================

    clickSquare(square) {
        const piece = this.getPiece(square);

        // Nothing selected yet
        if (!this.selection.selectedSquare) {
            if (piece && piece.color === this.turn) {
                this.selection.select(
                    square,
                    this.getLegalMoves(square).map((m) => m.to),
                );

                this.notify();
            }

            return;
        }

        // Clicked same square -> deselect
        if (square === this.selection.selectedSquare) {
            this.selection.clear();

            this.notify();

            return;
        }

        // Clicked another own piece
        if (piece && piece.color === this.turn) {
            this.selection.select(
                square,
                this.getLegalMoves(square).map((m) => m.to),
            );

            this.notify();

            return;
        }

        // Clicked a legal destination
        if (this.selection.isLegal(square)) {
            this.move({
                from: this.selection.selectedSquare,
                to: square,
            });

            this.selection.clear();

            this.notify();

            return;
        }

        // Clicked elsewhere
        this.selection.clear();

        this.notify();
    }
}
