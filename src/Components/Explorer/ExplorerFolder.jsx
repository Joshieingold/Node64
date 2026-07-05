import "./ExplorerFolder.css";
import { useState } from "react";

export default function ExplorerFolder({ type, plusClick }) {
    const [dirOpen, setDirOpen] = useState(false);

    const handleOpenDir = () => {
        setDirOpen((prev) => !prev);
    };

    return (
        <div className="explorer-folder">
            <div className="folder-label-wrapper">
                <div className="folder-wrapper" onClick={handleOpenDir}>
                    <div className="folder-button expand">
                        {dirOpen ? "v " : "> "}
                    </div>

                    <div className="folder-text">{type}</div>
                </div>

                <div className="folder-button new" onClick={plusClick}>
                    +
                </div>
            </div>

            {dirOpen && (
                <div className="folder-contents">
                    {/* Render files/folders here */}
                </div>
            )}
        </div>
    );
}
