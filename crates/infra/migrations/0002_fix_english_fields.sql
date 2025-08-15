-- ============================================================================
-- Migration: Ensure English field names and provisions table
-- This migration is idempotent and safe to run multiple times
-- ============================================================================

-- Create provisions table if it doesn't exist
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

-- Create indexes for provisions if they don't exist
CREATE INDEX IF NOT EXISTS idx_provisions_period ON provisions(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_provisions_type ON provisions(type);
CREATE INDEX IF NOT EXISTS idx_provisions_due_date ON provisions(due_date);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_provisions_period ON provisions(type, period_year, period_month);