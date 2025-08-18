-- Migration pour la planification annuelle
-- Ajout des tables yearly_planning et month_planning

CREATE TABLE yearly_planning (
    id TEXT PRIMARY KEY NOT NULL,
    year INTEGER NOT NULL UNIQUE,
    tjm_cents INTEGER NOT NULL DEFAULT 0,
    max_working_days_limit INTEGER NOT NULL DEFAULT 214,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE month_planning (
    id TEXT PRIMARY KEY NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    max_working_days INTEGER NOT NULL DEFAULT 0,
    holidays_taken INTEGER NOT NULL DEFAULT 0,
    public_holidays INTEGER NOT NULL DEFAULT 0,
    working_days INTEGER NOT NULL DEFAULT 0,
    estimated_revenue_cents INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(year, month),
    FOREIGN KEY (year) REFERENCES yearly_planning(year) ON DELETE CASCADE
);

-- Index pour optimiser les requêtes par année
CREATE INDEX idx_yearly_planning_year ON yearly_planning(year);
CREATE INDEX idx_month_planning_year_month ON month_planning(year, month);
CREATE INDEX idx_month_planning_year ON month_planning(year);