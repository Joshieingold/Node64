import { Chess } from "chess.js";

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Walks the tree and returns every root→leaf path as an array of nodes.
function extractLines(root) {
    const lines = [];
    function walk(node, path) {
        const nextPath = node.move ? [...path, node] : path;
        if (node.children.length === 0) {
            if (nextPath.length > 0) lines.push(nextPath);
            return;
        }
        for (const child of node.children) walk(child, nextPath);
    }
    walk(root, []);
    return lines;
}

// Presents the SAME public surface a board component expects from a
// ChessDocument (game, selectedSquare, legalMoves, lastMove,
// handleSquareClick, getPiece, isSelected, isLegal,
// getCheckedKingSquare, subscribe/notify/version) so the existing
// board component can render/interact with it with zero changes.
// Internally it behaves totally differently: movePiece only accepts
// the one "correct" move for the line being drilled.
export default class RepertoireTrainer {
    constructor(root, { userColor = "w", startNode = root, onChange } = {}) {
        this.root = startNode; // allows drilling a subtree, not just the whole repertoire
        this.userColor = userColor;
        this.lines = extractLines(this.root);

        this.game = new Chess();
        this.selectedSquare = null;
        this.legalMoves = [];
        this.lastMove = null;

        this.version = 0;
        this.listeners = new Set();
        if (onChange) this.listeners.add(onChange);

        this.status = "idle"; // idle | awaiting-user | wrong-move | line-complete | session-complete
        this.feedback = null; // "correct" | "wrong" | null — board can use this for flash styling
        this.currentLine = null;
        this.moveIndex = 0;
        this.expectedNode = null;

        this.mistakeCounts = new Map();
        this.stats = {
            correct: 0,
            incorrect: 0,
            linesCompleted: 0,
            totalLines: this.lines.length,
        };
    }

    // ---- Same shape as ChessDocument ----
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    notify() {
        this.version++;
        for (const listener of this.listeners) listener();
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
    isSelected(square) {
        return this.selectedSquare === square;
    }
    isLegal(square) {
        return this.legalMoves.includes(square);
    }
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
    // Same entry point the board already calls on square clicks.
    handleSquareClick(square) {
        if (this.selectedSquare) {
            this.movePiece(this.selectedSquare, square);
        } else {
            this.selectSquare(square);
        }
    }

    // ---- Overridden with drilling logic instead of free branching ----
    movePiece(from, to) {
        if (this.status !== "awaiting-user") {
            this.clearSelection();
            this.notify();
            return;
        }

        const legal = this.getLegalMoves(from).map((m) => m.to);
        if (!legal.includes(to)) {
            this.clearSelection();
            this.notify();
            return;
        }

        const expected = this.expectedNode.move;
        const promotion = expected.promotion; // auto-apply the repertoire's promotion choice if relevant
        const isCorrect = from === expected.from && to === expected.to;

        this.clearSelection();

        if (!isCorrect) {
            this.stats.incorrect++;
            this.mistakeCounts.set(
                this.currentLineIndex,
                (this.mistakeCounts.get(this.currentLineIndex) ?? 0) + 1,
            );
            this.status = "wrong-move";
            this.feedback = "wrong";
            this.notify();
            // Auto-recover after a beat so they can try again on the same position.
            setTimeout(() => {
                this.status = "awaiting-user";
                this.feedback = null;
                this.notify();
            }, 600);
            return;
        }

        const result = this.game.move({ from, to, promotion });
        this.lastMove = result;
        this.stats.correct++;
        this.moveIndex++;
        this.status = "correct";
        this.feedback = "correct";
        this.notify();

        setTimeout(() => this.advance(), 250);
    }

    // ---- Session control (trainer-specific, called from your training UI, not the board) ----
    startSession() {
        this.queue = this.buildQueue();
        this.stats.linesCompleted = 0;
        this.nextLine();
    }
    buildQueue() {
        const weighted = [];
        this.lines.forEach((_, i) => {
            const weight = 1 + (this.mistakeCounts.get(i) ?? 0);
            for (let w = 0; w < weight; w++) weighted.push(i);
        });
        return shuffle(weighted);
    }
    nextLine() {
        if (!this.queue || this.queue.length === 0) {
            this.status = "session-complete";
            this.notify();
            return;
        }
        this.currentLineIndex = this.queue.shift();
        this.currentLine = this.lines[this.currentLineIndex];
        this.moveIndex = 0;
        this.game = new Chess();
        this.lastMove = null;
        this.advance();
    }
    advance() {
        while (this.moveIndex < this.currentLine.length) {
            const node = this.currentLine[this.moveIndex];
            if (node.move.color === this.userColor) {
                this.expectedNode = node;
                this.status = "awaiting-user";
                this.feedback = null;
                this.notify();
                return;
            }
            const result = this.game.move({
                from: node.move.from,
                to: node.move.to,
                promotion: node.move.promotion,
            });
            this.lastMove = result;
            this.moveIndex++;
        }
        this.status = "line-complete";
        this.stats.linesCompleted++;
        this.notify();
        setTimeout(() => this.nextLine(), 1200);
    }
    skipLine() {
        this.nextLine();
    }
}
