// OpeningExplorer.jsx
import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { ScoreVisualization } from "../../../../../../Components/OpeningExplorer/OpeningExplorer";
import "./OpeningExplorer.css";

export default function OpeningExplorer({ tabData }) {
    const [, forceUpdate] = useState(0);
    const [loading, setLoading] = useState(false);
    const lastRequestedFen = useRef(null);

    const currentFen = tabData?.chessDocument?._getCurrentFen?.();

    // Re-render whenever the tab's data changes. databaseRef.onChange is
    // bound to chessDocument.notify (Tab.setDatabaseReference), so this
    // fires once the explorer fetch resolves and databaseRef.explorer updates.
    useEffect(() => {
        if (!tabData) return;
        return tabData.chessDocument.subscribe(() => {
            forceUpdate((v) => v + 1);
        });
    }, [tabData]);

    // Re-fetch the explorer table whenever the position changes.
    useEffect(() => {
        if (!tabData || !currentFen) return;
        if (lastRequestedFen.current === currentFen) return;
        lastRequestedFen.current = currentFen;

        let cancelled = false;
        setLoading(true);
        Promise.resolve(tabData.requestOpeningExplorer()).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [tabData, currentFen]);

    const handleClickMove = (san) => {
        if (!tabData || !currentFen) return;
        const scratch = new Chess(currentFen);
        let moveResult;
        try {
            moveResult = scratch.move(san);
        } catch {
            moveResult = null;
        }
        if (!moveResult) {
            console.warn(`OpeningExplorer: could not resolve SAN "${san}"`);
            return;
        }
        // tryMove plays the move on chessDocument AND re-requests the
        // explorer for the new position; the effect above also picks up
        // the currentFen change as a fallback, but this avoids waiting
        // an extra render.
        tabData.tryMove(moveResult.from, moveResult.to);
    };

    const moves = tabData?.databaseRef?.explorer?.moves ?? [];
    const noDatabase = !tabData?.databaseRef?.currentDatabase;

    return (
        <div className="opening-explorer">
            <div className={`move-section ${loading ? "oe-loading" : ""}`}>
                <div className="move-section-headers move-section-row">
                    <div className="move-section-header">Move</div>
                    <div className="move-section-header">Games</div>
                    <div className="move-section-header">Score</div>
                    <div className="move-section-header">Avg Rating</div>
                </div>
                <div className="move-section-content">
                    {noDatabase && (
                        <div className="oe-status-row">No database open.</div>
                    )}
                    {!noDatabase &&
                        moves.map((m) => (
                            <div
                                className="move-section-row"
                                key={m.san}
                                onClick={() => handleClickMove(m.san)}
                            >
                                <div className="move-section-data oe-san">
                                    {m.san}
                                </div>
                                <div className="move-section-data">
                                    {m.games}
                                </div>
                                <div className="move-section-data">
                                    <ScoreVisualization
                                        white={m.whiteWins}
                                        draw={m.draws}
                                        black={m.blackWins}
                                    />
                                </div>
                                <div className="move-section-data">
                                    {m.avgRating
                                        ? Math.round(m.avgRating)
                                        : "\u2013"}
                                </div>
                            </div>
                        ))}
                    {!noDatabase && !loading && moves.length === 0 && (
                        <div className="oe-status-row">No games found</div>
                    )}
                    {loading && (
                        <div className="oe-status-row oe-loading-row">
                            Loading{"\u2026"}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
