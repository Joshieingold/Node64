import "./Notation.css";
import Move from "./Move";

export default function Notation() {
    return (
        <div className="notation">
            <Move number={1} text="e4" />

            <Move text="e5" />

            <Move number={2} text="Nf3" />

            <Move text="Nc6" />

            <Move number={3} text="d4" />

            <Move text="exd4" active />
        </div>
    );
}
