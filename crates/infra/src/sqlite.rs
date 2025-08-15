use std::str::FromStr;

use chrono::{NaiveDate, NaiveDateTime};
use domain::{
    ConfigRepo, DomainError, DomainResult, Expense, ExpenseRepo, Invoice, InvoiceRepo, 
    MonthId, MonthRepo, MonthStatus, Provision, ProvisionType, ProvisionStatus, ProvisionRepo, Settings,
    // New domain imports
    WorkingDay, WorkingDayRepo, WorkingDaysStats, TaxSchedule, TaxScheduleRepo, TaxType, TaxScheduleStatus,
    Simulation, SimulationRepo, SimulationParameters, SimulationScenario,
    MonthlyKPI, KPIRepo, Operation, OperationRepo, OperationType,
    Declaration, DeclarationRepo, DeclarationType, DeclarationStatus
};
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

// New repository structs
#[derive(Clone)]
pub struct SqliteOperationRepo { pool: Pool<Sqlite> }
#[derive(Clone)]
pub struct SqliteDeclarationRepo { pool: Pool<Sqlite> }
#[derive(Clone)]
pub struct SqliteWorkingDayRepo { pool: Pool<Sqlite> }
#[derive(Clone)]
pub struct SqliteTaxScheduleRepo { pool: Pool<Sqlite> }
#[derive(Clone)]
pub struct SqliteSimulationRepo { pool: Pool<Sqlite> }
#[derive(Clone)]
pub struct SqliteKPIRepo { pool: Pool<Sqlite> }

impl SqliteRepos {
    pub fn invoices(&self) -> SqliteInvoiceRepo { SqliteInvoiceRepo { pool: self.pool.clone() } }
    pub fn expenses(&self) -> SqliteExpenseRepo { SqliteExpenseRepo { pool: self.pool.clone() } }
    pub fn provisions(&self) -> SqliteProvisionRepo { SqliteProvisionRepo { pool: self.pool.clone() } }
    pub fn config(&self) -> SqliteConfigRepo { SqliteConfigRepo { pool: self.pool.clone() } }
    pub fn months(&self) -> SqliteMonthRepo { SqliteMonthRepo { pool: self.pool.clone() } }
    
