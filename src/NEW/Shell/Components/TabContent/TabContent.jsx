import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ChessBoard from "../../../ChessBoard/ChessBoard";
import "./TabContent.css";
import PlayerShowcase from "../../../ChessBoard/Components/PlayerShowcase/PlayerShowcase";
import EvalBar from "../../../ChessBoard/Components/EvalBar/EvalBar";
import TabPanel from "../../../Pages/Components/TabPanel/TabPanel";
import DatabasePage from "../../../../Pages/DatabasePage/DatabasePage";
export default function TabContent({ activeTabRef }) {
    const chooseTabLayout = (tabType) => {
        switch (tabType) {
            case "Analysis":
                return <AnalysisPage activeTabRef={activeTabRef} />;
            case "Repertoire":
                return <RepertoirePage />;
            case "Database":
                return <DatabasePage data={activeTabRef.databaseRef} />;

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
    const [, forceUpdate] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const onFlip = () => {
        setFlipped((prev) => !prev);
    };
    useEffect(() => {
        if (!activeTabRef) return;
        return activeTabRef.chessDocument.subscribe(() => {
            forceUpdate((v) => v + 1);
        });
    }, [activeTabRef]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const lastCommitted = useRef({ width: 0, height: 0 });

    useLayoutEffect(() => {
        if (!elementRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                const prev = lastCommitted.current;
                const changed =
                    Math.abs(width - prev.width) >= 3 ||
                    Math.abs(height - prev.height) >= 3;
                if (changed) {
                    lastCommitted.current = { width, height };
                    setDimensions({ width, height });
                }
            }
        });
        resizeObserver.observe(elementRef.current);
        return () => resizeObserver.disconnect();
    }, []);
    return (
        <div className="tab-page analysis-page">
            <div className="chess-board-components">
                <div
                    className={`analysis-page-main-content ${flipped ? "flip-content" : ""}`}
                >
                    <PlayerShowcase
                        inWidth={Math.min(dimensions.height, dimensions.width)}
                        docRef={activeTabRef}
                        color={"black"}
                    ></PlayerShowcase>
                    <div className="analysis-board-location" ref={elementRef}>
                        <ChessBoard
                            tabDocument={activeTabRef}
                            inWidth={Math.min(
                                dimensions.height,
                                dimensions.width,
                            )}
                            onFlip={onFlip}
                        />
                    </div>
                    <PlayerShowcase
                        inWidth={Math.min(dimensions.height, dimensions.width)}
                        docRef={activeTabRef}
                        color={"white"}
                    ></PlayerShowcase>
                </div>
                <EvalBar
                    inHeight={Math.min(dimensions.height, dimensions.width)}
                    stockfishDoc={activeTabRef.chessDocument.stockfishData}
                />
            </div>
            <div className="tab-panel-location">
                <TabPanel activeTabRef={activeTabRef} />
            </div>
        </div>
    );
}
function RepertoirePage() {
    return <div>Repertoire</div>;
}
