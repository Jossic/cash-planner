use chrono::{NaiveDate, NaiveDateTime, Datelike};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ============ Entities ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthId {
    pub year: i32,
    pub month: u32, // 1..=12
}

impl MonthId {
    pub fn new(year: i32, month: u32) -> Self { Self { year, month } }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invoice {
    pub id: Uuid,
    pub number: String,
    pub client: String,
    pub service_date: NaiveDate,
    pub amount_ht: i64, // cents
    pub vat_rate_ppm: i32, // e.g., 200000 for 20% (ppm)
    pub amount_tva: i64, // cents
    pub amount_ttc: i64, // cents
    pub paid_at: Option<NaiveDate>,
    pub source: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Expense {
    pub id: Uuid,
    pub label: String,
    pub category: String,
    pub booking_date: NaiveDate,
    pub amount_ht: i64,
    pub vat_rate_ppm: i32,
    pub amount_tva: i64,
    pub amount_ttc: i64,
    pub paid_at: Option<NaiveDate>,
    pub receipt_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BankTx {
    pub id: Uuid,
    pub date: NaiveDate,
    pub amount_cents: i64,
    pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OperationSens {
    #[serde(rename = "achat")]
    Achat,
    #[serde(rename = "vente")]
    Vente,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OperationStatus {
    #[serde(rename = "draft")]
    Draft,
    #[serde(rename = "confirmed")]
    Confirmed,
    #[serde(rename = "paid")]
    Paid,
    #[serde(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Operation {
    pub id: Uuid,
    pub date_facture: NaiveDate,           // Date de facture (pas "date d'opération")
    pub date_encaissement: Option<NaiveDate>, // Si TVA sur encaissements (ventes)
    pub date_paiement: Option<NaiveDate>,     // Pour achats prestations
    pub sens: OperationSens,               // vente ou achat
    pub montant_ht_cents: i64,             // Montant HT en centimes
    pub montant_tva_cents: i64,            // Valeur TVA directe (pas de taux)
    pub montant_ttc_cents: i64,            // = HT + TVA
    pub tva_sur_encaissements: bool,       // true par défaut
    pub libelle: Option<String>,           // Description
    pub justificatif_url: Option<String>,  // URL MinIO
    pub created_at: NaiveDateTime,         // Date de création
    pub updated_at: NaiveDateTime,         // Date de modification
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TypeDeclaration {
    #[serde(rename = "tva")]
    Tva,
    #[serde(rename = "urssaf")]
    Urssaf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StatutDeclaration {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "paid")]
    Paid,
    #[serde(rename = "overdue")]
    Overdue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Declaration {
    pub id: Uuid,
    pub type_declaration: TypeDeclaration,
    pub periode_annee: i32,
    pub periode_mois: u32, // 1..=12
    pub montant_du_cents: i64,
    pub date_echeance: NaiveDate,
    pub date_paiement: Option<NaiveDate>,
    pub statut: StatutDeclaration,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Provision {
    pub id: Uuid,
    pub kind: ProvisionKind,
    pub label: String,
    pub due_date: NaiveDate,
    pub amount_cents: i64,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProvisionKind { Vat, Urssaf, Other }

// ============ New Entities for Enhanced Features ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkingDay {
    pub id: Uuid,
    pub date: NaiveDate,
    pub hours_worked: f64,
    pub billable_hours: f64,
    pub hourly_rate_cents: i64, // cents per hour
    pub description: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaxSchedule {
    pub id: Uuid,
    pub tax_type: TaxType,
    pub due_date: NaiveDate,
    pub amount_cents: i64,
    pub period_start: NaiveDate,
    pub period_end: NaiveDate,
    pub status: TaxScheduleStatus,
    pub created_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TaxType {
    Vat,
    Urssaf,
    IncomeTax,
    Other(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaxScheduleStatus {
    Pending,
    Paid,
    Overdue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Simulation {
    pub id: Uuid,
    pub name: String,
    pub scenario_type: SimulationScenario,
    pub parameters: SimulationParameters,
    pub results: Option<SimulationResults>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SimulationScenario {
    DailyRateOptimization,
    AnnualIncomeProjection,
    TaxOptimization,
    WorkingDaysImpact,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationParameters {
    // Common parameters
    pub target_annual_income_cents: Option<i64>,
    pub working_days_per_month: Option<f64>,
    pub working_hours_per_day: Option<f64>,
    pub current_hourly_rate_cents: Option<i64>,
    
    // Tax parameters
    pub vat_rate_ppm: Option<i32>,
    pub urssaf_rate_ppm: Option<i32>,
    pub income_tax_rate_ppm: Option<i32>,
    
    // Expenses parameters
    pub monthly_fixed_costs_cents: Option<i64>,
    pub annual_variable_costs_cents: Option<i64>,
    
    // Time parameters
    pub simulation_start_date: Option<NaiveDate>,
    pub simulation_horizon_months: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationResults {
    pub optimal_daily_rate_cents: Option<i64>,
    pub optimal_hourly_rate_cents: Option<i64>,
    pub projected_annual_income_ht_cents: Option<i64>,
    pub projected_annual_taxes_cents: Option<i64>,
    pub projected_net_income_cents: Option<i64>,
    pub working_days_needed: Option<f64>,
    pub monthly_breakdowns: Vec<SimulationMonthBreakdown>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationMonthBreakdown {
    pub month: MonthId,
    pub revenue_ht_cents: i64,
    pub taxes_cents: i64,
    pub expenses_cents: i64,
    pub net_cents: i64,
    pub working_days: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyKPI {
    pub id: Uuid,
    pub month: MonthId,
    pub revenue_ht_cents: i64,
    pub revenue_ttc_cents: i64,
    pub expenses_ttc_cents: i64,
    pub working_days: f64,
    pub billable_hours: f64,
    pub average_daily_rate_cents: i64,
    pub average_hourly_rate_cents: i64,
    pub vat_collected_cents: i64,
    pub vat_due_cents: i64,
    pub urssaf_due_cents: i64,
    pub net_margin_cents: i64,
    pub profitability_ratio: f64, // net_margin / revenue_ttc
    pub utilization_rate: f64, // billable_hours / total_working_hours
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VatReport {
    pub month: MonthId,
    pub collected_cents: i64,
    pub deductible_cents: i64,
    pub due_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UrssafReport {
    pub month: MonthId,
    pub ca_encaisse_cents: i64,
    pub rate_ppm: i32,
    pub due_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub default_vat_rate_ppm: i32, // 20% = 200000 ppm
    pub urssaf_rate_ppm: i32,
    pub vat_declare_day: u8,  // e.g. 12
    pub vat_pay_day: u8,      // e.g. 20
    pub urssaf_pay_day: u8,   // e.g. 5
    pub buffer_cents: i64,
    pub forecast_ht_cents: i64,
    pub forecast_expenses_ttc_cents: i64,
    pub forecast_expense_vat_rate_ppm: i32,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            default_vat_rate_ppm: 200_000,
            urssaf_rate_ppm: 220_000,
            vat_declare_day: 12,
            vat_pay_day: 20,
            urssaf_pay_day: 5,
            buffer_cents: 300_00,
            forecast_ht_cents: 0,
            forecast_expenses_ttc_cents: 0,
            forecast_expense_vat_rate_ppm: 200_000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForecastLine {
    pub year: i32,
    pub month: u32,
    pub ht_cents: i64,
    pub tva_due_cents: i64,
    pub urssaf_due_cents: i64,
    pub expenses_ttc_cents: i64,
    pub net_cents: i64,
    pub after_provisions_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForecastResult {
    pub start: MonthId,
    pub months: Vec<ForecastLine>,
}

pub fn forecast_cashflow(start: &MonthId, horizon: u32, settings: &Settings) -> ForecastResult {
    let mut y = start.year;
    let mut m = start.month;
    let mut lines = Vec::new();
    for _ in 0..horizon {
        let ht = settings.forecast_ht_cents;
        let collected_tva = ((ht as i128) * (settings.default_vat_rate_ppm as i128) / 1_000_000i128) as i64;
        let urssaf = ((ht as i128) * (settings.urssaf_rate_ppm as i128) / 1_000_000i128) as i64;
        let exp_ttc = settings.forecast_expenses_ttc_cents;
        // optional deductible VAT estimation based on provided rate
        let exp_ht_est = ((exp_ttc as i128) * 1_000_000i128 / (1_000_000i128 + settings.forecast_expense_vat_rate_ppm as i128)) as i64;
        let exp_tva_est = exp_ttc - exp_ht_est;
        let tva_due = collected_tva - exp_tva_est.max(0);
        let net = (ht + collected_tva) - exp_ttc;
        let after_prov = net - tva_due - urssaf - settings.buffer_cents;
        lines.push(ForecastLine { year: y, month: m, ht_cents: ht, tva_due_cents: tva_due, urssaf_due_cents: urssaf, expenses_ttc_cents: exp_ttc, net_cents: net, after_provisions_cents: after_prov });
        // increment month
        m += 1;
        if m > 12 { m = 1; y += 1; }
    }
    ForecastResult { start: start.clone(), months: lines }
}

// ============ Ports ============

#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("Not found")] NotFound,
    #[error("Validation: {0}")] Validation(String),
    #[error("Repo error: {0}")] Repo(String),
}

pub type DomainResult<T> = Result<T, DomainError>;

#[async_trait::async_trait]
pub trait InvoiceRepo: Send + Sync {
    async fn list_invoices(&self, month: Option<MonthId>) -> DomainResult<Vec<Invoice>>;
    async fn create_invoice(&self, inv: Invoice) -> DomainResult<()>;
}

#[async_trait::async_trait]
pub trait ExpenseRepo: Send + Sync {
    async fn list_expenses(&self, month: Option<MonthId>) -> DomainResult<Vec<Expense>>;
    async fn create_expense(&self, exp: Expense) -> DomainResult<()>;
}

#[async_trait::async_trait]
pub trait OperationRepo: Send + Sync {
    async fn create_operation(&self, operation: Operation) -> DomainResult<()>;
    async fn get_operation(&self, id: Uuid) -> DomainResult<Operation>;
    async fn update_operation(&self, operation: Operation) -> DomainResult<()>;
    async fn delete_operation(&self, id: Uuid) -> DomainResult<()>;
    async fn list_operations(&self, month: Option<MonthId>) -> DomainResult<Vec<Operation>>;
    async fn list_operations_by_sens(&self, sens: OperationSens, month: Option<MonthId>) -> DomainResult<Vec<Operation>>;
    async fn list_operations_by_encaissement_month(&self, month: MonthId) -> DomainResult<Vec<Operation>>;
}

#[async_trait::async_trait]
pub trait DeclarationRepo: Send + Sync {
    async fn create_declaration(&self, declaration: Declaration) -> DomainResult<()>;
    async fn get_declaration(&self, id: Uuid) -> DomainResult<Declaration>;
    async fn update_declaration(&self, declaration: Declaration) -> DomainResult<()>;
    async fn delete_declaration(&self, id: Uuid) -> DomainResult<()>;
    async fn list_declarations(&self, year: Option<i32>) -> DomainResult<Vec<Declaration>>;
    async fn get_declaration_by_period(&self, type_declaration: TypeDeclaration, annee: i32, mois: u32) -> DomainResult<Option<Declaration>>;
    async fn list_declarations_by_status(&self, statut: StatutDeclaration) -> DomainResult<Vec<Declaration>>;
}

#[async_trait::async_trait]
pub trait ProvisionRepo: Send + Sync {
    async fn upsert_provision(&self, p: Provision) -> DomainResult<()>;
    async fn list_provisions(&self, month: Option<MonthId>) -> DomainResult<Vec<Provision>>;
}

#[async_trait::async_trait]
pub trait ConfigRepo: Send + Sync {
    async fn load_settings(&self) -> DomainResult<Settings>;
    async fn save_settings(&self, s: Settings) -> DomainResult<()>;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthStatus {
    pub month: MonthId,
    pub closed_at: Option<NaiveDateTime>,
}

#[async_trait::async_trait]
pub trait MonthRepo: Send + Sync {
    async fn get_status(&self, month: &MonthId) -> DomainResult<MonthStatus>;
    async fn close_month(&self, month: &MonthId, closed_at: NaiveDateTime) -> DomainResult<()>;
}

// ============ New Repository Traits ============

#[async_trait::async_trait]
pub trait WorkingDayRepo: Send + Sync {
    async fn create_working_day(&self, working_day: WorkingDay) -> DomainResult<()>;
    async fn update_working_day(&self, working_day: WorkingDay) -> DomainResult<()>;
    async fn delete_working_day(&self, id: Uuid) -> DomainResult<()>;
    async fn get_working_day(&self, id: Uuid) -> DomainResult<WorkingDay>;
    async fn list_working_days(&self, start_date: Option<NaiveDate>, end_date: Option<NaiveDate>) -> DomainResult<Vec<WorkingDay>>;
    async fn get_working_days_for_month(&self, month: &MonthId) -> DomainResult<Vec<WorkingDay>>;
    async fn get_working_days_stats(&self, start_date: NaiveDate, end_date: NaiveDate) -> DomainResult<WorkingDaysStats>;
}

#[async_trait::async_trait]
pub trait TaxScheduleRepo: Send + Sync {
    async fn create_tax_schedule(&self, tax_schedule: TaxSchedule) -> DomainResult<()>;
    async fn update_tax_schedule(&self, tax_schedule: TaxSchedule) -> DomainResult<()>;
    async fn delete_tax_schedule(&self, id: Uuid) -> DomainResult<()>;
    async fn get_tax_schedule(&self, id: Uuid) -> DomainResult<TaxSchedule>;
    async fn list_tax_schedules(&self, start_date: Option<NaiveDate>, end_date: Option<NaiveDate>) -> DomainResult<Vec<TaxSchedule>>;
    async fn get_overdue_schedules(&self, as_of_date: NaiveDate) -> DomainResult<Vec<TaxSchedule>>;
    async fn mark_as_paid(&self, id: Uuid, paid_date: NaiveDate) -> DomainResult<()>;
}

#[async_trait::async_trait]
pub trait SimulationRepo: Send + Sync {
    async fn create_simulation(&self, simulation: Simulation) -> DomainResult<()>;
    async fn update_simulation(&self, simulation: Simulation) -> DomainResult<()>;
    async fn delete_simulation(&self, id: Uuid) -> DomainResult<()>;
    async fn get_simulation(&self, id: Uuid) -> DomainResult<Simulation>;
    async fn list_simulations(&self) -> DomainResult<Vec<Simulation>>;
}

#[async_trait::async_trait]
pub trait KPIRepo: Send + Sync {
    async fn save_monthly_kpi(&self, kpi: MonthlyKPI) -> DomainResult<()>;
    async fn get_monthly_kpi(&self, month: &MonthId) -> DomainResult<Option<MonthlyKPI>>;
    async fn list_monthly_kpis(&self, start_month: &MonthId, end_month: &MonthId) -> DomainResult<Vec<MonthlyKPI>>;
    async fn delete_monthly_kpi(&self, month: &MonthId) -> DomainResult<()>;
}

// ============ New Domain DTOs ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkingDaysStats {
    pub total_working_days: f64,
    pub total_billable_hours: f64,
    pub total_worked_hours: f64,
    pub average_daily_rate_cents: i64,
    pub average_hourly_rate_cents: i64,
    pub utilization_rate: f64, // billable_hours / worked_hours
}

// ============ Usecases ============

pub fn compute_vat_for_month(
    month: &MonthId,
    invoices: &[Invoice],
    expenses: &[Expense],
) -> VatReport {
    let collected_cents = invoices
        .iter()
        .filter(|i| i.paid_at.map(|d| d.year() == month.year && d.month() == month.month).unwrap_or(false))
        .map(|i| i.amount_tva)
        .sum();
    let deductible_cents = expenses
        .iter()
        .filter(|e| e.paid_at.map(|d| d.year() == month.year && d.month() == month.month).unwrap_or(false))
        .map(|e| e.amount_tva)
        .sum();
    let due_cents = collected_cents - deductible_cents;
    VatReport { month: month.clone(), collected_cents, deductible_cents, due_cents }
}

pub fn compute_urssaf_for_month(month: &MonthId, invoices: &[Invoice], rate_ppm: i32) -> UrssafReport {
    let ca_encaisse_cents: i64 = invoices
        .iter()
        .filter(|i| i.paid_at.map(|d| d.year() == month.year && d.month() == month.month).unwrap_or(false))
        .map(|i| i.amount_ht)
        .sum();
    let due_cents = ((ca_encaisse_cents as i128) * (rate_ppm as i128) / 1_000_000i128) as i64;
    UrssafReport { month: month.clone(), ca_encaisse_cents, rate_ppm, due_cents }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSummary {
    pub month: MonthId,
    pub encaissements_ht_cents: i64,
    pub tva_due_cents: i64,
    pub urssaf_due_cents: i64,
    pub disponible_cents: i64,
}

pub fn compute_dashboard(
    month: &MonthId,
    invoices: &[Invoice],
    expenses: &[Expense],
    provisions: &[Provision],
    settings: &Settings,
) -> DashboardSummary {
    let vat = compute_vat_for_month(month, invoices, expenses);
    let urssaf = compute_urssaf_for_month(month, invoices, settings.urssaf_rate_ppm);
    let encaissements_ht_cents: i64 = invoices
        .iter()
        .filter(|i| i.paid_at.map(|d| d.year() == month.year && d.month() == month.month).unwrap_or(false))
        .map(|i| i.amount_ht)
        .sum();
    let future_provisions: i64 = provisions.iter().map(|p| p.amount_cents).sum();
    let disponible_cents = encaissements_ht_cents - vat.due_cents - urssaf.due_cents - future_provisions - settings.buffer_cents;
    DashboardSummary {
        month: month.clone(),
        encaissements_ht_cents,
        tva_due_cents: vat.due_cents,
        urssaf_due_cents: urssaf.due_cents,
        disponible_cents,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthRecap {
    pub month: MonthId,
    pub receipts_ht_cents: i64,
    pub receipts_tva_cents: i64,
    pub receipts_ttc_cents: i64,
    pub expenses_ttc_cents: i64,
    pub vat_due_cents: i64,
    pub urssaf_due_cents: i64,
    pub net_from_month_cents: i64,      // receipts_ttc - expenses_ttc
    pub after_provisions_cents: i64,    // net_from_month - vat_due - urssaf_due - buffer
}

pub fn compute_month_recap(month: &MonthId, invoices: &[Invoice], expenses: &[Expense], settings: &Settings) -> MonthRecap {
    let vat = compute_vat_for_month(month, invoices, expenses);
    let urssaf = compute_urssaf_for_month(month, invoices, settings.urssaf_rate_ppm);
    let receipts_ht_cents: i64 = invoices
        .iter()
        .filter(|i| i.paid_at.map(|d| d.year() == month.year && d.month() == month.month).unwrap_or(false))
        .map(|i| i.amount_ht)
        .sum();
    let receipts_tva_cents: i64 = invoices
        .iter()
        .filter(|i| i.paid_at.map(|d| d.year() == month.year && d.month() == month.month).unwrap_or(false))
        .map(|i| i.amount_tva)
        .sum();
    let receipts_ttc_cents = receipts_ht_cents + receipts_tva_cents;
    let expenses_ttc_cents: i64 = expenses
        .iter()
        .filter(|e| e.paid_at.map(|d| d.year() == month.year && d.month() == month.month).unwrap_or(false))
        .map(|e| e.amount_ttc)
        .sum();
    let net_from_month_cents = receipts_ttc_cents - expenses_ttc_cents;
    let after_provisions_cents = net_from_month_cents - vat.due_cents - urssaf.due_cents - settings.buffer_cents;
    MonthRecap {
        month: month.clone(),
        receipts_ht_cents,
        receipts_tva_cents,
        receipts_ttc_cents,
        expenses_ttc_cents,
        vat_due_cents: vat.due_cents,
        urssaf_due_cents: urssaf.due_cents,
        net_from_month_cents,
        after_provisions_cents,
    }
}

// ============ New Operation-based Use Cases ============

/// Compute VAT for month using unified Operation model
/// Handles both TVA sur facturation and TVA sur encaissements logic
pub fn compute_vat_for_month_v2(month: &MonthId, operations: &[Operation]) -> VatReport {
    let mut collected_cents = 0i64;
    let mut deductible_cents = 0i64;

    for op in operations {
        let is_tva_due_this_month = if op.tva_sur_encaissements {
            // TVA sur encaissements: use date_encaissement if available
            if let Some(date_encaissement) = op.date_encaissement {
                date_encaissement.year() == month.year && date_encaissement.month() == month.month
            } else {
                false // No encaissement date means no TVA due yet
            }
        } else {
            // TVA sur facturation: use date_facture
            op.date_facture.year() == month.year && op.date_facture.month() == month.month
        };

        if is_tva_due_this_month {
            match op.sens {
                OperationSens::Vente => collected_cents += op.montant_tva_cents,
                OperationSens::Achat => deductible_cents += op.montant_tva_cents,
            }
        }
    }

    let due_cents = collected_cents - deductible_cents;
    VatReport {
        month: month.clone(),
        collected_cents,
        deductible_cents,
        due_cents,
    }
}

/// Compute URSSAF for month using unified Operation model
/// Based on HT revenue from sales that are encaissed (paid) in the month
pub fn compute_urssaf_for_month_v2(month: &MonthId, operations: &[Operation], rate_ppm: i32) -> UrssafReport {
    let ca_encaisse_cents: i64 = operations
        .iter()
        .filter(|op| {
            // Only sales (ventes) count for URSSAF
            matches!(op.sens, OperationSens::Vente) &&
            // Use date_encaissement if available, otherwise fall back to date_facture
            if let Some(date_encaissement) = op.date_encaissement {
                date_encaissement.year() == month.year && date_encaissement.month() == month.month
            } else {
                // For non-TVA-sur-encaissements, use date_facture as proxy for encaissement
                op.date_facture.year() == month.year && op.date_facture.month() == month.month
            }
        })
        .map(|op| op.montant_ht_cents)
        .sum();

    let due_cents = ((ca_encaisse_cents as i128) * (rate_ppm as i128) / 1_000_000i128) as i64;
    
    UrssafReport {
        month: month.clone(),
        ca_encaisse_cents,
        rate_ppm,
        due_cents,
    }
}

/// Compute dashboard using unified Operation model
pub fn compute_dashboard_v2(
    month: &MonthId,
    operations: &[Operation],
    provisions: &[Provision],
    settings: &Settings,
) -> DashboardSummary {
    let vat = compute_vat_for_month_v2(month, operations);
    let urssaf = compute_urssaf_for_month_v2(month, operations, settings.urssaf_rate_ppm);
    
    // Encaissements HT = sum of HT amounts from sales in the month
    let encaissements_ht_cents: i64 = operations
        .iter()
        .filter(|op| {
            matches!(op.sens, OperationSens::Vente) &&
            if let Some(date_encaissement) = op.date_encaissement {
                date_encaissement.year() == month.year && date_encaissement.month() == month.month
            } else {
                op.date_facture.year() == month.year && op.date_facture.month() == month.month
            }
        })
        .map(|op| op.montant_ht_cents)
        .sum();

    let future_provisions: i64 = provisions.iter().map(|p| p.amount_cents).sum();
    let disponible_cents = encaissements_ht_cents - vat.due_cents - urssaf.due_cents - future_provisions - settings.buffer_cents;

    DashboardSummary {
        month: month.clone(),
        encaissements_ht_cents,
        tva_due_cents: vat.due_cents,
        urssaf_due_cents: urssaf.due_cents,
        disponible_cents,
    }
}

/// Compute month recap using unified Operation model
pub fn compute_month_recap_v2(month: &MonthId, operations: &[Operation], settings: &Settings) -> MonthRecap {
    let vat = compute_vat_for_month_v2(month, operations);
    let urssaf = compute_urssaf_for_month_v2(month, operations, settings.urssaf_rate_ppm);
    
    // Receipts from sales
    let sales_operations: Vec<_> = operations
        .iter()
        .filter(|op| {
            matches!(op.sens, OperationSens::Vente) &&
            if let Some(date_encaissement) = op.date_encaissement {
                date_encaissement.year() == month.year && date_encaissement.month() == month.month
            } else {
                op.date_facture.year() == month.year && op.date_facture.month() == month.month
            }
        })
        .collect();

    let receipts_ht_cents: i64 = sales_operations.iter().map(|op| op.montant_ht_cents).sum();
    let receipts_tva_cents: i64 = sales_operations.iter().map(|op| op.montant_tva_cents).sum();
    let receipts_ttc_cents = receipts_ht_cents + receipts_tva_cents;

    // Expenses from purchases
    let expenses_ttc_cents: i64 = operations
        .iter()
        .filter(|op| {
            matches!(op.sens, OperationSens::Achat) &&
            if let Some(date_encaissement) = op.date_encaissement {
                date_encaissement.year() == month.year && date_encaissement.month() == month.month
            } else {
                op.date_facture.year() == month.year && op.date_facture.month() == month.month
            }
        })
        .map(|op| op.montant_ttc_cents)
        .sum();

    let net_from_month_cents = receipts_ttc_cents - expenses_ttc_cents;
    let after_provisions_cents = net_from_month_cents - vat.due_cents - urssaf.due_cents - settings.buffer_cents;

    MonthRecap {
        month: month.clone(),
        receipts_ht_cents,
        receipts_tva_cents,
        receipts_ttc_cents,
        expenses_ttc_cents,
        vat_due_cents: vat.due_cents,
        urssaf_due_cents: urssaf.due_cents,
        net_from_month_cents,
        after_provisions_cents,
    }
}

// ============ New Use Cases ============

/// Calculate the optimal daily rate to reach target annual income
pub fn calculate_optimal_daily_rate(
    target_annual_income_cents: i64,
    working_days_per_year: f64,
    annual_expenses_cents: i64,
    vat_rate_ppm: i32,
    urssaf_rate_ppm: i32,
    income_tax_rate_ppm: i32,
) -> DailyRateCalculation {
    // Target net income after taxes
    let target_net_cents = target_annual_income_cents;
    
    // Calculate gross income needed before taxes
    let combined_tax_rate = (vat_rate_ppm + urssaf_rate_ppm + income_tax_rate_ppm) as f64 / 1_000_000.0;
    let gross_income_needed_cents = ((target_net_cents as f64) / (1.0 - combined_tax_rate)) as i64;
    
    // Add expenses to get total revenue needed
    let total_revenue_ht_needed_cents = gross_income_needed_cents + annual_expenses_cents;
    
    // Calculate daily rate
    let optimal_daily_rate_cents = if working_days_per_year > 0.0 {
        (total_revenue_ht_needed_cents as f64 / working_days_per_year) as i64
    } else {
        0
    };
    
    DailyRateCalculation {
        target_annual_income_cents,
        working_days_per_year,
        annual_expenses_cents,
        optimal_daily_rate_cents,
        total_revenue_ht_needed_cents,
        total_taxes_cents: total_revenue_ht_needed_cents - target_net_cents - annual_expenses_cents,
        net_margin_ratio: if total_revenue_ht_needed_cents > 0 {
            target_net_cents as f64 / total_revenue_ht_needed_cents as f64
        } else {
            0.0
        },
    }
}

/// Project annual income based on current parameters
pub fn project_annual_income(
    monthly_avg_revenue_cents: i64,
    working_months: u32,
    annual_expenses_cents: i64,
    vat_rate_ppm: i32,
    urssaf_rate_ppm: i32,
) -> AnnualIncomeProjection {
    let total_revenue_ht_cents = monthly_avg_revenue_cents * working_months as i64;
    
    let vat_due_cents = ((total_revenue_ht_cents as i128) * (vat_rate_ppm as i128) / 1_000_000) as i64;
    let urssaf_due_cents = ((total_revenue_ht_cents as i128) * (urssaf_rate_ppm as i128) / 1_000_000) as i64;
    let total_taxes_cents = vat_due_cents + urssaf_due_cents;
    
    let net_income_cents = total_revenue_ht_cents - total_taxes_cents - annual_expenses_cents;
    
    AnnualIncomeProjection {
        total_revenue_ht_cents,
        total_taxes_cents,
        annual_expenses_cents,
        net_income_cents,
        effective_tax_rate: if total_revenue_ht_cents > 0 {
            total_taxes_cents as f64 / total_revenue_ht_cents as f64
        } else {
            0.0
        },
        profit_margin: if total_revenue_ht_cents > 0 {
            net_income_cents as f64 / total_revenue_ht_cents as f64
        } else {
            0.0
        },
    }
}

/// Compute tax schedule for the upcoming months
pub fn compute_tax_schedule(
    current_month: &MonthId,
    horizon_months: u32,
    vat_reports: &[VatReport],
    urssaf_reports: &[UrssafReport],
    settings: &Settings,
) -> Vec<TaxSchedule> {
    let mut schedules = Vec::new();
    
    for i in 0..horizon_months {
        let mut month = current_month.clone();
        month.month += i;
        if month.month > 12 {
            month.year += ((month.month - 1) / 12) as i32;
            month.month = ((month.month - 1) % 12) + 1;
        }
        
        // VAT schedule (due on vat_pay_day of following month)
        if let Some(vat_report) = vat_reports.iter().find(|r| r.month.year == month.year && r.month.month == month.month) {
            if vat_report.due_cents > 0 {
                let mut due_month = month.clone();
                due_month.month += 1;
                if due_month.month > 12 {
                    due_month.year += 1;
                    due_month.month = 1;
                }
                
                let due_date = NaiveDate::from_ymd_opt(due_month.year, due_month.month, settings.vat_pay_day as u32)
                    .unwrap_or_else(|| {
                        // Handle invalid date (e.g., February 30)
                        let last_day = match due_month.month {
                            2 => if due_month.year % 4 == 0 { 29 } else { 28 },
                            4 | 6 | 9 | 11 => 30,
                            _ => 31,
                        };
                        NaiveDate::from_ymd_opt(due_month.year, due_month.month, last_day.min(settings.vat_pay_day as u32)).unwrap()
                    });
                
                let period_start = NaiveDate::from_ymd_opt(month.year, month.month, 1).unwrap();
                let period_end = {
                    let mut next_month = month.clone();
                    next_month.month += 1;
                    if next_month.month > 12 {
                        next_month.year += 1;
                        next_month.month = 1;
                    }
                    NaiveDate::from_ymd_opt(next_month.year, next_month.month, 1).unwrap().pred_opt().unwrap()
                };
                
                schedules.push(TaxSchedule {
                    id: Uuid::new_v4(),
                    tax_type: TaxType::Vat,
                    due_date,
                    amount_cents: vat_report.due_cents,
                    period_start,
                    period_end,
                    status: TaxScheduleStatus::Pending,
                    created_at: chrono::Utc::now().naive_utc(),
                });
            }
        }
        
        // URSSAF schedule (due on urssaf_pay_day of following month)
        if let Some(urssaf_report) = urssaf_reports.iter().find(|r| r.month.year == month.year && r.month.month == month.month) {
            if urssaf_report.due_cents > 0 {
                let mut due_month = month.clone();
                due_month.month += 1;
                if due_month.month > 12 {
                    due_month.year += 1;
                    due_month.month = 1;
                }
                
                let due_date = NaiveDate::from_ymd_opt(due_month.year, due_month.month, settings.urssaf_pay_day as u32)
                    .unwrap_or_else(|| {
                        let last_day = match due_month.month {
                            2 => if due_month.year % 4 == 0 { 29 } else { 28 },
                            4 | 6 | 9 | 11 => 30,
                            _ => 31,
                        };
                        NaiveDate::from_ymd_opt(due_month.year, due_month.month, last_day.min(settings.urssaf_pay_day as u32)).unwrap()
                    });
                
                let period_start = NaiveDate::from_ymd_opt(month.year, month.month, 1).unwrap();
                let period_end = {
                    let mut next_month = month.clone();
                    next_month.month += 1;
                    if next_month.month > 12 {
                        next_month.year += 1;
                        next_month.month = 1;
                    }
                    NaiveDate::from_ymd_opt(next_month.year, next_month.month, 1).unwrap().pred_opt().unwrap()
                };
                
                schedules.push(TaxSchedule {
                    id: Uuid::new_v4(),
                    tax_type: TaxType::Urssaf,
                    due_date,
                    amount_cents: urssaf_report.due_cents,
                    period_start,
                    period_end,
                    status: TaxScheduleStatus::Pending,
                    created_at: chrono::Utc::now().naive_utc(),
                });
            }
        }
    }
    
    schedules.sort_by_key(|s| s.due_date);
    schedules
}

/// Optimize provisions based on cash flow and tax obligations
pub fn optimize_provisions(
    available_cash_cents: i64,
    upcoming_tax_schedules: &[TaxSchedule],
    buffer_cents: i64,
    optimization_horizon_days: u32,
) -> ProvisionOptimization {
    let cutoff_date = chrono::Local::now().naive_local().date() + chrono::Duration::days(optimization_horizon_days as i64);
    
    let upcoming_obligations: i64 = upcoming_tax_schedules
        .iter()
        .filter(|s| s.due_date <= cutoff_date && s.status == TaxScheduleStatus::Pending)
        .map(|s| s.amount_cents)
        .sum();
    
    let required_provisions = upcoming_obligations + buffer_cents;
    let available_for_distribution = available_cash_cents - required_provisions;
    
    let recommendations = if available_for_distribution < 0 {
        vec![format!("Besoin de {} € supplémentaires pour couvrir les obligations fiscales", (-available_for_distribution) / 100)]
    } else if available_for_distribution > buffer_cents * 2 {
        vec![format!("Possibilité de distribuer {} € après provisions", available_for_distribution / 100)]
    } else {
        vec!["Provisions optimales maintenues".to_string()]
    };
    
    ProvisionOptimization {
        available_cash_cents,
        required_provisions_cents: required_provisions,
        available_for_distribution_cents: available_for_distribution.max(0),
        recommendations,
        optimization_date: chrono::Local::now().naive_local().date(),
    }
}

/// Analyze working patterns and productivity
pub fn analyze_working_patterns(working_days: &[WorkingDay]) -> WorkingPatternAnalysis {
    if working_days.is_empty() {
        return WorkingPatternAnalysis {
            total_days: 0.0,
            average_hours_per_day: 0.0,
            average_billable_ratio: 0.0,
            peak_productivity_day: None,
            total_revenue_cents: 0,
            average_daily_rate_cents: 0,
            utilization_trends: vec![],
        };
    }
    
    let total_days = working_days.len() as f64;
    let total_hours: f64 = working_days.iter().map(|d| d.hours_worked).sum();
    let total_billable_hours: f64 = working_days.iter().map(|d| d.billable_hours).sum();
    let total_revenue_cents: i64 = working_days.iter().map(|d| (d.billable_hours * d.hourly_rate_cents as f64) as i64).sum();
    
    let average_hours_per_day = total_hours / total_days;
    let average_billable_ratio = if total_hours > 0.0 { total_billable_hours / total_hours } else { 0.0 };
    let average_daily_rate_cents = if total_days > 0.0 { (total_revenue_cents as f64 / total_days) as i64 } else { 0 };
    
    // Find peak productivity day (highest billable ratio)
    let peak_productivity_day = working_days.iter()
        .max_by(|a, b| {
            let ratio_a = if a.hours_worked > 0.0 { a.billable_hours / a.hours_worked } else { 0.0 };
            let ratio_b = if b.hours_worked > 0.0 { b.billable_hours / b.hours_worked } else { 0.0 };
            ratio_a.partial_cmp(&ratio_b).unwrap_or(std::cmp::Ordering::Equal)
        })
        .map(|d| d.date);
    
    // Calculate weekly utilization trends
    let mut utilization_trends = Vec::new();
    let mut current_week_days = Vec::new();
    let mut current_week_start = None;
    
    for working_day in working_days.iter() {
        let week_start = working_day.date - chrono::Duration::days(working_day.date.weekday().num_days_from_monday() as i64);
        
        if current_week_start != Some(week_start) {
            if !current_week_days.is_empty() {
                let week_hours: f64 = current_week_days.iter().map(|d: &WorkingDay| d.hours_worked).sum();
                let week_billable: f64 = current_week_days.iter().map(|d| d.billable_hours).sum();
                let utilization = if week_hours > 0.0 { week_billable / week_hours } else { 0.0 };
                utilization_trends.push((current_week_start.unwrap(), utilization));
            }
            current_week_days.clear();
            current_week_start = Some(week_start);
        }
        
        current_week_days.push(working_day.clone());
    }
    
    // Don't forget the last week
    if !current_week_days.is_empty() && current_week_start.is_some() {
        let week_hours: f64 = current_week_days.iter().map(|d| d.hours_worked).sum();
        let week_billable: f64 = current_week_days.iter().map(|d| d.billable_hours).sum();
        let utilization = if week_hours > 0.0 { week_billable / week_hours } else { 0.0 };
        utilization_trends.push((current_week_start.unwrap(), utilization));
    }
    
    WorkingPatternAnalysis {
        total_days,
        average_hours_per_day,
        average_billable_ratio,
        peak_productivity_day,
        total_revenue_cents,
        average_daily_rate_cents,
        utilization_trends,
    }
}

/// Compute monthly KPIs from data
pub fn compute_monthly_kpis(
    month: &MonthId,
    invoices: &[Invoice],
    expenses: &[Expense],
    working_days: &[WorkingDay],
    settings: &Settings,
) -> MonthlyKPI {
    let month_working_days: Vec<_> = working_days.iter()
        .filter(|d| d.date.year() == month.year && d.date.month() == month.month)
        .collect();
    
    let month_invoices: Vec<_> = invoices.iter()
        .filter(|i| i.paid_at.map(|d| d.year() == month.year && d.month() == month.month).unwrap_or(false))
        .collect();
    
    let month_expenses: Vec<_> = expenses.iter()
        .filter(|e| e.paid_at.map(|d| d.year() == month.year && d.month() == month.month).unwrap_or(false))
        .collect();
    
    let revenue_ht_cents: i64 = month_invoices.iter().map(|i| i.amount_ht).sum();
    let revenue_ttc_cents: i64 = month_invoices.iter().map(|i| i.amount_ttc).sum();
    let expenses_ttc_cents: i64 = month_expenses.iter().map(|e| e.amount_ttc).sum();
    
    let working_days_count: f64 = month_working_days.iter().map(|_d| 1.0).sum();
    let billable_hours: f64 = month_working_days.iter().map(|d| d.billable_hours).sum();
    let total_worked_hours: f64 = month_working_days.iter().map(|d| d.hours_worked).sum();
    
    let average_daily_rate_cents = if working_days_count > 0.0 {
        (revenue_ht_cents as f64 / working_days_count) as i64
    } else {
        0
    };
    
    let average_hourly_rate_cents = if billable_hours > 0.0 {
        (revenue_ht_cents as f64 / billable_hours) as i64
    } else {
        0
    };
    
    let vat_collected_cents: i64 = month_invoices.iter().map(|i| i.amount_tva).sum();
    let vat_deductible_cents: i64 = month_expenses.iter().map(|e| e.amount_tva).sum();
    let vat_due_cents = vat_collected_cents - vat_deductible_cents;
    
    let urssaf_due_cents = ((revenue_ht_cents as i128) * (settings.urssaf_rate_ppm as i128) / 1_000_000) as i64;
    
    let net_margin_cents = revenue_ttc_cents - expenses_ttc_cents - vat_due_cents - urssaf_due_cents;
    
    let profitability_ratio = if revenue_ttc_cents > 0 {
        net_margin_cents as f64 / revenue_ttc_cents as f64
    } else {
        0.0
    };
    
    let utilization_rate = if total_worked_hours > 0.0 {
        billable_hours / total_worked_hours
    } else {
        0.0
    };
    
    let now = chrono::Utc::now().naive_utc();
    
    MonthlyKPI {
        id: Uuid::new_v4(),
        month: month.clone(),
        revenue_ht_cents,
        revenue_ttc_cents,
        expenses_ttc_cents,
        working_days: working_days_count,
        billable_hours,
        average_daily_rate_cents,
        average_hourly_rate_cents,
        vat_collected_cents,
        vat_due_cents,
        urssaf_due_cents,
        net_margin_cents,
        profitability_ratio,
        utilization_rate,
        created_at: now,
        updated_at: now,
    }
}

// ============ New Domain Result Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyRateCalculation {
    pub target_annual_income_cents: i64,
    pub working_days_per_year: f64,
    pub annual_expenses_cents: i64,
    pub optimal_daily_rate_cents: i64,
    pub total_revenue_ht_needed_cents: i64,
    pub total_taxes_cents: i64,
    pub net_margin_ratio: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnnualIncomeProjection {
    pub total_revenue_ht_cents: i64,
    pub total_taxes_cents: i64,
    pub annual_expenses_cents: i64,
    pub net_income_cents: i64,
    pub effective_tax_rate: f64,
    pub profit_margin: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProvisionOptimization {
    pub available_cash_cents: i64,
    pub required_provisions_cents: i64,
    pub available_for_distribution_cents: i64,
    pub recommendations: Vec<String>,
    pub optimization_date: NaiveDate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkingPatternAnalysis {
    pub total_days: f64,
    pub average_hours_per_day: f64,
    pub average_billable_ratio: f64,
    pub peak_productivity_day: Option<NaiveDate>,
    pub total_revenue_cents: i64,
    pub average_daily_rate_cents: i64,
    pub utilization_trends: Vec<(NaiveDate, f64)>, // (week_start, utilization_ratio)
}