    // New repository accessors
    pub fn operations(&self) -> SqliteOperationRepo { SqliteOperationRepo { pool: self.pool.clone() } }
    pub fn declarations(&self) -> SqliteDeclarationRepo { SqliteDeclarationRepo { pool: self.pool.clone() } }
    pub fn working_days(&self) -> SqliteWorkingDayRepo { SqliteWorkingDayRepo { pool: self.pool.clone() } }
    pub fn tax_schedules(&self) -> SqliteTaxScheduleRepo { SqliteTaxScheduleRepo { pool: self.pool.clone() } }
    pub fn simulations(&self) -> SqliteSimulationRepo { SqliteSimulationRepo { pool: self.pool.clone() } }
    pub fn kpis(&self) -> SqliteKPIRepo { SqliteKPIRepo { pool: self.pool.clone() } }
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
        let provision_type_str = match p.provision_type {
            ProvisionType::Vat => "vat",
            ProvisionType::Urssaf => "urssaf",
        };
        let status_str = match p.status {
            ProvisionStatus::Pending => "pending",
            ProvisionStatus::Paid => "paid",
            ProvisionStatus::Overdue => "overdue",
        };
        sqlx::query(r#"INSERT INTO provisions (id, period_year, period_month, type, amount_cents, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(type, period_year, period_month) DO UPDATE SET id=excluded.id, amount_cents=excluded.amount_cents, due_date=excluded.due_date, status=excluded.status, updated_at=excluded.updated_at"#)
            .bind(p.id.to_string())
            .bind(p.period_year)
            .bind(p.period_month as i64)
            .bind(provision_type_str)
            .bind(p.amount_cents)
            .bind(p.due_date.format("%Y-%m-%d").to_string())
            .bind(status_str)
            .bind(p.created_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(p.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn list_provisions(&self, month: Option<MonthId>) -> DomainResult<Vec<Provision>> {
        let rows = if let Some(m) = month {
            sqlx::query(r#"SELECT id, period_year, period_month, type, amount_cents, due_date, status, created_at, updated_at FROM provisions WHERE period_year = ? AND period_month = ?"#)
                .bind(m.year)
                .bind(m.month as i64)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?
        } else {
            sqlx::query(r#"SELECT id, period_year, period_month, type, amount_cents, due_date, status, created_at, updated_at FROM provisions"#)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?
        };
        Ok(rows.into_iter().map(|r| {
            let provision_type = match r.get::<String,_>("type").as_str() {
                "vat" => ProvisionType::Vat,
                "urssaf" => ProvisionType::Urssaf,
                _ => ProvisionType::Vat,
            };
            let status = match r.get::<String,_>("status").as_str() {
                "pending" => ProvisionStatus::Pending,
                "paid" => ProvisionStatus::Paid,
                "overdue" => ProvisionStatus::Overdue,
                _ => ProvisionStatus::Pending,
            };
            Provision{
                id: r.get::<String,_>("id").parse().unwrap(),
                period_year: r.get("period_year"),
                period_month: r.get::<i64,_>("period_month") as u32,
                provision_type,
                amount_cents: r.get("amount_cents"),
                due_date: NaiveDate::parse_from_str(&r.get::<String,_>("due_date"), "%Y-%m-%d").unwrap(),
                status,
                created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
                updated_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            }
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

// ============ New Repository Implementations ============

#[async_trait::async_trait]
impl WorkingDayRepo for SqliteWorkingDayRepo {
    async fn create_working_day(&self, working_day: WorkingDay) -> DomainResult<()> {
        sqlx::query(r#"
            INSERT INTO working_days (id, date, hours_worked, billable_hours, hourly_rate_cents, description, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#)
            .bind(working_day.id.to_string())
            .bind(working_day.date.format("%Y-%m-%d").to_string())
            .bind(working_day.hours_worked)
            .bind(working_day.billable_hours)
            .bind(working_day.hourly_rate_cents)
            .bind(working_day.description)
            .bind(working_day.created_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(working_day.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn update_working_day(&self, working_day: WorkingDay) -> DomainResult<()> {
        sqlx::query(r#"
            UPDATE working_days 
            SET date = ?, hours_worked = ?, billable_hours = ?, hourly_rate_cents = ?, description = ?, updated_at = ?
            WHERE id = ?
        "#)
            .bind(working_day.date.format("%Y-%m-%d").to_string())
            .bind(working_day.hours_worked)
            .bind(working_day.billable_hours)
            .bind(working_day.hourly_rate_cents)
            .bind(working_day.description)
            .bind(working_day.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(working_day.id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn delete_working_day(&self, id: uuid::Uuid) -> DomainResult<()> {
        sqlx::query(r#"DELETE FROM working_days WHERE id = ?"#)
            .bind(id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn get_working_day(&self, id: uuid::Uuid) -> DomainResult<WorkingDay> {
        let row = sqlx::query(r#"
            SELECT id, date, hours_worked, billable_hours, hourly_rate_cents, description, created_at, updated_at 
            FROM working_days WHERE id = ?
        "#)
            .bind(id.to_string())
            .fetch_optional(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        if let Some(r) = row {
            Ok(WorkingDay {
                id: r.get::<String,_>("id").parse().unwrap(),
                date: NaiveDate::parse_from_str(&r.get::<String,_>("date"), "%Y-%m-%d").unwrap(),
                hours_worked: r.get("hours_worked"),
                billable_hours: r.get("billable_hours"),
                hourly_rate_cents: r.get("hourly_rate_cents"),
                description: r.get("description"),
                created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
                updated_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            })
        } else {
            Err(DomainError::NotFound)
        }
    }

    async fn list_working_days(&self, start_date: Option<NaiveDate>, end_date: Option<NaiveDate>) -> DomainResult<Vec<WorkingDay>> {
        let mut query = String::from("SELECT id, date, hours_worked, billable_hours, hourly_rate_cents, description, created_at, updated_at FROM working_days");
        let mut conditions = Vec::new();
        
        if start_date.is_some() {
            conditions.push("date >= ?");
        }
        if end_date.is_some() {
            conditions.push("date <= ?");
        }
        
        if !conditions.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&conditions.join(" AND "));
        }
        
        query.push_str(" ORDER BY date DESC");
        
        let mut sql_query = sqlx::query(&query);
        if let Some(start) = start_date {
            sql_query = sql_query.bind(start.format("%Y-%m-%d").to_string());
        }
        if let Some(end) = end_date {
            sql_query = sql_query.bind(end.format("%Y-%m-%d").to_string());
        }
        
        let rows = sql_query.fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        Ok(rows.into_iter().map(|r| WorkingDay {
            id: r.get::<String,_>("id").parse().unwrap(),
            date: NaiveDate::parse_from_str(&r.get::<String,_>("date"), "%Y-%m-%d").unwrap(),
            hours_worked: r.get("hours_worked"),
            billable_hours: r.get("billable_hours"),
            hourly_rate_cents: r.get("hourly_rate_cents"),
            description: r.get("description"),
            created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            updated_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
        }).collect())
    }

    async fn get_working_days_for_month(&self, month: &MonthId) -> DomainResult<Vec<WorkingDay>> {
        let ym = format!("{:04}-{:02}", month.year, month.month);
        let rows = sqlx::query(r#"
            SELECT id, date, hours_worked, billable_hours, hourly_rate_cents, description, created_at, updated_at 
            FROM working_days 
            WHERE substr(date,1,7) = ?
            ORDER BY date
        "#)
            .bind(ym)
            .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        Ok(rows.into_iter().map(|r| WorkingDay {
            id: r.get::<String,_>("id").parse().unwrap(),
            date: NaiveDate::parse_from_str(&r.get::<String,_>("date"), "%Y-%m-%d").unwrap(),
            hours_worked: r.get("hours_worked"),
            billable_hours: r.get("billable_hours"),
            hourly_rate_cents: r.get("hourly_rate_cents"),
            description: r.get("description"),
            created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            updated_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
        }).collect())
    }

    async fn get_working_days_stats(&self, start_date: NaiveDate, end_date: NaiveDate) -> DomainResult<WorkingDaysStats> {
        let row = sqlx::query(r#"
            SELECT 
                COUNT(*) as total_working_days,
                SUM(billable_hours) as total_billable_hours,
                SUM(hours_worked) as total_worked_hours,
                AVG(hourly_rate_cents * billable_hours) as avg_daily_rate_cents,
                AVG(hourly_rate_cents) as avg_hourly_rate_cents
            FROM working_days 
            WHERE date >= ? AND date <= ?
        "#)
            .bind(start_date.format("%Y-%m-%d").to_string())
            .bind(end_date.format("%Y-%m-%d").to_string())
            .fetch_one(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        let total_working_days: f64 = row.get::<i64,_>("total_working_days") as f64;
        let total_billable_hours: f64 = row.get::<f64,_>("total_billable_hours");
        let total_worked_hours: f64 = row.get::<f64,_>("total_worked_hours");
        let avg_daily_rate_cents: i64 = row.get::<f64,_>("avg_daily_rate_cents") as i64;
        let avg_hourly_rate_cents: i64 = row.get::<f64,_>("avg_hourly_rate_cents") as i64;
        let utilization_rate = if total_worked_hours > 0.0 { total_billable_hours / total_worked_hours } else { 0.0 };
        
        Ok(WorkingDaysStats {
            total_working_days,
            total_billable_hours,
            total_worked_hours,
            average_daily_rate_cents: avg_daily_rate_cents,
            average_hourly_rate_cents: avg_hourly_rate_cents,
            utilization_rate,
        })
    }
}

#[async_trait::async_trait]
impl TaxScheduleRepo for SqliteTaxScheduleRepo {
    async fn create_tax_schedule(&self, tax_schedule: TaxSchedule) -> DomainResult<()> {
        let tax_type_str = match tax_schedule.tax_type {
            TaxType::Vat => "Vat",
            TaxType::Urssaf => "Urssaf", 
            TaxType::IncomeTax => "IncomeTax",
            TaxType::Other(ref s) => s,
        };
        
        let status_str = match tax_schedule.status {
            TaxScheduleStatus::Pending => "Pending",
            TaxScheduleStatus::Paid => "Paid",
            TaxScheduleStatus::Overdue => "Overdue",
        };
        
        sqlx::query(r#"
            INSERT INTO tax_schedules (id, tax_type, due_date, amount_cents, period_start, period_end, status, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        "#)
            .bind(tax_schedule.id.to_string())
            .bind(tax_type_str)
            .bind(tax_schedule.due_date.format("%Y-%m-%d").to_string())
            .bind(tax_schedule.amount_cents)
            .bind(tax_schedule.period_start.format("%Y-%m-%d").to_string())
            .bind(tax_schedule.period_end.format("%Y-%m-%d").to_string())
            .bind(status_str)
            .bind(tax_schedule.created_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn update_tax_schedule(&self, tax_schedule: TaxSchedule) -> DomainResult<()> {
        let tax_type_str = match tax_schedule.tax_type {
            TaxType::Vat => "Vat",
            TaxType::Urssaf => "Urssaf",
            TaxType::IncomeTax => "IncomeTax", 
            TaxType::Other(ref s) => s,
        };
        
        let status_str = match tax_schedule.status {
            TaxScheduleStatus::Pending => "Pending",
            TaxScheduleStatus::Paid => "Paid",
            TaxScheduleStatus::Overdue => "Overdue",
        };
        
        sqlx::query(r#"
            UPDATE tax_schedules 
            SET tax_type = ?, due_date = ?, amount_cents = ?, period_start = ?, period_end = ?, status = ?
            WHERE id = ?
        "#)
            .bind(tax_type_str)
            .bind(tax_schedule.due_date.format("%Y-%m-%d").to_string())
            .bind(tax_schedule.amount_cents)
            .bind(tax_schedule.period_start.format("%Y-%m-%d").to_string())
            .bind(tax_schedule.period_end.format("%Y-%m-%d").to_string())
            .bind(status_str)
            .bind(tax_schedule.id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn delete_tax_schedule(&self, id: uuid::Uuid) -> DomainResult<()> {
        sqlx::query(r#"DELETE FROM tax_schedules WHERE id = ?"#)
            .bind(id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn get_tax_schedule(&self, id: uuid::Uuid) -> DomainResult<TaxSchedule> {
        let row = sqlx::query(r#"
            SELECT id, tax_type, due_date, amount_cents, period_start, period_end, status, created_at 
            FROM tax_schedules WHERE id = ?
        "#)
            .bind(id.to_string())
            .fetch_optional(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        if let Some(r) = row {
            let tax_type_str: String = r.get("tax_type");
            let tax_type = match tax_type_str.as_str() {
                "Vat" => TaxType::Vat,
                "Urssaf" => TaxType::Urssaf,
                "IncomeTax" => TaxType::IncomeTax,
                s => TaxType::Other(s.to_string()),
            };
            
            let status_str: String = r.get("status");
            let status = match status_str.as_str() {
                "Pending" => TaxScheduleStatus::Pending,
                "Paid" => TaxScheduleStatus::Paid,
                "Overdue" => TaxScheduleStatus::Overdue,
                _ => TaxScheduleStatus::Pending,
            };
            
            Ok(TaxSchedule {
                id: r.get::<String,_>("id").parse().unwrap(),
                tax_type,
                due_date: NaiveDate::parse_from_str(&r.get::<String,_>("due_date"), "%Y-%m-%d").unwrap(),
                amount_cents: r.get("amount_cents"),
                period_start: NaiveDate::parse_from_str(&r.get::<String,_>("period_start"), "%Y-%m-%d").unwrap(),
                period_end: NaiveDate::parse_from_str(&r.get::<String,_>("period_end"), "%Y-%m-%d").unwrap(),
                status,
                created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            })
        } else {
            Err(DomainError::NotFound)
        }
    }

    async fn list_tax_schedules(&self, start_date: Option<NaiveDate>, end_date: Option<NaiveDate>) -> DomainResult<Vec<TaxSchedule>> {
        let mut query = String::from("SELECT id, tax_type, due_date, amount_cents, period_start, period_end, status, created_at FROM tax_schedules");
        let mut conditions = Vec::new();
        
        if start_date.is_some() {
            conditions.push("due_date >= ?");
        }
        if end_date.is_some() {
            conditions.push("due_date <= ?");
        }
        
        if !conditions.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&conditions.join(" AND "));
        }
        
        query.push_str(" ORDER BY due_date");
        
        let mut sql_query = sqlx::query(&query);
        if let Some(start) = start_date {
            sql_query = sql_query.bind(start.format("%Y-%m-%d").to_string());
        }
        if let Some(end) = end_date {
            sql_query = sql_query.bind(end.format("%Y-%m-%d").to_string());
        }
        
        let rows = sql_query.fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        Ok(rows.into_iter().map(|r| {
            let tax_type_str: String = r.get("tax_type");
            let tax_type = match tax_type_str.as_str() {
                "Vat" => TaxType::Vat,
                "Urssaf" => TaxType::Urssaf,
                "IncomeTax" => TaxType::IncomeTax,
                s => TaxType::Other(s.to_string()),
            };
            
            let status_str: String = r.get("status");
            let status = match status_str.as_str() {
                "Pending" => TaxScheduleStatus::Pending,
                "Paid" => TaxScheduleStatus::Paid,
                "Overdue" => TaxScheduleStatus::Overdue,
                _ => TaxScheduleStatus::Pending,
            };
            
            TaxSchedule {
                id: r.get::<String,_>("id").parse().unwrap(),
                tax_type,
                due_date: NaiveDate::parse_from_str(&r.get::<String,_>("due_date"), "%Y-%m-%d").unwrap(),
                amount_cents: r.get("amount_cents"),
                period_start: NaiveDate::parse_from_str(&r.get::<String,_>("period_start"), "%Y-%m-%d").unwrap(),
                period_end: NaiveDate::parse_from_str(&r.get::<String,_>("period_end"), "%Y-%m-%d").unwrap(),
                status,
                created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            }
        }).collect())
    }

    async fn get_overdue_schedules(&self, as_of_date: NaiveDate) -> DomainResult<Vec<TaxSchedule>> {
        let rows = sqlx::query(r#"
            SELECT id, tax_type, due_date, amount_cents, period_start, period_end, status, created_at 
            FROM tax_schedules 
            WHERE due_date < ? AND status = 'Pending'
            ORDER BY due_date
        "#)
            .bind(as_of_date.format("%Y-%m-%d").to_string())
            .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        Ok(rows.into_iter().map(|r| {
            let tax_type_str: String = r.get("tax_type");
            let tax_type = match tax_type_str.as_str() {
                "Vat" => TaxType::Vat,
                "Urssaf" => TaxType::Urssaf,
                "IncomeTax" => TaxType::IncomeTax,
                s => TaxType::Other(s.to_string()),
            };
            
            TaxSchedule {
                id: r.get::<String,_>("id").parse().unwrap(),
                tax_type,
                due_date: NaiveDate::parse_from_str(&r.get::<String,_>("due_date"), "%Y-%m-%d").unwrap(),
                amount_cents: r.get("amount_cents"),
                period_start: NaiveDate::parse_from_str(&r.get::<String,_>("period_start"), "%Y-%m-%d").unwrap(),
                period_end: NaiveDate::parse_from_str(&r.get::<String,_>("period_end"), "%Y-%m-%d").unwrap(),
                status: TaxScheduleStatus::Overdue,
                created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            }
        }).collect())
    }

    async fn mark_as_paid(&self, id: uuid::Uuid, _paid_date: NaiveDate) -> DomainResult<()> {
        sqlx::query(r#"UPDATE tax_schedules SET status = 'Paid' WHERE id = ?"#)
            .bind(id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }
}

#[async_trait::async_trait]
impl SimulationRepo for SqliteSimulationRepo {
    async fn create_simulation(&self, simulation: Simulation) -> DomainResult<()> {
        let scenario_type_str = match simulation.scenario_type {
            SimulationScenario::DailyRateOptimization => "DailyRateOptimization",
            SimulationScenario::AnnualIncomeProjection => "AnnualIncomeProjection",
            SimulationScenario::TaxOptimization => "TaxOptimization",
            SimulationScenario::WorkingDaysImpact => "WorkingDaysImpact",
        };
        
        let parameters_json = serde_json::to_string(&simulation.parameters).map_err(|e| DomainError::Validation(e.to_string()))?;
        let results_json = simulation.results.as_ref().map(|r| serde_json::to_string(r)).transpose().map_err(|e| DomainError::Validation(e.to_string()))?;
        
        sqlx::query(r#"
            INSERT INTO simulations (id, name, scenario_type, parameters, results, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        "#)
            .bind(simulation.id.to_string())
            .bind(simulation.name)
            .bind(scenario_type_str)
            .bind(parameters_json)
            .bind(results_json)
            .bind(simulation.created_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(simulation.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn update_simulation(&self, simulation: Simulation) -> DomainResult<()> {
        let scenario_type_str = match simulation.scenario_type {
            SimulationScenario::DailyRateOptimization => "DailyRateOptimization",
            SimulationScenario::AnnualIncomeProjection => "AnnualIncomeProjection",
            SimulationScenario::TaxOptimization => "TaxOptimization",
            SimulationScenario::WorkingDaysImpact => "WorkingDaysImpact",
        };
        
        let parameters_json = serde_json::to_string(&simulation.parameters).map_err(|e| DomainError::Validation(e.to_string()))?;
        let results_json = simulation.results.as_ref().map(|r| serde_json::to_string(r)).transpose().map_err(|e| DomainError::Validation(e.to_string()))?;
        
        sqlx::query(r#"
            UPDATE simulations 
            SET name = ?, scenario_type = ?, parameters = ?, results = ?, updated_at = ?
            WHERE id = ?
        "#)
            .bind(simulation.name)
            .bind(scenario_type_str)
            .bind(parameters_json)
            .bind(results_json)
            .bind(simulation.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(simulation.id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn delete_simulation(&self, id: uuid::Uuid) -> DomainResult<()> {
        sqlx::query(r#"DELETE FROM simulations WHERE id = ?"#)
            .bind(id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn get_simulation(&self, id: uuid::Uuid) -> DomainResult<Simulation> {
        let row = sqlx::query(r#"
            SELECT id, name, scenario_type, parameters, results, created_at, updated_at 
            FROM simulations WHERE id = ?
        "#)
            .bind(id.to_string())
            .fetch_optional(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        if let Some(r) = row {
            let scenario_type_str: String = r.get("scenario_type");
            let scenario_type = match scenario_type_str.as_str() {
                "DailyRateOptimization" => SimulationScenario::DailyRateOptimization,
                "AnnualIncomeProjection" => SimulationScenario::AnnualIncomeProjection,
                "TaxOptimization" => SimulationScenario::TaxOptimization,
                "WorkingDaysImpact" => SimulationScenario::WorkingDaysImpact,
                _ => SimulationScenario::DailyRateOptimization,
            };
            
            let parameters_json: String = r.get("parameters");
            let parameters: SimulationParameters = serde_json::from_str(&parameters_json).map_err(|e| DomainError::Validation(e.to_string()))?;
            
            let results_json: Option<String> = r.get("results");
            let results = results_json.map(|json| serde_json::from_str(&json)).transpose().map_err(|e| DomainError::Validation(e.to_string()))?;
            
            Ok(Simulation {
                id: r.get::<String,_>("id").parse().unwrap(),
                name: r.get("name"),
                scenario_type,
                parameters,
                results,
                created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
                updated_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            })
        } else {
            Err(DomainError::NotFound)
        }
    }

    async fn list_simulations(&self) -> DomainResult<Vec<Simulation>> {
        let rows = sqlx::query(r#"
            SELECT id, name, scenario_type, parameters, results, created_at, updated_at 
            FROM simulations 
            ORDER BY updated_at DESC
        "#)
            .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        let mut simulations = Vec::new();
        for r in rows {
            let scenario_type_str: String = r.get("scenario_type");
            let scenario_type = match scenario_type_str.as_str() {
                "DailyRateOptimization" => SimulationScenario::DailyRateOptimization,
                "AnnualIncomeProjection" => SimulationScenario::AnnualIncomeProjection,
                "TaxOptimization" => SimulationScenario::TaxOptimization,
                "WorkingDaysImpact" => SimulationScenario::WorkingDaysImpact,
                _ => SimulationScenario::DailyRateOptimization,
            };
            
            let parameters_json: String = r.get("parameters");
            let parameters: SimulationParameters = serde_json::from_str(&parameters_json).map_err(|e| DomainError::Validation(e.to_string()))?;
            
            let results_json: Option<String> = r.get("results");
            let results = results_json.map(|json| serde_json::from_str(&json)).transpose().map_err(|e| DomainError::Validation(e.to_string()))?;
            
            simulations.push(Simulation {
                id: r.get::<String,_>("id").parse().unwrap(),
                name: r.get("name"),
                scenario_type,
                parameters,
                results,
                created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
                updated_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            });
        }
        
        Ok(simulations)
    }
}

#[async_trait::async_trait]
impl KPIRepo for SqliteKPIRepo {
    async fn save_monthly_kpi(&self, kpi: MonthlyKPI) -> DomainResult<()> {
        sqlx::query(r#"
            INSERT INTO monthly_kpis (
                id, year, month, revenue_ht_cents, revenue_ttc_cents, expenses_ttc_cents,
                working_days, billable_hours, average_daily_rate_cents, average_hourly_rate_cents,
                vat_collected_cents, vat_due_cents, urssaf_due_cents, net_margin_cents,
                profitability_ratio, utilization_rate, created_at, updated_at
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(year, month) DO UPDATE SET
                id = excluded.id,
                revenue_ht_cents = excluded.revenue_ht_cents,
                revenue_ttc_cents = excluded.revenue_ttc_cents,
                expenses_ttc_cents = excluded.expenses_ttc_cents,
                working_days = excluded.working_days,
                billable_hours = excluded.billable_hours,
                average_daily_rate_cents = excluded.average_daily_rate_cents,
                average_hourly_rate_cents = excluded.average_hourly_rate_cents,
                vat_collected_cents = excluded.vat_collected_cents,
                vat_due_cents = excluded.vat_due_cents,
                urssaf_due_cents = excluded.urssaf_due_cents,
                net_margin_cents = excluded.net_margin_cents,
                profitability_ratio = excluded.profitability_ratio,
                utilization_rate = excluded.utilization_rate,
                updated_at = excluded.updated_at
        "#)
            .bind(kpi.id.to_string())
            .bind(kpi.month.year)
            .bind(kpi.month.month as i64)
            .bind(kpi.revenue_ht_cents)
            .bind(kpi.revenue_ttc_cents)
            .bind(kpi.expenses_ttc_cents)
            .bind(kpi.working_days)
            .bind(kpi.billable_hours)
            .bind(kpi.average_daily_rate_cents)
            .bind(kpi.average_hourly_rate_cents)
            .bind(kpi.vat_collected_cents)
            .bind(kpi.vat_due_cents)
            .bind(kpi.urssaf_due_cents)
            .bind(kpi.net_margin_cents)
            .bind(kpi.profitability_ratio)
            .bind(kpi.utilization_rate)
            .bind(kpi.created_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(kpi.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn get_monthly_kpi(&self, month: &MonthId) -> DomainResult<Option<MonthlyKPI>> {
        let row = sqlx::query(r#"
            SELECT id, year, month, revenue_ht_cents, revenue_ttc_cents, expenses_ttc_cents,
                   working_days, billable_hours, average_daily_rate_cents, average_hourly_rate_cents,
                   vat_collected_cents, vat_due_cents, urssaf_due_cents, net_margin_cents,
                   profitability_ratio, utilization_rate, created_at, updated_at
            FROM monthly_kpis 
            WHERE year = ? AND month = ?
        "#)
            .bind(month.year)
            .bind(month.month as i64)
            .fetch_optional(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        if let Some(r) = row {
            Ok(Some(MonthlyKPI {
                id: r.get::<String,_>("id").parse().unwrap(),
                month: MonthId { year: r.get("year"), month: r.get::<i64,_>("month") as u32 },
                revenue_ht_cents: r.get("revenue_ht_cents"),
                revenue_ttc_cents: r.get("revenue_ttc_cents"),
                expenses_ttc_cents: r.get("expenses_ttc_cents"),
                working_days: r.get("working_days"),
                billable_hours: r.get("billable_hours"),
                average_daily_rate_cents: r.get("average_daily_rate_cents"),
                average_hourly_rate_cents: r.get("average_hourly_rate_cents"),
                vat_collected_cents: r.get("vat_collected_cents"),
                vat_due_cents: r.get("vat_due_cents"),
                urssaf_due_cents: r.get("urssaf_due_cents"),
                net_margin_cents: r.get("net_margin_cents"),
                profitability_ratio: r.get("profitability_ratio"),
                utilization_rate: r.get("utilization_rate"),
                created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
                updated_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            }))
        } else {
            Ok(None)
        }
    }

    async fn list_monthly_kpis(&self, start_month: &MonthId, end_month: &MonthId) -> DomainResult<Vec<MonthlyKPI>> {
        let rows = sqlx::query(r#"
            SELECT id, year, month, revenue_ht_cents, revenue_ttc_cents, expenses_ttc_cents,
                   working_days, billable_hours, average_daily_rate_cents, average_hourly_rate_cents,
                   vat_collected_cents, vat_due_cents, urssaf_due_cents, net_margin_cents,
                   profitability_ratio, utilization_rate, created_at, updated_at
            FROM monthly_kpis 
            WHERE (year > ? OR (year = ? AND month >= ?))
              AND (year < ? OR (year = ? AND month <= ?))
            ORDER BY year, month
        "#)
            .bind(start_month.year)
            .bind(start_month.year)
            .bind(start_month.month as i64)
            .bind(end_month.year)
            .bind(end_month.year)
            .bind(end_month.month as i64)
            .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        Ok(rows.into_iter().map(|r| MonthlyKPI {
            id: r.get::<String,_>("id").parse().unwrap(),
            month: MonthId { year: r.get("year"), month: r.get::<i64,_>("month") as u32 },
            revenue_ht_cents: r.get("revenue_ht_cents"),
            revenue_ttc_cents: r.get("revenue_ttc_cents"),
            expenses_ttc_cents: r.get("expenses_ttc_cents"),
            working_days: r.get("working_days"),
            billable_hours: r.get("billable_hours"),
            average_daily_rate_cents: r.get("average_daily_rate_cents"),
            average_hourly_rate_cents: r.get("average_hourly_rate_cents"),
            vat_collected_cents: r.get("vat_collected_cents"),
            vat_due_cents: r.get("vat_due_cents"),
            urssaf_due_cents: r.get("urssaf_due_cents"),
            net_margin_cents: r.get("net_margin_cents"),
            profitability_ratio: r.get("profitability_ratio"),
            utilization_rate: r.get("utilization_rate"),
            created_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
            updated_at: NaiveDateTime::parse_from_str(&r.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
        }).collect())
    }

    async fn delete_monthly_kpi(&self, month: &MonthId) -> DomainResult<()> {
        sqlx::query(r#"DELETE FROM monthly_kpis WHERE year = ? AND month = ?"#)
            .bind(month.year)
            .bind(month.month as i64)
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }
}

// Helper functions for Operation serialization/deserialization
fn operation_type_to_string(operation_type: &OperationType) -> &'static str {
    match operation_type {
        OperationType::Purchase => "purchase",
        OperationType::Sale => "sale",
    }
}

fn string_to_operation_type(s: &str) -> OperationType {
    match s {
        "purchase" => OperationType::Purchase,
        "sale" => OperationType::Sale,
        _ => OperationType::Sale, // default fallback
    }
}

fn row_to_operation(row: &sqlx::sqlite::SqliteRow) -> Operation {
    Operation {
        id: row.get::<String,_>("id").parse().unwrap(),
        invoice_date: NaiveDate::parse_from_str(&row.get::<String,_>("invoice_date"), "%Y-%m-%d").unwrap(),
        payment_date: row.get::<Option<String>,_>("payment_date")
            .map(|s: String| NaiveDate::parse_from_str(&s, "%Y-%m-%d").unwrap()),
        operation_type: string_to_operation_type(&row.get::<String,_>("type")),
        amount_ht_cents: row.get("amount_ht_cents"),
        vat_amount_cents: row.get("vat_amount_cents"),
        amount_ttc_cents: row.get("amount_ttc_cents"),
        vat_on_payments: row.get::<i64,_>("vat_on_payments") != 0,
        label: row.get("label"),
        receipt_url: row.get("receipt_url"),
        created_at: NaiveDateTime::parse_from_str(&row.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
        updated_at: NaiveDateTime::parse_from_str(&row.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
    }
}

#[async_trait::async_trait]
impl OperationRepo for SqliteOperationRepo {
    async fn create_operation(&self, operation: Operation) -> DomainResult<()> {
        let payment_date = operation.payment_date.map(|d| d.format("%Y-%m-%d").to_string());

        sqlx::query(r#"
            INSERT INTO operations (
                id, invoice_date, payment_date, type,
                amount_ht_cents, vat_amount_cents, amount_ttc_cents,
                vat_on_payments, label, receipt_url, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#)
            .bind(operation.id.to_string())
            .bind(operation.invoice_date.format("%Y-%m-%d").to_string())
            .bind(payment_date)
            .bind(operation_type_to_string(&operation.operation_type))
            .bind(operation.amount_ht_cents)
            .bind(operation.vat_amount_cents)
            .bind(operation.amount_ttc_cents)
            .bind(if operation.vat_on_payments { 1 } else { 0 })
            .bind(operation.label)
            .bind(operation.receipt_url)
            .bind(operation.created_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(operation.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn get_operation(&self, id: uuid::Uuid) -> DomainResult<Operation> {
        let row = sqlx::query(r#"
            SELECT id, invoice_date, payment_date, type,
                   amount_ht_cents, vat_amount_cents, amount_ttc_cents,
                   vat_on_payments, label, receipt_url, created_at, updated_at
            FROM operations WHERE id = ?
        "#)
            .bind(id.to_string())
            .fetch_one(&self.pool).await.map_err(|e| match e {
                sqlx::Error::RowNotFound => DomainError::NotFound,
                _ => DomainError::Repo(e.to_string())
            })?;
        Ok(row_to_operation(&row))
    }

    async fn update_operation(&self, operation: Operation) -> DomainResult<()> {
        let payment_date = operation.payment_date.map(|d| d.format("%Y-%m-%d").to_string());

        sqlx::query(r#"
            UPDATE operations SET 
                invoice_date = ?, payment_date = ?, type = ?,
                amount_ht_cents = ?, vat_amount_cents = ?, amount_ttc_cents = ?,
                vat_on_payments = ?, label = ?, receipt_url = ?, updated_at = ?
            WHERE id = ?
        "#)
            .bind(operation.invoice_date.format("%Y-%m-%d").to_string())
            .bind(payment_date)
            .bind(operation_type_to_string(&operation.operation_type))
            .bind(operation.amount_ht_cents)
            .bind(operation.vat_amount_cents)
            .bind(operation.amount_ttc_cents)
            .bind(if operation.vat_on_payments { 1 } else { 0 })
            .bind(operation.label)
            .bind(operation.receipt_url)
            .bind(operation.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(operation.id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn delete_operation(&self, id: uuid::Uuid) -> DomainResult<()> {
        sqlx::query(r#"DELETE FROM operations WHERE id = ?"#)
            .bind(id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn list_operations(&self, month: Option<MonthId>) -> DomainResult<Vec<Operation>> {
        let rows = if let Some(m) = month {
            let ym = format!("{:04}-{:02}", m.year, m.month);
            sqlx::query(r#"
                SELECT id, invoice_date, payment_date, type,
                       amount_ht_cents, vat_amount_cents, amount_ttc_cents,
                       vat_on_payments, label, receipt_url, created_at, updated_at
                FROM operations 
                WHERE substr(invoice_date, 1, 7) = ? 
                ORDER BY invoice_date DESC
            "#)
                .bind(ym)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?
        } else {
            sqlx::query(r#"
                SELECT id, invoice_date, payment_date, type,
                       amount_ht_cents, vat_amount_cents, amount_ttc_cents,
                       vat_on_payments, label, receipt_url, created_at, updated_at
                FROM operations 
                ORDER BY invoice_date DESC
            "#)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?
        };
        
        Ok(rows.into_iter().map(|r| row_to_operation(&r)).collect())
    }

    async fn list_operations_by_type(&self, operation_type: OperationType, month: Option<MonthId>) -> DomainResult<Vec<Operation>> {
        let rows = if let Some(m) = month {
            let ym = format!("{:04}-{:02}", m.year, m.month);
            sqlx::query(r#"
                SELECT id, invoice_date, payment_date, type,
                       amount_ht_cents, vat_amount_cents, amount_ttc_cents,
                       vat_on_payments, label, receipt_url, created_at, updated_at
                FROM operations 
                WHERE type = ? AND substr(invoice_date, 1, 7) = ?
                ORDER BY invoice_date DESC
            "#)
                .bind(operation_type_to_string(&operation_type))
                .bind(ym)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?
        } else {
            sqlx::query(r#"
                SELECT id, invoice_date, payment_date, type,
                       amount_ht_cents, vat_amount_cents, amount_ttc_cents,
                       vat_on_payments, label, receipt_url, created_at, updated_at
                FROM operations 
                WHERE type = ?
                ORDER BY invoice_date DESC
            "#)
                .bind(operation_type_to_string(&operation_type))
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?
        };
        
        Ok(rows.into_iter().map(|r| row_to_operation(&r)).collect())
    }

    async fn list_operations_by_payment_month(&self, month: MonthId) -> DomainResult<Vec<Operation>> {
        let ym = format!("{:04}-{:02}", month.year, month.month);
        let rows = sqlx::query(r#"
            SELECT id, invoice_date, payment_date, type,
                   amount_ht_cents, vat_amount_cents, amount_ttc_cents,
                   vat_on_payments, label, receipt_url, created_at, updated_at
            FROM operations 
            WHERE payment_date IS NOT NULL AND substr(payment_date, 1, 7) = ?
            ORDER BY payment_date DESC
        "#)
            .bind(ym)
            .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        Ok(rows.into_iter().map(|r| row_to_operation(&r)).collect())
    }
}

// Helper functions for Declaration serialization/deserialization
fn declaration_type_to_string(declaration_type: &DeclarationType) -> &'static str {
    match declaration_type {
        DeclarationType::Vat => "vat",
        DeclarationType::Urssaf => "urssaf",
    }
}

fn string_to_declaration_type(s: &str) -> DeclarationType {
    match s {
        "vat" => DeclarationType::Vat,
        "urssaf" => DeclarationType::Urssaf,
        _ => DeclarationType::Vat, // default fallback
    }
}

fn declaration_status_to_string(status: &DeclarationStatus) -> &'static str {
    match status {
        DeclarationStatus::Pending => "pending",
        DeclarationStatus::Paid => "paid",
        DeclarationStatus::Overdue => "overdue",
    }
}

fn string_to_declaration_status(s: &str) -> DeclarationStatus {
    match s {
        "pending" => DeclarationStatus::Pending,
        "paid" => DeclarationStatus::Paid,
        "overdue" => DeclarationStatus::Overdue,
        _ => DeclarationStatus::Pending, // default fallback
    }
}

fn row_to_declaration(row: &sqlx::sqlite::SqliteRow) -> Declaration {
    Declaration {
        id: row.get::<String,_>("id").parse().unwrap(),
        declaration_type: string_to_declaration_type(&row.get::<String,_>("declaration_type")),
        period_year: row.get("period_year"),
        period_month: row.get::<i64,_>("period_month") as u32,
        amount_due_cents: row.get("amount_due_cents"),
        due_date: NaiveDate::parse_from_str(&row.get::<String,_>("due_date"), "%Y-%m-%d").unwrap(),
        payment_date: row.get::<Option<String>,_>("payment_date")
            .map(|s: String| NaiveDate::parse_from_str(&s, "%Y-%m-%d").unwrap()),
        status: string_to_declaration_status(&row.get::<String,_>("status")),
        created_at: NaiveDateTime::parse_from_str(&row.get::<String,_>("created_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
        updated_at: NaiveDateTime::parse_from_str(&row.get::<String,_>("updated_at"), "%Y-%m-%d %H:%M:%S").unwrap(),
    }
}

#[async_trait::async_trait]
impl DeclarationRepo for SqliteDeclarationRepo {
    async fn create_declaration(&self, declaration: Declaration) -> DomainResult<()> {
        let payment_date = declaration.payment_date.map(|d| d.format("%Y-%m-%d").to_string());

        sqlx::query(r#"
            INSERT INTO declarations (
                id, declaration_type, period_year, period_month, amount_due_cents,
                due_date, payment_date, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        "#)
            .bind(declaration.id.to_string())
            .bind(declaration_type_to_string(&declaration.declaration_type))
            .bind(declaration.period_year)
            .bind(declaration.period_month as i64)
            .bind(declaration.amount_due_cents)
            .bind(declaration.due_date.format("%Y-%m-%d").to_string())
            .bind(payment_date)
            .bind(declaration_status_to_string(&declaration.status))
            .bind(declaration.created_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(declaration.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn get_declaration(&self, id: uuid::Uuid) -> DomainResult<Declaration> {
        let row = sqlx::query(r#"
            SELECT id, declaration_type, period_year, period_month, amount_due_cents,
                   due_date, payment_date, status, created_at, updated_at
            FROM declarations WHERE id = ?
        "#)
            .bind(id.to_string())
            .fetch_one(&self.pool).await.map_err(|e| match e {
                sqlx::Error::RowNotFound => DomainError::NotFound,
                _ => DomainError::Repo(e.to_string())
            })?;
        Ok(row_to_declaration(&row))
    }

    async fn update_declaration(&self, declaration: Declaration) -> DomainResult<()> {
        let payment_date = declaration.payment_date.map(|d| d.format("%Y-%m-%d").to_string());

        sqlx::query(r#"
            UPDATE declarations SET 
                declaration_type = ?, period_year = ?, period_month = ?, amount_due_cents = ?,
                due_date = ?, payment_date = ?, status = ?, updated_at = ?
            WHERE id = ?
        "#)
            .bind(declaration_type_to_string(&declaration.declaration_type))
            .bind(declaration.period_year)
            .bind(declaration.period_month as i64)
            .bind(declaration.amount_due_cents)
            .bind(declaration.due_date.format("%Y-%m-%d").to_string())
            .bind(payment_date)
            .bind(declaration_status_to_string(&declaration.status))
            .bind(declaration.updated_at.format("%Y-%m-%d %H:%M:%S").to_string())
            .bind(declaration.id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn delete_declaration(&self, id: uuid::Uuid) -> DomainResult<()> {
        sqlx::query(r#"DELETE FROM declarations WHERE id = ?"#)
            .bind(id.to_string())
            .execute(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        Ok(())
    }

    async fn list_declarations(&self, year: Option<i32>) -> DomainResult<Vec<Declaration>> {
        let rows = if let Some(y) = year {
            sqlx::query(r#"
                SELECT id, declaration_type, period_year, period_month, amount_due_cents,
                       due_date, payment_date, status, created_at, updated_at
                FROM declarations 
                WHERE period_year = ? 
                ORDER BY period_year DESC, period_month DESC
            "#)
                .bind(y)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?
        } else {
            sqlx::query(r#"
                SELECT id, declaration_type, period_year, period_month, amount_due_cents,
                       due_date, payment_date, status, created_at, updated_at
                FROM declarations 
                ORDER BY period_year DESC, period_month DESC
            "#)
                .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?
        };
        
        Ok(rows.into_iter().map(|r| row_to_declaration(&r)).collect())
    }

    async fn get_declaration_by_period(&self, declaration_type: DeclarationType, year: i32, month: u32) -> DomainResult<Option<Declaration>> {
        let row = sqlx::query(r#"
            SELECT id, declaration_type, period_year, period_month, amount_due_cents,
                   due_date, payment_date, status, created_at, updated_at
            FROM declarations 
            WHERE declaration_type = ? AND period_year = ? AND period_month = ?
        "#)
            .bind(declaration_type_to_string(&declaration_type))
            .bind(year)
            .bind(month as i64)
            .fetch_optional(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        Ok(row.map(|r| row_to_declaration(&r)))
    }

    async fn list_declarations_by_status(&self, status: DeclarationStatus) -> DomainResult<Vec<Declaration>> {
        let rows = sqlx::query(r#"
            SELECT id, declaration_type, period_year, period_month, amount_due_cents,
                   due_date, payment_date, status, created_at, updated_at
            FROM declarations 
            WHERE status = ?
            ORDER BY due_date ASC
        "#)
            .bind(declaration_status_to_string(&status))
            .fetch_all(&self.pool).await.map_err(|e| DomainError::Repo(e.to_string()))?;
        
        Ok(rows.into_iter().map(|r| row_to_declaration(&r)).collect())
    }
}
