import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import "./Explorer.css";
import ExplorerFolder from "./ExplorerFolder";
import CreateFileModal from "./CreateFileModal";

export function flattenFolders(node, list = []) {
    if (!node || (!node.is_directory && node.children === undefined)) {
        // leaf file node, skip
    }
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

export default function Explorer() {
    const [directoryNodeTree, setDirectoryNodeTree] = useState(null);
    const [newFileModalState, setNewFileModalState] = useState(false);
    const [targetFolder, setTargetFolder] = useState(null);

    useEffect(() => {
        async function load() {
            const response = await invoke("list_directory", {
                path: "/home/josh/Documents/repos/Node64/ChessData/",
            });
            setDirectoryNodeTree(response);
        }
        load();
    }, []);

    const handlePlusClick = (path) => {
        setTargetFolder(path);
        setNewFileModalState(true);
    };

    const handleCloseModal = () => {
        setNewFileModalState(false);
        setTargetFolder(null);
    };

    const folderOptions = directoryNodeTree
        ? flattenFolders(directoryNodeTree)
        : [];

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
            <div className="panel-title">Explorer</div>
            <div className="panel-items">
                {directoryNodeTree && (
                    <ExplorerFolder
                        name={directoryNodeTree.name}
                        path={directoryNodeTree.path}
                        children={directoryNodeTree.children}
                        level={0}
                        plusClick={handlePlusClick}
                    />
                )}
            </div>
        </div>
    );
}
