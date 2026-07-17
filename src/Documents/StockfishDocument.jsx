import { Chess } from "chess.js";
export default class StockFishDocument {
    constructor(onChange, getFen) {
        this.onChange = onChange;
        this.getFen = getFen;
        this.stockfish = null;
        this.engineStatus = "Offline";
        this.engineInfo = {
            depth: 0,
            evaluation: "--",
            bestMove: "--",
            pv: [],
        };
        this.engineOptions = {
            depth: 20,
            moveTime: 3000,
            useMoveTime: false,
            threads: 4,
            hashMB: 64,
        };
        this.updateTimer = null;
        this.searchToken = 0;
        this.currentFen = null;
        this.currentTurn = "w";
    }

    _emit() {
        if (this.onChange) this.onChange();
    }

    turnOnStockFish() {
        if (this.stockfish) return;
        this.engineStatus = "Loading";
        this._emit();
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
                this._emit();
                const fen = this.getFen ? this.getFen() : null;
                if (fen) this.updateStockfish(fen);
                return;
            }
            if (line.startsWith("info")) {
                const info = this.parseInfo(line);
                if (info.depth !== undefined)
                    this.engineInfo.depth = info.depth;
                if (info.evaluation !== undefined)
                    this.engineInfo.evaluation = info.evaluation;
                if (info.pvSAN) {
                    this.engineInfo.pv = info.pvSAN;
                    if (info.pvSAN.length > 0)
                        this.engineInfo.bestMove = info.pvSAN[0];
                }
                this._emit();
                return;
            }
            if (line.startsWith("bestmove")) {
                this.engineStatus = "Ready";
                this._emit();
                return;
            }
        };
        this.stockfish.postMessage("isready");
    }

    turnOffStockFish() {
        if (!this.stockfish) return;
        clearTimeout(this.updateTimer);
        this.stockfish.terminate();
        this.stockfish = null;
        this.engineStatus = "Offline";
        this.engineInfo = {
            depth: 0,
            evaluation: "--",
            bestMove: "--",
            pv: [],
        };
        this._emit();
    }

    updateStockfish(fen) {
        if (!this.stockfish) return;
        this.currentFen = fen;
        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => this.runSearch(), 150);
    }

    runSearch() {
        if (!this.stockfish || !this.currentFen) return;
        this.searchToken++;
        this.stockfish.postMessage("stop");
        this.currentTurn = this.currentFen.split(" ")[1] || "w";
        this.stockfish.postMessage(`position fen ${this.currentFen}`);
        this.engineStatus = "Thinking";
        this.engineInfo.depth = 0;
        this._emit();
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
        const board = new Chess(this.currentFen);
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
                    if (this.currentTurn === "b") value = -value;
                    if (type === "cp") {
                        info.evaluation =
                            (value >= 0 ? "+" : "") + (value / 100).toFixed(2);
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
