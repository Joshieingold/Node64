/* ============================================================
   ChessData — pure board/tree state. No notify(), no stockfish,
   no pgn. Just the game tree and the live chess.js instance.
   Calls this.onChange() (if set) after every mutation so its
   owner can react (re-render, update the engine, etc).
   ============================================================ */

import { Chess } from "chess.js";
import { createNode } from "./Utils/NodeHelpers";

export default class ChessData {
    constructor(onChange = null) {
        this.game = new Chess();
        this.selectedSquare = null;
        this.legalMoves = [];
        this.root = createNode(null, null);
        this.lastMove = null;
        this.currentNode = this.root;
        this.onChange = onChange;
    }

    _emit() {
        if (this.onChange) this.onChange();
    }

    resetTree() {
        this.root = createNode(null, null);
        this.currentNode = this.root;
    }
    getMoveSequenceForNode(node) {
        return this.getPathFromRoot(node)
            .map((n) => n.move.san)
            .join(" ");
    }

    getMoveSequence() {
        return this.getMoveSequenceForNode(this.currentNode);
    }

    getPathFromRoot(node) {
        const path = [];
        let n = node;
        while (n && n.parent) {
            path.unshift(n);
            n = n.parent;
        }
        return path;
    }

    getCurrentPath() {
        return this.getPathFromRoot(this.currentNode);
    }

    cycleVariation(direction) {
        const parent = this.currentNode.parent;
        if (!parent || parent.children.length < 2) return;
        const idx = parent.children.indexOf(this.currentNode);
        let newIdx = idx + direction;
        if (newIdx < 0) newIdx = parent.children.length - 1;
        if (newIdx >= parent.children.length) newIdx = 0;
        this.goToNode(parent.children[newIdx]);
    }

    deleteVariation(node) {
        const parent = node.parent;
        if (!parent) return;
        const idx = parent.children.indexOf(node);
        if (idx === -1) return;
        parent.children.splice(idx, 1);
        if (parent.activeChildIndex >= parent.children.length) {
            parent.activeChildIndex = Math.max(0, parent.children.length - 1);
        }
        let n = this.currentNode;
        let wasInsideDeleted = false;
        while (n) {
            if (n === node) {
                wasInsideDeleted = true;
                break;
            }
            n = n.parent;
        }
        if (wasInsideDeleted) {
            this.currentNode = parent;
            this.rebuildBoard();
        } else {
            this._emit();
        }
    }

    promoteVariation(node) {
        const parent = node.parent;
        if (!parent) return;
        const idx = parent.children.indexOf(node);
        if (idx <= 0) return;
        parent.children.splice(idx, 1);
        parent.children.unshift(node);
        parent.activeChildIndex = 0;
        this._emit();
    }

    isMainlineNode(node) {
        let n = node;
        while (n.parent) {
            if (n.parent.children[0] !== n) return false;
            n = n.parent;
        }
        return true;
    }

    goToNode(node) {
        this.currentNode = node;
        let n = node;
        while (n.parent) {
            n.parent.activeChildIndex = n.parent.children.indexOf(n);
            n = n.parent;
        }
        this.rebuildBoard();
    }

    goToEnd() {
        let node = this.currentNode;
        while (node.children.length > 0) {
            node = node.children[node.activeChildIndex ?? 0];
        }
        this.currentNode = node;
        this.rebuildBoard();
    }

    goToStart() {
        this.currentNode = this.root;
        this.rebuildBoard();
    }
    movePiece(from, to) {
        const piece = this.getPiece(from);
        if (!piece) return false;
        const legal = this.getLegalMoves(from).map((m) => m.to);
        if (!legal.includes(to)) {
            this.clearSelection();
            return false;
        }
        const result = this.game.move({ from, to });
        if (!result) return false;
        let child = this.currentNode.children.find(
            (c) =>
                c.move.from === result.from &&
                c.move.to === result.to &&
                c.move.promotion === result.promotion,
        );
        if (!child) {
            child = createNode(result, this.currentNode);
            this.currentNode.children.push(child);
        }
        this.currentNode.activeChildIndex =
            this.currentNode.children.indexOf(child);
        this.currentNode = child;
        this.lastMove = result;
        this.clearSelection();
        this._emit();
        return true;
    }

