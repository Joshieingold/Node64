import "./StockfishDock.css";
import { useState } from "react";
export default function StockfishDock({ activeTabRef }) {
    const [switchState, setSwitchState] = useState(false);
    const handleSwitch = () => {
        setSwitchState((prev) => !prev);
        if (!switchState) {
            activeTabRef.chessDocument.stockfishData.turnOnStockFish();
        } else {
            activeTabRef.chessDocument.stockfishData.turnOffStockFish();
        }
    };
    const getEval = () => {
        if (!switchState) {
            return "--";
        }
        if (!activeTabRef.chessDocument.stockfishData.engineInfo.evaluation) {
            return "...";
        }
        return activeTabRef.chessDocument.stockfishData.engineInfo.evaluation;
    };
    const getBestMove = () => {
        if (!switchState) {
            return "--";
        }
        if (!activeTabRef.chessDocument.stockfishData.engineInfo.bestMove) {
            return "...";
        }
        return activeTabRef.chessDocument.stockfishData.engineInfo.bestMove;
    };
    const getDepth = () => {
        if (!switchState) {
            return "Depth: 0";
        }
        if (!activeTabRef.chessDocument.stockfishData.engineInfo.depth) {
            return "Depth: 1";
        }
        return `Depth: ${activeTabRef.chessDocument.stockfishData.engineInfo.depth}`;
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
                <div className="best-move-text">{getBestMove()}</div>
                <div className="depth-text">{getDepth()}</div>
            </div>
            <div className="top-line-container">{getBestLine()}</div>
        </div>
    );
}
