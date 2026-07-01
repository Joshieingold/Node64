import "./Move.css";

export default function Move({ number, text, active, onClick }) {
    return (
        <span className={`move ${active ? "active" : ""}`} onClick={onClick}>
            {number && <span className="move-number">{number}.</span>}

            {text}
        </span>
    );
}
