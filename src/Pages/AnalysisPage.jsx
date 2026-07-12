import "./AnalysisPage.css";
import { useState, useEffect } from "react";
import Notation from "../Components/Notation/Notation";
import SFToggle from "../Components/StockFish/SFToggle";
import EvalBar from "../Components/StockFish/EvalBar";
import OptionsBar from "../Components/OptionsBar/OptionsBar";
import { AnalysisChessBoard } from "../NEW/ChessBoard/ChessBoard";

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

    return (
        <div className="analysis-page">
            <div className="content-container">
                <div className="board-wrapper">
                    <AnalysisChessBoard doc={data} updateCallback={update} />
                    <EvalBar data={data} update={update} />
                </div>
                <div className="right-content-container">
                    <OptionsBar data={data} />
                    <SFToggle data={data} />
                    <Notation data={data} update={update} />
                </div>
            </div>
        </div>
    );
}
