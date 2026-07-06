import "./ExplorerFolder.css";
import { useState } from "react";

export default function ExplorerFolder({
    name,
    children = [],
    plusClick,
    level = 0,
}) {
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

                    <div className="folder-text">{name}</div>
                </div>

                <div className="folder-button new" onClick={plusClick}>
                    +
                </div>
            </div>

            {dirOpen && (
                <div
                    className="folder-contents"
                    style={{ paddingLeft: `${level * 48}px` }}
                >
                    {children.map((item) =>
                        item.is_directory ? (
                            <ExplorerFolder
                                key={item.path}
                                name={item.name}
                                children={item.children}
                                plusClick={plusClick}
                                level={level + 1}
                            />
                        ) : (
                            <div key={item.path} className="file-item">
                                {item.name.split(".")[0]}
                            </div>
                        ),
                    )}
                </div>
            )}
        </div>
    );
}
