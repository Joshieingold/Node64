import "./StockfishDock.css";
import { useState } from "react";
export default function StockfishDock({ stockfishManager }) {
    const [switchState, setSwitchState] = useState(false);
    const handleSwitch = () => {
        setSwitchState((prev) => !prev);
        if (!switchState) {
            stockfishManager.turnOnStockFish();
        } else {
            stockfishManager.turnOffStockFish();
        }
    };
    const getEval = () => {
        if (!switchState) {
            return "--";
        }
        if (!stockfishManager.engineInfo.evaluation) {
            return "...";
        }
        return stockfishManager.engineInfo.evaluation;
    };
    const getBestMove = () => {
        if (!switchState) {
            return "--";
        }
        if (!stockfishManager.engineInfo.bestMove) {
            return "...";
        }
        return stockfishManager.engineInfo.bestMove;
    };
    const getDepth = () => {
        if (!switchState) {
            return "Depth: 0";
        }
        if (!stockfishManager.engineInfo.depth) {
            return "Depth: 1";
        }
        return `Depth: ${stockfishManager.engineInfo.depth}`;
    };
    const getBestLine = () => {
        return "BEST LINE WILL GO HERE SOMETIME";
    };
    return (
        <div className="stockfish-dock">
            <div className="top-container">
                <div
                    className={`switch-button-wrapper ${switchState ? "wrapper-active" : ""}`}
                    onClick={() => handleSwitch()}
                >
                    <div
                        className={`circle ${switchState ? "circle-on" : "circle-off"}`}
                    />
                </div>
                <div className="evaluation-text">{getEval()}</div>
                <div className="best-move">{getBestMove()}</div>
                <div className="depth">{getDepth()}</div>
            </div>
            <div className="top-line-container">{getBestLine()}</div>
        </div>
    );
}
