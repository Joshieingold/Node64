import "./AnalysisPage.css";
import { useState, useEffect } from "react";
import Notation from "../../Components/Notation/Notation";
import EvalBar from "../../Components/StockFish/EvalBar";
import { SaveButton } from "../../ReusableComponents/SaveButton";
import { AnalysisChessBoard } from "../../Components/ChessBoard/ChessBoard.jsx";
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
    }, [data, update]);

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
                <div className="main-content">
                    <div
                        className={`player-info ${flipped === true ? "reverse" : ""}`}
                    >
                        <PlayerShowcase
                            name={data.pgnData.blackName}
                            elo={data.pgnData.blackElo}
                            color={"black"}
                        />
                        <div className="board-wrapper">
                            <AnalysisChessBoard
                                doc={data}
                                updateCallback={update}
                                onFlip={onFlip}
                                inWidth={40}
                            />
                        </div>
                        <PlayerShowcase
                            name={data.pgnData.whiteName}
                            elo={data.pgnData.whiteElo}
                            color={"white"}
                        />
                    </div>
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
