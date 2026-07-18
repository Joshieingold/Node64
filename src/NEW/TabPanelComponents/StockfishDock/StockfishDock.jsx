import "./StockfishDock.css";

export default function StockfishDock({ activeTabRef }) {
    const stockfishData = activeTabRef.chessDocument.stockfishData;
    const switchState = stockfishData.enabled;

    const handleSwitch = () => {
        if (!switchState) {
            stockfishData.turnOnStockFish();
        } else {
            stockfishData.turnOffStockFish();
        }
    };

    const getEval = () => {
        if (!switchState) return "--";
        if (!stockfishData.engineInfo.evaluation) return "...";
        return stockfishData.engineInfo.evaluation;
    };

    const getBestMove = () => {
        if (!switchState) return "--";
        if (!stockfishData.engineInfo.bestMove) return "...";
        return stockfishData.engineInfo.bestMove;
    };

    const getDepth = () => {
        if (!switchState) return "Depth: 0";
        if (!stockfishData.engineInfo.depth) return "Depth: 1";
        return `Depth: ${stockfishData.engineInfo.depth}`;
    };

    const getBestLine = () => "BEST LINE WILL GO HERE SOMETIME";

    return (
        <div className="stockfish-dock">
            <div className="top-container">
                <div
                    className={`switch-button-wrapper ${switchState ? "wrapper-active" : ""}`}
                    onClick={handleSwitch}
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
