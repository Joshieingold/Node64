use std::path::{Path, PathBuf};
use tauri::State;

use crate::db::{self, DbState, DB_EXTENSION};
use crate::explorer;
use crate::import;
use crate::models::{DatabaseInfo, ExplorerResult, GameRecord, GameStats, ImportSummary, SearchFilters, SearchResult};
use crate::search;

fn db_path(databases_dir: &str, name: &str) -> PathBuf {
    Path::new(databases_dir).join(format!("{name}.{DB_EXTENSION}"))
}

// ---------------------------------------------------------------------
// Database lifecycle
// ---------------------------------------------------------------------

#[tauri::command]
pub fn n64_list_databases(databases_dir: String, state: State<DbState>) -> Result<Vec<DatabaseInfo>, String> {
    let current = state.current_path();
    db::list_databases(Path::new(&databases_dir), current.as_deref())
}

#[tauri::command]
pub fn n64_create_database(databases_dir: String, name: String) -> Result<(), String> {
    db::create_database(&db_path(&databases_dir, &name))
}

#[tauri::command]
pub fn n64_open_database(databases_dir: String, name: String, state: State<DbState>) -> Result<(), String> {
    state.open(&db_path(&databases_dir, &name))
}

#[tauri::command]
pub fn n64_close_database(state: State<DbState>) -> Result<(), String> {
    state.close()
}

#[tauri::command]
pub fn n64_delete_database(databases_dir: String, name: String, state: State<DbState>) -> Result<(), String> {
    let path = db_path(&databases_dir, &name);
    if state.current_path().as_deref() == Some(path.as_path()) {
        state.close()?;
    }
    db::delete_database(&path)
}

#[tauri::command]
pub fn n64_rename_database(databases_dir: String, old_name: String, new_name: String, state: State<DbState>) -> Result<(), String> {
    let old_path = db_path(&databases_dir, &old_name);
    let new_path = db_path(&databases_dir, &new_name);
    let was_open = state.current_path().as_deref() == Some(old_path.as_path());
    if was_open {
        state.close()?;
    }
    db::rename_database(&old_path, &new_path)?;
    if was_open {
        state.open(&new_path)?;
    }
    Ok(())
}

#[tauri::command]
pub fn n64_current_database(state: State<DbState>) -> Option<String> {
    state.current_path().map(|p| p.to_string_lossy().to_string())
}

// ---------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------

#[tauri::command]
pub fn n64_import_pgn_text(pgn_text: String, source: Option<String>, state: State<DbState>) -> Result<ImportSummary, String> {
    state.with_conn(|conn| import::import_pgn_text(conn, &pgn_text, source.as_deref().unwrap_or("manual-import")))
}

#[tauri::command]
pub fn n64_import_pgn_file(file_path: String, state: State<DbState>) -> Result<ImportSummary, String> {
    let text = std::fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let source = format!("file:{file_path}");
    state.with_conn(|conn| import::import_pgn_text(conn, &text, &source))
}

// ---------------------------------------------------------------------
// Search / browse
// ---------------------------------------------------------------------

#[tauri::command]
pub fn n64_search_games(filters: SearchFilters, state: State<DbState>) -> Result<SearchResult, String> {
    state.with_conn(|conn| search::search_games(conn, &filters))
}

#[tauri::command]
pub fn n64_search_stats(filters: SearchFilters, state: State<DbState>) -> Result<GameStats, String> {
    state.with_conn(|conn| search::compute_stats(conn, &filters))
}

#[tauri::command]
pub fn n64_get_game(game_id: i64, state: State<DbState>) -> Result<GameRecord, String> {
    state.with_conn(|conn| {
        conn.query_row(
            "SELECT id, uuid, white, black, event, site, date, round, result, eco,
                    white_elo, black_elo, start_fen, is_chess960, ply_count, pgn, source, imported_at
             FROM games WHERE id = ?1",
            rusqlite::params![game_id],
            |row| {
                Ok(GameRecord {
                    id: row.get(0)?,
                    uuid: row.get(1)?,
                    white: row.get(2)?,
                    black: row.get(3)?,
                    event: row.get(4)?,
                    site: row.get(5)?,
                    date: row.get(6)?,
                    round: row.get(7)?,
                    result: row.get(8)?,
                    eco: row.get(9)?,
                    white_elo: row.get(10)?,
                    black_elo: row.get(11)?,
                    start_fen: row.get(12)?,
                    is_chess960: row.get::<_, i64>(13)? != 0,
                    ply_count: row.get(14)?,
                    pgn: row.get(15)?,
                    source: row.get(16)?,
                    imported_at: row.get(17)?,
                })
            },
        )
        .map_err(|e| e.to_string())
    })
}

#[tauri::command]
pub fn n64_delete_game(game_id: i64, state: State<DbState>) -> Result<(), String> {
    state.with_conn(|conn| {
        conn.execute("DELETE FROM games WHERE id = ?1", rusqlite::params![game_id])
            .map_err(|e| e.to_string())?;
        Ok(())
    })
}

// ---------------------------------------------------------------------
// Opening explorer
// ---------------------------------------------------------------------

#[tauri::command]
pub fn n64_explorer_by_fen(fen: Option<String>, state: State<DbState>) -> Result<ExplorerResult, String> {
    state.with_conn(|conn| explorer::explore(conn, fen.as_deref()))
}

#[tauri::command]
pub fn n64_explorer_by_moves(move_sequence: String, state: State<DbState>) -> Result<ExplorerResult, String> {
    state.with_conn(|conn| explorer::explore_after_sequence(conn, &move_sequence))
}

#[tauri::command]
pub fn n64_representative_games(fen: String, limit: Option<i64>, state: State<DbState>) -> Result<Vec<crate::models::GameSummary>, String> {
    state.with_conn(|conn| explorer::representative_games(conn, &fen, limit.unwrap_or(20)))
}
