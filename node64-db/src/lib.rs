pub mod chess;
pub mod commands;
pub mod db;
pub mod eco;
pub mod explorer;
pub mod import;
pub mod models;
pub mod pgn;
pub mod search;
pub mod util;
pub mod zobrist;

pub use db::DbState;

/// Registers Node64 state and commands on a Tauri Builder.
///
/// ```ignore
/// fn main() {
///     tauri::Builder::default()
///         .setup(|app| node64_db::init(app))
///         .invoke_handler(node64_db::invoke_handler())
///         .run(tauri::generate_context!())
///         .expect("error while running tauri application");
/// }
/// ```
pub fn init(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    app.manage(db::DbState::default());
    Ok(())
}

/// Convenience macro-free handler list. Because `tauri::generate_handler!`
/// must be invoked from the binary crate (it uses macro hygiene tied to the
/// call site), copy this list into your own `main.rs`:
///
/// ```ignore
/// tauri::generate_handler![
///     node64_db::commands::n64_list_databases,
///     node64_db::commands::n64_create_database,
///     node64_db::commands::n64_open_database,
///     node64_db::commands::n64_close_database,
///     node64_db::commands::n64_delete_database,
///     node64_db::commands::n64_rename_database,
///     node64_db::commands::n64_current_database,
///     node64_db::commands::n64_import_pgn_text,
///     node64_db::commands::n64_import_pgn_file,
///     node64_db::commands::n64_search_games,
///     node64_db::commands::n64_search_stats,
///     node64_db::commands::n64_get_game,
///     node64_db::commands::n64_delete_game,
///     node64_db::commands::n64_explorer_by_fen,
///     node64_db::commands::n64_explorer_by_moves,
///     node64_db::commands::n64_representative_games,
/// ]
/// ```
pub fn handler_names() -> &'static [&'static str] {
    &[
        "n64_list_databases",
        "n64_create_database",
        "n64_open_database",
        "n64_close_database",
        "n64_delete_database",
        "n64_rename_database",
        "n64_current_database",
        "n64_import_pgn_text",
        "n64_import_pgn_file",
        "n64_search_games",
        "n64_search_stats",
        "n64_get_game",
        "n64_delete_game",
        "n64_explorer_by_fen",
        "n64_explorer_by_moves",
        "n64_representative_games",
    ]
}

use tauri::Manager;
