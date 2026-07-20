import { useState } from "react";
import "./Explorer.css";
import ExplorerButton from "./Components/ExplorerButton";
import ExplorerFolder from "./Components/ExplorerFolder";
import ExplorerFile from "./Components/ExplorerFile";
import ContextMenu from "../../../../../OldButUsed/ContextMenu";
import { ExplorerProvider, useExplorer } from "./ExplorerContext";

export default function Explorer({ callbackObj }) {
    return (
        <ExplorerProvider callbackObj={callbackObj}>
            <ExplorerBody />
        </ExplorerProvider>
    );
}

function ExplorerBody() {
    const {
        tree,
        reload,
        contextMenu,
        closeContextMenu,
        handleNewFileHere,
        beginRename,
        deleteItem,
    } = useExplorer();

    return (
        <div className="explorer">
            <div className="explorer-head">
                <h2 className="title">Explorer</h2>
                <div className="explorer-buttons-wrapper">
                    <div className="explorer-button" onClick={reload}>
                        ⟳
                    </div>
                </div>
            </div>
            <div className="filetree-content">
                {tree?.children.map((item) =>
                    item.is_directory ? (
                        <ExplorerFolder key={item.path} node={item} level={1} />
                    ) : (
                        <ExplorerFile key={item.path} node={item} />
                    ),
                )}
            </div>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={closeContextMenu}
                    items={[
                        {
                            label: "New File...",
                            onClick: () => handleNewFileHere(contextMenu.item),
                        },
                        { divider: true },
                        {
                            label: "Rename",
                            onClick: () => beginRename(contextMenu.item),
                        },
                        {
                            label: "Delete",
                            danger: true,
                            onClick: () => deleteItem(contextMenu.item),
                        },
                    ]}
                />
            )}
        </div>
    );
}
