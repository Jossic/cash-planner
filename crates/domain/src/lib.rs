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
