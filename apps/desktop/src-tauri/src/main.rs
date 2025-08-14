#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{path::PathBuf, sync::Arc};

use app::{AppDeps, AppService, CreateInvoiceDto, CreateInvoiceSimpleDto, CreateWorkingDayDto, CreateSimulationDto, EnhancedDashboardData, CreateOperationDto, UpdateOperationDto};
use chrono::NaiveDate;
use domain::{
    DashboardSummary, Expense, MonthId, Settings, UrssafReport, VatReport, MonthRecap,
    // New imports for enhanced features
    WorkingDay, WorkingDaysStats, TaxSchedule, Simulation, SimulationResults, MonthlyKPI,
    DailyRateCalculation, AnnualIncomeProjection, ProvisionOptimization, WorkingPatternAnalysis,
    // Operation model
    Operation, OperationSens, OperationStatus
};
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
                    // New dependencies
                    operations: Arc::new(repos.operations()),
                    working_days: Arc::new(repos.working_days()),
                    tax_schedules: Arc::new(repos.tax_schedules()),
                    simulations: Arc::new(repos.simulations()),
                    kpis: Arc::new(repos.kpis()),
                };
                let service = AppService::new(deps);
                app_handle.manage(AppState(Arc::new(service)));
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Existing commands
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
            cmd_save_settings,
            cmd_forecast,
            // New commands for enhanced features
            cmd_get_enhanced_dashboard,
            cmd_create_working_day,
            cmd_update_working_day,
            cmd_delete_working_day,
            cmd_list_working_days,
            cmd_get_working_days_stats,
            cmd_list_tax_schedules,
            cmd_get_overdue_schedules,
            cmd_mark_tax_schedule_paid,
            cmd_create_simulation,
            cmd_update_simulation,
            cmd_list_simulations,
            cmd_run_simulation,
            cmd_delete_simulation,
            cmd_get_monthly_kpi,
            cmd_compute_monthly_kpis,
            cmd_calculate_optimal_daily_rate,
            cmd_project_annual_income,
            cmd_compute_tax_schedule,
            cmd_optimize_provisions,
            cmd_analyze_working_patterns,
            // Operation commands
            cmd_create_operation,
            cmd_get_operation,
            cmd_update_operation,
            cmd_delete_operation,
            cmd_list_operations,
            cmd_list_operations_by_status,
            cmd_list_operations_by_sens,
            cmd_list_operations_by_encaissement_month,
            // V2 business logic commands
            cmd_get_dashboard_v2,
            cmd_prepare_vat_v2,
            cmd_prepare_urssaf_v2,
            cmd_month_recap_v2
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

// ============ New Tauri Commands ============

#[tauri::command]
async fn cmd_get_enhanced_dashboard(state: State<'_, AppState>, month: i32, m: u8) -> Result<EnhancedDashboardData, String> {
    state.0.get_enhanced_dashboard(MonthId { year: month, month: m as u32 }).await.map_err(|e| e.to_string())
}

