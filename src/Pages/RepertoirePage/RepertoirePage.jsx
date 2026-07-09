import "./RepertoirePage.css";
import { useState, useEffect } from "react";
import ChessBoard from "../../Components/Board/Board";
import RepertoireGraph from "../../Components/RepertoireGraph/RepertoireGraph";

export default function RepertoirePage({ data }) {
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
    return (
        <div className="repertoire-page">
            <div className="repertoire-board-container">
                <ChessBoard data={data} update={update} />
            </div>
            <div className="repertoire-graph-container">
                <RepertoireGraph nodeData={data.root} update={update} />
            </div>
        </div>
    );
}
