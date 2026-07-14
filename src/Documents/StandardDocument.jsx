import ChessData from "./ChessData";
/* ============================================================
   StandardDocument — the base every "board tab" document extends.
   Owns notify()/subscribe() AND delegates the whole ChessBoard-
   facing interface down to an internal ChessData instance, so
   `data={someStandardDocumentSubclass}` just works with your
   existing Board.jsx unchanged.
   ============================================================ */
export default class StandardDocument {
    constructor() {
        this.chessData = new ChessData(() => this.notify());
        this.version = 0;
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.version++;
        for (const listener of this.listeners) listener();
    }

    // ---- Flat pass-through properties ChessBoard.jsx reads directly ----
    get game() {
        return this.chessData.game;
    }
    get selectedSquare() {
        return this.chessData.selectedSquare;
    }
    get legalMoves() {
        return this.chessData.legalMoves;
    }
    get lastMove() {
        return this.chessData.lastMove;
    }
    get root() {
        return this.chessData.root;
    }
    get currentNode() {
        return this.chessData.currentNode;
    }

    // ---- Delegated methods ----
    handleSquareClick(square) {
        this.chessData.handleSquareClick(square);
    }
    movePiece(from, to) {
        this.chessData.movePiece(from, to);
    }
    selectSquare(square) {
        this.chessData.selectSquare(square);
    }
    clearSelection() {
        this.chessData.clearSelection();
    }
    getPiece(square) {
        return this.chessData.getPiece(square);
    }
    getLegalMoves(square) {
        return this.chessData.getLegalMoves(square);
    }
    isSelected(square) {
        return this.chessData.isSelected(square);
    }
    isLegal(square) {
        return this.chessData.isLegal(square);
    }
    getCheckedKingSquare() {
        return this.chessData.getCheckedKingSquare();
    }
    undo() {
        this.chessData.undo();
    }
    previousMove() {
        this.chessData.previousMove();
    }
    nextMove() {
        this.chessData.nextMove();
    }
    goToStart() {
        this.chessData.goToStart();
    }
    goToEnd() {
        this.chessData.goToEnd();
    }
    goToNode(node) {
        this.chessData.goToNode(node);
    }
    cycleVariation(direction) {
        this.chessData.cycleVariation(direction);
    }
    promoteVariation(node) {
        this.chessData.promoteVariation(node);
    }
    deleteVariation(node) {
        this.chessData.deleteVariation(node);
    }
    isMainlineNode(node) {
        return this.chessData.isMainlineNode(node);
    }
    getPathFromRoot(node) {
        return this.chessData.getPathFromRoot(node);
    }
    getCurrentPath() {
        return this.chessData.getCurrentPath();
    }
    rebuildBoard() {
        this.chessData.rebuildBoard();
    }

    // Overridden by subclasses that actually have player data (PGN).
    getPlayerNames() {
        return {
            white: { name: "?", elo: "?", title: "" },
            black: { name: "?", elo: "?", title: "" },
        };
    }
}
