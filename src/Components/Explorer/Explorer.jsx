import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import "./Explorer.css";
import ExplorerFolder from "./ExplorerFolder";

export default function Explorer() {
    const [directoryNodeTree, setDirectoryNodeTree] = useState(null);

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
            <div className="panel-title">Explorer</div>

            <div className="panel-items">
                {directoryNodeTree && (
                    <ExplorerFolder
                        name={directoryNodeTree.name}
                        children={directoryNodeTree.children}
                        level={0}
                    />
                )}
            </div>
        </div>
    );
}
