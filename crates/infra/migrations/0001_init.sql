-- ============================================================================
-- JLA Cash Planner - Schema définitif unifié
-- ============================================================================

-- Table operations - Modèle unifié pour toutes les opérations comptables
CREATE TABLE operations (
    id TEXT PRIMARY KEY,
    date_facture TEXT NOT NULL,           -- Date de facture (pas "date d'opération")
    date_encaissement TEXT,               -- Si TVA sur encaissements (ventes)
    date_paiement TEXT,                   -- Pour achats prestations  
    sens TEXT NOT NULL CHECK (sens IN ('vente', 'achat')),
    montant_ht_cents INTEGER NOT NULL,
    montant_tva_cents INTEGER NOT NULL,   -- Valeur TVA directe (pas de taux)
    montant_ttc_cents INTEGER NOT NULL,   -- = HT + TVA
    tva_sur_encaissements BOOLEAN NOT NULL DEFAULT true,
    libelle TEXT,
    justificatif_url TEXT,                -- URL MinIO
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Table declarations - Gestion des déclarations fiscales
CREATE TABLE declarations (
    id TEXT PRIMARY KEY,
    type_declaration TEXT NOT NULL CHECK (type_declaration IN ('tva', 'urssaf')),
    periode_annee INTEGER NOT NULL,
    periode_mois INTEGER NOT NULL CHECK (periode_mois >= 1 AND periode_mois <= 12),
    montant_du_cents INTEGER NOT NULL,
    date_echeance TEXT NOT NULL,
    date_paiement TEXT,
    statut TEXT NOT NULL DEFAULT 'pending' CHECK (statut IN ('pending', 'paid', 'overdue')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Table settings - Configuration de l'application
CREATE TABLE settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    default_vat_rate_ppm INTEGER NOT NULL DEFAULT 200000,  -- 20% = 200000 ppm  
    urssaf_rate_ppm INTEGER NOT NULL DEFAULT 220000,       -- 22% = 220000 ppm
    vat_declare_day INTEGER NOT NULL DEFAULT 12,
    vat_pay_day INTEGER NOT NULL DEFAULT 20,
    urssaf_pay_day INTEGER NOT NULL DEFAULT 5,
    buffer_cents INTEGER NOT NULL DEFAULT 300000,          -- 3000€ par défaut
    forecast_ht_cents INTEGER NOT NULL DEFAULT 500000,     -- 5000€ par défaut
    forecast_expenses_ttc_cents INTEGER NOT NULL DEFAULT 200000, -- 2000€ par défaut  
    forecast_expense_vat_rate_ppm INTEGER NOT NULL DEFAULT 200000, -- 20% par défaut
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX idx_operations_date_facture ON operations(date_facture);
CREATE INDEX idx_operations_date_encaissement ON operations(date_encaissement);
CREATE INDEX idx_operations_sens ON operations(sens);
CREATE INDEX idx_operations_sens_date ON operations(sens, date_facture);

-- Index composé pour requêtes TVA (par mois d'encaissement)
CREATE INDEX idx_operations_tva_encaissements ON operations(
    tva_sur_encaissements, 
    date_encaissement, 
    sens
) WHERE date_encaissement IS NOT NULL;

-- Index pour declarations par période
CREATE INDEX idx_declarations_periode ON declarations(periode_annee, periode_mois);
CREATE INDEX idx_declarations_type_statut ON declarations(type_declaration, statut);
CREATE INDEX idx_declarations_echeance ON declarations(date_echeance);

-- Contraintes d'unicité
CREATE UNIQUE INDEX uniq_declarations_periode ON declarations(type_declaration, periode_annee, periode_mois);

-- Insertion des paramètres par défaut
INSERT INTO settings (
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
    200000,     -- 20% TVA
    220000,     -- 22% URSSAF
    12,         -- Déclaration TVA le 12
    20,         -- Paiement TVA le 20
    5,          -- Paiement URSSAF le 5
    300000,     -- Buffer 3000€
    500000,     -- Forecast HT 5000€
    200000,     -- Forecast expenses 2000€
    200000,     -- Forecast expense VAT 20%
    datetime('now'),
    datetime('now')
);