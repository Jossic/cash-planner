-- ============================================================================
-- JLA Cash Planner - Initial schema with English field names
-- ============================================================================

-- Table operations - Unified model for all accounting operations
CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    invoice_date TEXT NOT NULL,           -- Invoice date
    payment_date TEXT,                    -- Payment/encaissement date 
    type TEXT NOT NULL CHECK (type IN ('sale', 'purchase')),
    amount_ht_cents INTEGER NOT NULL,
    vat_amount_cents INTEGER NOT NULL,    -- Direct VAT value (not rate)
    amount_ttc_cents INTEGER NOT NULL,    -- = HT + VAT
    vat_on_payments BOOLEAN NOT NULL DEFAULT true,
    label TEXT,
    receipt_url TEXT,                     -- MinIO URL
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Table declarations - Tax declarations management
CREATE TABLE IF NOT EXISTS declarations (
    id TEXT PRIMARY KEY,
    declaration_type TEXT NOT NULL CHECK (declaration_type IN ('vat', 'urssaf')),
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    amount_due_cents INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    payment_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Table provisions - Tax provisions management
CREATE TABLE IF NOT EXISTS provisions (
    id TEXT PRIMARY KEY,
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    type TEXT NOT NULL CHECK (type IN ('vat', 'urssaf')),
    amount_cents INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Table settings - Application configuration
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    default_vat_rate_ppm INTEGER NOT NULL DEFAULT 200000,  -- 20% = 200000 ppm  
    urssaf_rate_ppm INTEGER NOT NULL DEFAULT 220000,       -- 22% = 220000 ppm
    vat_declare_day INTEGER NOT NULL DEFAULT 12,
    vat_pay_day INTEGER NOT NULL DEFAULT 20,
    urssaf_pay_day INTEGER NOT NULL DEFAULT 5,
    buffer_cents INTEGER NOT NULL DEFAULT 300000,          -- €3000 default
    forecast_ht_cents INTEGER NOT NULL DEFAULT 500000,     -- €5000 default
    forecast_expenses_ttc_cents INTEGER NOT NULL DEFAULT 200000, -- €2000 default  
    forecast_expense_vat_rate_ppm INTEGER NOT NULL DEFAULT 200000, -- 20% default
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Indexes to optimize frequent queries
CREATE INDEX IF NOT EXISTS idx_operations_invoice_date ON operations(invoice_date);
CREATE INDEX IF NOT EXISTS idx_operations_payment_date ON operations(payment_date);
CREATE INDEX IF NOT EXISTS idx_operations_type ON operations(type);
CREATE INDEX IF NOT EXISTS idx_operations_type_date ON operations(type, invoice_date);

-- Composite index for VAT queries (by payment month)
CREATE INDEX IF NOT EXISTS idx_operations_vat_payments ON operations(
    vat_on_payments, 
    payment_date, 
    type
) WHERE payment_date IS NOT NULL;

-- Indexes for declarations by period
CREATE INDEX IF NOT EXISTS idx_declarations_period ON declarations(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_declarations_type_status ON declarations(declaration_type, status);
CREATE INDEX IF NOT EXISTS idx_declarations_due_date ON declarations(due_date);

-- Indexes for provisions
CREATE INDEX IF NOT EXISTS idx_provisions_period ON provisions(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_provisions_type ON provisions(type);
CREATE INDEX IF NOT EXISTS idx_provisions_due_date ON provisions(due_date);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS uniq_declarations_period ON declarations(declaration_type, period_year, period_month);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_provisions_period ON provisions(type, period_year, period_month);

-- Insert default settings
INSERT OR IGNORE INTO settings (
    id, 
    default_vat_rate_ppm, 
    urssaf_rate_ppm, 
    vat_declare_day, 
    vat_pay_day, 
    urssaf_pay_day, 
    buffer_cents,
    forecast_ht_cents,
    forecast_expenses_ttc_cents,
    forecast_expense_vat_rate_ppm,
    created_at,
    updated_at
) VALUES (
    1, 
    200000,     -- 20% VAT
    220000,     -- 22% URSSAF
    12,         -- VAT declaration on 12th
    20,         -- VAT payment on 20th
    5,          -- URSSAF payment on 5th
    300000,     -- €3000 buffer
    500000,     -- €5000 forecast HT
    200000,     -- €2000 forecast expenses
    200000,     -- 20% forecast expense VAT
    datetime('now'),
    datetime('now')
);