import { Chess } from "chess.js";
/* ============================================================
   RepertoireDocument — a GRAPH (not a board document). Converts
   an AnalysisDocument's tree into merged nodes with prev/next
   links, collapsing transpositions. Deliberately does NOT extend
   StandardDocument — it has no board, no selection, no engine.
   ============================================================ */
export class RepertoireDocument {
    constructor(chessDocument = null) {
        this.nodeCollection = [];
        if (chessDocument) {
            this.importChessDocument(chessDocument);
        }
    }

    importChessDocument(chessDocument) {
        this.nodeCollection = [];
        const convert = (oldNode, parent = null) => {
            let fen;
            let ucn = null;
            let san = null;
            if (oldNode.move === null) {
                fen = new Chess().fen();
            } else {
                fen = oldNode.move.after;
                ucn =
                    oldNode.move.from +
                    oldNode.move.to +
                    (oldNode.move.promotion ?? "");
                san = oldNode.move.san;
            }
            const newNode = new RepNode(fen, ucn, san);
            if (parent) {
                newNode.prev.push(parent);
                parent.next.push(newNode);
            }
            this.nodeCollection.push(newNode);
            for (const child of oldNode.children) {
                convert(child, newNode);
            }
            return newNode;
        };
        convert(chessDocument.root);
        this.crushNodes();
    }

    crushNodes() {
        const fenMap = new Map();
        for (const node of this.nodeCollection) {
            if (!fenMap.has(node.fen)) fenMap.set(node.fen, []);
            fenMap.get(node.fen).push(node);
        }
        for (const nodes of fenMap.values()) {
            if (nodes.length <= 1) continue;
            const master = nodes[0];
            for (let i = 1; i < nodes.length; i++) {
                this.mergeNodes(master, nodes[i]);
            }
        }
    }

    mergeNodes(master, duplicate) {
        for (const parent of duplicate.prev) {
            if (!master.prev.includes(parent)) master.prev.push(parent);
            const index = parent.next.indexOf(duplicate);
            if (index !== -1) parent.next[index] = master;
            parent.next = [...new Set(parent.next)];
        }
        for (const child of duplicate.next) {
            if (!master.next.includes(child)) master.next.push(child);
            const index = child.prev.indexOf(duplicate);
            if (index !== -1) child.prev[index] = master;
            child.prev = [...new Set(child.prev)];
        }
        master.prev = [...new Set(master.prev)];
        master.next = [...new Set(master.next)];
        this.nodeCollection = this.nodeCollection.filter(
            (node) => node !== duplicate,
        );
    }

    getRoot() {
        return this.nodeCollection.find((node) => node.prev.length === 0);
    }

    toJSON() {
        return this.nodeCollection.map((node) => ({
            id: node.id,
            fen: node.fen,
            ucn: node.ucn,
            san: node.san,
            prev: node.prev.map((n) => n.id),
            next: node.next.map((n) => n.id),
        }));
    }
}
