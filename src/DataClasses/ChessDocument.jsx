import { Chess } from "chess.js";
import { readTextFile } from "@tauri-apps/plugin-fs";
import PgnHead from "./PgnHead";
import RepertoireDocument, { RepNode } from "./NodeMaker";

let nodeCounter = 0;
function createNode(move, parent) {
    return {
        id: nodeCounter++,
        move,
        parent,
        children: [],
        activeChildIndex: 0,
        visits: 0, // how many imported games pass through this node
        games: [], // headers of any game that ends exactly at this node
    };
}

// Splits a multi-game PGN database into individual game chunks by
// finding each "[Event " tag, which always starts a new game in a
// spec-compliant PGN file.
function splitPgnDatabase(text) {
    const matches = [...text.matchAll(/^\[Event\s/gm)];
    if (matches.length === 0) return text.trim() ? [text] : [];
    const games = [];
    for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index;
        const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
        const chunk = text.slice(start, end).trim();
        if (chunk) games.push(chunk);
    }
    return games;
}

function parseHeaders(gameText) {
    const headers = {};
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let m;
    while ((m = headerRegex.exec(gameText))) {
        headers[m[1]] = m[2];
    }
    return headers;
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
        this.version = 0;
        this.listeners = new Set();
        if (this.onChange) {
            this.listeners.add(onChange);
        }

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
        this.engineOptions = {
            depth: 20,
            moveTime: 3000,
            useMoveTime: false,
            threads: 4,
            hashMB: 64,
        };
        this._updateTimer = null;
        this._searchToken = 0;

        // PGN STUFF //
        this.pgnHeader = new PgnHead();
        this.fileLocation = "";
        this.fileName = "";
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    // Notifies Components to update
    notify() {
        this.version++;
        for (const listener of this.listeners) listener();
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

    // PGN STUFF //

    createPgnString() {
        const formatMoveNumber = (ply) => Math.floor((ply + 1) / 2);
        const renderChildren = (game, parentNode, ply, forceNumber = false) => {
            const tokens = [];
            if (
                !parentNode ||
                !parentNode.children ||
                parentNode.children.length === 0
            ) {
                return tokens;
            }

            const activeIdx = parentNode.activeChildIndex || 0;
            const activeChild = parentNode.children[activeIdx];
            const fenBeforeMove = game.fen();

            const isWhite = game.turn() === "w";
            if (isWhite) {
                tokens.push(`${formatMoveNumber(ply)}.`);
            } else if (forceNumber) {
                tokens.push(`${formatMoveNumber(ply)}...`);
            }

            const moveResult = game.move({
                from: activeChild.move.from,
                to: activeChild.move.to,
                promotion: activeChild.move.promotion,
            });
            tokens.push(moveResult.san);

            const hasVariations = parentNode.children.length > 1;
            for (let i = 0; i < parentNode.children.length; i++) {
                if (i === activeIdx) continue;
                const sibling = parentNode.children[i];
                const varGame = new Chess(fenBeforeMove);

                const varTokens = [];
                const siblingIsWhite = varGame.turn() === "w";
                varTokens.push(
                    `${formatMoveNumber(ply)}.${siblingIsWhite ? "" : "..."}`,
                );
                const varMoveResult = varGame.move({
                    from: sibling.move.from,
                    to: sibling.move.to,
                    promotion: sibling.move.promotion,
                });
                varTokens.push(varMoveResult.san);
                varTokens.push(...renderChildren(varGame, sibling, ply + 1));

                tokens.push(`(${varTokens.join(" ")})`);
            }

            tokens.push(
                ...renderChildren(game, activeChild, ply + 1, hasVariations),
            );

            return tokens;
        };

        const game = new Chess();
        const tokens = renderChildren(game, this.root, 1);

        return tokens.join(" ");
    }
    getFullPgn() {
        return this.pgnHeader.toPgn(this.createPgnString());
    }
    async loadPgn(path) {
        const pgnText = await readTextFile(path);
        this.loadPgnString(pgnText);
    }
    loadPgnString(pgnText) {
        const headers = {};
        const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
        let m;
        while ((m = headerRegex.exec(pgnText))) {
            headers[m[1]] = m[2];
        }

        const PGN_TAG_TO_FIELD = {
            White: "whiteName",
            Black: "blackName",
            WhiteElo: "whiteElo",
            BlackElo: "blackElo",
            WhiteTitle: "whiteTitle",
            BlackTitle: "blackTitle",
            WhiteFideId: "whiteFideId",
            BlackFideId: "blackFideId",
            WhiteNA: "whiteNationalId",
            BlackNA: "blackNationalId",
            TimeControl: "timeControl",
            Date: "date",
            Result: "result",
            Termination: "termination",
            Site: "site",
            Event: "event",
            Round: "round",
            Board: "board",
            Annotator: "annotator",
            GameId: "gameId",
        };

        const mappedHeaders = {};
        for (const [tag, value] of Object.entries(headers)) {
            const field = PGN_TAG_TO_FIELD[tag];
            if (field) mappedHeaders[field] = value;
        }

        if (typeof this.pgnHeader.setHeaders === "function") {
            this.pgnHeader.setHeaders(mappedHeaders);
        } else {
            Object.assign(this.pgnHeader, mappedHeaders);
        }

        this.root = createNode(null, null);
        this.currentNode = this.root;
        const movetext = pgnText.replace(/\[[^\]]*\]/g, "").trim();
        this.parseMovetext(movetext);
        this.currentNode = this.root;
        this.rebuildBoard();
    }
    parseMovetext(movetext) {
        let text = movetext
            .replace(/\{[^}]*\}/g, " ") // strip {comments}
            .replace(/\$\d+/g, " ") // strip NAGs like $1
            .replace(/\(/g, " ( ")
            .replace(/\)/g, " ) ");
        const tokens = text.split(/\s+/).filter(Boolean);

        const moveNumberRe = /^\d+\.(\.\.)?$/;
        const resultRe = /^(1-0|0-1|1\/2-1\/2|\*)$/;
        const gluedMoveNumberRe = /^\d+\.(\.\.)?/;

        let game = new Chess();
        let currentNode = this.root;
        let lastFenBefore = game.fen();
        let lastParent = this.root;
        const stack = [];

        for (let rawToken of tokens) {
            if (rawToken === "(") {
                stack.push({ game, currentNode });
                game = new Chess(lastFenBefore);
                currentNode = lastParent;
                continue;
            }
            if (rawToken === ")") {
                const restored = stack.pop();
                if (restored) {
                    game = restored.game;
                    currentNode = restored.currentNode;
                }
                continue;
            }
            if (moveNumberRe.test(rawToken) || resultRe.test(rawToken))
                continue;

            const token = rawToken.replace(gluedMoveNumberRe, "");
            if (!token) continue;

            lastFenBefore = game.fen();
            lastParent = currentNode;

            let moveResult = null;
            try {
                moveResult = game.move(token);
            } catch (e) {
                moveResult = null;
            }
            if (!moveResult) {
                console.warn(
                    `Skipping unparseable token: "${rawToken}" (cleaned: "${token}")`,
                );
                continue;
            }

            let child = currentNode.children.find(
                (c) =>
                    c.move.from === moveResult.from &&
                    c.move.to === moveResult.to &&
                    c.move.promotion === moveResult.promotion,
            );
            if (!child) {
                child = createNode(moveResult, currentNode);
                currentNode.children.push(child);
            }
            currentNode = child;
        }
    }
    getPlayerNames() {
        return {
            black: {
                name: this.pgnHeader.blackName || "Unknown",
                elo: this.pgnHeader.blackElo || "?",
                title: this.pgnHeader.blackTitle || "",
            },
            white: {
                name: this.pgnHeader.whiteName || "Unknown",
                elo: this.pgnHeader.whiteElo || "?",
                title: this.pgnHeader.whiteTitle || "",
            },
        };
    }
    createRepertoire() {
        const repertoire = new RepertoireDocument(
            this.root.children.length
                ? this.root.children[0].move.before
                : new Chess().fen(),
        );

        const map = new Map();

        const visit = (treeNode, previousRepNode = null) => {
            let repNode = previousRepNode;

            if (treeNode.move) {
                repNode = new RepNode();
                repNode.fen = treeNode.move.after;

                repertoire.addNode(repNode);

                map.set(treeNode.id, repNode);

                if (previousRepNode) {
                    repNode.last = previousRepNode;
                    previousRepNode.next = repNode;
                }
            }

            for (const child of treeNode.children) {
                visit(child, repNode);
            }
        };

        visit(this.root);

        return repertoire;
    }

    /////////////////////////////
    // Multi-Game PGN Import  //
    /////////////////////////////

    // Loads a multi-game PGN database from disk and merges every game
    // into the existing tree. Does not touch loadPgn/loadPgnString.
    async loadPgnDatabase(path) {
        const text = await readTextFile(path);
        return this.importPgnDatabase(text);
    }

    // Merges every game in a multi-game PGN string into the existing
    // tree. Shared openings/lines collapse onto the same nodes; the
    // moment two games diverge, a new variation branch is created —
    // this uses its own self-contained parser (mergeGameMovetext)
    // rather than reusing parseMovetext, so single-game loading logic
    // is completely unaffected.
    importPgnDatabase(pgnText) {
        const gameTexts = splitPgnDatabase(pgnText);
        let imported = 0;

        for (const gameText of gameTexts) {
            const headers = parseHeaders(gameText);
            const movetext = gameText.replace(/\[[^\]]*\]/g, "").trim();
            if (!movetext) continue;

            const leaf = this._mergeGameMovetext(movetext, this.root);
            if (leaf && leaf !== this.root) {
                leaf.games.push(headers); // remember which game(s) ended here
            }
            imported++;
        }

        this.currentNode = this.root;
        this.rebuildBoard(); // also calls notify()
        return imported;
    }

    // Self-contained variant of the movetext parser, used only by
    // importPgnDatabase. Starts from an arbitrary node (usually root)
    // instead of always assuming an empty tree, and reuses existing
    // children so games sharing a line merge together automatically.
    _mergeGameMovetext(movetext, startNode) {
        let text = movetext
            .replace(/\{[^}]*\}/g, " ")
            .replace(/\$\d+/g, " ")
            .replace(/\(/g, " ( ")
            .replace(/\)/g, " ) ");
        const tokens = text.split(/\s+/).filter(Boolean);

        const moveNumberRe = /^\d+\.(\.\.)?$/;
        const resultRe = /^(1-0|0-1|1\/2-1\/2|\*)$/;
        const gluedMoveNumberRe = /^\d+\.(\.\.)?/;

        let game = new Chess(startNode.move ? startNode.move.after : undefined);
        let currentNode = startNode;
        let lastFenBefore = game.fen();
        let lastParent = startNode;
        const stack = [];
        let mainlineLeaf = startNode;

        for (let rawToken of tokens) {
            if (rawToken === "(") {
                stack.push({ game, currentNode });
                game = new Chess(lastFenBefore);
                currentNode = lastParent;
                continue;
            }
            if (rawToken === ")") {
                const restored = stack.pop();
                if (restored) {
                    game = restored.game;
                    currentNode = restored.currentNode;
                }
                continue;
            }
            if (moveNumberRe.test(rawToken) || resultRe.test(rawToken))
                continue;

            const token = rawToken.replace(gluedMoveNumberRe, "");
            if (!token) continue;

            lastFenBefore = game.fen();
            lastParent = currentNode;

            let moveResult = null;
            try {
                moveResult = game.move(token);
            } catch (e) {
                moveResult = null;
            }
            if (!moveResult) {
                console.warn(
                    `Skipping unparseable token: "${rawToken}" (cleaned: "${token}")`,
                );
                continue;
            }

            let child = currentNode.children.find(
                (c) =>
                    c.move.from === moveResult.from &&
                    c.move.to === moveResult.to &&
                    c.move.promotion === moveResult.promotion,
            );
            if (!child) {
                child = createNode(moveResult, currentNode);
                currentNode.children.push(child);
            }
            child.visits++;
            currentNode = child;

            if (stack.length === 0) {
                mainlineLeaf = currentNode;
            }
        }

        return mainlineLeaf;
    }
}
