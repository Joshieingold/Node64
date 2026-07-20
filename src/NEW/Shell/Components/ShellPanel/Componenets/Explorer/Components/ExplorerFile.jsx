import { useExplorer } from "../ExplorerContext";

export default function ExplorerFile({ node }) {
    const {
        renamingPath,
        renameValue,
        setRenameValue,
        handleRenameKeyDown,
        cancelRename,
        openContextMenu,
        openFile,
    } = useExplorer();
    const isRenaming = renamingPath === node.path;

    const getIcon = (fileType) => {
        switch (fileType) {
            case "pgn":
                return "♞";
            case "rpgn":
                return "♜";
        }
    };
    if (isRenaming) {
        return (
            <div className="file-item">
                <input
                    className="rename-input"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => handleRenameKeyDown(e, node)}
                    onBlur={cancelRename}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        );
    }

    return (
        <div
            className="file-item"
            onClick={() => openFile(node)}
            onContextMenu={(e) => openContextMenu(e, node)}
        >
            <div className="file-icon">{getIcon(node.name.split(".")[1])}</div>
            <div className="file-name">{node.name.split(".")[0]}</div>
        </div>
    );
}
