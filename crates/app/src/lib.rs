use domain::*;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Clone)]
pub struct AppDeps {
    pub invoices: Arc<dyn InvoiceRepo>,
    pub expenses: Arc<dyn ExpenseRepo>,
    pub provisions: Arc<dyn ProvisionRepo>,
    pub config: Arc<dyn ConfigRepo>,
    pub months: Arc<dyn MonthRepo>,
}

#[derive(Clone)]
pub struct AppService {
    deps: AppDeps,
}

impl AppService {
    pub fn new(deps: AppDeps) -> Self { Self { deps } }

    pub async fn get_dashboard(&self, month: MonthId) -> DomainResult<DashboardSummary> {
        let (invoices, expenses, provisions, settings) = tokio::try_join!(
            self.deps.invoices.list_invoices(None),
            self.deps.expenses.list_expenses(None),
            self.deps.provisions.list_provisions(None),
            self.deps.config.load_settings(),
        ).map_err(|e| DomainError::Repo(format!("{e}")))?;
        Ok(compute_dashboard(&month, &invoices, &expenses, &provisions, &settings))
    }

    pub async fn list_invoices(&self, month: Option<MonthId>) -> DomainResult<Vec<Invoice>> {
        self.deps.invoices.list_invoices(month).await
    }

    pub async fn create_invoice(&self, mut inv: Invoice) -> DomainResult<()> {
        // basic derive amounts if not set
        if inv.amount_tva == 0 {
            inv.amount_tva = ((inv.amount_ht as i128) * (inv.vat_rate_ppm as i128) / 1_000_000i128) as i64;
        }
        if inv.amount_ttc == 0 { inv.amount_ttc = inv.amount_ht + inv.amount_tva; }
        self.deps.invoices.create_invoice(inv).await
    }

    pub async fn list_expenses(&self, month: Option<MonthId>) -> DomainResult<Vec<Expense>> {
        self.deps.expenses.list_expenses(month).await
    }

    pub async fn create_expense(&self, mut exp: Expense) -> DomainResult<()> {
        if exp.amount_tva == 0 {
            exp.amount_tva = ((exp.amount_ht as i128) * (exp.vat_rate_ppm as i128) / 1_000_000i128) as i64;
        }
        if exp.amount_ttc == 0 { exp.amount_ttc = exp.amount_ht + exp.amount_tva; }
        self.deps.expenses.create_expense(exp).await
    }

    pub async fn prepare_vat(&self, month: MonthId) -> DomainResult<VatReport> {
        let (invoices, expenses) = tokio::try_join!(
            self.deps.invoices.list_invoices(Some(month.clone())),
            self.deps.expenses.list_expenses(Some(month.clone())),
        ).map_err(|e| DomainError::Repo(format!("{e}")))?;
        Ok(compute_vat_for_month(&month, &invoices, &expenses))
    }

    pub async fn prepare_urssaf(&self, month: MonthId) -> DomainResult<UrssafReport> {
        let settings = self.deps.config.load_settings().await?;
        let invoices = self.deps.invoices.list_invoices(Some(month.clone())).await?;
        Ok(compute_urssaf_for_month(&month, &invoices, settings.urssaf_rate_ppm))
    }

    pub async fn get_settings(&self) -> DomainResult<Settings> {
        self.deps.config.load_settings().await
    }

    pub async fn save_settings(&self, s: Settings) -> DomainResult<()> {
        self.deps.config.save_settings(s).await
    }

    pub async fn month_recap(&self, month: MonthId) -> DomainResult<MonthRecap> {
        let settings = self.deps.config.load_settings().await?;
        let (invoices, expenses) = tokio::try_join!(
            self.deps.invoices.list_invoices(Some(month.clone())),
            self.deps.expenses.list_expenses(Some(month.clone())),
        ).map_err(|e| DomainError::Repo(format!("{e}")))?;
        Ok(compute_month_recap(&month, &invoices, &expenses, &settings))
    }

    pub async fn forecast(&self, start: MonthId, horizon: u32) -> DomainResult<ForecastResult> {
        let settings = self.deps.config.load_settings().await?;
        Ok(forecast_cashflow(&start, horizon, &settings))
    }

