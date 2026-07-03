import "./SFToggle.css";
import { useState } from "react";

export default function SFToggle({ data }) {
    const [doAnalysis, setDoAnalysis] = useState(false);
    const [currentSfResponse, setCurrentSfResponse] = useState(null);
    const HandleAnalysis = () => {
        setDoAnalysis(!doAnalysis);
        // Request stockfish json;
        setCurrentSfResponse(data.requestStockFish);
        console.log(currentSfResponse);
    };
    const GetEval = () => {
        if (!doAnalysis) {
            return "--";
        }
        if (!currentSfResponse) {
            return "...";
        }
        return currentSfResponse.evaluation;
    };
    const GetBestMove = () => {
        if (!doAnalysis) {
            return "--";
        }
        if (!currentSfResponse) {
            return "...";
        }
        return currentSfResponse.bestMove;
    };
    return (
        <div className="sf-toggle">
            <div
                className={`toggler ${doAnalysis ? "toggle-on" : "toggle-off"}`}
                onClick={() => HandleAnalysis()}
            >
                <div
                    className={`toggle-circle ${doAnalysis ? "circle-on" : "circle-off"}`}
                ></div>
            </div>
            <div className="best-move">{GetBestMove()}</div>
            <div className="evaluation">{GetEval()}</div>
        </div>
    );
}
