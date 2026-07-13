import "./AnalysisPage.css";
import { useState, useEffect } from "react";
import Notation from "../../Components/Notation/Notation";
import EvalBar from "../../Components/StockFish/EvalBar";
import { SaveButton } from "../../ReusableComponents/SaveButton";
import { AnalysisChessBoard } from "../../NEW/ChessBoard/ChessBoard.jsx";
import TabPanel from "../../ReusableComponents/TabPanel/TabPanel";
import SFToggle from "../../Components/StockFish/SFToggle.jsx";
import PlayerShowcase from "../../Components/PlayerShowcase/PlayerShowcase.jsx";

export default function AnalysisPage({ data }) {
    const [, setVersion] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const update = () => {
        setVersion((v) => v + 1);
    };
    const onFlip = () => {
        setFlipped((prev) => !prev);
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
                <div
                    className={`player-info ${flipped === true ? "reverse" : ""}`}
                >
                    <PlayerShowcase
                        name={data.pgnData.blackName}
                        elo={data.pgnData.blackElo}
                        color={"black"}
                    />
                    <PlayerShowcase
                        name={data.pgnData.whiteName}
                        elo={data.pgnData.whiteElo}
                        color={"white"}
                    />
                </div>
                <div className="board-wrapper">
                    <AnalysisChessBoard
                        doc={data}
                        updateCallback={update}
                        onFlip={onFlip}
                    />
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
