export default function Piece({ piece }) {
    const src = `/pieces/${piece.color}${piece.type}.svg`;

    return <img src={src} className="piece" draggable={false} alt="" />;
}
