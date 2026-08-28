#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            proof_pile_core::scan_directories,
            proof_pile_core::execute_quarantine,
            proof_pile_core::restore_quarantined,
            proof_pile_core::write_decision_log
        ])
        .run(tauri::generate_context!())
        .expect("Proof Pile could not start");
}
