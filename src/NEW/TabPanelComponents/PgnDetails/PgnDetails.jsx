import "./PgnDetails.css";
import { useState, useEffect } from "react";

const TITLES = [
    "None",
    "GM",
    "IM",
    "NM",
    "FM",
    "CM",
    "WGM",
    "WIM",
    "WFM",
    "WCM",
];

const RESULTS = ["1-0", "0-1", "½-½"];

const TERMINATIONS_BY_RESULT = {
    "1-0": ["Checkmate", "Resignation", "Timeout / Forfeit", "Abortion"],
    "0-1": ["Checkmate", "Resignation", "Timeout / Forfeit", "Abortion"],
    "½-½": [
        "Stalemate",
        "Dead Position",
        "Mutual Agreement",
        "Threefold Repetition",
        "50 Move Rule",
    ],
    "": [
        "Checkmate",
        "Resignation",
        "Timeout / Forfeit",
        "Abortion",
        "Stalemate",
        "Dead Position",
        "Mutual Agreement",
        "Threefold Repetition",
        "50 Move Rule",
    ],
};

function InlineTextField({ label, value, onChange, type = "text" }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value ?? "");

    useEffect(() => {
        if (!editing) setDraft(value ?? "");
    }, [value, editing]);

    const commit = () => {
        setEditing(false);
        if (draft !== value)
            onChange(
                type === "number"
                    ? draft === ""
                        ? null
                        : Number(draft)
                    : draft,
            );
    };

    return (
        <div className="pgn-field">
            <span className="pgn-field-label">{label}</span>
            {editing ? (
                <input
                    className="pgn-field-input"
                    autoFocus
                    type={type}
                    value={draft ?? ""}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") {
                            setDraft(value ?? "");
                            setEditing(false);
                        }
                    }}
                />
            ) : (
                <span
                    className="pgn-field-value"
                    onClick={() => setEditing(true)}
                >
                    {value === null || value === undefined || value === ""
                        ? "—"
                        : value}
                </span>
            )}
        </div>
    );
}

function InlineSelectField({ label, value, onChange, options }) {
    const [editing, setEditing] = useState(false);

    return (
        <div className="pgn-field">
            <span className="pgn-field-label">{label}</span>
            {editing ? (
                <select
                    className="pgn-field-input"
                    autoFocus
                    value={value || ""}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setEditing(false);
                    }}
                    onBlur={() => setEditing(false)}
                >
                    <option value="" disabled>
                        Select…
                    </option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <span
                    className="pgn-field-value"
                    onClick={() => setEditing(true)}
                >
                    {value || "—"}
                </span>
            )}
        </div>
    );
}

export default function PgnDetails({ tabDocument }) {
    const pgnData = tabDocument.chessDocument.pgnData;
    const notify = tabDocument.chessDocument.chessData._emit;
    const [pgn, setPgn] = useState(() => pgnData.clone());

    // Resync if the underlying pgnData instance is swapped out
    // (e.g. loading a different PGN into this tab).
    useEffect(() => {
        setPgn(pgnData.clone());
    }, [pgnData]);

    const set = (field) => (value) => {
        pgnData.setHeaders({ [field]: value });
        setPgn((prev) => {
            const next = prev.clone();
            next[field] = value;
            return next;
        });
        if (notify) notify();
    };

    const terminationOptions =
        TERMINATIONS_BY_RESULT[pgn.result] || TERMINATIONS_BY_RESULT[""];

    return (
        <div className="pgn-details">
            <div className="split-container">
                <div className="white-details">
                    <InlineTextField
                        label="White"
                        value={pgn.whiteName}
                        onChange={set("whiteName")}
                    />
                    <InlineSelectField
                        label="Title"
                        value={pgn.whiteTitle}
                        onChange={set("whiteTitle")}
                        options={TITLES}
                    />
                    <InlineTextField
                        label="Elo"
                        type="number"
                        value={pgn.whiteElo}
                        onChange={set("whiteElo")}
                    />
                    <InlineTextField
                        label="FIDE ID"
                        value={pgn.whiteFideId}
                        onChange={set("whiteFideId")}
                    />
                    <InlineTextField
                        label="National ID"
                        value={pgn.whiteNationalId}
                        onChange={set("whiteNationalId")}
                    />
                </div>
                <div className="black-details">
                    <InlineTextField
                        label="Black"
                        value={pgn.blackName}
                        onChange={set("blackName")}
                    />
                    <InlineSelectField
                        label="Title"
                        value={pgn.blackTitle}
                        onChange={set("blackTitle")}
                        options={TITLES}
                    />
                    <InlineTextField
                        label="Elo"
                        type="number"
                        value={pgn.blackElo}
                        onChange={set("blackElo")}
                    />
                    <InlineTextField
                        label="FIDE ID"
                        value={pgn.blackFideId}
                        onChange={set("blackFideId")}
                    />
                    <InlineTextField
                        label="National ID"
                        value={pgn.blackNationalId}
                        onChange={set("blackNationalId")}
                    />
                </div>
            </div>

            <div className="shared-details">
                <InlineSelectField
                    label="Result"
                    value={pgn.result}
                    onChange={set("result")}
                    options={RESULTS}
                />
                <InlineSelectField
                    label="Termination"
                    value={pgn.termination}
                    onChange={set("termination")}
                    options={terminationOptions}
                />
                <InlineTextField
                    label="Time Control"
                    value={pgn.timeControl}
                    onChange={set("timeControl")}
                />
                <InlineTextField
                    label="Date"
                    type="date"
                    value={pgn.date}
                    onChange={set("date")}
                />
                <InlineTextField
                    label="Event"
                    value={pgn.event}
                    onChange={set("event")}
                />
                <InlineTextField
                    label="Site"
                    value={pgn.site}
                    onChange={set("site")}
                />
                <InlineTextField
                    label="Round"
                    type="number"
                    value={pgn.round}
                    onChange={set("round")}
                />
                <InlineTextField
                    label="Board"
                    type="number"
                    value={pgn.board}
                    onChange={set("board")}
                />
                <InlineTextField
                    label="Annotator"
                    value={pgn.annotator}
                    onChange={set("annotator")}
                />
                <InlineTextField
                    label="Game ID"
                    value={pgn.gameId}
                    onChange={set("gameId")}
                />
            </div>
        </div>
    );
}
