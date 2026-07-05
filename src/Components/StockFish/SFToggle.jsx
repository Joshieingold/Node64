import "./SFToggle.css";
import { useState } from "react";

export default function SFToggle({ data }) {
    const [doAnalysis, setDoAnalysis] = useState(false);
    const HandleAnalysis = () => {
        setDoAnalysis((prevState) => !prevState);
        // Request stockfish json;
        if (!doAnalysis) {
            data.turnOnStockFish();
        } else {
            data.turnOffStockFish();
            console.log("dead fish");
        }
    };
    const GetEval = () => {
        if (!doAnalysis) {
            return "--";
        }
        if (!data.engineInfo.evaluation) {
            return "...";
        }
        return data.engineInfo.evaluation;
    };
    const GetBestMove = () => {
        if (!doAnalysis) {
            return "--";
        }
        if (!data.engineInfo.bestMove) {
            return "...";
        }
        return data.engineInfo.bestMove;
    };
    const GetDepth = () => {
        if (!doAnalysis) {
            return "Depth: 0";
        }
        if (!data.engineInfo.depth) {
            return "Depth: 1";
        }
        return `Depth: ${data.engineInfo.depth}`;
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
            <div className="evaluation">{GetEval()}</div>
            <div className="best-move">{GetBestMove()}</div>
            <div className="depth">{GetDepth()}</div>
        </div>
    );
}
