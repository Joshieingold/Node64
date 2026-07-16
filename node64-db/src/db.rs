use rusqlite::Connection;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use crate::models::DatabaseInfo;

const SCHEMA_SQL: &str = include_str!("../schema.sql");
pub const DB_EXTENSION: &str = "n64db";

/// Global app state: at most one database is open at a time, matching the
/// Node64 philosophy of a single "current database" per session.
pub struct DbState {
    pub inner: Mutex<Option<OpenDb>>,
}

pub struct OpenDb {
    pub conn: Connection,
    pub path: PathBuf,
}

impl Default for DbState {
    fn default() -> Self {
        DbState { inner: Mutex::new(None) }
    }
}

impl DbState {
    /// Open (or create) a database file and make it the current database,
    /// closing whatever was previously open.
    pub fn open(&self, path: &Path) -> Result<(), String> {
        let conn = Connection::open(path).map_err(|e| e.to_string())?;
        conn.pragma_update(None, "foreign_keys", "ON").map_err(|e| e.to_string())?;
        conn.pragma_update(None, "journal_mode", "WAL").map_err(|e| e.to_string())?;
        conn.execute_batch(SCHEMA_SQL).map_err(|e| e.to_string())?;

        let mut guard = self.inner.lock().map_err(|_| "db lock poisoned".to_string())?;
        *guard = Some(OpenDb { conn, path: path.to_path_buf() });
        Ok(())
    }

    pub fn close(&self) -> Result<(), String> {
        let mut guard = self.inner.lock().map_err(|_| "db lock poisoned".to_string())?;
        *guard = None;
        Ok(())
    }

    pub fn current_path(&self) -> Option<PathBuf> {
        let guard = self.inner.lock().ok()?;
        guard.as_ref().map(|d| d.path.clone())
    }

    /// Run a closure with access to the currently open connection.
    pub fn with_conn<T>(&self, f: impl FnOnce(&Connection) -> Result<T, String>) -> Result<T, String> {
        let guard = self.inner.lock().map_err(|_| "db lock poisoned".to_string())?;
        let db = guard.as_ref().ok_or_else(|| "no database is currently open".to_string())?;
        f(&db.conn)
    }
}

/// Create a brand-new, empty database file at `path`. Fails if it already exists.
pub fn create_database(path: &Path) -> Result<(), String> {
    if path.exists() {
        return Err(format!("database already exists: {}", path.display()));
    }
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute_batch(SCHEMA_SQL).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_database(path: &Path) -> Result<(), String> {
    std::fs::remove_file(path).map_err(|e| e.to_string())?;
    // WAL/SHM sidecar files, if present
    let _ = std::fs::remove_file(path.with_extension(format!("{DB_EXTENSION}-wal")));
    let _ = std::fs::remove_file(path.with_extension(format!("{DB_EXTENSION}-shm")));
    Ok(())
}

pub fn rename_database(old_path: &Path, new_path: &Path) -> Result<(), String> {
    if new_path.exists() {
        return Err(format!("a database already exists at: {}", new_path.display()));
    }
    std::fs::rename(old_path, new_path).map_err(|e| e.to_string())
}

/// List every .n64db file in the Databases directory.
pub fn list_databases(dir: &Path, currently_open: Option<&Path>) -> Result<Vec<DatabaseInfo>, String> {
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut out = Vec::new();
    for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some(DB_EXTENSION) {
            continue;
        }
        let size_bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);
        let name = path.file_stem().and_then(|s| s.to_str()).unwrap_or("unknown").to_string();
        let is_open = currently_open == Some(path.as_path());

        let (game_count, position_count) = match Connection::open(&path) {
            Ok(conn) => {
                let games: i64 = conn.query_row("SELECT COUNT(*) FROM games", [], |r| r.get(0)).unwrap_or(0);
                let positions: i64 = conn.query_row("SELECT COUNT(*) FROM positions", [], |r| r.get(0)).unwrap_or(0);
                (games, positions)
            }
            Err(_) => (0, 0),
        };

        out.push(DatabaseInfo {
            name,
            path: path.to_string_lossy().to_string(),
            size_bytes,
            game_count,
            position_count,
            is_open,
        });
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(out)
}
