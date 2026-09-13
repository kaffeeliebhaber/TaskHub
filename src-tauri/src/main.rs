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
#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    let parsed = tauri::Url::parse(&url).map_err(|e| e.to_string())?;
    if !["http", "https"].contains(&parsed.scheme()) { return Err("Nur HTTP/HTTPS erlaubt.".into()); }
    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open").arg(parsed.as_str()).spawn().map_err(|e|e.to_string())?;
    #[cfg(target_os = "windows")]
    std::process::Command::new("rundll32.exe").arg("url.dll,FileProtocolHandler").arg(parsed.as_str()).spawn().map_err(|e|e.to_string())?;
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(parsed.as_str()).spawn().map_err(|e|e.to_string())?;
    Ok(())
}
#[tauri::command]
fn export_canvas(app: tauri::AppHandle, content: String) -> Result<String, String> {
    if content.len() > 100_000_000 { return Err("Export zu groß.".into()); }
    let directory = app.path().download_dir().map_err(|e|e.to_string())?;
    std::fs::create_dir_all(&directory).map_err(|e|e.to_string())?;
    let stamp=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|e|e.to_string())?.as_nanos();
    let path=directory.join(format!("TaskHub-{stamp}.canvas"));
    std::fs::write(&path,content).map_err(|e|e.to_string())?;
    Ok(format!("Export gespeichert: {}. Lege diese Datei in deinen Obsidian-Vault.",path.display()))
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
            database_path,
            open_external,
            export_canvas
        ])
        .run(tauri::generate_context!())
        .expect("TaskHub konnte nicht gestartet werden");
}
