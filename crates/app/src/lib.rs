use domain::*;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use infra::MinioService;
use chrono::Datelike;

#[derive(Clone)]
pub struct AppDeps {
    pub invoices: Arc<dyn InvoiceRepo>,
    pub expenses: Arc<dyn ExpenseRepo>,
    pub provisions: Arc<dyn ProvisionRepo>,
    pub config: Arc<dyn ConfigRepo>,
    pub months: Arc<dyn MonthRepo>,
    // New dependencies
    pub operations: Arc<dyn OperationRepo>,
    pub declarations: Arc<dyn DeclarationRepo>,
    pub working_days: Arc<dyn WorkingDayRepo>,
    pub tax_schedules: Arc<dyn TaxScheduleRepo>,
    pub simulations: Arc<dyn SimulationRepo>,
    pub kpis: Arc<dyn KPIRepo>,
    pub yearly_planning: Arc<dyn YearlyPlanningRepo>,
    // External services
    pub minio_service: Arc<MinioService>,
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

    // ============ Operation Use Cases ============

    pub async fn create_operation(&self, operation: Operation) -> DomainResult<()> {
        self.deps.operations.create_operation(operation).await
    }
    
    pub async fn create_operation_from_dto(&self, dto: CreateOperationDto) -> DomainResult<()> {
        let settings = self.deps.config.load_settings().await?;
        let operation = dto.into_entity(settings.default_vat_rate_ppm)
            .map_err(|e| DomainError::Validation(e))?;
        self.create_operation(operation).await
    }

    pub async fn get_operation(&self, id: uuid::Uuid) -> DomainResult<Operation> {
        self.deps.operations.get_operation(id).await
    }

    pub async fn update_operation(&self, mut operation: Operation) -> DomainResult<()> {
        // Auto-calculate TTC from HT + TVA
        if operation.amount_ttc_cents == 0 {
            operation.amount_ttc_cents = operation.amount_ht_cents + operation.vat_amount_cents;
        }
        
        // Set updated_at
        operation.updated_at = chrono::Utc::now().naive_utc();
        
        self.deps.operations.update_operation(operation).await
    }

    pub async fn delete_operation(&self, id: uuid::Uuid) -> DomainResult<()> {
        self.deps.operations.delete_operation(id).await
    }

    pub async fn list_operations(&self, month: Option<MonthId>) -> DomainResult<Vec<Operation>> {
        self.deps.operations.list_operations(month).await
    }


    pub async fn list_operations_by_type(&self, operation_type: OperationType, month: Option<MonthId>) -> DomainResult<Vec<Operation>> {
        self.deps.operations.list_operations_by_type(operation_type, month).await
    }

    pub async fn list_operations_by_payment_month(&self, month: MonthId) -> DomainResult<Vec<Operation>> {
        self.deps.operations.list_operations_by_payment_month(month).await
    }

    // ============ Operation-based Business Logic ============

    pub async fn get_dashboard_v2(&self, month: MonthId) -> DomainResult<DashboardSummary> {
        let (operations, provisions, settings) = tokio::try_join!(
            self.deps.operations.list_operations(None),
            self.deps.provisions.list_provisions(None),
            self.deps.config.load_settings(),
        ).map_err(|e| DomainError::Repo(format!("{e}")))?;
        Ok(compute_dashboard_v2(&month, &operations, &provisions, &settings))
    }

    pub async fn prepare_vat_v2(&self, month: MonthId) -> DomainResult<VatReport> {
        let operations = self.deps.operations.list_operations(None).await?;
        Ok(compute_vat_for_month_v2(&month, &operations))
    }

    pub async fn prepare_urssaf_v2(&self, month: MonthId) -> DomainResult<UrssafReport> {
        let settings = self.deps.config.load_settings().await?;
        let operations = self.deps.operations.list_operations(None).await?;
        Ok(compute_urssaf_for_month_v2(&month, &operations, settings.urssaf_rate_ppm))
    }

    pub async fn month_recap_v2(&self, month: MonthId) -> DomainResult<MonthRecap> {
        let settings = self.deps.config.load_settings().await?;
        let operations = self.deps.operations.list_operations(None).await?;
        Ok(compute_month_recap_v2(&month, &operations, &settings))
    }

