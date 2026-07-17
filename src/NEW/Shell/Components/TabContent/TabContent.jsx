import { useLayoutEffect, useRef, useState } from "react";
import ChessBoard from "../../../ChessBoard/ChessBoard";
import "./TabContent.css";
export default function TabContent({ activeTabRef }) {
    const chooseTabLayout = (tabType) => {
        switch (tabType) {
            case "Analysis":
                return <AnalysisPage activeTabRef={activeTabRef} />;
            case "Repertoire":
                return <RepertoirePage />;
            default:
                console.error("TabType not defined:", tabType);
        }
    };
    return (
        <div
            className={`tab-content ${activeTabRef == null || activeTabRef == undefined ? "full-hidden" : ""}`}
        >
            {chooseTabLayout(activeTabRef?.tabType)}
        </div>
    );
}
function AnalysisPage({ activeTabRef }) {
    // For measuring the component for the board
    const elementRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    useLayoutEffect(() => {
        if (!elementRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });
        resizeObserver.observe(elementRef.current);
        return () => resizeObserver.disconnect();
    }, []);
    return (
        <div className="tab-page analysis-page">
            <div className="analysis-board-location" ref={elementRef}>
                <ChessBoard
                    tabDocument={activeTabRef}
                    inWidth={
                        Math.min(dimensions.height, dimensions.width) - 150
                    }
                />
            </div>
            <div className="tab-panel-location"></div>
        </div>
    );
}
function RepertoirePage() {
    return <div>Repertoire</div>;
}
