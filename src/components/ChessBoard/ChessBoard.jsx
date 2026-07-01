import Square from "./Square";
import "./board.css";
import { useChess } from "../../context/ChessContext";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

export default function ChessBoard() {
    const document = useChess();

    const squares = [];

    for (let rank = 8; rank >= 1; rank--) {
        for (let file = 0; file < 8; file++) {
            const square = files[file] + rank;

            squares.push(
                <Square
                    key={square}
                    square={square}
                    light={(rank + file) % 2 === 1}
                />,
            );
        }
    }

    return <div className="board">{squares}</div>;
}
