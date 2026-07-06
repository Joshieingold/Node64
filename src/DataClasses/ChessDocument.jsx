import { Chess } from "chess.js";
import PgnStuct from "./PgnTracker";

let nodeCounter = 0;
function createNode(move, parent) {
    return {
        id: nodeCounter++,
        move, // verbose chess.js move object, or null for the root
        parent, // parent node, or null for the root
        children: [], // array of child nodes; children[0] is the mainline
        activeChildIndex: 0, // which child nextMove()/goToEnd() should follow
    };
}

export default class ChessDocument {
    constructor(onChange) {
        this.game = new Chess();
        this.onChange = onChange;
        this.selectedSquare = null;
        this.legalMoves = [];

        this.root = createNode(null, null);
        this.currentNode = this.root;
        this.lastMove = null;

        // STOCKFISH STUFF //
        this.stockfishOn = null;
        this.stockfish = null;
        this.engineStatus = "Offline"; // Offline | Loading | Ready | Thinking
        this.engineInfo = {
            depth: 0,
            evaluation: "--",
            bestMove: "--",
            pv: [],
        };

        // PGN STUFF //
        this.pgnHeader = new PgnStuct();

        this.engineOptions = {
            depth: 20,
            moveTime: 3000,
            useMoveTime: false,
            threads: 4,
            hashMB: 64,
        };
        this._updateTimer = null;
        this._searchToken = 0;
    }

    // Notifies Components to update
    notify() {
        if (this.onChange) this.onChange();
    }

    // Walks from root down to `node`, returning the array of nodes (excluding root).
    getPathFromRoot(node) {
        const path = [];
        let n = node;
        while (n && n.parent) {
            path.unshift(n);
            n = n.parent;
        }
        return path;
    }

    // The path for the line currently being viewed (handy for a move-list UI).
    getCurrentPath() {
        return this.getPathFromRoot(this.currentNode);
    }

    // Replays the game state from root to currentNode.
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
        if (this.stockfish) {
            this.updateStockfish();
        }
        this.notify();
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

