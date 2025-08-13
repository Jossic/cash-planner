#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{path::PathBuf, sync::Arc};

use app::{AppDeps, AppService, CreateInvoiceDto, CreateInvoiceSimpleDto};
use chrono::NaiveDate;
use domain::{DashboardSummary, Expense, MonthId, Settings, UrssafReport, VatReport, MonthRecap};
use infra::connect_and_migrate;
use serde::{Deserialize, Serialize};
use tauri::{Manager, State};

struct AppState(Arc<AppService>);

#[tauri::command]
async fn cmd_dashboard(state: State<'_, AppState>, month: i32, m: u8) -> Result<DashboardSummary, String> {
    state.0.get_dashboard(MonthId { year: month, month: m as u32 }).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_list_invoices(state: State<'_, AppState>, month: Option<i32>, m: Option<u8>) -> Result<serde_json::Value, String> {
    let month = match (month, m) {
        (Some(y), Some(m)) => Some(MonthId { year: y, month: m as u32 }),
        _ => None,
    };
    let list = state.0.list_invoices(month).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(list).unwrap())
}

#[tauri::command]
async fn cmd_create_invoice(state: State<'_, AppState>, dto: CreateInvoiceDto) -> Result<(), String> {
    let inv = dto.into_entity().map_err(|e| e.to_string())?;
    state.0.create_invoice(inv).await.map_err(|e| e.to_string())
}

#[derive(Debug, Serialize, Deserialize)]
struct CreateExpenseDto {
    label: String,
    category: String,
    booking_date: String,
    amount_ht_cents: i64,
    vat_rate_ppm: i32,
    paid_at: Option<String>,
}

#[tauri::command]
async fn cmd_create_expense(state: State<'_, AppState>, dto: CreateExpenseDto) -> Result<(), String> {
    let booking_date = NaiveDate::parse_from_str(&dto.booking_date, "%Y-%m-%d").map_err(|e| e.to_string())?;
    let paid_at = match dto.paid_at { Some(s) => Some(NaiveDate::parse_from_str(&s, "%Y-%m-%d").map_err(|e| e.to_string())?), None => None };
    let exp = Expense {
        id: uuid::Uuid::new_v4(),
        label: dto.label,
        category: dto.category,
        booking_date,
        amount_ht: dto.amount_ht_cents,
        vat_rate_ppm: dto.vat_rate_ppm,
        amount_tva: 0,
        amount_ttc: 0,
        paid_at,
        receipt_path: None,
    };
    state.0.create_expense(exp).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_list_expenses(state: State<'_, AppState>, month: Option<i32>, m: Option<u8>) -> Result<serde_json::Value, String> {
    let month = match (month, m) {
        (Some(y), Some(m)) => Some(MonthId { year: y, month: m as u32 }),
        _ => None,
    };
    let list = state.0.list_expenses(month).await.map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(list).unwrap())
}

#[tauri::command]
async fn cmd_prepare_vat(state: State<'_, AppState>, y: i32, m: u8) -> Result<VatReport, String> {
    state.0.prepare_vat(MonthId { year: y, month: m as u32 }).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_prepare_urssaf(state: State<'_, AppState>, y: i32, m: u8) -> Result<UrssafReport, String> {
    state.0.prepare_urssaf(MonthId { year: y, month: m as u32 }).await.map_err(|e| e.to_string())
}

fn data_dir<R: tauri::Runtime>(app: &tauri::App<R>) -> PathBuf {
    app
        .path()
        .app_data_dir()
        .or_else(|_| app.path().app_config_dir())
        .unwrap_or_else(|_| std::env::current_dir().unwrap())
        .join("data")
}

fn main() {
    tauri::Builder::<tauri::Wry>::default()
        .setup(|app: &mut tauri::App<tauri::Wry>| {
            let base = data_dir(app);
            std::fs::create_dir_all(&base).ok();
            let db_path = base.join("data.sqlite");
            let app_handle = app.handle();
            tauri::async_runtime::block_on(async move {
                let conn_str = format!("sqlite:{}", db_path.display());
                let repos = connect_and_migrate(&conn_str).await.expect("db init");
                let deps = AppDeps {
                    invoices: Arc::new(repos.invoices()),
                    expenses: Arc::new(repos.expenses()),
                    provisions: Arc::new(repos.provisions()),
                    config: Arc::new(repos.config()),
                    months: Arc::new(repos.months()),
                };
                let service = AppService::new(deps);
                app_handle.manage(AppState(Arc::new(service)));
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            cmd_dashboard,
            cmd_list_invoices,
            cmd_create_invoice,
            cmd_create_invoice_simple,
            cmd_create_expense,
            cmd_list_expenses,
            cmd_prepare_vat,
            cmd_prepare_urssaf,
            cmd_month_recap,
            cmd_close_month,
            cmd_month_status,
            cmd_get_settings,
            cmd_save_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn cmd_create_invoice_simple(state: State<'_, AppState>, dto: CreateInvoiceSimpleDto) -> Result<(), String> {
    state.0.create_invoice_simple(dto).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_month_recap(state: State<'_, AppState>, y: i32, m: u8) -> Result<MonthRecap, String> {
    state.0.month_recap(MonthId{ year: y, month: m as u32 }).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_close_month(state: State<'_, AppState>, y: i32, m: u8) -> Result<(), String> {
    state.0.close_month(MonthId{ year: y, month: m as u32 }).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_month_status(state: State<'_, AppState>, y: i32, m: u8) -> Result<domain::MonthStatus, String> {
    state.0.get_month_status(MonthId{ year: y, month: m as u32 }).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_forecast(state: State<'_, AppState>, y: i32, m: u8, horizon: u32) -> Result<domain::ForecastResult, String> {
    state.0.forecast(MonthId{ year: y, month: m as u32 }, horizon).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_get_settings(state: State<'_, AppState>) -> Result<Settings, String> {
    state.0.get_settings().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_save_settings(state: State<'_, AppState>, s: Settings) -> Result<(), String> {
    state.0.save_settings(s).await.map_err(|e| e.to_string())
}