// Working Days Commands
#[tauri::command]
async fn cmd_create_working_day(state: State<'_, AppState>, dto: CreateWorkingDayDto) -> Result<(), String> {
    let working_day = dto.into_entity().map_err(|e| e.to_string())?;
    state.0.create_working_day(working_day).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_update_working_day(state: State<'_, AppState>, working_day: WorkingDay) -> Result<(), String> {
    state.0.update_working_day(working_day).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_delete_working_day(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    state.0.delete_working_day(uuid).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_list_working_days(
    state: State<'_, AppState>, 
    start_date: Option<String>, 
    end_date: Option<String>
) -> Result<Vec<WorkingDay>, String> {
    let start = start_date.map(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d")).transpose().map_err(|e| e.to_string())?;
    let end = end_date.map(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d")).transpose().map_err(|e| e.to_string())?;
    
    state.0.list_working_days(start, end).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_get_working_days_stats(
    state: State<'_, AppState>, 
    start_date: String, 
    end_date: String
) -> Result<WorkingDaysStats, String> {
    let start = NaiveDate::parse_from_str(&start_date, "%Y-%m-%d").map_err(|e| e.to_string())?;
    let end = NaiveDate::parse_from_str(&end_date, "%Y-%m-%d").map_err(|e| e.to_string())?;
    
    state.0.get_working_days_stats(start, end).await.map_err(|e| e.to_string())
}

// Tax Schedule Commands
#[tauri::command]
async fn cmd_list_tax_schedules(
    state: State<'_, AppState>, 
    start_date: Option<String>, 
    end_date: Option<String>
) -> Result<Vec<TaxSchedule>, String> {
    let start = start_date.map(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d")).transpose().map_err(|e| e.to_string())?;
    let end = end_date.map(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d")).transpose().map_err(|e| e.to_string())?;
    
    state.0.list_tax_schedules(start, end).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_get_overdue_schedules(state: State<'_, AppState>, as_of_date: String) -> Result<Vec<TaxSchedule>, String> {
    let date = NaiveDate::parse_from_str(&as_of_date, "%Y-%m-%d").map_err(|e| e.to_string())?;
    state.0.get_overdue_schedules(date).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_mark_tax_schedule_paid(state: State<'_, AppState>, id: String, paid_date: String) -> Result<(), String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let date = NaiveDate::parse_from_str(&paid_date, "%Y-%m-%d").map_err(|e| e.to_string())?;
    state.0.mark_tax_schedule_as_paid(uuid, date).await.map_err(|e| e.to_string())
}

// Simulation Commands
#[tauri::command]
async fn cmd_create_simulation(state: State<'_, AppState>, dto: CreateSimulationDto) -> Result<String, String> {
    let simulation = dto.into_entity().map_err(|e| e.to_string())?;
    let id = simulation.id.to_string();
    state.0.create_simulation(simulation).await.map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
async fn cmd_update_simulation(state: State<'_, AppState>, simulation: Simulation) -> Result<(), String> {
    state.0.update_simulation(simulation).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_list_simulations(state: State<'_, AppState>) -> Result<Vec<Simulation>, String> {
    state.0.list_simulations().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_run_simulation(state: State<'_, AppState>, id: String) -> Result<SimulationResults, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    state.0.run_simulation(uuid).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_delete_simulation(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    state.0.delete_simulation(uuid).await.map_err(|e| e.to_string())
}

// KPI Commands
#[tauri::command]
async fn cmd_get_monthly_kpi(state: State<'_, AppState>, year: i32, month: u8) -> Result<Option<MonthlyKPI>, String> {
    let month_id = MonthId { year, month: month as u32 };
    state.0.get_monthly_kpi(&month_id).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_compute_monthly_kpis(state: State<'_, AppState>, year: i32, month: u8) -> Result<MonthlyKPI, String> {
    let month_id = MonthId { year, month: month as u32 };
    state.0.compute_and_save_monthly_kpis(&month_id).await.map_err(|e| e.to_string())
}

// Business Logic Commands
#[tauri::command]
async fn cmd_calculate_optimal_daily_rate(
    state: State<'_, AppState>,
    target_annual_income_cents: i64,
    working_days_per_year: f64,
    annual_expenses_cents: i64
) -> Result<DailyRateCalculation, String> {
    state.0.calculate_optimal_daily_rate(target_annual_income_cents, working_days_per_year, annual_expenses_cents)
        .await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_project_annual_income(
    state: State<'_, AppState>,
    monthly_avg_revenue_cents: i64,
    working_months: u32,
    annual_expenses_cents: i64
) -> Result<AnnualIncomeProjection, String> {
    state.0.project_annual_income(monthly_avg_revenue_cents, working_months, annual_expenses_cents)
        .await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_compute_tax_schedule(
    state: State<'_, AppState>,
    current_year: i32,
    current_month: u8,
    horizon_months: u32
) -> Result<Vec<TaxSchedule>, String> {
    let month_id = MonthId { year: current_year, month: current_month as u32 };
    state.0.compute_tax_schedule(&month_id, horizon_months).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_optimize_provisions(
    state: State<'_, AppState>,
    available_cash_cents: i64,
    optimization_horizon_days: u32
) -> Result<ProvisionOptimization, String> {
    state.0.optimize_provisions(available_cash_cents, optimization_horizon_days).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn cmd_analyze_working_patterns(
    state: State<'_, AppState>,
    start_date: String,
    end_date: String
) -> Result<WorkingPatternAnalysis, String> {
    let start = NaiveDate::parse_from_str(&start_date, "%Y-%m-%d").map_err(|e| e.to_string())?;
    let end = NaiveDate::parse_from_str(&end_date, "%Y-%m-%d").map_err(|e| e.to_string())?;
    
    state.0.analyze_working_patterns(start, end).await.map_err(|e| e.to_string())
}

// ============ Operation Commands ============

/// Create a new operation (unified model for invoices and expenses)
#[tauri::command]
async fn cmd_create_operation(state: State<'_, AppState>, dto: CreateOperationDto) -> Result<String, String> {
    let operation = dto.into_entity().map_err(|e| e.to_string())?;
    let id = operation.id.to_string();
    state.0.create_operation(operation).await.map_err(|e| e.to_string())?;
    Ok(id)
}

/// Get a specific operation by ID
#[tauri::command]
async fn cmd_get_operation(state: State<'_, AppState>, id: String) -> Result<Operation, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    state.0.get_operation(uuid).await.map_err(|e| e.to_string())
}

/// Update an existing operation
#[tauri::command]
async fn cmd_update_operation(state: State<'_, AppState>, dto: UpdateOperationDto) -> Result<(), String> {
    // First get the existing operation
    let existing_id = uuid::Uuid::parse_str(&dto.id).map_err(|e| e.to_string())?;
    let existing = state.0.get_operation(existing_id).await.map_err(|e| e.to_string())?;
    
    // Convert DTO to entity using existing operation data
    let operation = dto.into_entity(existing).map_err(|e| e.to_string())?;
    state.0.update_operation(operation).await.map_err(|e| e.to_string())
}

/// Delete an operation
#[tauri::command]
async fn cmd_delete_operation(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    state.0.delete_operation(uuid).await.map_err(|e| e.to_string())
}

/// List operations with optional month filter
#[tauri::command]
async fn cmd_list_operations(
    state: State<'_, AppState>, 
    month: Option<i32>, 
    m: Option<u8>
) -> Result<Vec<Operation>, String> {
    let month_filter = match (month, m) {
        (Some(y), Some(m)) => Some(MonthId { year: y, month: m as u32 }),
        _ => None,
    };
    state.0.list_operations(month_filter).await.map_err(|e| e.to_string())
}

/// List operations by status (draft, confirmed, paid, cancelled)
#[tauri::command]
async fn cmd_list_operations_by_status(state: State<'_, AppState>, status: String) -> Result<Vec<Operation>, String> {
    let operation_status = match status.as_str() {
        "draft" => OperationStatus::Draft,
        "confirmed" => OperationStatus::Confirmed,
        "paid" => OperationStatus::Paid,
        "cancelled" => OperationStatus::Cancelled,
        _ => return Err("Statut invalide: doit être 'draft', 'confirmed', 'paid' ou 'cancelled'".into()),
    };
    state.0.list_operations_by_status(operation_status).await.map_err(|e| e.to_string())
}

/// List operations by sens (achat/vente) with optional month filter
#[tauri::command]
async fn cmd_list_operations_by_sens(
    state: State<'_, AppState>, 
    sens: String,
    month: Option<i32>,
    m: Option<u8>
) -> Result<Vec<Operation>, String> {
    let operation_sens = match sens.as_str() {
        "achat" => OperationSens::Achat,
        "vente" => OperationSens::Vente,
        _ => return Err("Sens invalide: doit être 'achat' ou 'vente'".into()),
    };
    
    let month_filter = match (month, m) {
        (Some(y), Some(m)) => Some(MonthId { year: y, month: m as u32 }),
        _ => None,
    };
    
    state.0.list_operations_by_sens(operation_sens, month_filter).await.map_err(|e| e.to_string())
}

/// List operations by encaissement (payment received) month for VAT calculation
#[tauri::command]
async fn cmd_list_operations_by_encaissement_month(
    state: State<'_, AppState>,
    year: i32,
    month: u8
) -> Result<Vec<Operation>, String> {
    let month_id = MonthId { year, month: month as u32 };
    state.0.list_operations_by_encaissement_month(month_id).await.map_err(|e| e.to_string())
}

// ============ V2 Business Logic Commands (Operation-based) ============

/// Get dashboard summary using the new Operation model
#[tauri::command]
async fn cmd_get_dashboard_v2(state: State<'_, AppState>, month: i32, m: u8) -> Result<DashboardSummary, String> {
    state.0.get_dashboard_v2(MonthId { year: month, month: m as u32 }).await.map_err(|e| e.to_string())
}

/// Calculate VAT using the new Operation model (more accurate for "encaissements")
#[tauri::command]
async fn cmd_prepare_vat_v2(state: State<'_, AppState>, year: i32, month: u8) -> Result<VatReport, String> {
    state.0.prepare_vat_v2(MonthId { year, month: month as u32 }).await.map_err(|e| e.to_string())
}

/// Calculate URSSAF using the new Operation model
#[tauri::command]
async fn cmd_prepare_urssaf_v2(state: State<'_, AppState>, year: i32, month: u8) -> Result<UrssafReport, String> {
    state.0.prepare_urssaf_v2(MonthId { year, month: month as u32 }).await.map_err(|e| e.to_string())
}

/// Get month recap using the new Operation model
#[tauri::command]
async fn cmd_month_recap_v2(state: State<'_, AppState>, year: i32, month: u8) -> Result<MonthRecap, String> {
    state.0.month_recap_v2(MonthId { year, month: month as u32 }).await.map_err(|e| e.to_string())
}
