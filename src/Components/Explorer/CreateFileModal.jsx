import "./CreateFileModal.css";
import Modal from "../OptionsBar/Modal";

function CreateFileBody() {
    return (
        <div className="modal-body">
            <div className="small-input-area">
                <label htmlFor="file-name">Name</label>
                <input id="file-name" />
            </div>
            <div className="destination-area">
                <label htmlFor="file-destination">Destination</label>
                <select id="file-destination">
                    <option>Analysis</option>
                    <option>Repertoires</option>
                    <option>Databases</option>
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

export default function CreateFileModal({ open, title, onClose, onSave }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            children={<CreateFileBody />}
            footer={<CreateButtonOptions onSave={onSave} onClose={onClose} />}
        />
    );
}
