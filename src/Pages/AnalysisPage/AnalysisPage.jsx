import "./AnalysisPage.css";
import { useState, useEffect } from "react";
import Notation from "../../Components/Notation/Notation";
import EvalBar from "../../Components/StockFish/EvalBar";
import { SaveButton } from "../../ReusableComponents/SaveButton";
import { AnalysisChessBoard } from "../../NEW/ChessBoard/ChessBoard.jsx";
import TabPanel from "../../ReusableComponents/TabPanel/TabPanel";
import SFToggle from "../../Components/StockFish/SFToggle.jsx";

export default function AnalysisPage({ data }) {
    const [, setVersion] = useState(0);
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

    const tabs = [
        {
            key: "ScoreSheet",
            label: "ScoreSheet",
            content: <Notation data={data} update={update} />,
        },
    ];
    const actions = [
        {
            key: "GameReview",
            label: "Game Review",
            onClick: () => {
                console.log("Hello Game Review");
            },
        },
        {
            key: "Import",
            label: "Import",
            onClick: () => {
                console.log("Hello Import");
            },
        },
    ];

    return (
        <div className="analysis-page">
            <div className="content-container">
                <div className="board-wrapper">
                    <AnalysisChessBoard doc={data} updateCallback={update} />
                    <EvalBar data={data} update={update} />
                </div>
                <div className="right-content-container">
                    <SFToggle data={data} update={update} />
                    <div className="analysis-tab-panel-container">
                        <TabPanel
                            tabs={tabs}
                            extraControls={
                                <>
                                    <SaveButton data={data} />
                                </>
                            }
                            actions={actions}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
