import "./ExplorerFolder.css";
import { useState } from "react";

export default function ExplorerFolder({
    name,
    path,
    children = [],
    plusClick,
    level = 0,
    openAnalysisCallback,
}) {
    const [dirOpen, setDirOpen] = useState(false);
    const handleOpenDir = () => {
        setDirOpen((prev) => !prev);
    };
    const HandleOpenFile = (fileName) => {
        let suffix = fileName.split(".")[1];
        console.log("hit");
        console.log(suffix);
        switch (suffix) {
            case "pgn":
                openAnalysisCallback();
                return;
        }
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
                <div
                    className="folder-button new"
                    onClick={(e) => {
                        e.stopPropagation();
                        plusClick(path);
                    }}
                >
                    +
                </div>
            </div>
            {dirOpen && (
                <div
                    className="folder-contents"
                    style={{ paddingLeft: `${level * 22}px` }}
                >
                    {children.map((item) =>
                        item.is_directory ? (
                            <ExplorerFolder
                                key={item.path}
                                name={item.name}
                                path={item.path}
                                children={item.children}
                                plusClick={plusClick}
                                level={level + 1}
                            />
                        ) : (
                            <div
                                key={item.path}
                                className="file-item"
                                onClick={() => HandleOpenFile(item.name)}
                            >
                                {item.name.split(".")[0]}
                            </div>
                        ),
                    )}
                </div>
            )}
        </div>
    );
}
