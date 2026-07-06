mod explorer;
use explorer::list_directory;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
