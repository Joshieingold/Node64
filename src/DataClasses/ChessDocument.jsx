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
        this.stockfish = null;
        this.engineStatus = "Offline"; // Offline | Loading | Ready | Thinking
        this.engineInfo = {
            depth: 0,
            evaluation: "--",
            bestMove: "--",
            pv: [],
        };

        // Engine tuning / internal bookkeeping
        this.engineOptions = {
            depth: 18, // used if useMoveTime is false
            moveTime: 800, // ms, used if useMoveTime is true
            useMoveTime: true,
            threads: 4,
            hashMB: 64,
        };
        this._updateTimer = null;
        this._searchToken = 0; // increments each search; used to ignore stale results
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
        this.lastMove =
            this.currentMove >= 0 ? this.history[this.currentMove] : null;
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
        if (this.stockfish) {
            this.updateStockfish();
        }
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

    /////////////////////
    // Stockfish Stuff //
    /////////////////////

    turnOnStockFish() {
        if (this.stockfish) return; // guard against double-init / leaked workers

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

    // Debounced so rapid navigation (holding arrow keys, fast history
    // scrubbing) doesn't spam Stockfish with searches it'll never finish.
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

        // Always stop any in-flight search before starting a new one,
        // otherwise info lines from the old + new position interleave.
        this.stockfish.postMessage("stop");

        const fen =
            this.currentMove === -1
                ? null
                : this.history[this.currentMove].after;
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

    // Optional: let the UI change search behavior (e.g. a "deep analyze" button).
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
                    // Convert to White's perspective
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
}
