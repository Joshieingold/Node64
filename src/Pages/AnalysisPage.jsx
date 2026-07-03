import "./AnalysisPage.css";
import { useState } from "react";
import Notation from "../Components/Notation";
import ChessBoard from "../Components/Board/Board";
import SFToggle from "../Components/StockFish/SFToggle";

export default function AnalysisPage({ data }) {
    const [, setVersion] = useState(0);

    const update = () => setVersion((v) => v + 1);

    data.onChange = update;

    return (
        <div className="analysis-page">
            <div className="board-wrapper">
                <ChessBoard data={data} update={update} />
            </div>

            <div className="right-content-container">
                <SFToggle />
                <Notation data={data} update={update} />
            </div>
        </div>
    );
}
