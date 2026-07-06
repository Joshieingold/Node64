use serde::Serialize;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

#[derive(Debug, Clone, Serialize)]
pub struct ExplorerNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub expanded: bool,
    pub children: Vec<ExplorerNode>,
}

fn build_tree(path: &Path) -> ExplorerNode {
    let metadata = fs::metadata(path).unwrap();
    let mut node = ExplorerNode {
        name: path
            .file_name()
            .unwrap_or(path.as_os_str())
            .to_string_lossy()
            .to_string(),
        path: path.to_string_lossy().to_string(),
        is_directory: metadata.is_dir(),
        expanded: false,
        children: Vec::new(),
    };
    if metadata.is_dir() {
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.flatten() {
                node.children.push(build_tree(&entry.path()));
            }
        }
    }
    node
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<ExplorerNode, String> {
    Ok(build_tree(Path::new(&path)))
}

#[tauri::command]
pub fn create_file(destination: String, name: String, pgn: String) -> Result<(), String> {
    let full_path = format!("{}/{}", destination, name);
    let mut file = File::create(full_path).map_err(|e| e.to_string())?;

    let contents = if pgn.is_empty() {
        "".to_string()
    } else {
        pgn
    };

    file.write_all(contents.as_bytes()).map_err(|e| e.to_string())?;
    Ok(())
}
