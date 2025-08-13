use std::str::FromStr;

use chrono::{NaiveDate, NaiveDateTime};
use domain::{ConfigRepo, DomainError, DomainResult, Expense, ExpenseRepo, Invoice, InvoiceRepo, MonthId, MonthRepo, MonthStatus, Provision, ProvisionKind, ProvisionRepo, Settings};
use sqlx::{sqlite::{SqliteConnectOptions}, Pool, Row, Sqlite};

#[derive(Clone)]
pub struct SqliteRepos {
    pub pool: Pool<Sqlite>,
}

pub async fn connect_and_migrate(db_path: &str) -> anyhow::Result<SqliteRepos> {
    let opts = SqliteConnectOptions::from_str(db_path)?.create_if_missing(true);
    let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(5).connect_with(opts).await?;
    sqlx::migrate!("./migrations").run(&pool).await?;
    Ok(SqliteRepos { pool })
}

#[derive(Clone)]
pub struct SqliteInvoiceRepo { pool: Pool<Sqlite> }
#[derive(Clone)]
pub struct SqliteExpenseRepo { pool: Pool<Sqlite> }
#[derive(Clone)]
pub struct SqliteProvisionRepo { pool: Pool<Sqlite> }
#[derive(Clone)]
pub struct SqliteConfigRepo { pool: Pool<Sqlite> }
#[derive(Clone)]
pub struct SqliteMonthRepo { pool: Pool<Sqlite> }

impl SqliteRepos {
    pub fn invoices(&self) -> SqliteInvoiceRepo { SqliteInvoiceRepo { pool: self.pool.clone() } }
    pub fn expenses(&self) -> SqliteExpenseRepo { SqliteExpenseRepo { pool: self.pool.clone() } }
    pub fn provisions(&self) -> SqliteProvisionRepo { SqliteProvisionRepo { pool: self.pool.clone() } }
    pub fn config(&self) -> SqliteConfigRepo { SqliteConfigRepo { pool: self.pool.clone() } }
    pub fn months(&self) -> SqliteMonthRepo { SqliteMonthRepo { pool: self.pool.clone() } }
}

