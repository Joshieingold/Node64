import { useState } from "react";
import { useExplorer } from "../ExplorerContext";
import ExplorerFile from "./ExplorerFile";
import "./ExplorerComponenents.css";

export default function ExplorerFolder({ node, level = 0 }) {
    const {
        forceOpen,
        renamingPath,
        renameValue,
        setRenameValue,
        handleRenameKeyDown,
        cancelRename,
        creatingPath,
        createValue,
        setCreateValue,
        handleCreateKeyDown,
        submitCreate,
        openContextMenu,
        beginCreate,
    } = useExplorer();

    const [dirOpen, setDirOpen] = useState(false);
    const isCreatingHere = creatingPath === node.path;
    const isRenamingThis = renamingPath === node.path;
    const isOpen = dirOpen || forceOpen || isCreatingHere;

    return (
        <div className="explorer-folder">
            <div className="folder-label-wrapper">
                <div
                    className="folder-wrapper"
                    onClick={
                        isRenamingThis ? undefined : () => setDirOpen((p) => !p)
                    }
                    onContextMenu={(e) => openContextMenu(e, node)}
                >
                    <div className="folder-button expand">
                        {isOpen ? "🗁" : "🖿 "}
                    </div>
                    {isRenamingThis ? (
                        <input
                            className="rename-input"
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => handleRenameKeyDown(e, node)}
                            onBlur={cancelRename}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <div className="folder-text">{node.name}</div>
                    )}
                </div>
                <div
                    className="folder-button new"
                    onClick={(e) => {
                        e.stopPropagation();
                        beginCreate(node.path);
                    }}
                >
                    +
                </div>
            </div>
            {isOpen && (
                <div
                    className="folder-contents"
                    style={{ paddingLeft: `${level * 10}px` }}
                >
                    {isCreatingHere && (
                        <div className="explorer-file">
                            <input
                                className="rename-input"
                                autoFocus
                                value={createValue}
                                onChange={(e) => setCreateValue(e.target.value)}
                                onKeyDown={handleCreateKeyDown}
                                onBlur={submitCreate}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    )}
                    {node.children?.map((child) =>
                        child.is_directory ? (
                            <ExplorerFolder
                                key={child.path}
                                node={child}
                                level={level + 1}
                            />
                        ) : (
                            <ExplorerFile key={child.path} node={child} />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}
