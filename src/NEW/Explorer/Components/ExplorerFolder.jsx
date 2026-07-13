import { useState } from "react";
import "./ExplorerItems.css";
import ExplorerFile from "./ExplorerFile";

export default function ExplorerFolder({
    name,
    path,
    children = [],
    plusClick,
    level = 0,
    openAnalysisCallback,
    openRepertoireCallback,
    onContextMenu,
    renamingPath,
    renameValue,
    setRenameValue,
    onRenameKeyDown,
    onRenameBlur,
    forceOpen = false,
}) {
    const [dirOpen, setDirOpen] = useState(false);
    const isOpen = dirOpen || forceOpen;

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
            case "rpgn":
                openRepertoireCallback(path);
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
                        {isOpen ? "v " : "> "}
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
            {isOpen && (
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
                                openRepertoireCallback={openRepertoireCallback}
                                onContextMenu={onContextMenu}
                                renamingPath={renamingPath}
                                renameValue={renameValue}
                                setRenameValue={setRenameValue}
                                onRenameKeyDown={onRenameKeyDown}
                                onRenameBlur={onRenameBlur}
                                forceOpen={forceOpen}
                            />
                        ) : (
                            <ExplorerFile
                                key={item.path}
                                itemRef={item}
                                fileOpenRef={HandleOpenFile}
                                contextMenuRef={onContextMenu}
                                isRenaming={renamingPath === item.path}
                                renameValue={renameValue}
                                setRenameValue={setRenameValue}
                                onRenameKeyDown={onRenameKeyDown}
                                onRenameBlur={onRenameBlur}
                            />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}