    // Deletes the current node (and everything under it) and steps back to its parent.
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
        this.notify();
    }

    // Handles moving a piece. This is the key change: no more forcing
    // goToEnd() first, so playing a move from any point in the tree
    // creates (or enters) a branch instead of overwriting the future.
    movePiece(from, to) {
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

        // If this exact move already exists as a child (you replayed a
        // known line), just step into it instead of duplicating it.
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
        if (this.stockfish) {
            this.updateStockfish();
        }
        this.notify();
    }

    ////////////////
    // UI Helpers //
    ////////////////

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

    previousMove() {
        if (!this.currentNode.parent) return;
        this.currentNode = this.currentNode.parent;
        this.rebuildBoard();
    }

    // Follows the "active" child — the branch you were last viewing/playing.
    nextMove() {
        if (this.currentNode.children.length === 0) return;
        const idx = this.currentNode.activeChildIndex ?? 0;
        this.currentNode = this.currentNode.children[idx];
        this.rebuildBoard();
    }

    goToStart() {
        this.currentNode = this.root;
        this.rebuildBoard();
    }

    // Follows active children all the way to the end of the current line.
    goToEnd() {
        let node = this.currentNode;
        while (node.children.length > 0) {
            node = node.children[node.activeChildIndex ?? 0];
        }
        this.currentNode = node;
        this.rebuildBoard();
    }

    // Jump straight to a specific node (e.g. from a move-list/variation click).
    // Also updates activeChildIndex up the chain so nextMove/goToEnd follow
    // this path afterwards.
    goToNode(node) {
        this.currentNode = node;
        let n = node;
        while (n.parent) {
            n.parent.activeChildIndex = n.parent.children.indexOf(n);
            n = n.parent;
        }
        this.rebuildBoard();
    }

    /////////////////////////
    // Variation Utilities //
    /////////////////////////

    // Is this node part of the "main line" all the way back to the start?
    isMainlineNode(node) {
        let n = node;
        while (n.parent) {
            if (n.parent.children[0] !== n) return false;
            n = n.parent;
        }
        return true;
    }

    // Makes `node` the new mainline continuation of its parent (moves it to children[0]).
    promoteVariation(node) {
        const parent = node.parent;
        if (!parent) return;
        const idx = parent.children.indexOf(node);
        if (idx <= 0) return;
        parent.children.splice(idx, 1);
        parent.children.unshift(node);
        parent.activeChildIndex = 0;
        this.notify();
    }

    // Deletes a node (and its whole subtree) without touching sibling variations.
    deleteVariation(node) {
        const parent = node.parent;
        if (!parent) return; // can't delete the root
        const idx = parent.children.indexOf(node);
        if (idx === -1) return;
        parent.children.splice(idx, 1);
        if (parent.activeChildIndex >= parent.children.length) {
            parent.activeChildIndex = Math.max(0, parent.children.length - 1);
        }
        // If we deleted the branch we were currently viewing, back up to its parent.
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
            this.notify();
        }
    }

    /////////////////////
    // Stockfish Stuff //
    /////////////////////

    turnOnStockFish() {
        if (this.stockfish) return;

        this.engineStatus = "Loading";
        this.notify();

        this.stockfish = new Worker("/stockfish/stockfish.js");
        this.stockfish.onmessage = (event) => {
            const line = event.data;

            if (line === "readyok") {
                this.engineStatus = "Ready";
                this.stockfish.postMessage("uci");
                return;
            }

            if (line === "uciok") {
                const { threads, hashMB } = this.engineOptions;
                this.stockfish.postMessage(
                    `setoption name Threads value ${threads}`,
                );
                this.stockfish.postMessage(
                    `setoption name Hash value ${hashMB}`,
                );
                this.stockfish.postMessage("ucinewgame");
                this.engineStatus = "Ready";
                this.notify();
                this.updateStockfish();
                return;
            }

            if (line.startsWith("info")) {
                const info = this.parseInfo(line);
                if (info.depth !== undefined) {
                    this.engineInfo.depth = info.depth;
                }
                if (info.evaluation !== undefined) {
                    this.engineInfo.evaluation = info.evaluation;
                }
                if (info.pvSAN) {
                    this.engineInfo.pv = info.pvSAN;
                    if (info.pvSAN.length > 0) {
                        this.engineInfo.bestMove = info.pvSAN[0];
                    }
                }
                this.notify();
                return;
            }

            if (line.startsWith("bestmove")) {
                this.engineStatus = "Ready";
                this.notify();
                return;
            }
        };
        this.stockfish.postMessage("isready");
    }

    turnOffStockFish() {
        if (!this.stockfish) return;
        clearTimeout(this._updateTimer);
        this.stockfish.terminate();
        this.stockfish = null;
        this.engineStatus = "Offline";
        this.engineInfo = {
            depth: 0,
            evaluation: "--",
            bestMove: "--",
            pv: [],
        };
        this.notify();
    }

    updateStockfish() {
        if (!this.stockfish) return;
        clearTimeout(this._updateTimer);
        this._updateTimer = setTimeout(() => {
            this._runSearch();
        }, 150);
    }

    _runSearch() {
        if (!this.stockfish) return;

        this._searchToken++;
        this.stockfish.postMessage("stop");

        const fen = this.currentNode.move ? this.currentNode.move.after : null;
        this.stockfish.postMessage(
            fen ? `position fen ${fen}` : "position startpos",
        );

        this.engineStatus = "Thinking";
        this.engineInfo.depth = 0;
        this.notify();

        const { useMoveTime, moveTime, depth } = this.engineOptions;
        if (useMoveTime) {
            this.stockfish.postMessage(`go movetime ${moveTime}`);
        } else {
            this.stockfish.postMessage(`go depth ${depth}`);
        }
    }

    setEngineOptions(options) {
        this.engineOptions = { ...this.engineOptions, ...options };
        if (this.stockfish) {
            const { threads, hashMB } = this.engineOptions;
            if (options.threads !== undefined) {
                this.stockfish.postMessage(
                    `setoption name Threads value ${threads}`,
                );
            }
            if (options.hashMB !== undefined) {
                this.stockfish.postMessage(
                    `setoption name Hash value ${hashMB}`,
                );
            }
        }
    }

    convertPVToSAN(pv) {
        const board = new Chess(this.game.fen());
        const san = [];
        for (const move of pv) {
            const played = board.move({
                from: move.substring(0, 2),
                to: move.substring(2, 4),
                promotion: move[4],
            });
            if (!played) break;
            san.push(played.san);
        }
        return san;
    }

    parseInfo(line) {
        const tokens = line.split(" ");
        const info = {};
        for (let i = 0; i < tokens.length; i++) {
            switch (tokens[i]) {
                case "depth":
                    info.depth = Number(tokens[++i]);
                    break;
                case "multipv":
                    info.multipv = Number(tokens[++i]);
                    break;
                case "score": {
                    const type = tokens[++i];
                    let value = Number(tokens[++i]);
                    if (this.game.turn() === "b") {
                        value = -value;
                    }
                    if (type === "cp") {
                        const evalString =
                            (value >= 0 ? "+" : "") + (value / 100).toFixed(2);
                        info.evaluation = evalString;
                    } else {
                        info.evaluation = "M" + (value >= 0 ? "+" : "") + value;
                    }
                    break;
                }
                case "pv": {
                    const pv = tokens.slice(i + 1);
                    info.pv = pv;
                    info.pvSAN = this.convertPVToSAN(pv);
                    return info;
                }
            }
        }
        return info;
    }
    // Cycles nodes so the user can choose from either of its siblings
    cycleVariation(direction) {
        const parent = this.currentNode.parent;
        if (!parent || parent.children.length < 2) return;

        const idx = parent.children.indexOf(this.currentNode);
        let newIdx = idx + direction;
        if (newIdx < 0) newIdx = parent.children.length - 1;
        if (newIdx >= parent.children.length) newIdx = 0;

        this.goToNode(parent.children[newIdx]);
    }
}
