import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
import { open as openFileDialog } from "@tauri-apps/plugin-dialog";

/**
 * DatabaseDocument
 *
 * Mirrors the shape of AnalysisDocument: a plain class holding state, with
 * an `onChange` callback the page calls setVersion(v+1) from so React
 * re-renders whenever the class mutates itself. Node64 only ever has one
 * database open at a time, so this class owns that global-ish state for
 * the single Database tab.
 */
export default class DatabaseDocument {
    constructor(onChange) {
        this.onChange = onChange;

        this.databasesDir = null; // resolved async in init()
        this.databases = []; // [{ name, path, sizeBytes, gameCount, positionCount, isOpen }]
        this.currentDatabase = null; // name of the open db, or null

        this.filters = {
            player: "",
            eco: "",
            result: "",
            dateFrom: "",
            dateTo: "",
            minElo: "",
            moveSequence: "",
            fen: "",
            sortBy: "date",
            sortDesc: true,
            limit: 200,
            offset: 0,
        };

        this.results = { games: [], totalCount: 0 };
        this.stats = null;
        this.explorer = null; // { positionFen, totalGames, moves: [...] }
        this.selectedGame = null; // full GameRecord, when a row is opened

        this.loading = false;
        this.importSummary = null;
        this.importProgress = null; // { done, total } while a multi-file import is running
        this.error = null;
    }

    notify() {
        if (this.onChange) this.onChange();
    }

    async init() {
        if (!this.databasesDir) {
            const base = await appDataDir();
            this.databasesDir = await join(base, "ChessData", "Databases");
        }
        await this.refreshDatabaseList();
    }

    async refreshDatabaseList() {
        try {
            this.databases = await invoke("n64_list_databases", {
                databasesDir: this.databasesDir,
            });
            const open = this.databases.find((d) => d.isOpen);
            this.currentDatabase = open ? open.name : null;
        } catch (e) {
            this.error = String(e);
        }
        this.notify();
    }

    async createDatabase(name) {
        if (!name || !name.trim()) return;
        try {
            await invoke("n64_create_database", {
                databasesDir: this.databasesDir,
                name: name.trim(),
            });
            this.error = null;
        } catch (e) {
            this.error = String(e);
        }
        await this.refreshDatabaseList();
    }

    async openDatabase(name) {
        this.loading = true;
        this.notify();
        try {
            await invoke("n64_open_database", {
                databasesDir: this.databasesDir,
                name,
            });
            this.currentDatabase = name;
            this.error = null;
            await this.search();
        } catch (e) {
            this.error = String(e);
        }
        this.loading = false;
        await this.refreshDatabaseList();
    }

    async closeDatabase() {
        try {
            await invoke("n64_close_database");
            this.currentDatabase = null;
            this.results = { games: [], totalCount: 0 };
            this.stats = null;
            this.explorer = null;
        } catch (e) {
            this.error = String(e);
        }
        await this.refreshDatabaseList();
    }

    async deleteDatabase(name) {
        try {
            await invoke("n64_delete_database", {
                databasesDir: this.databasesDir,
                name,
            });
            if (this.currentDatabase === name) {
                this.currentDatabase = null;
                this.results = { games: [], totalCount: 0 };
            }
        } catch (e) {
            this.error = String(e);
        }
        await this.refreshDatabaseList();
    }

    async renameDatabase(oldName, newName) {
        if (!newName || !newName.trim()) return;
        try {
            await invoke("n64_rename_database", {
                databasesDir: this.databasesDir,
                oldName,
                newName: newName.trim(),
            });
            if (this.currentDatabase === oldName) this.currentDatabase = newName.trim();
        } catch (e) {
            this.error = String(e);
        }
        await this.refreshDatabaseList();
    }