    undo() {
        if (!this.currentNode.parent) return;
        const parent = this.currentNode.parent;
        const idx = parent.children.indexOf(this.currentNode);
        parent.children.splice(idx, 1);
        if (parent.activeChildIndex >= parent.children.length) {
            parent.activeChildIndex = Math.max(0, parent.children.length - 1);
        }
        this.currentNode = parent;
        this.rebuildBoard();
    }

    handleSquareClick(square) {
        if (this.selectedSquare) {
            this.movePiece(this.selectedSquare, square);
        } else {
            this.selectSquare(square);
        }
    }

    clearSelection() {
        this.selectedSquare = null;
        this.legalMoves = [];
        this._emit();
    }

    selectSquare(square) {
        const piece = this.getPiece(square);
        if (!piece) return;
        this.selectedSquare = square;
        this.legalMoves = this.getLegalMoves(square).map((m) => m.to);
        this._emit();
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

    isSelected(square) {
        return this.selectedSquare === square;
    }
    getPiece(square) {
        return this.game.get(square);
    }
    getLegalMoves(square) {
        return this.game.moves({ square, verbose: true });
    }
    isLegal(square) {
        return this.legalMoves.includes(square);
    }

    previousMove() {
        if (!this.currentNode.parent) return;
        this.currentNode = this.currentNode.parent;
        this.rebuildBoard();
    }

    nextMove() {
        if (this.currentNode.children.length === 0) return;
        const idx = this.currentNode.activeChildIndex ?? 0;
        this.currentNode = this.currentNode.children[idx];
        this.rebuildBoard();
    }

    rebuildBoard() {
        this.game = new Chess();
        const path = this.getPathFromRoot(this.currentNode);
        for (const node of path) {
            this.game.move({
                from: node.move.from,
                to: node.move.to,
                promotion: node.move.promotion,
            });
        }
        this.lastMove = this.currentNode.move || null;
        this.clearSelection();
        this._emit();
    }

    /* ------------------------------------------------------------
       Arrows — annotations that live on a specific tree node (i.e.
       a specific position), so they follow the line they were drawn
       on rather than being global to the board. Persisted to PGN as
       [%cal ...] comments by AnalysisDocument.createPgnString().
       ------------------------------------------------------------ */

    addArrow(from, to, color = "G") {
        if (!this.currentNode.arrows) this.currentNode.arrows = [];
        const existing = this.currentNode.arrows.find(
            (a) => a.from === from && a.to === to,
        );
        if (existing) {
            existing.color = color;
        } else {
            this.currentNode.arrows.push({ from, to, color });
        }
        this._emit();
    }

    removeArrow(from, to) {
        if (!this.currentNode.arrows) return;
        const idx = this.currentNode.arrows.findIndex(
            (a) => a.from === from && a.to === to,
        );
        if (idx === -1) return;
        this.currentNode.arrows.splice(idx, 1);
        this._emit();
    }

    // Draw same arrow+color again to remove it; draw same squares with a
    // different color to recolor it; otherwise add a new arrow. This is
    // the standard lichess/chess.com right-click-drag behavior.
    toggleArrow(from, to, color = "G") {
        if (!this.currentNode.arrows) this.currentNode.arrows = [];
        const existing = this.currentNode.arrows.find(
            (a) => a.from === from && a.to === to,
        );
        if (existing && existing.color === color) {
            this.removeArrow(from, to);
            return;
        }
        if (existing) {
            existing.color = color;
            this._emit();
            return;
        }
        this.currentNode.arrows.push({ from, to, color });
        this._emit();
    }

    clearArrows() {
        if (!this.currentNode.arrows || this.currentNode.arrows.length === 0) {
            return;
        }
        this.currentNode.arrows = [];
        this._emit();
    }
}
