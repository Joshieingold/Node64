import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import "./Explorer.css";
import ExplorerFolder from "./ExplorerFolder";
import CreateFileModal from "./CreateFileModal";

export default function Explorer() {
    const [directoryNodeTree, setDirectoryNodeTree] = useState(null);
    const [newFileModalState, setNewFileModalState] = useState(false);

    useEffect(() => {
        async function load() {
            const response = await invoke("list_directory", {
                path: "/home/josh/Documents/repos/Node64/ChessData/",
            });

            setDirectoryNodeTree(response);
        }

        load();
    }, []);
    return (
        <div className="explorer">
            {newFileModalState && (
                <CreateFileModal
                    open={newFileModalState}
                    title="Create New File"
                    onClose={() => setNewFileModalState(false)}
                />
            )}
            <div className="panel-title">Explorer</div>

            <div className="panel-items">
                {directoryNodeTree && (
                    <ExplorerFolder
                        name={directoryNodeTree.name}
                        children={directoryNodeTree.children}
                        level={0}
                        plusClick={() => setNewFileModalState((prev) => !prev)}
                    />
                )}
            </div>
        </div>
    );
}