    /** Opens a native file picker and imports the chosen .pgn file. */
    async importPgnFile() {
        if (!this.currentDatabase) {
            this.error = "Open a database before importing.";
            this.notify();
            return;
        }
        let filePaths;
        try {
            filePaths = await openFileDialog({
                multiple: true,
                filters: [{ name: "PGN", extensions: ["pgn"] }],
            });
        } catch (e) {
            this.error = String(e);
            this.notify();
            return;
        }
        if (!filePaths) return; // user cancelled
        // openFileDialog returns a single string when multiple picks aren't
        // supported by the platform/version; normalize to an array either way.
        const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
        if (paths.length === 0) return;

        this.loading = true;
        this.importProgress = { done: 0, total: paths.length };
        this.notify();

        const combined = { imported: 0, skippedDuplicates: 0, failed: 0, errors: [] };
        for (const filePath of paths) {
            try {
                const summary = await invoke("n64_import_pgn_file", { filePath });
                combined.imported += summary.imported;
                combined.skippedDuplicates += summary.skippedDuplicates;
                combined.failed += summary.failed;
                combined.errors.push(...summary.errors);
            } catch (e) {
                combined.failed += 1;
                combined.errors.push(`${filePath}: ${String(e)}`);
            }
            this.importProgress = { done: this.importProgress.done + 1, total: paths.length };
            this.notify();
        }

        this.importSummary = combined;
        this.importProgress = null;
        this.error = null;
        await this.search();
        this.loading = false;
        this.notify();
    }

    /** Imports raw PGN text, e.g. pasted from the clipboard. */
    async importPgnText(pgnText, source = "clipboard") {
        if (!this.currentDatabase) {
            this.error = "Open a database before importing.";
            this.notify();
            return;
        }
        this.loading = true;
        this.notify();
        try {
            this.importSummary = await invoke("n64_import_pgn_text", { pgnText, source });
            this.error = null;
            await this.search();
        } catch (e) {
            this.error = String(e);
        }
        this.loading = false;
        this.notify();
    }

    setFilter(key, value) {
        this.filters = { ...this.filters, [key]: value };
        this.notify();
    }

    async search(resetOffset = true) {
        if (!this.currentDatabase) return;
        if (resetOffset) this.filters.offset = 0;

        const f = this.filters;
        const payload = {
            player: f.player || null,
            eco: f.eco || null,
            result: f.result || null,
            dateFrom: f.dateFrom || null,
            dateTo: f.dateTo || null,
            minElo: f.minElo ? Number(f.minElo) : null,
            moveSequence: f.moveSequence || null,
            fen: f.fen || null,
            sortBy: f.sortBy,
            sortDesc: f.sortDesc,
            limit: f.limit,
            offset: f.offset,
        };

        this.loading = true;
        this.notify();
        try {
            this.results = await invoke("n64_search_games", { filters: payload });
            this.stats = await invoke("n64_search_stats", { filters: payload });
            this.error = null;
        } catch (e) {
            this.error = String(e);
        }
        this.loading = false;
        this.notify();
    }

    async nextPage() {
        this.filters.offset += this.filters.limit;
        await this.search(false);
    }

    async prevPage() {
        this.filters.offset = Math.max(0, this.filters.offset - this.filters.limit);
        await this.search(false);
    }

    sortBy(column) {
        if (this.filters.sortBy === column) {
            this.filters.sortDesc = !this.filters.sortDesc;
        } else {
            this.filters.sortBy = column;
            this.filters.sortDesc = true;
        }
        this.search();
    }

    async loadExplorer(moveSequence = "") {
        try {
            this.explorer = moveSequence
                ? await invoke("n64_explorer_by_moves", { moveSequence })
                : await invoke("n64_explorer_by_fen", { fen: null });
            this.error = null;
        } catch (e) {
            this.error = String(e);
        }
        this.notify();
    }

    async openGame(gameId) {
        try {
            this.selectedGame = await invoke("n64_get_game", { gameId });
            this.error = null;
        } catch (e) {
            this.error = String(e);
        }
        this.notify();
    }

    closeSelectedGame() {
        this.selectedGame = null;
        this.notify();
    }

    async deleteGame(gameId) {
        try {
            await invoke("n64_delete_game", { gameId });
            if (this.selectedGame?.id === gameId) this.selectedGame = null;
            await this.search(false);
        } catch (e) {
            this.error = String(e);
        }
        this.notify();
    }
}
