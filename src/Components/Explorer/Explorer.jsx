import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import "./Explorer.css";
import ExplorerFolder from "./ExplorerFolder";
import CreateFileModal from "./CreateFileModal";

export function flattenFolders(node, list = []) {
    if (!node || (!node.is_directory && node.children === undefined)) {
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
                            />
                        ) : (
                            <div key={item.path} className="file-item">
                                {item.name.split(".")[0]}
                            </div>
                        ),
                    )}
            </div>
        </div>
    );
}