    /// Get annual tax declaration data for French BNC freelancers
    pub async fn get_annual_tax_data(&self, year: i32) -> DomainResult<AnnualTaxData> {
        // Fetch all operations for the year
        let operations = self.deps.operations.list_operations(None).await?;
        
        // Filter for the requested year based on payment dates (encaissements)
        let year_operations: Vec<_> = operations
            .into_iter()
            .filter(|op| {
                if let Some(payment_date) = op.payment_date {
                    payment_date.year() == year
                } else {
                    // For unpaid operations, use invoice date as fallback
                    op.invoice_date.year() == year
                }
            })
            .collect();

        // Calculate totals for sales (revenues)
        let sales: Vec<_> = year_operations
            .iter()
            .filter(|op| matches!(op.operation_type, OperationType::Sale))
            .collect();

        let total_revenue_ht_cents: i64 = sales.iter().map(|op| op.amount_ht_cents).sum();
        let total_revenue_ttc_cents: i64 = sales.iter().map(|op| op.amount_ttc_cents).sum();
        let total_vat_collected_cents: i64 = sales.iter().map(|op| op.vat_amount_cents).sum();

        // Calculate totals for purchases (expenses)
        let purchases: Vec<_> = year_operations
            .iter()
            .filter(|op| matches!(op.operation_type, OperationType::Purchase))
            .collect();

        let total_expenses_cents: i64 = purchases.iter().map(|op| op.amount_ttc_cents).sum();
        let total_vat_deductible_cents: i64 = purchases.iter().map(|op| op.vat_amount_cents).sum();

        // Calculate net VAT due
        let net_vat_due_cents = total_vat_collected_cents - total_vat_deductible_cents;

        // Format currency amounts for tax form cases (in euros as strings)
        let case_5hq = format!("{:.2}", total_revenue_ht_cents as f64 / 100.0);
        let case_5hh = format!("{:.2}", total_expenses_cents as f64 / 100.0);
        let case_5iu = format!("{:.2}", (total_revenue_ht_cents - total_expenses_cents) as f64 / 100.0);

        // Create monthly breakdowns
        let mut monthly_breakdown = Vec::new();
        let mut months_worked = 0;
        for month in 1..=12 {
            let month_operations: Vec<_> = year_operations
                .iter()
                .filter(|op| {
                    if let Some(payment_date) = op.payment_date {
                        payment_date.month() == month as u32
                    } else {
                        op.invoice_date.month() == month as u32
                    }
                })
                .collect();

            let month_sales: Vec<_> = month_operations
                .iter()
                .filter(|op| matches!(op.operation_type, OperationType::Sale))
                .collect();

            let month_purchases: Vec<_> = month_operations
                .iter()
                .filter(|op| matches!(op.operation_type, OperationType::Purchase))
                .collect();

            let revenue_ht_cents: i64 = month_sales.iter().map(|op| op.amount_ht_cents).sum();
            let expenses_cents: i64 = month_purchases.iter().map(|op| op.amount_ttc_cents).sum();
            let vat_due_cents: i64 = month_sales.iter().map(|op| op.vat_amount_cents).sum::<i64>() -
                                     month_purchases.iter().map(|op| op.vat_amount_cents).sum::<i64>();

            // Count as working month if there's any revenue
            if revenue_ht_cents > 0 {
                months_worked += 1;
            }

            monthly_breakdown.push(MonthlyTaxBreakdown {
                month_id: MonthId { year, month: month as u32 },
                revenue_ht_cents,
                expenses_cents,
                vat_due_cents,
                urssaf_due_cents: 0, // Would need URSSAF calculation logic
            });
        }

        // Calculate average monthly revenue
        let average_monthly_revenue = if months_worked > 0 {
            total_revenue_ht_cents / months_worked as i64
        } else {
            0
        };

        Ok(AnnualTaxData {
            year,
            total_revenue_ht_cents,
            total_revenue_ttc_cents,
            total_expenses_cents,
            total_vat_collected_cents,
            total_vat_deductible_cents,
            net_vat_due_cents,
            total_urssaf_paid_cents: 0, // Would need URSSAF calculation
            case_5hq,
            case_5hh,
            case_5iu,
            months_worked,
            average_monthly_revenue,
            monthly_breakdown,
        })
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
    
    // ============ New Service Methods ============

    // Working Days Management
    pub async fn create_working_day(&self, working_day: WorkingDay) -> DomainResult<()> {
        self.deps.working_days.create_working_day(working_day).await
    }

    pub async fn update_working_day(&self, working_day: WorkingDay) -> DomainResult<()> {
        self.deps.working_days.update_working_day(working_day).await
    }

    pub async fn delete_working_day(&self, id: uuid::Uuid) -> DomainResult<()> {
        self.deps.working_days.delete_working_day(id).await
    }

    pub async fn get_working_day(&self, id: uuid::Uuid) -> DomainResult<WorkingDay> {
        self.deps.working_days.get_working_day(id).await
    }

    pub async fn list_working_days(&self, start_date: Option<chrono::NaiveDate>, end_date: Option<chrono::NaiveDate>) -> DomainResult<Vec<WorkingDay>> {
        self.deps.working_days.list_working_days(start_date, end_date).await
    }

    pub async fn get_working_days_for_month(&self, month: &MonthId) -> DomainResult<Vec<WorkingDay>> {
        self.deps.working_days.get_working_days_for_month(month).await
    }

    pub async fn get_working_days_stats(&self, start_date: chrono::NaiveDate, end_date: chrono::NaiveDate) -> DomainResult<WorkingDaysStats> {
        self.deps.working_days.get_working_days_stats(start_date, end_date).await
    }

    // Tax Schedule Management
    pub async fn create_tax_schedule(&self, tax_schedule: TaxSchedule) -> DomainResult<()> {
        self.deps.tax_schedules.create_tax_schedule(tax_schedule).await
    }

    pub async fn update_tax_schedule(&self, tax_schedule: TaxSchedule) -> DomainResult<()> {
        self.deps.tax_schedules.update_tax_schedule(tax_schedule).await
    }

    pub async fn list_tax_schedules(&self, start_date: Option<chrono::NaiveDate>, end_date: Option<chrono::NaiveDate>) -> DomainResult<Vec<TaxSchedule>> {
        self.deps.tax_schedules.list_tax_schedules(start_date, end_date).await
    }

    pub async fn get_overdue_schedules(&self, as_of_date: chrono::NaiveDate) -> DomainResult<Vec<TaxSchedule>> {
        self.deps.tax_schedules.get_overdue_schedules(as_of_date).await
    }

    pub async fn mark_tax_schedule_as_paid(&self, id: uuid::Uuid, paid_date: chrono::NaiveDate) -> DomainResult<()> {
        self.deps.tax_schedules.mark_as_paid(id, paid_date).await
    }

    // Simulation Management
    pub async fn create_simulation(&self, simulation: Simulation) -> DomainResult<()> {
        self.deps.simulations.create_simulation(simulation).await
    }

    pub async fn update_simulation(&self, simulation: Simulation) -> DomainResult<()> {
        self.deps.simulations.update_simulation(simulation).await
    }

    pub async fn get_simulation(&self, id: uuid::Uuid) -> DomainResult<Simulation> {
        self.deps.simulations.get_simulation(id).await
    }

    pub async fn list_simulations(&self) -> DomainResult<Vec<Simulation>> {
        self.deps.simulations.list_simulations().await
    }

    pub async fn delete_simulation(&self, id: uuid::Uuid) -> DomainResult<()> {
        self.deps.simulations.delete_simulation(id).await
    }

    // KPI Management
    pub async fn save_monthly_kpi(&self, kpi: MonthlyKPI) -> DomainResult<()> {
        self.deps.kpis.save_monthly_kpi(kpi).await
    }

    pub async fn get_monthly_kpi(&self, month: &MonthId) -> DomainResult<Option<MonthlyKPI>> {
        self.deps.kpis.get_monthly_kpi(month).await
    }

    pub async fn list_monthly_kpis(&self, start_month: &MonthId, end_month: &MonthId) -> DomainResult<Vec<MonthlyKPI>> {
        self.deps.kpis.list_monthly_kpis(start_month, end_month).await
    }

    pub async fn delete_monthly_kpi(&self, month: &MonthId) -> DomainResult<()> {
        self.deps.kpis.delete_monthly_kpi(month).await
    }

    // Advanced Business Logic Services
    
    /// Calculate optimal daily rate for target income
    pub async fn calculate_optimal_daily_rate(
        &self,
        target_annual_income_cents: i64,
        working_days_per_year: f64,
        annual_expenses_cents: i64,
    ) -> DomainResult<DailyRateCalculation> {
        let settings = self.deps.config.load_settings().await?;
        Ok(calculate_optimal_daily_rate(
            target_annual_income_cents,
            working_days_per_year,
            annual_expenses_cents,
            settings.default_vat_rate_ppm,
            settings.urssaf_rate_ppm,
            0, // Income tax rate - could be configurable
        ))
    }

    /// Project annual income based on current data
    pub async fn project_annual_income(
        &self,
        monthly_avg_revenue_cents: i64,
        working_months: u32,
        annual_expenses_cents: i64,
    ) -> DomainResult<AnnualIncomeProjection> {
        let settings = self.deps.config.load_settings().await?;
        Ok(project_annual_income(
            monthly_avg_revenue_cents,
            working_months,
            annual_expenses_cents,
            settings.default_vat_rate_ppm,
            settings.urssaf_rate_ppm,
        ))
    }

    /// Generate tax payment schedule
    pub async fn compute_tax_schedule(
        &self,
        current_month: &MonthId,
        horizon_months: u32,
    ) -> DomainResult<Vec<TaxSchedule>> {
        let settings = self.deps.config.load_settings().await?;
        
        // Generate VAT and URSSAF reports for the horizon
        let mut vat_reports = Vec::new();
        let mut urssaf_reports = Vec::new();
        
        for i in 0..horizon_months {
            let mut month = current_month.clone();
            month.month += i;
            if month.month > 12 {
                month.year += ((month.month - 1) / 12) as i32;
                month.month = ((month.month - 1) % 12) + 1;
            }
            
            let invoices = self.deps.invoices.list_invoices(Some(month.clone())).await?;
            let expenses = self.deps.expenses.list_expenses(Some(month.clone())).await?;
            
            let vat = compute_vat_for_month(&month, &invoices, &expenses);
            let urssaf = compute_urssaf_for_month(&month, &invoices, settings.urssaf_rate_ppm);
            
            vat_reports.push(vat);
            urssaf_reports.push(urssaf);
        }
        
        Ok(compute_tax_schedule(current_month, horizon_months, &vat_reports, &urssaf_reports, &settings))
    }

    /// Optimize provisions based on cash flow
    pub async fn optimize_provisions(
        &self,
        available_cash_cents: i64,
        optimization_horizon_days: u32,
    ) -> DomainResult<ProvisionOptimization> {
        let settings = self.deps.config.load_settings().await?;
        let today = chrono::Local::now().naive_local().date();
        let end_date = today + chrono::Duration::days(optimization_horizon_days as i64);
        
        let upcoming_schedules = self.deps.tax_schedules.list_tax_schedules(Some(today), Some(end_date)).await?;
        
        Ok(optimize_provisions(
            available_cash_cents,
            &upcoming_schedules,
            settings.buffer_cents,
            optimization_horizon_days,
        ))
    }

    /// Analyze working patterns and productivity
    pub async fn analyze_working_patterns(
        &self,
        start_date: chrono::NaiveDate,
        end_date: chrono::NaiveDate,
    ) -> DomainResult<WorkingPatternAnalysis> {
        let working_days = self.deps.working_days.list_working_days(Some(start_date), Some(end_date)).await?;
        Ok(analyze_working_patterns(&working_days))
    }

    /// Compute and save monthly KPIs
    pub async fn compute_and_save_monthly_kpis(&self, month: &MonthId) -> DomainResult<MonthlyKPI> {
        let settings = self.deps.config.load_settings().await?;
        let (invoices, expenses, working_days) = tokio::try_join!(
            self.deps.invoices.list_invoices(None),
            self.deps.expenses.list_expenses(None),
            self.deps.working_days.get_working_days_for_month(month),
        ).map_err(|e| DomainError::Repo(format!("{e}")))?;

        let kpi = compute_monthly_kpis(month, &invoices, &expenses, &working_days, &settings);
        self.deps.kpis.save_monthly_kpi(kpi.clone()).await?;
        Ok(kpi)
    }

    /// Enhanced dashboard with KPIs and working days data
    pub async fn get_enhanced_dashboard(&self, month: MonthId) -> DomainResult<EnhancedDashboardData> {
        let (basic_dashboard, kpi, working_days) = tokio::try_join!(
            self.get_dashboard(month.clone()),
            self.deps.kpis.get_monthly_kpi(&month),
            self.deps.working_days.get_working_days_for_month(&month),
        ).map_err(|e| DomainError::Repo(format!("{e}")))?;

        let working_pattern = if !working_days.is_empty() {
            Some(analyze_working_patterns(&working_days))
        } else {
            None
        };

        Ok(EnhancedDashboardData {
            basic_summary: basic_dashboard,
            monthly_kpi: kpi,
            working_pattern,
            working_days_count: working_days.len() as f64,
        })
    }

    /// Run simulation and save results
    pub async fn run_simulation(&self, simulation_id: uuid::Uuid) -> DomainResult<SimulationResults> {
        let mut simulation = self.deps.simulations.get_simulation(simulation_id).await?;
        
        let results = match simulation.scenario_type {
            SimulationScenario::DailyRateOptimization => {
                let params = &simulation.parameters;
                if let (Some(target_income), Some(working_days), Some(expenses)) = (
                    params.target_annual_income_cents,
                    params.working_days_per_month.map(|d| d * 12.0),
                    params.annual_variable_costs_cents,
                ) {
                    let calc = self.calculate_optimal_daily_rate(target_income, working_days, expenses).await?;
                    SimulationResults {
                        optimal_daily_rate_cents: Some(calc.optimal_daily_rate_cents),
                        optimal_hourly_rate_cents: params.working_hours_per_day.map(|h| {
                            if h > 0.0 { (calc.optimal_daily_rate_cents as f64 / h) as i64 } else { 0 }
                        }),
                        projected_annual_income_ht_cents: Some(calc.total_revenue_ht_needed_cents),
                        projected_annual_taxes_cents: Some(calc.total_taxes_cents),
                        projected_net_income_cents: Some(target_income),
                        working_days_needed: Some(working_days),
                        monthly_breakdowns: vec![], // Could be implemented
                    }
                } else {
                    return Err(DomainError::Validation("Paramètres manquants pour l'optimisation du TJM".into()));
                }
            },
            SimulationScenario::AnnualIncomeProjection => {
                let params = &simulation.parameters;
                if let (Some(monthly_revenue), Some(working_months), Some(expenses)) = (
                    params.current_hourly_rate_cents.and_then(|hr| 
                        params.working_hours_per_day.and_then(|hd|
                            params.working_days_per_month.map(|dm| (hr as f64 * hd * dm) as i64)
                        )
                    ),
                    params.simulation_horizon_months,
                    params.annual_variable_costs_cents,
                ) {
                    let projection = self.project_annual_income(monthly_revenue, working_months, expenses).await?;
                    SimulationResults {
                        optimal_daily_rate_cents: None,
                        optimal_hourly_rate_cents: None,
                        projected_annual_income_ht_cents: Some(projection.total_revenue_ht_cents),
                        projected_annual_taxes_cents: Some(projection.total_taxes_cents),
                        projected_net_income_cents: Some(projection.net_income_cents),
                        working_days_needed: None,
                        monthly_breakdowns: vec![], // Could be implemented
                    }
                } else {
                    return Err(DomainError::Validation("Paramètres manquants pour la projection annuelle".into()));
                }
            },
            _ => {
                return Err(DomainError::Validation("Type de simulation non encore implémenté".into()));
            }
        };

        simulation.results = Some(results.clone());
        simulation.updated_at = chrono::Utc::now().naive_utc();
        self.deps.simulations.update_simulation(simulation).await?;
        
        Ok(results)
    }

    // ============ File Upload Use Cases ============

    pub async fn upload_justificatif(&self, file_content: bytes::Bytes, original_filename: &str, content_type: Option<String>) -> DomainResult<String> {
        self.deps.minio_service.upload_file(file_content, original_filename, content_type).await
    }

    pub async fn delete_justificatif(&self, file_url: &str) -> DomainResult<()> {
        self.deps.minio_service.delete_file(file_url).await
    }

    pub async fn list_justificatifs_by_month(&self, year: i32, month: u32) -> DomainResult<Vec<infra::FileInfo>> {
        self.deps.minio_service.list_files_by_month(year, month).await
    }

    pub async fn get_storage_stats(&self) -> DomainResult<infra::StorageStats> {
        self.deps.minio_service.get_storage_stats().await
    }
}

// ============ New DTOs ============

#[derive(Debug, Serialize, Deserialize)]
pub struct EnhancedDashboardData {
    pub basic_summary: DashboardSummary,
    pub monthly_kpi: Option<MonthlyKPI>,
    pub working_pattern: Option<WorkingPatternAnalysis>,
    pub working_days_count: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateWorkingDayDto {
    pub date: String, // ISO date
    pub hours_worked: f64,
    pub billable_hours: f64,
    pub hourly_rate_cents: i64,
    pub description: Option<String>,
}

impl CreateWorkingDayDto {
    pub fn into_entity(self) -> Result<WorkingDay, String> {
        let date = chrono::NaiveDate::parse_from_str(&self.date, "%Y-%m-%d")
            .map_err(|e| e.to_string())?;
        
        let now = chrono::Utc::now().naive_utc();
        
        Ok(WorkingDay {
            id: uuid::Uuid::new_v4(),
            date,
            hours_worked: self.hours_worked,
            billable_hours: self.billable_hours,
            hourly_rate_cents: self.hourly_rate_cents,
            description: self.description,
            created_at: now,
            updated_at: now,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSimulationDto {
    pub name: String,
    pub scenario_type: String, // "DailyRateOptimization", "AnnualIncomeProjection", etc.
    pub parameters: SimulationParameters,
}

impl CreateSimulationDto {
    pub fn into_entity(self) -> Result<Simulation, String> {
        let scenario_type = match self.scenario_type.as_str() {
            "DailyRateOptimization" => SimulationScenario::DailyRateOptimization,
            "AnnualIncomeProjection" => SimulationScenario::AnnualIncomeProjection,
            "TaxOptimization" => SimulationScenario::TaxOptimization,
            "WorkingDaysImpact" => SimulationScenario::WorkingDaysImpact,
            _ => return Err("Type de scénario invalide".into()),
        };
        
        let now = chrono::Utc::now().naive_utc();
        
        Ok(Simulation {
            id: uuid::Uuid::new_v4(),
            name: self.name,
            scenario_type,
            parameters: self.parameters,
            results: None,
            created_at: now,
            updated_at: now,
        })
    }
}

// ============ Operation DTOs ============

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateOperationDto {
    pub invoice_date: String,               // "YYYY-MM-DD" Invoice date
    pub payment_date: Option<String>,       // "YYYY-MM-DD" Unified payment/encaissement date
    pub operation_type: String,             // "sale" or "purchase"
    pub amount_ht_cents: i64,               // HT amount in cents
    pub vat_amount_cents: Option<i64>,      // VAT amount direct (calculated if not provided)
    pub vat_on_payments: bool,              // true by default
    pub label: Option<String>,              // Description
    pub receipt_url: Option<String>,        // MinIO receipt URL
}

impl CreateOperationDto {
    pub fn into_entity(self, default_vat_rate_ppm: i32) -> Result<Operation, String> {
        let invoice_date = chrono::NaiveDate::parse_from_str(&self.invoice_date, "%Y-%m-%d")
            .map_err(|e| format!("Invoice date invalid: {}", e))?;
        
        let operation_type = match self.operation_type.as_str() {
            "purchase" => OperationType::Purchase,
            "sale" => OperationType::Sale,
            _ => return Err("Operation type invalid: must be 'sale' or 'purchase'".into()),
        };

        let payment_date = if let Some(date_str) = self.payment_date {
            Some(chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
                .map_err(|e| format!("Payment date invalid: {}", e))?)
        } else {
            None
        };

        // Automatic VAT calculation if not provided
        let vat_amount_cents = if let Some(vat) = self.vat_amount_cents {
            vat
        } else {
            // Use default rate
            ((self.amount_ht_cents as i128) * (default_vat_rate_ppm as i128) / 1_000_000i128) as i64
        };

        let amount_ttc_cents = self.amount_ht_cents + vat_amount_cents;

        let now = chrono::Utc::now().naive_utc();

        Ok(Operation {
            id: uuid::Uuid::new_v4(),
            invoice_date,
            payment_date,
            operation_type,
            amount_ht_cents: self.amount_ht_cents,
            vat_amount_cents,
            amount_ttc_cents,
            vat_on_payments: self.vat_on_payments,
            label: self.label,
            receipt_url: self.receipt_url,
            created_at: now,
            updated_at: now,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateOperationDto {
    pub id: String,
    pub invoice_date: String,
    pub label: Option<String>,
    pub amount_ht_cents: i64,
    pub vat_amount_cents: i64,
    pub operation_type: String,
    pub vat_on_payments: bool,
    pub payment_date: Option<String>,
    pub receipt_url: Option<String>,
}

impl UpdateOperationDto {
    pub fn into_entity(self, existing_operation: Operation) -> Result<Operation, String> {
        let id = uuid::Uuid::parse_str(&self.id)
            .map_err(|e| format!("ID invalid: {}", e))?;

        let invoice_date = chrono::NaiveDate::parse_from_str(&self.invoice_date, "%Y-%m-%d")
            .map_err(|e| format!("Invoice date invalid: {}", e))?;
        
        let operation_type = match self.operation_type.as_str() {
            "purchase" => OperationType::Purchase,
            "sale" => OperationType::Sale,
            _ => return Err("Operation type invalid: must be 'sale' or 'purchase'".into()),
        };

        let payment_date = if let Some(date_str) = self.payment_date {
            Some(chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
                .map_err(|e| format!("Payment date invalid: {}", e))?)
        } else {
            None
        };

        let amount_ttc_cents = self.amount_ht_cents + self.vat_amount_cents;

        Ok(Operation {
            id,
            invoice_date,
            payment_date,
            operation_type,
            amount_ht_cents: self.amount_ht_cents,
            vat_amount_cents: self.vat_amount_cents,
            amount_ttc_cents,
            vat_on_payments: self.vat_on_payments,
            label: self.label,
            receipt_url: self.receipt_url,
            created_at: existing_operation.created_at, // Preserve creation date
            updated_at: chrono::Utc::now().naive_utc(),
        })
    }
}

// ============ Yearly Planning DTOs and Services ============

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateYearlyPlanningDto {
    pub year: i32,
    pub tjm_cents: i64,
    pub max_working_days_limit: i32,
    pub months: Vec<CreateMonthPlanningDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateMonthPlanningDto {
    pub month: u32,
    pub max_working_days: i32,
    pub holidays_taken: i32,
    pub public_holidays: i32,
    pub working_days: i32,
    pub estimated_revenue_cents: i64,
}

impl CreateYearlyPlanningDto {
    pub fn to_domain(&self) -> YearlyPlanning {
        let now = chrono::Utc::now().naive_utc();
        
        let months: Vec<MonthPlanning> = self.months.iter().map(|month_dto| MonthPlanning {
            id: uuid::Uuid::new_v4(),
            year: self.year,
            month: month_dto.month,
            max_working_days: month_dto.max_working_days,
            holidays_taken: month_dto.holidays_taken,
            public_holidays: month_dto.public_holidays,
            working_days: month_dto.working_days,
            estimated_revenue_cents: month_dto.estimated_revenue_cents,
            created_at: now,
            updated_at: now,
        }).collect();

        YearlyPlanning {
            id: uuid::Uuid::new_v4(),
            year: self.year,
            tjm_cents: self.tjm_cents,
            max_working_days_limit: self.max_working_days_limit,
            months,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateYearlyPlanningDto {
    pub year: i32,
    pub tjm_cents: i64,
    pub max_working_days_limit: i32,
    pub months: Vec<UpdateMonthPlanningDto>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateMonthPlanningDto {
    pub id: String,
    pub month: u32,
    pub max_working_days: i32,
    pub holidays_taken: i32,
    pub public_holidays: i32,
    pub working_days: i32,
    pub estimated_revenue_cents: i64,
}

impl UpdateYearlyPlanningDto {
    pub fn to_domain(&self, existing_planning: &YearlyPlanning) -> YearlyPlanning {
        let now = chrono::Utc::now().naive_utc();
        
        let months: Vec<MonthPlanning> = self.months.iter().map(|month_dto| {
            let existing_month = existing_planning.months.iter()
                .find(|m| m.month == month_dto.month);
            
            MonthPlanning {
                id: if let Ok(id) = uuid::Uuid::parse_str(&month_dto.id) {
                    id
                } else {
                    existing_month.map(|m| m.id).unwrap_or_else(|| uuid::Uuid::new_v4())
                },
                year: self.year,
                month: month_dto.month,
                max_working_days: month_dto.max_working_days,
                holidays_taken: month_dto.holidays_taken,
                public_holidays: month_dto.public_holidays,
                working_days: month_dto.working_days,
                estimated_revenue_cents: month_dto.estimated_revenue_cents,
                created_at: existing_month.map(|m| m.created_at).unwrap_or(now),
                updated_at: now,
            }
        }).collect();

        YearlyPlanning {
            id: existing_planning.id,
            year: self.year,
            tjm_cents: self.tjm_cents,
            max_working_days_limit: self.max_working_days_limit,
            months,
            created_at: existing_planning.created_at,
            updated_at: now,
        }
    }
}

impl AppService {
    // Yearly Planning Services
    pub async fn create_yearly_planning(&self, dto: CreateYearlyPlanningDto) -> DomainResult<()> {
        let planning = dto.to_domain();
        self.deps.yearly_planning.create_yearly_planning(planning).await
    }

    pub async fn update_yearly_planning(&self, dto: UpdateYearlyPlanningDto) -> DomainResult<()> {
        // Get existing planning to preserve creation dates and IDs
        let existing_planning = self.deps.yearly_planning.get_yearly_planning(dto.year).await?
            .ok_or_else(|| DomainError::NotFound)?;
        
        let updated_planning = dto.to_domain(&existing_planning);
        self.deps.yearly_planning.update_yearly_planning(updated_planning).await
    }

    pub async fn get_yearly_planning(&self, year: i32) -> DomainResult<Option<YearlyPlanning>> {
        self.deps.yearly_planning.get_yearly_planning(year).await
    }

    pub async fn delete_yearly_planning(&self, year: i32) -> DomainResult<()> {
        self.deps.yearly_planning.delete_yearly_planning(year).await
    }

    pub async fn list_yearly_plannings(&self) -> DomainResult<Vec<YearlyPlanning>> {
        self.deps.yearly_planning.list_yearly_plannings().await
    }

    pub async fn update_month_planning(&self, year: i32, month: u32, dto: UpdateMonthPlanningDto) -> DomainResult<()> {
        let existing_month = self.deps.yearly_planning.get_month_planning(year, month).await?
            .ok_or_else(|| DomainError::NotFound)?;
        
        let updated_month = MonthPlanning {
            id: existing_month.id,
            year,
            month,
            max_working_days: dto.max_working_days,
            holidays_taken: dto.holidays_taken,
            public_holidays: dto.public_holidays,
            working_days: dto.working_days,
            estimated_revenue_cents: dto.estimated_revenue_cents,
            created_at: existing_month.created_at,
            updated_at: chrono::Utc::now().naive_utc(),
        };
        
        self.deps.yearly_planning.update_month_planning(updated_month).await
    }
}
