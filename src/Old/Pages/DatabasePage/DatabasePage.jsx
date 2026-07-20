import "./DatabasePage.css";
import { useEffect, useState } from "react";
import TabPanel from "../../ReusableComponents/TabPanel/TabPanel";

export default function DatabasePage({ data, onOpenGameInAnalysis }) {
    const [, setVersion] = useState(0);
    const [newDbName, setNewDbName] = useState("");
    const [renamingName, setRenamingName] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [pasteText, setPasteText] = useState("");
    const [showPasteBox, setShowPasteBox] = useState(false);
    const [explorerInput, setExplorerInput] = useState("");

    const update = () => setVersion((v) => v + 1);

    useEffect(() => {
        data.onChange = update;
        data.init();
        return () => {
            if (data.onChange === update) data.onChange = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const f = data.filters;
    const setFilter = (key) => (e) => data.setFilter(key, e.target.value);

    const handleCreate = async () => {
        if (!newDbName.trim()) return;
        await data.createDatabase(newDbName.trim());
        setNewDbName("");
    };

    const handleRenameSubmit = async (oldName) => {
        await data.renameDatabase(oldName, renameValue);
        setRenamingName(null);
        setRenameValue("");
    };

    const handlePasteImport = async () => {
        if (!pasteText.trim()) return;
        await data.importPgnText(pasteText, "clipboard");
        setPasteText("");
        setShowPasteBox(false);
    };

    const sortArrow = (col) =>
        f.sortBy === col ? (f.sortDesc ? " \u25BC" : " \u25B2") : "";

    const gamesTabContent = (
        <div className="db-games-tab">
            <div className="db-filter-bar">
                <input
                    className="db-input"
                    placeholder="Player (either color)"
                    value={f.player}
                    onChange={setFilter("player")}
                />
                <input
                    className="db-input db-input-small"
                    placeholder="ECO"
                    value={f.eco}
                    onChange={setFilter("eco")}
                />
                <select className="db-input db-input-small" value={f.result} onChange={setFilter("result")}>
                    <option value="">Any result</option>
                    <option value="1-0">1-0</option>
                    <option value="0-1">0-1</option>
                    <option value="1/2-1/2">1/2-1/2</option>
                </select>
                <input
                    className="db-input db-input-small"
                    placeholder="From (YYYY)"
                    value={f.dateFrom}
                    onChange={setFilter("dateFrom")}
                />
                <input
                    className="db-input db-input-small"
                    placeholder="To (YYYY)"
                    value={f.dateTo}
                    onChange={setFilter("dateTo")}
                />
                <input
                    className="db-input db-input-small"
                    placeholder="Min Elo (both)"
                    value={f.minElo}
                    onChange={setFilter("minElo")}
                />
                <input
                    className="db-input"
                    placeholder="Move sequence, e.g. 1.e4 c6"
                    value={f.moveSequence}
                    onChange={setFilter("moveSequence")}
                />
                <button className="db-btn db-btn-primary" onClick={() => data.search()}>
                    Search
                </button>
            </div>

            {data.stats && (
                <div className="db-stats-bar">
                    <span>{data.stats.totalGames} games</span>
                    <span>White {data.stats.whiteWinPct.toFixed(1)}%</span>
                    <span>Draw {data.stats.drawPct.toFixed(1)}%</span>
                    <span>Black {data.stats.blackWinPct.toFixed(1)}%</span>
                    {data.stats.avgWhiteElo && (
                        <span>
                            Avg Elo {Math.round((data.stats.avgWhiteElo + data.stats.avgBlackElo) / 2)}
                        </span>
                    )}
                </div>
            )}

            <div className="db-table-wrapper">
                <table className="db-table">
                    <thead>
                        <tr>
                            <th onClick={() => data.sortBy("white")}>White{sortArrow("white")}</th>
                            <th onClick={() => data.sortBy("black")}>Black{sortArrow("black")}</th>
                            <th>Result</th>
                            <th onClick={() => data.sortBy("date")}>Date{sortArrow("date")}</th>
                            <th>Event</th>
                            <th>ECO</th>
                            <th>Opening</th>
                            <th onClick={() => data.sortBy("elo")}>Rating{sortArrow("elo")}</th>
                            <th>Length</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.results.games.map((g) => (
                            <tr key={g.id} onClick={() => data.openGame(g.id)}>
                                <td>{g.white || "?"}</td>
                                <td>{g.black || "?"}</td>
                                <td>{g.result || "*"}</td>
                                <td>{g.date || ""}</td>
                                <td className="db-cell-truncate">{g.event || ""}</td>
                                <td>{g.eco || ""}</td>
                                <td className="db-cell-truncate">{g.openingName || ""}</td>
                                <td>
                                    {g.whiteElo || "?"}/{g.blackElo || "?"}
                                </td>
                                <td>{Math.ceil((g.plyCount || 0) / 2)}</td>
                            </tr>
                        ))}
                        {data.results.games.length === 0 && (
                            <tr>
                                <td colSpan={9} className="db-empty-row">
                                    {data.currentDatabase ? "No games match these filters." : "Open a database to browse games."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="db-pagination">
                <button
                    className="db-btn"
                    disabled={f.offset === 0}
                    onClick={() => data.prevPage()}
                >
                    Prev
                </button>
                <span>
                    {f.offset + 1}
                    {"\u2013"}
                    {Math.min(f.offset + f.limit, data.results.totalCount)} of {data.results.totalCount}
                </span>
                <button
                    className="db-btn"
                    disabled={f.offset + f.limit >= data.results.totalCount}
                    onClick={() => data.nextPage()}
                >
                    Next
                </button>
            </div>
        </div>
    );

    const explorerTabContent = (
        <div className="db-explorer-tab">
            <div className="db-filter-bar">
                <input
                    className="db-input"
                    placeholder="Move sequence, e.g. 1.e4 c6 (blank = starting position)"
                    value={explorerInput}
                    onChange={(e) => setExplorerInput(e.target.value)}
                />
                <button className="db-btn db-btn-primary" onClick={() => data.loadExplorer(explorerInput)}>
                    Explore
                </button>
            </div>
            {data.explorer ? (
                <div className="db-table-wrapper">
                    <table className="db-table">
                        <thead>
                            <tr>
                                <th>Move</th>
                                <th>Games</th>
                                <th>Score % (White)</th>
                                <th>White</th>
                                <th>Draw</th>
                                <th>Black</th>
                                <th>Avg Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.explorer.moves.map((m) => (
                                <tr
                                    key={m.san}
                                    onClick={() => {
                                        const nextSeq = `${explorerInput} ${m.san}`.trim();
                                        setExplorerInput(nextSeq);
                                        data.loadExplorer(nextSeq);
                                    }}
                                >
                                    <td>{m.san}</td>
                                    <td>{m.games}</td>
                                    <td>{m.scorePct.toFixed(1)}</td>
                                    <td>{m.whiteWins}</td>
                                    <td>{m.draws}</td>
                                    <td>{m.blackWins}</td>
                                    <td>{m.avgRating ? Math.round(m.avgRating) : "\u2013"}</td>
                                </tr>
                            ))}
                            {data.explorer.moves.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="db-empty-row">
                                        No games reach this position.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="db-empty-row">Click Explore to see the opening tree from this position.</div>
            )}
        </div>
    );

    const tabs = [
        { key: "games", label: "Games", content: gamesTabContent },
        { key: "explorer", label: "Opening Explorer", content: explorerTabContent },
    ];

    const actions = [
        {
            key: "import-file",
            label: "Import PGN Files",
            onClick: () => data.importPgnFile(),
        },
        {
            key: "import-paste",
            label: "Paste PGN",
            onClick: () => setShowPasteBox((s) => !s),
        },
    ];

    return (
        <div className="database-page">
            <div className="db-sidebar">
                <div className="db-sidebar-header">Databases</div>
                <div className="db-list">
                    {data.databases.map((db) => (
                        <div
                            key={db.name}
                            className={`db-list-item ${db.isOpen ? "db-list-item-open" : ""}`}
                        >
                            {renamingName === db.name ? (
                                <input
                                    autoFocus
                                    className="db-input"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit(db.name)}
                                    onBlur={() => handleRenameSubmit(db.name)}
                                />
                            ) : (
                                <div
                                    className="db-list-item-name"
                                    onClick={() => data.openDatabase(db.name)}
                                    title={db.path}
                                >
                                    {db.name}
                                </div>
                            )}
                            <div className="db-list-item-meta">{db.gameCount} games</div>
                            <div className="db-list-item-actions">
                                <span
                                    onClick={() => {
                                        setRenamingName(db.name);
                                        setRenameValue(db.name);
                                    }}
                                >
                                    Rename
                                </span>
                                <span onClick={() => data.deleteDatabase(db.name)}>Delete</span>
                            </div>
                        </div>
                    ))}
                    {data.databases.length === 0 && (
                        <div className="db-empty-row">No databases yet.</div>
                    )}
                </div>
                <div className="db-sidebar-create">
                    <input
                        className="db-input"
                        placeholder="New database name"
                        value={newDbName}
                        onChange={(e) => setNewDbName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                    <button className="db-btn db-btn-primary" onClick={handleCreate}>
                        Create
                    </button>
                </div>
                {data.currentDatabase && (
                    <div className="db-sidebar-current">
                        Current: <strong>{data.currentDatabase}</strong>
                        <button className="db-btn" onClick={() => data.closeDatabase()}>
                            Close
                        </button>
                    </div>
                )}
                {data.error && <div className="db-error">{data.error}</div>}
                {data.loading && <div className="db-loading">Working\u2026</div>}
            </div>

            <div className="db-main">
                {showPasteBox && (
                    <div className="db-paste-box">
                        <textarea
                            placeholder="Paste PGN text here — multiple games in one paste are fine"
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                        />
                        <div className="db-paste-box-actions">
                            <button className="db-btn db-btn-primary" onClick={handlePasteImport}>
                                Import
                            </button>
                            <button className="db-btn" onClick={() => setShowPasteBox(false)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                {data.importProgress && (
                    <div className="db-import-summary db-import-progress">
                        Importing file {data.importProgress.done} of {data.importProgress.total}
                        {"\u2026"}
                    </div>
                )}
                {data.importSummary && !data.importProgress && (
                    <div className="db-import-summary">
                        <span className="db-import-summary-line">
                            Imported {data.importSummary.imported}, skipped{" "}
                            {data.importSummary.skippedDuplicates}
                            {data.importSummary.failed > 0 && `, failed ${data.importSummary.failed}`}
                        </span>
                        {data.importSummary.errors.length > 0 && (
                            <ul className="db-import-errors">
                                {data.importSummary.errors.slice(0, 5).map((err, i) => (
                                    <li key={i}>{err}</li>
                                ))}
                                {data.importSummary.errors.length > 5 && (
                                    <li>{`\u2026and ${data.importSummary.errors.length - 5} more`}</li>
                                )}
                            </ul>
                        )}
                    </div>
                )}

                <TabPanel tabs={tabs} actions={actions} />

                {data.selectedGame && (
                    <div className="db-game-overlay" onClick={() => data.closeSelectedGame()}>
                        <div className="db-game-panel" onClick={(e) => e.stopPropagation()}>
                            <div className="db-game-panel-header">
                                <div>
                                    {data.selectedGame.white} vs {data.selectedGame.black}
                                    {" \u2014 "}
                                    {data.selectedGame.result}
                                </div>
                                <span onClick={() => data.closeSelectedGame()}>×</span>
                            </div>
                            <div className="db-game-panel-meta">
                                {data.selectedGame.event} {data.selectedGame.date && `\u00b7 ${data.selectedGame.date}`}
                                {data.selectedGame.eco && ` \u00b7 ${data.selectedGame.eco}`}
                                {data.selectedGame.openingName && ` \u00b7 ${data.selectedGame.openingName}`}
                            </div>
                            <pre className="db-game-pgn">{data.selectedGame.pgn}</pre>
                            <div className="db-game-panel-actions">
                                {onOpenGameInAnalysis && (
                                    <button
                                        className="db-btn db-btn-primary"
                                        onClick={() =>
                                            onOpenGameInAnalysis(
                                                data.selectedGame.pgn,
                                                `${data.selectedGame.white} vs ${data.selectedGame.black}`,
                                            )
                                        }
                                    >
                                        Open in Analysis
                                    </button>
                                )}
                                <button
                                    className="db-btn db-btn-danger"
                                    onClick={() => data.deleteGame(data.selectedGame.id)}
                                >
                                    Delete Game
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
