export function formatArrowsComment(arrows) {
    const spec = arrows.map((a) => `${a.color}${a.from}${a.to}`).join(",");
    return `{[%cal ${spec}]}`;
}

export function parseArrowsFromComment(commentText) {
    const match = commentText.match(/%cal\s+([^\]]+)/);
    if (!match) return [];
    return match[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((entry) => {
            const color = ARROW_COLORS.has(entry[0]) ? entry[0] : "G";
            const from = entry.slice(1, 3);
            const to = entry.slice(3, 5);
            return { from, to, color };
        });
}
