import { useState, useEffect } from "react";
import "../Components/OptionsBar/OptionsBar.css";
import Modal from "../Components/OptionsBar/Modal.jsx";
import PgnDocument from "../NEW/Documents/PgnDocument.jsx";
import FileNameField from "./FileNameField";
import SelectField from "./SelectField";
import TextField from "./TextField";
import { invoke } from "@tauri-apps/api/core";

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

// Maps the file-type select to the folder it should be saved in.
// These are the only three destinations the user can pick from.
const DEST_BY_TYPE = {
    Analysis: "/home/josh/Documents/repos/Node64/ChessData/Analysis/",
    Database: "/home/josh/Documents/repos/Node64/ChessData/Database/",
    Repertoire: "/home/josh/Documents/repos/Node64/ChessData/Repertoire/",
};

function useSaveManager(data) {
    const [saveOpen, setSaveOpen] = useState(false);
    const [pgn, setPgn] = useState(() => data.pgnData ?? new PgnDocument());
    const [selectedFileType, setSelectedFileType] = useState(
        () => data.fileData.fileType ?? "Analysis",
    );

    useEffect(() => {
        setPgn(data.pgnData ?? new PgnDocument());
    }, [data.pgnData]);

    useEffect(() => {
        setSelectedFileType(data.fileData.fileType ?? "Analysis");
    }, [data.fileData.fileType]);

    const set = (field) => (value) =>
        setPgn((prev) => {
            const next = prev.clone();
            next[field] = value;
            return next;
        });

    const openSave = () => setSaveOpen(true);
    const closeSave = () => setSaveOpen(false);

    // Resolves the destination folder from the file type.
    // Falls back to an explicit fileLocation if one was ever set directly,
    // otherwise maps the type -> its fixed folder.
    const getDest = (type) => {
        if (data.fileData.fileLocation) {
            return data.fileData.fileLocation;
        }
        return DEST_BY_TYPE[type] ?? DEST_BY_TYPE.Analysis;
    };

    // fileType is optional - only pass it when you want to override
    // whatever is currently persisted on `data`.
    const performSave = async (
        fileType = data.fileData.fileType ?? selectedFileType,
    ) => {
        const headers = {
            White: pgn.whiteName || "?",
            Black: pgn.blackName || "?",
            WhiteElo: pgn.whiteElo || undefined,
            BlackElo: pgn.blackElo || undefined,
            WhiteTitle:
                pgn.whiteTitle && pgn.whiteTitle !== "None"
                    ? pgn.whiteTitle
                    : undefined,
            BlackTitle:
                pgn.blackTitle && pgn.blackTitle !== "None"
                    ? pgn.blackTitle
                    : undefined,
            WhiteFideId: pgn.whiteFideId || undefined,
            BlackFideId: pgn.blackFideId || undefined,
            WhiteNA: pgn.whiteNationalId || undefined,
            BlackNA: pgn.blackNationalId || undefined,
            TimeControl: pgn.timeControl || undefined,
            Date: pgn.date ? pgn.date.replace(/-/g, ".") : undefined,
            Result: pgn.result || undefined,
            Termination: pgn.termination || undefined,
            Site: pgn.site || undefined,
            Event: pgn.event || undefined,
            Round: pgn.round || undefined,
            Board: pgn.board || undefined,
            Annotator: pgn.annotator || undefined,
            GameId: pgn.gameId || undefined,
        };
        Object.keys(headers).forEach(
            (key) => headers[key] === undefined && delete headers[key],
        );

        data.pgnData = pgn;
        data.fileData.fileType = fileType;

        await invoke("create_file", {
            destination: getDest(fileType),
            name: data.fileData.fileName || "unnamed_analysis",
            fileType,
            pgn: data.getFullPgn(),
        });
    };

    const handleModalSave = async () => {
        await performSave(selectedFileType);
        closeSave();
    };

    const handleQuickSave = async () => {
        if (!data.fileData.fileLocation && !data.fileData.fileType) {
            openSave();
            return;
        }
        await performSave(data.fileData.fileType ?? "Analysis");
    };

    const terminationOptions =
        TERMINATIONS_BY_RESULT[pgn.result] || TERMINATIONS_BY_RESULT[""];

    return {
        saveOpen,
        openSave,
        closeSave,
        pgn,
        set,
        selectedFileType,
        setSelectedFileType,
        handleModalSave,
        handleQuickSave,
        terminationOptions,
    };
}

