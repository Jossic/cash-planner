// Quick test to see how Operation serializes to JSON
use domain::{Operation, OperationType};

fn main() {
    let op = Operation {
        id: uuid::Uuid::new_v4(),
        invoice_date: chrono::NaiveDate::from_ymd_opt(2025, 8, 1).unwrap(),
        payment_date: Some(chrono::NaiveDate::from_ymd_opt(2025, 8, 15).unwrap()),
        operation_type: OperationType::Sale,
        amount_ht_cents: 700000,
        vat_amount_cents: 140000,
        amount_ttc_cents: 840000,
        vat_on_payments: true,
        label: Some("Test".to_string()),
        receipt_url: None,
        created_at: chrono::Utc::now().naive_utc(),
        updated_at: chrono::Utc::now().naive_utc(),
    };

    let json = serde_json::to_string_pretty(&op).unwrap();
    println!("Operation JSON:");
    println!("{}", json);
}