import "./RepertoirePage.css";
import { useState, useEffect } from "react";
import RepertoireGraph from "../../Components/RepertoireGraph/RepertoireGraph";
import Notation from "../../Components/Notation/Notation";
import { SaveAsButton, SaveButton } from "../../ReusableComponents/SaveButton";
import { AnalysisChessBoard } from "../../NEW/ChessBoard/ChessBoard";

export default function RepertoirePage({ data, onReviewAllLines }) {
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
                <AnalysisChessBoard doc={data} updateCallback={update} />
            </div>
            <div className="tab-panel-container">
                <div className="panel-control-wrapper">
                    <SaveAsButton data={data} />
                    <SaveButton data={data} />
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
                    <div
                        className="panel-option"
                        onClick={() => onReviewAllLines({ userColor: "w" })}
                    >
                        Memorize Lines
                    </div>
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
