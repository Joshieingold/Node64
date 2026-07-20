export function splitPgnDatabase(text) {
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

export function parseHeaders(gameText) {
    const headers = {};
    const headerRegex = /\[(\w+)\s+"([^"]*)"\]/g;
    let m;
    while ((m = headerRegex.exec(gameText))) {
        headers[m[1]] = m[2];
    }
    return headers;
}
