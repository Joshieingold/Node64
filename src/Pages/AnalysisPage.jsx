import { useState } from "react";
import Notation from "../Components/Notation";
import ChessBoard from "../Components/Board/Board";

export default function AnalysisPage({ data }) {
    const [pageData, setPageData] = useState(data.pageData);
    return (
        <div>
            <ChessBoard data={pageData} />
            <Notation data={pageData} />
        </div>
    );
}
