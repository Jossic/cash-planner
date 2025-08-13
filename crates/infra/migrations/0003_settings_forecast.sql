ALTER TABLE settings ADD COLUMN forecast_ht_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE settings ADD COLUMN forecast_expenses_ttc_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE settings ADD COLUMN forecast_expense_vat_rate_ppm INTEGER NOT NULL DEFAULT 200000;
