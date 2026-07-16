mod explorer;
use explorer::list_directory;
use explorer::delete_path;
use explorer::create_file;
use explorer::rename_path;
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(node64_db::DbState::default())
        .invoke_handler(tauri::generate_handler![
            list_directory,
            create_file,
            delete_path,
            rename_path,
            node64_db::commands::n64_list_databases,
            node64_db::commands::n64_create_database,
            node64_db::commands::n64_open_database,
            node64_db::commands::n64_close_database,
            node64_db::commands::n64_delete_database,
            node64_db::commands::n64_rename_database,
            node64_db::commands::n64_current_database,
            node64_db::commands::n64_import_pgn_text,
            node64_db::commands::n64_import_pgn_file,
            node64_db::commands::n64_search_games,
            node64_db::commands::n64_search_stats,
            node64_db::commands::n64_get_game,
            node64_db::commands::n64_delete_game,
            node64_db::commands::n64_explorer_by_fen,
            node64_db::commands::n64_explorer_by_moves,
            node64_db::commands::n64_representative_games,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
