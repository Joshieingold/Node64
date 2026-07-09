import "./AnalysisPage.css";
import { useState, useEffect } from "react";
import Notation from "../Components/Notation/Notation";
import ChessBoard from "../Components/Board/Board";
import SFToggle from "../Components/StockFish/SFToggle";
import EvalBar from "../Components/StockFish/EvalBar";
import OptionsBar from "../Components/OptionsBar/OptionsBar";
import RepertoireTree from "../Components/RepertoireGraph/RepertoireGraph";

export default function AnalysisPage({ data }) {
    const [, setVersion] = useState(0);
    const update = () => {
        setVersion((v) => v + 1);
    };
    console.log(data.createRepertoire());

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
            <RepertoireTree root={data.root} />
        </div>
    );
}
