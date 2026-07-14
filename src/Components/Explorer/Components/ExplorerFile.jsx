export default function ExplorerFile({
    itemRef,
    fileOpenRef,
    contextMenuRef,
    isRenaming,
    renameValue,
    setRenameValue,
    onRenameKeyDown,
    onRenameBlur,
}) {
    if (isRenaming) {
        return (
            <div className="file-item">
                <input
                    className="rename-input"
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => onRenameKeyDown(e, itemRef)}
                    onBlur={onRenameBlur}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        );
    }

    return (
        <div
            className="file-item"
            onClick={() => fileOpenRef(itemRef)}
            onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                contextMenuRef(e, {
                    path: itemRef.path,
                    name: itemRef.name,
                    is_directory: false,
                });
            }}
        >
            {itemRef.name.split(".")[0]}
        </div>
    );
}
