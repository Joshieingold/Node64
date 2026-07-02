import "./AnalysisPage.css";
import { useState } from "react";
import Notation from "../Components/Notation";
import ChessBoard from "../Components/Board/Board";

export default function AnalysisPage({ data }) {
    const [pageData, setPageData] = useState(data);
    const [version, setVersion] = useState(0);
    return (
        <div className="analysis-page">
            <div className="board-wrapper">
                <ChessBoard
                    data={pageData}
                    onChange={() => setVersion((v) => v + 1)}
                />
            </div>
            <Notation data={pageData} version={version} />
        </div>
    );
}
