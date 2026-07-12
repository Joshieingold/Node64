import { Chess } from "chess.js";
import { readTextFile } from "@tauri-apps/plugin-fs";
import StandardDocument from "./StandardDocument";
import PgnDocument from "./PgnDocument";
import FileDocument from "./FileDocument";
import StockFishDocument from "./StockfishDocument";
import { RepertoireDocument } from "./RepertoireDocument";
import { createNode } from "./Utils/NodeHelpers";
import { splitPgnDatabase, parseHeaders } from "./Utils/PgnParsing";
/* ============================================================
   AnalysisDocument — the real tab document. Combines the board
   (via StandardDocument→ChessData), the engine, PGN headers, and
   file info. This is what Shell.jsx should instantiate for both
   Analysis and Repertoire tabs.
   ============================================================ */
export default class AnalysisDocument extends StandardDocument {
    constructor(onChange = null) {
        super();
        if (onChange) this.listeners.add(onChange);

        this.pgnData = new PgnDocument();
        this.fileData = new FileDocument();
        this.stockfishData = new StockFishDocument(
            () => this.notify(),
            () => this._getCurrentFen(),
        );

        // Re-wire chessData's onChange so every move both notifies
        // React AND (if the engine is on) feeds it the new position.
        this.chessData.onChange = () => {
            this.notify();
            if (this.stockfishData.stockfish) {
                this.stockfishData.updateStockfish(this._getCurrentFen());
            }
        };
    }

    _getCurrentFen() {
        return this.chessData.currentNode.move
            ? this.chessData.currentNode.move.after
            : this.chessData.game.fen();
    }

    getPlayerNames() {
        return {
            black: {
                name: this.pgnData.blackName || "Unknown",
                elo: this.pgnData.blackElo || "?",
                title: this.pgnData.blackTitle || "",
            },
            white: {
                name: this.pgnData.whiteName || "Unknown",
                elo: this.pgnData.whiteElo || "?",
                title: this.pgnData.whiteTitle || "",
            },
        };
    }

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
        const tokens = renderChildren(game, this.chessData.root, 1);
        return tokens.join(" ");
    }

    getFullPgn() {
        return this.pgnData.toPgn(this.createPgnString());
    }

    async loadPgn(path) {
        const pgnText = await readTextFile(path);
        this.loadPgnString(pgnText);
    }

    loadPgnString(pgnText) {
        const headers = parseHeaders(pgnText);
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
        this.pgnData.setHeaders(mappedHeaders);

        this.chessData.resetTree();
        const movetext = pgnText.replace(/\[[^\]]*\]/g, "").trim();
        this._mergeGameMovetext(movetext, this.chessData.root);
        this.chessData.currentNode = this.chessData.root;
        this.chessData.rebuildBoard();
    }

    // Shared parser used by both single-game and multi-game loads.
    // Starts at an arbitrary node (root, usually) and merges shared
    // lines onto existing children instead of always assuming an
    // empty tree — this is what lets multi-game PGN imports collapse
    // transpositions automatically.
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

    async loadPgnDatabase(path) {
        const text = await readTextFile(path);
        return this.importPgnDatabase(text);
    }

    importPgnDatabase(pgnText) {
        this.chessData.resetTree();
        const gameTexts = splitPgnDatabase(pgnText);
        let imported = 0;
        for (const gameText of gameTexts) {
            const headers = parseHeaders(gameText);
            const movetext = gameText.replace(/\[[^\]]*\]/g, "").trim();
            if (!movetext) continue;
            const leaf = this._mergeGameMovetext(movetext, this.chessData.root);
            if (leaf && leaf !== this.chessData.root) {
                leaf.games.push(headers);
            }
            imported++;
        }
        this.chessData.currentNode = this.chessData.root;
        this.chessData.rebuildBoard();
        return imported;
    }

    // Converts the tab's tree into a graph-based RepertoireDocument
    // (transpositions merged) — used for training / export.
    createRepertoire() {
        const repertoire = new RepertoireDocument();
        repertoire.importChessDocument(this);
        return repertoire;
    }
}
