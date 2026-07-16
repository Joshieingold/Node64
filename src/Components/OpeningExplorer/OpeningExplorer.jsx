import "./OpeningExplorer.css";
import { useEffect } from "react";
import { Chess } from "chess.js";

/**
 * OpeningExplorer
 *
 * Live panel: always shows the explorer table for gameData's current
 * position, and clicking a move plays it (which moves currentNode via
 * StandardDocument.movePiece, which re-triggers the effect below to fetch
 * the new position's table).
 */
export default function OpeningExplorer({ gameData, databaseData, update }) {
    // AnalysisDocument._getCurrentFen(): currentNode.move.after if a move
    // has been played, otherwise chessData.game.fen() at the root.
    const currentFen = gameData?._getCurrentFen?.();

    useEffect(() => {
        if (!currentFen || !databaseData?.currentDatabase) return;
        databaseData.loadExplorerByFen(currentFen);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFen, databaseData?.currentDatabase]);

    const handleClickMove = async (san) => {
        if (!gameData || !currentFen || !databaseData) return;
        // StandardDocument only exposes movePiece(from, to) -- not a
        // SAN-based method -- so resolve the SAN against a scratch chess.js
        // instance (not gameData's own game) just to get {from, to}.
        const scratch = new Chess(currentFen);
        let moveResult;
        try {
            moveResult = scratch.move(san);
        } catch {
            moveResult = null;
        }
        if (!moveResult) {
            console.warn(
                `OpeningExplorer: could not resolve SAN "${san}" from the current position`,
            );
            return;
        }
        // NOTE: movePiece(from, to) has no promotion parameter, so an
        // underpromotion move here would fall back to whatever ChessData's
        // default promotion behavior is (typically queen). Fine for the
        // vast majority of opening moves; flagging in case it matters.
        gameData.movePiece(moveResult.from, moveResult.to);
        if (update) update();
        // Fetch immediately using the FEN we already computed above, rather
        // than waiting for the effect to notice currentFen changed on the
        // next render -- removes one full render/IPC round trip of lag.
        await databaseData.loadExplorerByFen(moveResult.after);
    };

    if (!databaseData?.currentDatabase) {
        return (
            <div className="opening-explorer-panel">
                <div className="oe-empty">
                    Open a database to see the opening explorer.
                </div>
            </div>
        );
    }

    // databaseData.explorer starts out null and only becomes populated once
    // the effect above resolves -- this guard is what line 18 was missing.
    const moves = databaseData.explorer?.moves ?? [];

    return (
        <div className="opening-explorer-panel">
            <div className="move-section-wrapper">
                <table className="move-section">
                    <thead>
                        <tr>
                            <th>Move</th>
                            <th>Games</th>
                            <th>Score</th>
                            <th>Avg Rating</th>
                        </tr>
                    </thead>
                    <tbody>
                        {moves.map((m) => (
                            <tr
                                className="move-row"
                                key={m.san}
                                onClick={() => handleClickMove(m.san)}
                            >
                                <td className="oe-san">{m.san}</td>
                                <td>{m.games}</td>
                                <td>
                                    <ScoreVisualization
                                        white={m.whiteWins}
                                        draw={m.draws}
                                        black={m.blackWins}
                                    />
                                </td>
                                <td>
                                    {m.avgRating
                                        ? Math.round(m.avgRating)
                                        : "\u2013"}
                                </td>
                            </tr>
                        ))}
                        {moves.length === 0 && (
                            <tr>
                                <td colSpan={4} className="oe-empty-row">
                                    No games reach this position.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function ScoreVisualization({ white, draw, black }) {
    const size = white + draw + black;
    const getPercent = (num) => (size > 0 ? (num / size) * 100 : 0);

    return (
        <div className="score-visualization">
            {white > 0 && (
                <div
                    className="white-amount"
                    style={{ width: `${getPercent(white)}%` }}
                >
                    {white}
                </div>
            )}
            {draw > 0 && (
                <div
                    className="draw-amount"
                    style={{ width: `${getPercent(draw)}%` }}
                >
                    {draw}
                </div>
            )}
            {black > 0 && (
                <div
                    className="black-amount"
                    style={{ width: `${getPercent(black)}%` }}
                >
                    {black}
                </div>
            )}
        </div>
    );
}
