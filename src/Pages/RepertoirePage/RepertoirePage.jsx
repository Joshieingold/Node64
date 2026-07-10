import "./RepertoirePage.css";
import { useState, useEffect } from "react";
import ChessBoard from "../../Components/Board/Board";
import RepertoireGraph from "../../Components/RepertoireGraph/RepertoireGraph";
import Notation from "../../Components/Notation/Notation";

export default function RepertoirePage({ data }) {
    const [, setVersion] = useState(0);
    const [currentPanelView, setCurrentPanelView] = useState("NodeView");
    const update = () => {
        setVersion((v) => v + 1);
    };

    useEffect(() => {
        data.onChange = update;
        return () => {
            if (data.onChange === update) {
                data.onChange = null;
            }
        };
    });
    return (
        <div className="repertoire-page">
            <div className="repertoire-board-container">
                <ChessBoard data={data} update={update} />
            </div>
            <div className="tab-panel-container">
                <div className="panel-control-wrapper">
                    <div
                        className="panel-option"
                        onClick={() => setCurrentPanelView("NodeView")}
                    >
                        Node View
                    </div>
                    <div
                        className="panel-option"
                        onClick={() => setCurrentPanelView("ScoreSheet")}
                    >
                        ScoreSheet View
                    </div>
                    <div className="panel-option">Memorize Lines</div>
                </div>
                <div className="panel-options-wrapper">
                    <div
                        className={`panel-view ${currentPanelView === "NodeView" ? "" : "hidden"}`}
                    >
                        <RepertoireGraph data={data} update={update} />
                    </div>
                    <div
                        className={`panel-view ${currentPanelView === "ScoreSheet" ? "" : "hidden"}`}
                    >
                        <Notation data={data} />
                    </div>
                </div>
            </div>
        </div>
    );
}
