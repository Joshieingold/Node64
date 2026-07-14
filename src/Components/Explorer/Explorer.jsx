import "./Explorer.css";
import { useEffect, useState } from "react";
import ExplorerButton from "./Components/ExplorerButton";
import { invoke } from "@tauri-apps/api/core";
import CreateFileModal from "./Components/CreateFileModal";
import ExplorerFolder from "./Components/ExplorerFolder";
import ContextMenu from "../../ReusableComponents/ContextMenu";
import ExplorerFile from "./Components/ExplorerFile";

// Callback Object is {
// analysis_callback: func,
// repertoire_callback: func
// }

export default function Explorer({ callbackObj }) {
    // On Load
    useEffect(() => {
        ReloadFiles();
    }, []);

    // Create-File Modal
    const [modalOpen, setModalOpen] = useState(false);
    const handleCloseModal = async () => {
        setModalOpen(false);
        ReloadFiles();
        setTargetFolder(null);
    };

    // File Data
    const [directoryNodeTree, setDirectoryNodeTree] = useState(null);

    const handleNewFileHere = (item) => {
        const dir = item.is_directory
            ? item.path
            : item.path.slice(0, item.path.lastIndexOf("/"));
        plusClick(dir);
    };

    // Search Bar
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const filteredTree = !searchTerm.trim()
        ? directoryNodeTree
        : directoryNodeTree && {
              ...directoryNodeTree,
              children: directoryNodeTree.children
                  .map((child) => filterTree(child, searchTerm))
                  .filter(Boolean),
          };

    // Context Menu
    const [contextMenu, setContextMenu] = useState(null);
    const [targetFolder, setTargetFolder] = useState(null);

    const handleContextMenu = (e, item) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };

    const closeContextMenu = () => {
        setContextMenu(null);
    };

    const handleDelete = async (item) => {
        await invoke("delete_path", { path: item.path });
        ReloadFiles();
    };

    // Renaming
    const [renamingPath, setRenamingPath] = useState(null);
    const [renameValue, setRenameValue] = useState("");

    const beginRename = (item) => {
        setRenamingPath(item.path);
        setRenameValue(item.name);
        closeContextMenu();
    };
    const cancelRename = () => {
        setRenamingPath(null);
        setRenameValue("");
    };
    const submitRename = async (item) => {
        const trimmed = renameValue.trim();
        if (!trimmed || trimmed === item.name) {
            cancelRename();
            return;
        }

        const parentDir = item.path.slice(0, item.path.lastIndexOf("/"));
        const newPath = `${parentDir}/${trimmed}`;

        try {
            await invoke("rename_path", {
                oldPath: item.path,
                newPath: newPath,
            });
            await ReloadFiles();
        } catch (err) {
            console.error("Rename failed:", err);
        } finally {
            cancelRename();
        }
    };

    const handleRenameKeyDown = (e, item) => {
        if (e.key === "Enter") {
            e.preventDefault();
            submitRename(item);
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancelRename();
        }
    };

    // Button Functions
    const OpenCreateFile = () => {
        setModalOpen((prev) => !prev);
    };
    const OpenSearch = () => {
        setSearchOpen((prev) => !prev);
    };

    const plusClick = (path) => {
        setTargetFolder(path);
        setModalOpen(true);
    };

    const ReloadFiles = async () => {
        // HARD CODED FOR NOW
        const response = await invoke("list_directory", {
            path: "/home/josh/Documents/repos/Node64/ChessData/",
        });
        setDirectoryNodeTree(response);
    };

    return (
        <div className="explorer">
            <div
                className={`create-file-modal-wrapper ${modalOpen ? "" : "hidden"}`}
            >
                <CreateFileModal
                    targetFolder={targetFolder}
                    onClose={handleCloseModal}
                />
            </div>
            <div className="explorer-head">
                <div className="title">Explorer</div>
                <div className="explorer-buttons-wrapper">
                    <ExplorerButton content={"⌕"} clickFunction={OpenSearch} />
                    <ExplorerButton content={"⟳"} clickFunction={ReloadFiles} />
                </div>
            </div>
            <div className={`search-container ${searchOpen ? "" : "hidden"}`}>
                <input
                    type="text"
                    id="search-directories"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="filetree-content">
                {filteredTree &&
                    filteredTree.children.map((item) =>
                        item.is_directory ? (
                            <ExplorerFolder
                                key={item.path}
                                name={item.name}
                                path={item.path}
                                children={item.children}
                                level={1}
                                plusClick={plusClick}
                                openAnalysisCallback={
                                    callbackObj.analysis_callback
                                }
                                openRepertoireCallback={
                                    callbackObj.repertoire_callback
                                }
                                onContextMenu={handleContextMenu}
                                renamingPath={renamingPath}
                                renameValue={renameValue}
                                setRenameValue={setRenameValue}
                                onRenameKeyDown={handleRenameKeyDown}
                                onRenameBlur={cancelRename}
                                forceOpen={!!searchTerm.trim()}
                            />
                        ) : (
                            <ExplorerFile
                                key={item.path}
                                itemRef={item}
                                fileOpenRef={() => {}}
                                contextMenuRef={handleContextMenu}
                                isRenaming={renamingPath === item.path}
                                renameValue={renameValue}
                                setRenameValue={setRenameValue}
                                onRenameKeyDown={handleRenameKeyDown}
                                onRenameBlur={cancelRename}
                            />
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
                            onClick: () => handleDelete(contextMenu.item),
                        },
                    ]}
                />
            )}
        </div>
    );
}

export function filterTree(node, term) {
    const lowerTerm = term.toLowerCase();

    if (!node.is_directory) {
        return node.name.toLowerCase().includes(lowerTerm) ? node : null;
    }

    const filteredChildren = (node.children || [])
        .map((child) => filterTree(child, term))
        .filter(Boolean);

    const nameMatches = node.name?.toLowerCase().includes(lowerTerm);

    if (nameMatches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
    }

    return null;
}