function SaveModal({
    data,
    saveOpen,
    closeSave,
    pgn,
    set,
    selectedFileType,
    setSelectedFileType,
    handleModalSave,
    terminationOptions,
}) {
    return (
        <Modal
            className="long"
            open={saveOpen}
            onClose={closeSave}
            title="Save PGN"
            footer={
                <>
                    <div className="file-options-container">
                        <div className="input-wrapper">
                            <label htmlFor="file-name-input">Name</label>
                            <FileNameField data={data} id="file-name-input" />
                        </div>
                        <div className="input-wrapper">
                            <label htmlFor="file-type-picker">Type</label>
                            <select
                                id="file-type-picker"
                                value={selectedFileType}
                                onChange={(e) =>
                                    setSelectedFileType(e.target.value)
                                }
                            >
                                <option value="Analysis">Analysis</option>
                                <option value="Database">Database</option>
                                <option value="Repertoire">Repertoire</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-button-container">
                        <button
                            className="modal-btn secondary"
                            onClick={closeSave}
                        >
                            Cancel
                        </button>
                        <button
                            className="modal-btn primary"
                            onClick={handleModalSave}
                        >
                            Save PGN
                        </button>
                    </div>
                </>
            }
        >
            <div className="form-section">
                <h4>Players</h4>
                <div className="player-data-container">
                    <div className="white-data">
                        <TextField
                            label="White Name"
                            id="white-name"
                            value={pgn.whiteName}
                            onChange={set("whiteName")}
                        />
                        <TextField
                            label="Elo"
                            id="white-elo"
                            value={pgn.whiteElo}
                            onChange={set("whiteElo")}
                        />
                        <SelectField
                            label="Title"
                            id="white-title"
                            value={pgn.whiteTitle}
                            onChange={set("whiteTitle")}
                            options={TITLES}
                        />
                        <TextField
                            label="FIDE ID"
                            id="white-fide-id"
                            value={pgn.whiteFideId}
                            onChange={set("whiteFideId")}
                        />
                        <TextField
                            label="National ID"
                            id="white-national-id"
                            value={pgn.whiteNationalId}
                            onChange={set("whiteNationalId")}
                        />
                    </div>
                    <div className="black-data">
                        <TextField
                            label="Black Name"
                            id="black-name"
                            value={pgn.blackName}
                            onChange={set("blackName")}
                        />
                        <TextField
                            label="Elo"
                            id="black-elo"
                            value={pgn.blackElo}
                            onChange={set("blackElo")}
                        />
                        <SelectField
                            label="Title"
                            id="black-title"
                            value={pgn.blackTitle}
                            onChange={set("blackTitle")}
                            options={TITLES}
                        />
                        <TextField
                            label="FIDE ID"
                            id="black-fide-id"
                            value={pgn.blackFideId}
                            onChange={set("blackFideId")}
                        />
                        <TextField
                            label="National ID"
                            id="black-national-id"
                            value={pgn.blackNationalId}
                            onChange={set("blackNationalId")}
                        />
                    </div>
                </div>
            </div>
            <div className="form-section">
                <h4>Game Info</h4>
                <div className="general-data-container">
                    <TextField
                        label="Time Control"
                        id="time-control"
                        value={pgn.timeControl}
                        onChange={set("timeControl")}
                    />
                    <TextField
                        label="Date Played"
                        id="date-played"
                        type="date"
                        value={pgn.date}
                        onChange={set("date")}
                    />
                    <SelectField
                        label="Result"
                        id="result"
                        value={pgn.result}
                        onChange={set("result")}
                        options={["1-0", "0-1", "½-½"]}
                    />
                    <SelectField
                        label="Termination"
                        id="termination"
                        value={pgn.termination}
                        onChange={set("termination")}
                        options={terminationOptions}
                    />
                    <TextField
                        label="Site"
                        id="site"
                        value={pgn.site}
                        onChange={set("site")}
                    />
                    <TextField
                        label="Event"
                        id="event"
                        value={pgn.event}
                        onChange={set("event")}
                    />
                    <TextField
                        label="Round"
                        id="round"
                        type="number"
                        value={pgn.round}
                        onChange={set("round")}
                    />
                    <TextField
                        label="Board #"
                        id="board"
                        type="number"
                        value={pgn.board}
                        onChange={set("board")}
                    />
                    <TextField
                        label="Annotator"
                        id="annotator"
                        value={pgn.annotator}
                        onChange={set("annotator")}
                    />
                    <TextField
                        label="Game ID"
                        id="game-id"
                        value={pgn.gameId}
                        onChange={set("gameId")}
                    />
                </div>
            </div>
        </Modal>
    );
}

export function SaveButton({ data }) {
    const manager = useSaveManager(data);
    return (
        <>
            <div className="option save" onClick={manager.handleQuickSave}>
                Save
            </div>
            <SaveModal data={data} {...manager} />
        </>
    );
}

export function SaveAsButton({ data }) {
    const manager = useSaveManager(data);
    return (
        <>
            <div className="option save-as" onClick={manager.openSave}>
                Save As
            </div>
            <SaveModal data={data} {...manager} />
        </>
    );
}
