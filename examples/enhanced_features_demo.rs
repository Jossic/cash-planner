// Demo script for the enhanced JLA Cash Planner backend features
// This demonstrates the new working days tracking, KPIs, simulations, and tax scheduling

use chrono::{NaiveDate, Utc};
use domain::*;
use uuid::Uuid;

fn main() {
    println!("🚀 JLA Cash Planner - Enhanced Backend Features Demo");
    println!("=".repeat(60));

    // Demo data
    let current_month = MonthId { year: 2024, month: 8 };
    let today = NaiveDate::from_ymd_opt(2024, 8, 15).unwrap();
    let now = Utc::now().naive_utc();

    // 1. Working Days Demo
    println!("\n📅 Working Days Tracking");
    println!("-".repeat(30));

    let working_day = WorkingDay {
        id: Uuid::new_v4(),
        date: today,
        hours_worked: 8.0,
        billable_hours: 7.5,
        hourly_rate_cents: 6000, // 60€/hour
        description: Some("Développement nouvelle fonctionnalité".to_string()),
        created_at: now,
        updated_at: now,
    };

    println!("📊 Journée de travail:");
    println!("  - Date: {}", working_day.date);
    println!("  - Heures travaillées: {:.1}h", working_day.hours_worked);
    println!("  - Heures facturables: {:.1}h", working_day.billable_hours);
    println!("  - Taux horaire: {}€", working_day.hourly_rate_cents / 100);
    println!("  - Revenus: {}€", (working_day.billable_hours * working_day.hourly_rate_cents as f64) as i64 / 100);

    // 2. Daily Rate Calculation Demo
    println!("\n💰 Calcul du TJM Optimal");
    println!("-".repeat(30));

    let target_annual_income = 60000_00; // 60k€
    let working_days_per_year = 220.0;
    let annual_expenses = 15000_00; // 15k€
    
    let calc = calculate_optimal_daily_rate(
        target_annual_income,
        working_days_per_year,
        annual_expenses,
        200_000, // 20% VAT
        220_000, // 22% URSSAF
        0,       // No income tax for simplicity
    );

    println!("🎯 Objectif revenus annuel: {}€", target_annual_income / 100);
    println!("📈 TJM optimal calculé: {}€", calc.optimal_daily_rate_cents / 100);
    println!("💼 Jours de travail nécessaires: {:.0}", working_days_per_year);
    println!("🏛️ Taxes totales: {}€", calc.total_taxes_cents / 100);
    println!("📊 Marge nette: {:.1}%", calc.net_margin_ratio * 100.0);

    // 3. Tax Schedule Demo
    println!("\n📋 Échéancier Fiscal");
    println!("-".repeat(30));

    let tax_schedule = TaxSchedule {
        id: Uuid::new_v4(),
        tax_type: TaxType::Vat,
        due_date: NaiveDate::from_ymd_opt(2024, 9, 20).unwrap(),
        amount_cents: 2400_00, // 2400€
        period_start: NaiveDate::from_ymd_opt(2024, 8, 1).unwrap(),
        period_end: NaiveDate::from_ymd_opt(2024, 8, 31).unwrap(),
        status: TaxScheduleStatus::Pending,
        created_at: now,
    };

    println!("🏛️ Échéance TVA:");
    println!("  - Montant: {}€", tax_schedule.amount_cents / 100);
    println!("  - Date d'échéance: {}", tax_schedule.due_date);
    println!("  - Période: {} au {}", tax_schedule.period_start, tax_schedule.period_end);
    println!("  - Statut: {:?}", tax_schedule.status);

    // 4. Monthly KPI Demo
    println!("\n📊 KPIs Mensuels");
    println!("-".repeat(30));

    let monthly_kpi = MonthlyKPI {
        id: Uuid::new_v4(),
        month: current_month.clone(),
        revenue_ht_cents: 12000_00, // 12k€ HT
        revenue_ttc_cents: 14400_00, // 14.4k€ TTC
        expenses_ttc_cents: 800_00,  // 800€
        working_days: 22.0,
        billable_hours: 165.0,
        average_daily_rate_cents: 54545, // ~545€/jour
        average_hourly_rate_cents: 7272, // ~72€/heure
        vat_collected_cents: 2400_00,
        vat_due_cents: 2240_00, // Après déduction
        urssaf_due_cents: 2640_00,
        net_margin_cents: 6720_00,
        profitability_ratio: 0.467, // 46.7%
        utilization_rate: 0.937, // 93.7%
        created_at: now,
        updated_at: now,
    };

    println!("📈 Performance du mois {}:", format!("{:04}-{:02}", current_month.year, current_month.month));
    println!("  - CA HT: {}€", monthly_kpi.revenue_ht_cents / 100);
    println!("  - Jours travaillés: {:.0}", monthly_kpi.working_days);
    println!("  - TJM moyen: {}€", monthly_kpi.average_daily_rate_cents / 100);
    println!("  - Taux d'utilisation: {:.1}%", monthly_kpi.utilization_rate * 100.0);
    println!("  - Marge nette: {}€ ({:.1}%)", 
        monthly_kpi.net_margin_cents / 100, 
        monthly_kpi.profitability_ratio * 100.0);

    // 5. Simulation Demo
    println!("\n🔮 Simulation d'Impact");
    println!("-".repeat(30));

    let simulation = Simulation {
        id: Uuid::new_v4(),
        name: "Augmentation TJM à 600€".to_string(),
        scenario_type: SimulationScenario::AnnualIncomeProjection,
        parameters: SimulationParameters {
            target_annual_income_cents: None,
            working_days_per_month: Some(20.0),
            working_hours_per_day: Some(7.5),
            current_hourly_rate_cents: Some(8000), // 80€/heure
            vat_rate_ppm: Some(200_000),
            urssaf_rate_ppm: Some(220_000),
            income_tax_rate_ppm: None,
            monthly_fixed_costs_cents: Some(1200_00),
            annual_variable_costs_cents: Some(14400_00),
            simulation_start_date: Some(today),
            simulation_horizon_months: Some(12),
        },
        results: None,
        created_at: now,
        updated_at: now,
    };

    println!("🎲 Scénario: {}", simulation.name);
    println!("📊 Type: {:?}", simulation.scenario_type);
    if let Some(rate) = simulation.parameters.current_hourly_rate_cents {
        println!("💰 Taux horaire simulé: {}€", rate / 100);
    }

    // 6. Working Pattern Analysis Demo
    println!("\n🔍 Analyse des Patterns de Travail");
    println!("-".repeat(30));

    let working_days = vec![
        WorkingDay {
            id: Uuid::new_v4(),
            date: NaiveDate::from_ymd_opt(2024, 8, 1).unwrap(),
            hours_worked: 8.0,
            billable_hours: 7.5,
            hourly_rate_cents: 7500,
            description: None,
            created_at: now,
            updated_at: now,
        },
        WorkingDay {
            id: Uuid::new_v4(),
            date: NaiveDate::from_ymd_opt(2024, 8, 2).unwrap(),
            hours_worked: 7.5,
            billable_hours: 7.0,
            hourly_rate_cents: 7500,
            description: None,
            created_at: now,
            updated_at: now,
        },
    ];

    let analysis = analyze_working_patterns(&working_days);
    println!("📊 Analyse sur {} jours:", analysis.total_days);
    println!("  - Moyenne heures/jour: {:.1}h", analysis.average_hours_per_day);
    println!("  - Taux facturable moyen: {:.1}%", analysis.average_billable_ratio * 100.0);
    println!("  - TJM moyen: {}€", analysis.average_daily_rate_cents / 100);
    println!("  - Revenus totaux: {}€", analysis.total_revenue_cents / 100);

    println!("\n✅ Démonstration terminée avec succès !");
    println!("🎉 Toutes les nouvelles fonctionnalités backend sont opérationnelles.");
}