#[async_trait::async_trait]
impl InvoiceRepo for SqliteInvoiceRepo {
    async fn list_invoices(&self, month: Option<MonthId>) -> DomainResult<Vec<Invoice>> {
        if let Some(m) = month {
            let ym = format!("{:04}-{:02}", m.year, m.month);
            let rows = sqlx::query(r#"SELECT id, number, client, service_date, amount_ht, vat_rate_ppm, amount_tva, amount_ttc, paid_at, source FROM invoices WHERE paid_at IS NOT NULL AND substr(paid_at,1,7)=?"#)
                .bind(ym)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
            Ok(rows.into_iter().map(|r| Invoice{
                id: r.get::<String,_>("id").parse().unwrap(),
                number: r.get("number"),
                client: r.get("client"),
                service_date: NaiveDate::parse_from_str(&r.get::<String,_>("service_date"), "%Y-%m-%d").unwrap(),
                amount_ht: r.get("amount_ht"),
                vat_rate_ppm: r.get("vat_rate_ppm"),
                amount_tva: r.get("amount_tva"),
                amount_ttc: r.get("amount_ttc"),
                paid_at: r.get::<Option<String>,_>("paid_at").map(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").unwrap()),
                source: r.get("source"),
            }).collect())
        } else {
            let rows = sqlx::query(r#"SELECT id, number, client, service_date, amount_ht, vat_rate_ppm, amount_tva, amount_ttc, paid_at, source FROM invoices"#)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
            Ok(rows.into_iter().map(|r| Invoice{
                id: r.get::<String,_>("id").parse().unwrap(),
                number: r.get("number"),
                client: r.get("client"),
                service_date: NaiveDate::parse_from_str(&r.get::<String,_>("service_date"), "%Y-%m-%d").unwrap(),
                amount_ht: r.get("amount_ht"),
                vat_rate_ppm: r.get("vat_rate_ppm"),
                amount_tva: r.get("amount_tva"),
                amount_ttc: r.get("amount_ttc"),
                paid_at: r.get::<Option<String>,_>("paid_at").map(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").unwrap()),
                source: r.get("source"),
            }).collect())
        }
    }

    async fn create_invoice(&self, inv: Invoice) -> DomainResult<()> {
        let paid_at = inv.paid_at.map(|d| d.format("%Y-%m-%d").to_string());
        sqlx::query(r#"INSERT INTO invoices (id, number, client, service_date, amount_ht, vat_rate_ppm, amount_tva, amount_ttc, paid_at, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#)
            .bind(inv.id.to_string())
            .bind(inv.number)
            .bind(inv.client)
            .bind(inv.service_date.format("%Y-%m-%d").to_string())
            .bind(inv.amount_ht)
            .bind(inv.vat_rate_ppm)
            .bind(inv.amount_tva)
            .bind(inv.amount_ttc)
            .bind(paid_at)
            .bind(inv.source)
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }
}

#[async_trait::async_trait]
impl ExpenseRepo for SqliteExpenseRepo {
    async fn list_expenses(&self, month: Option<MonthId>) -> DomainResult<Vec<Expense>> {
        if let Some(m) = month {
            let ym = format!("{:04}-{:02}", m.year, m.month);
            let rows = sqlx::query(r#"SELECT id, label, category, booking_date, amount_ht, vat_rate_ppm, amount_tva, amount_ttc, paid_at, receipt_path FROM expenses WHERE paid_at IS NOT NULL AND substr(paid_at,1,7)=?"#)
                .bind(ym)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
            Ok(rows.into_iter().map(|r| Expense{
                id: r.get::<String,_>("id").parse().unwrap(),
                label: r.get("label"),
                category: r.get("category"),
                booking_date: NaiveDate::parse_from_str(&r.get::<String,_>("booking_date"), "%Y-%m-%d").unwrap(),
                amount_ht: r.get("amount_ht"),
                vat_rate_ppm: r.get("vat_rate_ppm"),
                amount_tva: r.get("amount_tva"),
                amount_ttc: r.get("amount_ttc"),
                paid_at: r.get::<Option<String>,_>("paid_at").map(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").unwrap()),
                receipt_path: r.get("receipt_path"),
            }).collect())
        } else {
            let rows = sqlx::query(r#"SELECT id, label, category, booking_date, amount_ht, vat_rate_ppm, amount_tva, amount_ttc, paid_at, receipt_path FROM expenses"#)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
            Ok(rows.into_iter().map(|r| Expense{
                id: r.get::<String,_>("id").parse().unwrap(),
                label: r.get("label"),
                category: r.get("category"),
                booking_date: NaiveDate::parse_from_str(&r.get::<String,_>("booking_date"), "%Y-%m-%d").unwrap(),
                amount_ht: r.get("amount_ht"),
                vat_rate_ppm: r.get("vat_rate_ppm"),
                amount_tva: r.get("amount_tva"),
                amount_ttc: r.get("amount_ttc"),
                paid_at: r.get::<Option<String>,_>("paid_at").map(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d").unwrap()),
                receipt_path: r.get("receipt_path"),
            }).collect())
        }
    }

    async fn create_expense(&self, exp: Expense) -> DomainResult<()> {
        let paid_at = exp.paid_at.map(|d| d.format("%Y-%m-%d").to_string());
        sqlx::query(r#"INSERT INTO expenses (id, label, category, booking_date, amount_ht, vat_rate_ppm, amount_tva, amount_ttc, paid_at, receipt_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#)
            .bind(exp.id.to_string())
            .bind(exp.label)
            .bind(exp.category)
            .bind(exp.booking_date.format("%Y-%m-%d").to_string())
            .bind(exp.amount_ht)
            .bind(exp.vat_rate_ppm)
            .bind(exp.amount_tva)
            .bind(exp.amount_ttc)
            .bind(paid_at)
            .bind(exp.receipt_path)
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }
}

#[async_trait::async_trait]
impl ProvisionRepo for SqliteProvisionRepo {
    async fn upsert_provision(&self, p: Provision) -> DomainResult<()> {
        sqlx::query(r#"INSERT INTO provisions (id, kind, label, due_date, amount_cents, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind, label=excluded.label, due_date=excluded.due_date, amount_cents=excluded.amount_cents, created_at=excluded.created_at"#)
            .bind(p.id.to_string())
            .bind(match p.kind { ProvisionKind::Vat=>"Vat", ProvisionKind::Urssaf=>"Urssaf", ProvisionKind::Other=>"Other" })
            .bind(p.label)
            .bind(p.due_date.format("%Y-%m-%d").to_string())
            .bind(p.amount_cents)
            .bind(p.created_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn list_provisions(&self, _month: Option<MonthId>) -> DomainResult<Vec<Provision>> {
        let rows = sqlx::query(r#"SELECT id, kind, label, due_date, amount_cents, created_at FROM provisions"#)
            .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(rows.into_iter().map(|r| Provision{
            id: r.get::<String,_>("id").parse().unwrap(),
            kind: match r.get::<String,_>("kind").as_str() { "Vat"=>ProvisionKind::Vat, "Urssaf"=>ProvisionKind::Urssaf, _=>ProvisionKind::Other },
            label: r.get("label"),
            due_date: NaiveDate::parse_from_str(&r.get::<String,_>("due_date"), "%Y-%m-%d").unwrap(),
            amount_cents: r.get("amount_cents"),
            created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
        }).collect())
    }
}

#[async_trait::async_trait]
impl ConfigRepo for SqliteConfigRepo {
    async fn load_settings(&self) -> DomainResult<Settings> {
        let row = sqlx::query(r#"SELECT default_vat_rate_ppm, urssaf_rate_ppm, vat_declare_day, vat_pay_day, urssaf_pay_day, buffer_cents, forecast_ht_cents, forecast_expenses_ttc_cents, forecast_expense_vat_rate_ppm FROM settings WHERE id=1"#)
            .fetch_optional(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        if let Some(r) = row {
            Ok(Settings{
                default_vat_rate_ppm: r.get("default_vat_rate_ppm"),
                urssaf_rate_ppm: r.get("urssaf_rate_ppm"),
                vat_declare_day: r.get::<i64,_>("vat_declare_day") as u8,
                vat_pay_day: r.get::<i64,_>("vat_pay_day") as u8,
                urssaf_pay_day: r.get::<i64,_>("urssaf_pay_day") as u8,
                buffer_cents: r.get("buffer_cents"),
                forecast_ht_cents: r.get("forecast_ht_cents"),
                forecast_expenses_ttc_cents: r.get("forecast_expenses_ttc_cents"),
                forecast_expense_vat_rate_ppm: r.get("forecast_expense_vat_rate_ppm"),
            })
        } else {
            Ok(Settings::default())
        }
    }

    async fn save_settings(&self, s: Settings) -> DomainResult<()> {
        sqlx::query(r#"INSERT INTO settings (id, default_vat_rate_ppm, urssaf_rate_ppm, vat_declare_day, vat_pay_day, urssaf_pay_day, buffer_cents, forecast_ht_cents, forecast_expenses_ttc_cents, forecast_expense_vat_rate_ppm) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET default_vat_rate_ppm=excluded.default_vat_rate_ppm, urssaf_rate_ppm=excluded.urssaf_rate_ppm, vat_declare_day=excluded.vat_declare_day, vat_pay_day=excluded.vat_pay_day, urssaf_pay_day=excluded.urssaf_pay_day, buffer_cents=excluded.buffer_cents, forecast_ht_cents=excluded.forecast_ht_cents, forecast_expenses_ttc_cents=excluded.forecast_expenses_ttc_cents, forecast_expense_vat_rate_ppm=excluded.forecast_expense_vat_rate_ppm"#)
            .bind(s.default_vat_rate_ppm)
            .bind(s.urssaf_rate_ppm)
            .bind(s.vat_declare_day as i64)
            .bind(s.vat_pay_day as i64)
            .bind(s.urssaf_pay_day as i64)
            .bind(s.buffer_cents)
            .bind(s.forecast_ht_cents)
            .bind(s.forecast_expenses_ttc_cents)
            .bind(s.forecast_expense_vat_rate_ppm)
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }
}

#[async_trait::async_trait]
impl MonthRepo for SqliteMonthRepo {
    async fn get_status(&self, month: &MonthId) -> DomainResult<MonthStatus> {
        let row = sqlx::query(r#"SELECT closed_at FROM months WHERE year=? AND month=?"#)
            .bind(month.year).bind(month.month as i64)
            .fetch_optional(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        let closed_at = row.and_then(|r| r.get::<Option<String>,_>("closed_at").map(|s| chrono::NaiveDateTime::parse_from_str(&s, "%Y-%m-%d %H:%M:%S").unwrap()));
        Ok(MonthStatus{ month: month.clone(), closed_at })
    }

    async fn close_month(&self, month: &MonthId, closed_at: chrono::NaiveDateTime) -> DomainResult<()> {
        sqlx::query(r#"INSERT INTO months (year, month, closed_at) VALUES (?, ?, ?) ON CONFLICT(year, month) DO UPDATE SET closed_at=excluded.closed_at"#)
            .bind(month.year).bind(month.month as i64).bind(closed_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }
}
