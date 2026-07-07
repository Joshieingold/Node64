mod explorer;
use explorer::list_directory;
use explorer::create_file;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            list_directory,
            create_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
