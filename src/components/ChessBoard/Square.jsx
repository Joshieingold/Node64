import Piece from "./Piece";

export default function Square({ square, light, document }) {
    const piece = document.getPiece(square);

    return (
        <div className={`square ${light ? "light" : "dark"}`}>
            {piece && <Piece piece={{ color: piece[0], type: piece[1] }} />}
        </div>
    );
}
