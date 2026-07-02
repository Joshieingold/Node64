import { useState } from "react";
import ChessBoard from "../Components/ChessBoard";
import Notation from "../Components/Notation";
import Tab from "../DataClasses/Tab";

export default function AnalysisPage({ data }) {
    const [pageData, setPageData] = useState(data.pageData);
    return (
        <div>
            <ChessBoard data={pageData} />
            <Notation data={pageData} />
        </div>
    );
}
