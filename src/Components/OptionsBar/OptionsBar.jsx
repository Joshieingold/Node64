import { useState } from "react";
import "./OptionsBar.css";
import Modal from "./Modal";
import PgnHead from "../../DataClasses/PgnHead";
import FileNameField from "../../ReusableComponents/FileNameField";
import SelectField from "../../ReusableComponents/SelectField";
import TextField from "../../ReusableComponents/TextField";
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

export default function OptionsBar({ data }) {
    const [saveOpen, setSaveOpen] = useState(false);
    const [pgn, setPgn] = useState(() => new PgnHead());
    const [selectedFileType, setSelectedFileType] = useState("Analysis");
    const [fileName, setFileName] = useState("");
    const set = (field) => (value) =>
        setPgn((prev) => {
            const next = prev.clone();
            next[field] = value;
            return next;
        });

    const openSave = () => {
        setSaveOpen(true);
    };
    const closeSave = () => setSaveOpen(false);

    const handleSave = async () => {
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

        data.pgnHeader = pgn;

        const getDest = () => {
            if (data.fileLocation) {
                return data.fileLocation;
            }
            return "/home/josh/Documents/repos/Node64/ChessData/Analysis/";
        };
        await invoke("create_file", {
            destination: getDest(),
            name: data.fileName || "unamed_analysis",
            fileType: selectedFileType,
            pgn: data.getFullPgn(),
        });
        closeSave();
    };

    const terminationOptions =
        TERMINATIONS_BY_RESULT[pgn.result] || TERMINATIONS_BY_RESULT[""];

    return (
        <div className="options-bar-wrapper">
            <div className="options-container">
                <div className="option save" onClick={openSave}>
                    Save
                </div>
                <div className="option greview">Game Review</div>
                <div className="option import">Import</div>
            </div>

            <Modal
                open={saveOpen}
                onClose={closeSave}
                title="Save PGN"
                footer={
                    <>
                        <div className="file-options-container">
                            <FileNameField data={data} />
                            <select
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
                        <div className="modal-button-container">
                            <button
                                className="modal-btn secondary"
                                onClick={closeSave}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-btn primary"
                                onClick={handleSave}
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
        </div>
    );
}
