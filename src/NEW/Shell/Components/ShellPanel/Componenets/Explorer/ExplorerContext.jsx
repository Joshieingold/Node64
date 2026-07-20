import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
} from "react";
import { invoke } from "@tauri-apps/api/core";

const ExplorerContext = createContext(null);
export const useExplorer = () => useContext(ExplorerContext);

const STORAGE_KEY = "explorer.rootPath";
const DEFAULT_PATH = "/home/josh/Documents/repos/Node64/ChessData/";

export function ExplorerProvider({ callbackObj, children }) {
    const [rootPath] = useState(
        () => localStorage.getItem(STORAGE_KEY) || DEFAULT_PATH,
    );
    const [tree, setTree] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [contextMenu, setContextMenu] = useState(null);
    const [renamingPath, setRenamingPath] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [creatingPath, setCreatingPath] = useState(null);
    const [createValue, setCreateValue] = useState("");

    const reload = useCallback(async () => {
        const response = await invoke("list_directory", { path: rootPath });
        setTree(response);
    }, [rootPath]);

    useEffect(() => {
        reload();
    }, [reload]);

    // --- context menu ---
    const openContextMenu = (e, item) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
    };
    const closeContextMenu = () => setContextMenu(null);

    // --- delete ---
    const deleteItem = async (item) => {
        await invoke("delete_path", { path: item.path });
        reload();
    };

    // --- rename ---
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
        if (!trimmed || trimmed === item.name) return cancelRename();
        const parentDir = item.path.slice(0, item.path.lastIndexOf("/"));
        try {
            await invoke("rename_path", {
                oldPath: item.path,
                newPath: `${parentDir}/${trimmed}`,
            });
            await reload();
        } catch (err) {
            console.error("Rename failed:", err);
        } finally {
            cancelRename();
        }
    };
    const handleRenameKeyDown = (e, item) => {
        if (e.key === "Enter") submitRename(item);
        if (e.key === "Escape") cancelRename();
    };

    // --- create ---
    const beginCreate = (path) => {
        setCreatingPath(path);
        setCreateValue("");
    };
    const cancelCreate = () => {
        setCreatingPath(null);
        setCreateValue("");
    };
    const submitCreate = async () => {
        const trimmed = createValue.trim();
        if (!trimmed) return cancelCreate();
        const [name, fileType] = trimmed.split(".");
        try {
            await invoke("create_file", {
                destination: creatingPath,
                name,
                fileType,
                pgn: "",
            });
            await reload();
        } catch (err) {
            console.error("Create failed:", err);
        } finally {
            cancelCreate();
        }
    };
    const handleCreateKeyDown = (e) => {
        if (e.key === "Enter") submitCreate();
        if (e.key === "Escape") cancelCreate();
    };
    const handleNewFileHere = (item) => {
        const dir = item.is_directory
            ? item.path
            : item.path.slice(0, item.path.lastIndexOf("/"));
        beginCreate(dir);
    };

    // --- open file ---
    const openFile = (item) => {
        const suffix = item.name.split(".")[1];
        if (suffix === "pgn") callbackObj.analysis_callback(item.path);
        if (suffix === "rpgn") callbackObj.repertoire_callback(item.path);
    };

    const filteredTree = !searchTerm.trim()
        ? tree
        : tree && {
              ...tree,
              children: tree.children
                  .map((c) => filterTree(c, searchTerm))
                  .filter(Boolean),
          };

    const value = {
        tree: filteredTree,
        reload,
        searchTerm,
        setSearchTerm,
        forceOpen: !!searchTerm.trim(),
        contextMenu,
        openContextMenu,
        closeContextMenu,
        deleteItem,
        renamingPath,
        renameValue,
        setRenameValue,
        beginRename,
        cancelRename,
        submitRename,
        handleRenameKeyDown,
        creatingPath,
        createValue,
        setCreateValue,
        beginCreate,
        cancelCreate,
        submitCreate,
        handleCreateKeyDown,
        handleNewFileHere,
        openFile,
    };

    return (
        <ExplorerContext.Provider value={value}>
            {children}
        </ExplorerContext.Provider>
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
    return nameMatches || filteredChildren.length > 0
        ? { ...node, children: filteredChildren }
        : null;
}
