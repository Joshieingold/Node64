import "./ExplorerFolder.css";
import { useState } from "react";

export default function ExplorerFolder({
    name,
    path,
    children = [],
    plusClick,
    level = 0,
    openAnalysisCallback,
    onContextMenu,
    renamingPath,
    renameValue,
    setRenameValue,
    onRenameKeyDown,
    onRenameBlur,
}) {
    const [dirOpen, setDirOpen] = useState(false);

    const handleOpenDir = () => {
        setDirOpen((prev) => !prev);
    };

    const HandleOpenFile = (item) => {
        let suffix = item.name.split(".")[1];
        let path = item.path;
        switch (suffix) {
            case "pgn":
                openAnalysisCallback(path);
                return;
        }
    };

    const isRenamingThisFolder = renamingPath === path;

    return (
        <div className="explorer-folder">
            <div className="folder-label-wrapper">
                <div
                    className="folder-wrapper"
                    onClick={isRenamingThisFolder ? undefined : handleOpenDir}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onContextMenu(e, { path, name, is_directory: true });
                    }}
                >
                    <div className="folder-button expand">
                        {dirOpen ? "v " : "> "}
                    </div>
                    {isRenamingThisFolder ? (
                        <input
                            className="rename-input"
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) =>
                                onRenameKeyDown(e, {
                                    path,
                                    name,
                                    is_directory: true,
                                })
                            }
                            onBlur={onRenameBlur}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div className="folder-text">{name}</div>
                    )}
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
                                openAnalysisCallback={openAnalysisCallback}
                                onContextMenu={onContextMenu}
                                renamingPath={renamingPath}
                                renameValue={renameValue}
                                setRenameValue={setRenameValue}
                                onRenameKeyDown={onRenameKeyDown}
                                onRenameBlur={onRenameBlur}
                            />
                        ) : renamingPath === item.path ? (
                            <div key={item.path} className="file-item">
                                <input
                                    className="rename-input"
                                    autoFocus
                                    value={renameValue}
                                    onChange={(e) =>
                                        setRenameValue(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        onRenameKeyDown(e, {
                                            path: item.path,
                                            name: item.name,
                                            is_directory: false,
                                        })
                                    }
                                    onBlur={onRenameBlur}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        ) : (
                            <div
                                key={item.path}
                                className="file-item"
                                onClick={() => HandleOpenFile(item)}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onContextMenu(e, {
                                        path: item.path,
                                        name: item.name,
                                        is_directory: false,
                                    });
                                }}
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
