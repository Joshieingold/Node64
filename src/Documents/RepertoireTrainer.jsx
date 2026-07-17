import StandardDocument from "./StandardDocument";

export default class RepertoireTrainer extends StandardDocument {
    constructor(
        repertoireRoot,
        { userColor = "w", startNode = null, onChange = null } = {},
    ) {
        super();
        if (onChange) this.listeners.add(onChange);

        this.repertoireRoot = repertoireRoot;
        this.trainStartNode = startNode ?? repertoireRoot;
        this.userColor = userColor;

        this.status = "idle";
        this.stats = {
            correct: 0,
            incorrect: 0,
            linesCompleted: 0,
            totalLines: 0,
        };

        this.lines = [];
        this.currentLine = null;
        this.currentLineIndex = 0;
        this.lineMoveIndex = 0;
        this.answerNode = this.trainStartNode;

        this._advanceTimer = null;
        this._wrongMoveTimer = null;
    }

    startSession() {
        this.lines = [];
        this._collectLines(this.trainStartNode, []);
        this.stats = {
            correct: 0,
            incorrect: 0,
            linesCompleted: 0,
            totalLines: this.lines.length,
        };
        this._shuffle(this.lines);
        this.currentLineIndex = 0;
        this._startLine();
    }

    // Gets the lines from the repertoire tree
    _collectLines(node, path) {
        if (node.children.length === 0) {
            if (path.length > 0) this.lines.push(path);
            return;
        }
        for (const child of node.children) {
            this._collectLines(child, [...path, child]);
        }
    }

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    _startLine() {
        clearTimeout(this._advanceTimer);
        clearTimeout(this._wrongMoveTimer);

        if (this.currentLineIndex >= this.lines.length) {
            this.status = "session-complete";
            this.notify();
            return;
        }

        this.currentLine = this.lines[this.currentLineIndex];
        this.lineMoveIndex = 0;

        this.chessData.resetTree();
        this.chessData.currentNode = this.chessData.root;
        this.answerNode = this.trainStartNode;

        for (const node of this._pathToStart()) {
            this._playAnswerMove(node);
        }

        this.chessData.rebuildBoard();
        this._maybePlayOpponentMove();
    }

    _pathToStart() {
        const path = [];
        let n = this.trainStartNode;
        while (n && n.parent) {
            path.unshift(n);
            n = n.parent;
        }
        return path;
    }

    _playAnswerMove(node) {
        const { from, to } = node.move;
        this.chessData.movePiece(from, to);
    }
    _maybePlayOpponentMove() {
        const nextAnswer = this.currentLine[this.lineMoveIndex];
        if (!nextAnswer) {
            this.status = "awaiting-user";
            this.notify();
            return;
        }
        const isUserTurn = this.chessData.game.turn() === this.userColor;
        if (isUserTurn) {
            this.status = "awaiting-user";
            this.notify();
            return;
        }
        this._playAnswerMove(nextAnswer);
        this.answerNode = nextAnswer;
        this.lineMoveIndex++;
        this.notify();

        if (this.lineMoveIndex >= this.currentLine.length) {
            this._completeLine();
        } else {
            this._maybePlayOpponentMove();
        }
    }

    _completeLine() {
        this.stats.linesCompleted++;
        this.status = "line-complete";
        this.notify();
        clearTimeout(this._advanceTimer);
        this._advanceTimer = setTimeout(() => {
            this.currentLineIndex++;
            this._startLine();
        }, 1200);
    }

    movePiece(from, to) {
        if (this.status !== "awaiting-user") return;
        if (this.chessData.game.turn() !== this.userColor) return;

        const legal = this.chessData.getLegalMoves(from).map((m) => m.to);
        if (!legal.includes(to)) {
            this.chessData.clearSelection();
            this.notify();
            return;
        }

        const expected = this.currentLine[this.lineMoveIndex];
        const isCorrect =
            expected && expected.move.from === from && expected.move.to === to;

        if (!isCorrect) {
            this.stats.incorrect++;
            this.status = "wrong-move";
            this.chessData.clearSelection();
            this.notify();

            clearTimeout(this._wrongMoveTimer);
            this._wrongMoveTimer = setTimeout(() => {
                this.status = "awaiting-user";
                this.notify();
            }, 600);
            return;
        }

        this._playAnswerMove(expected);
        this.answerNode = expected;
        this.lineMoveIndex++;
        this.stats.correct++;
        this.status = "correct";
        this.notify();

        if (this.lineMoveIndex >= this.currentLine.length) {
            this._completeLine();
        } else {
            this._maybePlayOpponentMove();
        }
    }

    handleSquareClick(square) {
        if (this.chessData.selectedSquare) {
            this.movePiece(this.chessData.selectedSquare, square);
        } else {
            this.chessData.selectSquare(square);
        }
    }
}
