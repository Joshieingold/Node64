import "./RepertoirePage.css";
import { useState, useEffect } from "react";
import RepertoireTree from "../../Components/RepertoireGraph/RepertoireGraph";
import ChessBoard from "../../Components/Board/Board";

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
            <RepertoireTree nodeRef={data.root} update={update} />
        </div>
    );
}
