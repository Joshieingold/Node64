import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import "./Explorer.css";
import ExplorerFolder from "./ExplorerFolder";
import CreateFileModal from "./CreateFileModal";
import ContextMenu from "../../ReusableComponents/ContextMenu";

export default function Explorer({ openAnalysisCallback }) {
    const [directoryNodeTree, setDirectoryNodeTree] = useState(null);
    const [newFileModalState, setNewFileModalState] = useState(false);
    const [targetFolder, setTargetFolder] = useState(null);
    const [contextMenu, setContextMenu] = useState(null); // { x, y, item }

    const folderOptions = directoryNodeTree
        ? flattenFolders(directoryNodeTree)
        : [];

    async function load() {
        const response = await invoke("list_directory", {
            path: "/home/josh/Documents/repos/Node64/ChessData/",
        });
        setDirectoryNodeTree(response);
    }

    useEffect(() => {
        load();
    }, []);

    const handlePlusClick = (path) => {
        setTargetFolder(path);
        setNewFileModalState(true);
    };

    const handleCloseModal = async () => {
        setNewFileModalState(false);
        load();
        setTargetFolder(null);
    };

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };

    const closeContextMenu = () => setContextMenu(null);

    const handleRename = async (item) => {
        // your rename logic — e.g. open a rename modal, then invoke("rename_file", {...})
    };

    const handleDelete = async (item) => {
        await invoke("delete_path", { path: item.path });
        load();
    };

    const handleNewFileHere = (item) => {
        const dir = item.is_directory
            ? item.path
            : item.path.slice(0, item.path.lastIndexOf("/"));
        handlePlusClick(dir);
    };

    return (
        <div className="explorer">
            {newFileModalState && (
                <CreateFileModal
                    open={newFileModalState}
                    title="New File"
                    defaultDestination={targetFolder}
                    folderOptions={folderOptions}
                    onClose={handleCloseModal}
                />
            )}
            <div className="panel-title">
                <h2>Explorer</h2>
                <p onClick={load} className="panel-button">
                    ⟳
                </p>
            </div>
            <div className="panel-items">
                {directoryNodeTree &&
                    directoryNodeTree.children.map((item) =>
                        item.is_directory ? (
                            <ExplorerFolder
                                key={item.path}
                                name={item.name}
                                path={item.path}
                                children={item.children}
                                level={1}
                                plusClick={handlePlusClick}
                                openAnalysisCallback={openAnalysisCallback}
                                onContextMenu={handleContextMenu}
                            />
                        ) : (
                            <div
                                key={item.path}
                                className="file-item"
                                onContextMenu={(e) =>
                                    handleContextMenu(e, item)
                                }
                            >
                                {item.name.split(".")[0]}
                            </div>
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
                            onClick: () => handleRename(contextMenu.item),
                        },
                        {
                            label: "Delete",
                            danger: true,
                            onClick: () => handleDelete(contextMenu.item),
                        },
                    ]}
                />
            )}
        </div>
    );
}

export function flattenFolders(node, list = []) {
    if (node.children !== undefined) {
        list.push({ path: node.path, name: node.name });
        node.children.forEach((child) => {
            if (child.is_directory) {
                flattenFolders(child, list);
            }
        });
    }
    return list;
}
