import "./AnalysisPage.css";
import { useState, useEffect } from "react";
import Notation from "../Components/Notation/Notation";
import ChessBoard from "../Components/Board/Board";
import SFToggle from "../Components/StockFish/SFToggle";
import EvalBar from "../Components/StockFish/EvalBar";
import OptionsBar from "../Components/OptionsBar/OptionsBar";
import RepertoireDocument from "../DataClasses/RepertoireDocument";
import RepertoireViewer from "../Components/RepertoireGraph/RepertoireGraph";

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
            <RepertoireViewer
                chessDocument={data}
                repertoire={new RepertoireDocument(data)}
            />
        </div>
    );
}
