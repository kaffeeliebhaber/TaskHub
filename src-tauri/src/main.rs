#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::sync::Mutex;
use taskhub_core::{Database, Workspace};
use tauri::Manager;
struct AppState {
    db: Mutex<Database>,
    path: String,
}
#[tauri::command]
fn load_workspace(state: tauri::State<AppState>) -> Result<Workspace, String> {
    state
        .db
        .lock()
        .map_err(|_| "Datenbank ist gesperrt.".to_string())?
        .load()
}
#[tauri::command]
fn save_workspace(state: tauri::State<AppState>, workspace: Workspace) -> Result<u64, String> {
    state
        .db
        .lock()
        .map_err(|_| "Datenbank ist gesperrt.".to_string())?
        .save(&workspace)
}
#[tauri::command]
fn database_path(state: tauri::State<AppState>) -> String {
    state.path.clone()
}
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let directory = app.path().app_data_dir()?;
            std::fs::create_dir_all(&directory)?;
            let path = directory.join("taskhub.db");
            let db = Database::open(&path).map_err(std::io::Error::other)?;
            app.manage(AppState {
                db: Mutex::new(db),
                path: path.to_string_lossy().into_owned(),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_workspace,
            save_workspace,
            database_path
        ])
        .run(tauri::generate_context!())
        .expect("TaskHub konnte nicht gestartet werden");
}
