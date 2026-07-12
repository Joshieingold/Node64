export function transformXY(x, y, flipped) {
    if (!flipped) return { x, y };
    return { x: 7 - x, y: 7 - y };
}
export function squareToXY(square) {
    const x = "abcdefgh".indexOf(square[0]);
    const y = 8 - Number(square[1]);
    return { x, y };
}
