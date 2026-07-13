import "./RepertoirePage.css";
import { useState, useEffect } from "react";
import RepertoireGraph from "../../Components/RepertoireGraph/RepertoireGraph";
import Notation from "../../Components/Notation/Notation";
import { SaveAsButton, SaveButton } from "../../ReusableComponents/SaveButton";
import { AnalysisChessBoard } from "../../NEW/ChessBoard/ChessBoard";
import TabPanel from "../../ReusableComponents/TabPanel/TabPanel";

export default function RepertoirePage({ data, onReviewAllLines }) {
    const [, setVersion] = useState(0);
    const update = () => {
        setVersion((v) => v + 1);
    };
    const tabs = [
        {
            key: "NodeView",
            label: "Node View",
            content: <RepertoireGraph data={data} update={update} />,
        },
        {
            key: "ScoreSheet",
            label: "ScoreSheet View",
            content: <Notation data={data} update={update} />,
        },
    ];
    const actions = [
        {
            key: "memorize",
            label: "Memorize Lines",
            onClick: () => onReviewAllLines({ userColor: "w" }),
        },
    ];

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
                <TabPanel
                    tabs={tabs}
                    extraControls={
                        <>
                            <SaveAsButton data={data} />
                            <SaveButton data={data} />
                        </>
                    }
                    actions={actions}
                />
            </div>
        </div>
    );
}
