export default class RepertoireDocument {
    constructor(inFen) {
        this.startingPosition = inFen;
        this.nodeList = [];
    }
    addNode(node) {
        const existing = this.nodeList.find((n) => n.fen === node.fen);

        if (existing) {
            if (node.previous.length) {
                const parent = node.previous[0];

                if (!parent.next.includes(existing)) parent.next.push(existing);

                if (!existing.previous.includes(parent))
                    existing.previous.push(parent);
            }

            return existing;
        }

        this.nodeList.push(node);
        return node;
    }
}
export class RepNode {
    constructor(fen) {
        this.id = crypto.randomUUID();
        this.fen = fen;

        this.previous = [];
        this.next = [];
    }
}
