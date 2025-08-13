-- invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  client TEXT NOT NULL,
  service_date TEXT NOT NULL,
  amount_ht INTEGER NOT NULL,
  vat_rate_ppm INTEGER NOT NULL,
  amount_tva INTEGER NOT NULL,
  amount_ttc INTEGER NOT NULL,
  paid_at TEXT NULL,
  source TEXT NULL
);

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  booking_date TEXT NOT NULL,
  amount_ht INTEGER NOT NULL,
  vat_rate_ppm INTEGER NOT NULL,
  amount_tva INTEGER NOT NULL,
  amount_ttc INTEGER NOT NULL,
  paid_at TEXT NULL,
  receipt_path TEXT NULL
);

-- provisions
CREATE TABLE IF NOT EXISTS provisions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

-- settings (single row id=1)
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  default_vat_rate_ppm INTEGER NOT NULL,
  urssaf_rate_ppm INTEGER NOT NULL,
  vat_declare_day INTEGER NOT NULL,
  vat_pay_day INTEGER NOT NULL,
  urssaf_pay_day INTEGER NOT NULL,
  buffer_cents INTEGER NOT NULL
);

INSERT OR IGNORE INTO settings (id, default_vat_rate_ppm, urssaf_rate_ppm, vat_declare_day, vat_pay_day, urssaf_pay_day, buffer_cents)
VALUES (1, 200000, 220000, 12, 20, 5, 30000);
