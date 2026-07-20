import "./EvalBar.css";
const MAX_EVAL = 3;

export default function EvalBar({ inHeight, stockfishDoc }) {
    const getValue = () => {
        if (!stockfishDoc.engineInfo.evaluation) {
            return 0;
        }
        if (stockfishDoc.engineInfo.evaluation.startsWith("M")) {
            return 69;
        }
        if (Number(stockfishDoc.engineInfo.evaluation)) {
            return stockfishDoc.engineInfo.evaluation;
        } else {
            return 0;
        }
    };
    const value = stockfishDoc.engineInfo.evaluation;
    const clamped = Math.max(-MAX_EVAL, Math.min(MAX_EVAL, getValue()));
    const whitePercent = 50 + (clamped / MAX_EVAL) * 50;

    const notches = [];
    for (let v = MAX_EVAL; v >= -MAX_EVAL; v--) {
        notches.push(v);
    }

    return (
        <div
            className={`eval-bar ${stockfishDoc.stockfish === null ? "full-hidden" : ""}`}
            style={{ height: `${inHeight}px` }}
        >
            <div className="indicator-wrap">
                {notches.map((v) => (
                    <div
                        key={v}
                        className={`indicator-bar${v === 0 ? " middle-bar" : ""}`}
                        style={{
                            top: `${((MAX_EVAL - v) / (2 * MAX_EVAL)) * 100}%`,
                        }}
                    />
                ))}
            </div>
            <div className="color-fight-wrap">
                <div
                    className="black-eval"
                    style={{ height: `${100 - whitePercent}%` }}
                />
                <div
                    className="white-eval"
                    style={{ height: `${whitePercent}%` }}
                />
            </div>
        </div>
    );
}
