#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use ff7_lib::utils::process;
use tauri::ipc::Invoke;
use ff7_lib::ff7::addresses::FF7Addresses;
use ff7_lib::utils::memory::write_memory_buffer;

#[tauri::command]
pub fn update_mes_data(data: Vec<u8>) -> Result<(), String> {
    if process::is_ff7_running() {
        let addresses = FF7Addresses::new();
        let _ = write_memory_buffer(addresses.world_mes_data, data);
        Ok(())
    } else {
        Err("FF7 is not running".to_string())
    }
}

pub fn generate_handler() -> impl Fn(Invoke<tauri::Wry>) -> bool + Send + Sync {
    tauri::generate_handler![
        update_mes_data,
    ]
}
