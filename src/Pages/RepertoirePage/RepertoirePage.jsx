import "./RepertoirePage.css";
import { useState, useEffect } from "react";
import RepertoireGraph from "../../Components/RepertoireGraph/RepertoireGraph";
import Notation from "../../Components/Notation/Notation";
import { SaveAsButton, SaveButton } from "../../ReusableComponents/SaveButton";
import TabPanel from "../../ReusableComponents/TabPanel/TabPanel";
import { AnalysisChessBoard } from "../../Components/ChessBoard/ChessBoard";

export default function RepertoirePage({ data, onReviewAllLines }) {
    const [, setVersion] = useState(0);
    const update = () => {
        setVersion((v) => v + 1);
    };
    const tabs = [
        {
            key: "NodeView",
            label: "Tree",
            content: <RepertoireGraph data={data} update={update} />,
        },
        {
            key: "ScoreSheet",
            label: "ScoreSheet",
            content: <Notation data={data} update={update} />,
        },
    ];
    const actions = [
        {
            key: "memorize",
            label: "Learn",
            onClick: () => onReviewAllLines({ userColor: data.orientation }),
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
    const onFlip = () => {
        if (data.orientation === "b") {
            data.orientation = "w";
        } else {
            data.orientation = "b";
        }
    };
    return (
        <div className="repertoire-page">
            <div className="repertoire-board-container">
                <AnalysisChessBoard
                    onFlip={onFlip}
                    doc={data}
                    updateCallback={update}
                />
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
