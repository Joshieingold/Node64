import "./CreateFileModal.css";
import { useState, useEffect } from "react";
import Modal from "../OptionsBar/Modal";
import { invoke } from "@tauri-apps/api/core";

function CreateFileBody({
    name,
    onNameChange,
    destination,
    onDestinationChange,
    folderOptions,
}) {
    return (
        <div className="modal-body">
            <div className="small-input-area">
                <label htmlFor="file-name">Name</label>
                <input
                    id="file-name"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                />
            </div>
            <div className="destination-area">
                <label htmlFor="file-destination">Destination</label>
                <select
                    id="file-destination"
                    value={destination}
                    onChange={(e) => onDestinationChange(e.target.value)}
                >
                    {folderOptions.map((folder) => (
                        <option key={folder.path} value={folder.path}>
                            {folder.path}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

function CreateButtonOptions({ onSave, onClose }) {
    return (
        <div className="button-container">
            <div className="btn" onClick={onSave}>
                Save
            </div>
            <div className="btn" onClick={onClose}>
                Close
            </div>
        </div>
    );
}

export default function CreateFileModal({
    open,
    title,
    onClose,
    defaultDestination,
    folderOptions = [],
}) {
    const [name, setName] = useState("");
    const [destination, setDestination] = useState(defaultDestination ?? "");

    useEffect(() => {
        setDestination(defaultDestination ?? "");
    }, [defaultDestination]);

    const handleSave = async () => {
        if (!name.trim() || !destination) return;
        try {
            await invoke("create_file", { destination, name, pgn: "" });
            setName("");
            onClose();
        } catch (err) {
            console.error("Failed to create file:", err);
        }
    };
    const handleClose = () => {
        setName("");
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            title={title}
            children={
                <CreateFileBody
                    name={name}
                    onNameChange={setName}
                    destination={destination}
                    onDestinationChange={setDestination}
                    folderOptions={folderOptions}
                />
            }
            footer={
                <CreateButtonOptions
                    onSave={handleSave}
                    onClose={handleClose}
                />
            }
        />
    );
}
