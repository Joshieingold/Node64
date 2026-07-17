import { useCallback, useState, useSyncExternalStore } from "react";
import "./TrainingPage.css";
import { AnalysisChessBoard } from "../../Components/ChessBoard/ChessBoard";

// MAKE ME LESS UGLY SOME DAY
export default function TrainingPage({ data: trainer }) {
    useSyncExternalStore(
        useCallback((cb) => trainer.subscribe(cb), [trainer]),
        () => trainer.version,
    );
    const [, setTick] = useState(0);
    const update = useCallback(() => setTick((t) => t + 1), []);
    const [colorChoice, setColorChoice] = useState(trainer.userColor);

    const renderStatusBanner = () => {
        switch (trainer.status) {
            case "idle":
                return (
                    <div className="training-banner">Starting session...</div>
                );
            case "awaiting-user":
                return (
                    <div className="training-banner">
                        Your move (
                        {trainer.userColor === "w" ? "White" : "Black"})
                    </div>
                );
            case "correct":
                return <div className="training-banner correct">Correct!</div>;
            case "wrong-move":
                return (
                    <div className="training-banner wrong">
                        Not quite — try again
                    </div>
                );
            case "line-complete":
                return (
                    <div className="training-banner correct">
                        Line complete ✓
                    </div>
                );
            case "session-complete":
                return (
                    <div className="training-banner session-complete">
                        Session complete
                    </div>
                );
            default:
                return null;
        }
    };

    if (trainer.status === "session-complete") {
        return (
            <div className="training-page">
                <div className="training-complete-screen">
                    <h2>Session Complete</h2>
                    <p>
                        {trainer.stats.linesCompleted} /{" "}
                        {trainer.stats.totalLines} lines drilled
                    </p>
                    <p>
                        {trainer.stats.correct} correct moves,{" "}
                        {trainer.stats.incorrect} mistakes
                    </p>
                    <button
                        onClick={() => {
                            trainer.userColor = colorChoice;
                            trainer.startSession();
                            update();
                        }}
                    >
                        Train Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="training-page">
            {renderStatusBanner()}
            <AnalysisChessBoard doc={trainer} updateCallback={update} />
        </div>
    );
}
