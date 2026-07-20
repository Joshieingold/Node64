let nodeCounter = 0;

export function createNode(move, parent) {
    return {
        id: nodeCounter++,
        move,
        parent,
        children: [],
        activeChildIndex: 0,
        visits: 0,
        games: [],
        arrows: [],
    };
}

// Walks the tree and returns every root→leaf path as an array of nodes.
export function extractLines(root) {
    const lines = [];
    function walk(node, path) {
        const nextPath = node.move ? [...path, node] : path;
        if (node.children.length === 0) {
            if (nextPath.length > 0) lines.push(nextPath);
            return;
        }
        for (const child of node.children) walk(child, nextPath);
    }
    walk(root, []);
    return lines;
}
