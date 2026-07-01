import { useChess } from "../../context/ChessContext";
import Piece from "./Piece";

export default function Square({ square, light }) {
    const document = useChess();

    const piece = document.getPiece(square);

    return (
        <div className={`square ${light ? "light" : "dark"}`}>
            {piece && (
                <Piece
                    piece={{
                        color: piece.color,
                        type: piece.type,
                    }}
                />
            )}
        </div>
    );
}
