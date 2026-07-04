import "./EvalBar.css";
export default function EvalBar({ data, update }) {
    function evalToPercent(evalScore) {
        // evalScore is in pawns (+0.5, -1.3, etc.)

        return 100 / (1 + Math.exp(-evalScore));
    }
    const evaluation = Number(data.engineInfo.evaluation);

    const whitePercent = evalToPercent(isNaN(evaluation) ? 0 : evaluation);

    const blackPercent = 100 - whitePercent;

    return (
        <div
            className={`eval-bar ${data.engineStatus == "Offline" ? "hidden" : ""}`}
        >
            <div
                className="black-eval"
                style={{ height: `${blackPercent}%` }}
            />
            <div
                className="white-eval"
                style={{ height: `${whitePercent}%` }}
            />
        </div>
    );
}