    pub async fn get_month_status(&self, month: MonthId) -> DomainResult<MonthStatus> {
        self.deps.months.get_status(&month).await
    }

    pub async fn close_month(&self, month: MonthId) -> DomainResult<()> {
        let now = chrono::Utc::now().naive_utc();
        self.deps.months.close_month(&month, now).await
    }
}

// DTOs for Tauri commands
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInvoiceDto {
    pub number: String,
    pub client: String,
    pub service_date: String,
    pub amount_ht_cents: i64,
    pub vat_rate_ppm: i32,
    pub paid_at: Option<String>,
    pub source: Option<String>,
}

impl CreateInvoiceDto {
    pub fn into_entity(self) -> Result<Invoice, String> {
        let service_date = chrono::NaiveDate::parse_from_str(&self.service_date, "%Y-%m-%d").map_err(|e| e.to_string())?;
        let paid_at = match self.paid_at {
            Some(s) => Some(chrono::NaiveDate::parse_from_str(&s, "%Y-%m-%d").map_err(|e| e.to_string())?),
            None => None,
        };
        Ok(Invoice {
            id: uuid::Uuid::new_v4(),
            number: self.number,
            client: self.client,
            service_date,
            amount_ht: self.amount_ht_cents,
            vat_rate_ppm: self.vat_rate_ppm,
            amount_tva: 0,
            amount_ttc: 0,
            paid_at,
            source: self.source,
        })
    }
}

// Simpler DTO: only amounts and dates
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateInvoiceSimpleDto {
    pub service_date: String,
    pub paid_at: Option<String>,
    pub amount_ht_cents: Option<i64>,
    pub amount_tva_cents: Option<i64>,
    pub amount_ttc_cents: Option<i64>,
}

impl CreateInvoiceSimpleDto {
    pub fn into_entity(self, default_vat_rate_ppm: i32) -> Result<Invoice, String> {
        let service_date = chrono::NaiveDate::parse_from_str(&self.service_date, "%Y-%m-%d").map_err(|e| e.to_string())?;
        let paid_at = match self.paid_at {
            Some(s) => Some(chrono::NaiveDate::parse_from_str(&s, "%Y-%m-%d").map_err(|e| e.to_string())?),
            None => None,
        };
        // derive missing amount among HT/TVA/TTC
        let (ht, tva, ttc) = match (self.amount_ht_cents, self.amount_tva_cents, self.amount_ttc_cents) {
            (Some(ht), Some(tva), Some(ttc)) => {
                if ht + tva != ttc { return Err("TTC doit être égal à HT + TVA".into()); }
                (ht, tva, ttc)
            }
            (Some(ht), Some(tva), None) => (ht, tva, ht + tva),
            (Some(ht), None, Some(ttc)) => {
                if ttc < ht { return Err("TTC < HT".into()); }
                (ht, ttc - ht, ttc)
            }
            (None, Some(tva), Some(ttc)) => {
                if ttc < tva { return Err("TTC < TVA".into()); }
                (ttc - tva, tva, ttc)
            }
            (Some(ht), None, None) => {
                let tva = ((ht as i128) * (default_vat_rate_ppm as i128) / 1_000_000i128) as i64;
                (ht, tva, ht + tva)
            }
            _ => return Err("Fournir au moins HT, ou deux montants parmi HT/TVA/TTC".into()),
        };
        Ok(Invoice {
            id: uuid::Uuid::new_v4(),
            number: String::new(),
            client: String::new(),
            service_date,
            amount_ht: ht,
            vat_rate_ppm: default_vat_rate_ppm,
            amount_tva: tva,
            amount_ttc: ttc,
            paid_at,
            source: None,
        })
    }
}

impl AppService {
    pub async fn create_invoice_simple(&self, dto: CreateInvoiceSimpleDto) -> DomainResult<()> {
        let settings = self.deps.config.load_settings().await?;
        let inv = dto.into_entity(settings.default_vat_rate_ppm).map_err(|e| DomainError::Validation(e))?;
        self.deps.invoices.create_invoice(inv).await
    }
}
