// Route types - Mise à jour avec nouvelle route unifiée
export type RouteKey = 'dashboard' | 'operations' | 'declaration' | 'invoices' | 'expenses' | 'simulations' | 'vat' | 'urssaf' | 'settings'

// Period management
export interface Period {
  year: number
  month: number
  label: string // "Janvier 2025"
  key: string   // "2025-01"
}

// =============================================================================
// NOUVEAU MODÈLE UNIFIÉ - OPÉRATION
// =============================================================================

// Opération - correspond exact au backend Rust
export interface Operation {
  id: string
  date_facture: string            // Date de facturation (NaiveDate depuis le backend)
  date_encaissement?: string      // Date d'encaissement (Option<NaiveDate>)
  date_paiement?: string          // Date de paiement (pour achats)
  sens: 'vente' | 'achat'         // Type d'opération (OperationSens)
  montant_ht_cents: number        // Montant HT en centimes
  montant_tva_cents: number       // Montant TVA en centimes (valeur directe)
  montant_ttc_cents: number       // Montant TTC = HT + TVA
  tva_sur_encaissements: boolean  // true = TVA à l'encaissement
  libelle?: string                // Description optionnelle
  justificatif_url?: string       // URL MinIO pour justificatif
  created_at: string              // Date de création
  updated_at: string              // Date de modification

  // Propriétés calculées pour compatibilité avec l'ancien code
  readonly date: string                    // = date_facture
  readonly encaissement_date?: string      // = date_encaissement 
  readonly amount_ht_cents: number         // = montant_ht_cents
  readonly amount_ttc_cents: number        // = montant_ttc_cents
  readonly tva_cents: number               // = montant_tva_cents
}

// Statuts d'opération simplifiés
export type OperationStatus = 
  | 'draft'        // Brouillon
  | 'confirmed'    // Confirmée (facturée pour ventes, dépense validée pour achats)
  | 'paid'         // Payée/encaissée
  | 'cancelled'    // Annulée

// Formulaire pour création/modification d'opération (simplifié)
export interface OperationFormData {
  libelle?: string               // Description (optionnel)
  sens: 'achat' | 'vente'       // Type d'opération
  montant_ht: string            // Montant HT en euros (saisie utilisateur)
  tva_rate: string              // Taux TVA en % (string pour saisie)
  tva_sur_encaissements: boolean // TVA sur encaissements ou facturation
  date: string                   // Date de l'opération
  encaissement_date?: string     // Si TVA sur encaissements
  justificatif_file?: File       // Fichier à uploader (optionnel)
}

// DTO pour création d'opération (simplifié)
export interface CreateOperationDto {
  libelle?: string
  sens: 'achat' | 'vente'
  montant_ht: number            // Montant HT en centimes
  tva_rate: number              // Taux TVA en %
  tva_sur_encaissements: boolean
  date: string                   // Date ISO
  encaissement_date?: string     // Date ISO (optionnel)
  justificatif_url?: string      // URL MinIO après upload (optionnel)
}

// =============================================================================
// TYPES HÉRITÉS (À CONSERVER TEMPORAIREMENT POUR LA MIGRATION)
// =============================================================================

// Invoice/Facturation - DEPRECATED: Utiliser Operation avec sens='vente'
export interface Invoice {
  id: string
  number?: string
  client: string
  description?: string
  amount_ht_cents: number
  tva_rate: number
  amount_ttc_cents: number
  issued_date: string      // Date de facturation
  payment_date?: string    // Date d'encaissement (pour la TVA)
  due_date?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  is_service: boolean      // true: prestation (TVA sur encaissement), false: bien (TVA sur livraison)
  delivery_date?: string   // Date de livraison (pour les biens uniquement)
  created_at: string
}

// Expense/Dépense - DEPRECATED: Utiliser Operation avec sens='achat'
export interface Expense {
  id: string
  label: string
  category: string
  amount_ht_cents: number
  tva_rate: number
  amount_ttc_cents: number
  expense_date: string     // Date de la dépense (pour la TVA déductible)
  payment_date?: string
  supplier?: string
  receipt_path?: string
  is_deductible: boolean
  is_service: boolean      // true: prestation, false: bien/immobilisation
  created_at: string
}

// =============================================================================
// CALCULS TVA AVEC NOUVEAU MODÈLE OPÉRATION
// =============================================================================

// Calcul TVA simplifié avec modèle Operation
export interface VatCalculation {
  period: string
  
  // TVA collectée (ventes)
  collected_vat_cents: number        // Total TVA collectée sur les ventes
  
  // TVA déductible (achats)
  deductible_vat_cents: number       // Total TVA déductible sur les achats
  
  // Calcul final
  vat_due_cents: number              // TVA à payer (collectée - déductible)
  declaration_date: string           // 12 du mois suivant
  payment_date: string               // 20 du mois suivant
  
  // Détails pour validation avec nouveau modèle
  operations_breakdown: VatOperationBreakdown[]
  calculation_method: 'encaissements' | 'debits'
  calculated_at: string
}

// Détail d'une opération dans le calcul TVA
export interface VatOperationBreakdown {
  operation_id: string
  label: string
  sens: 'achat' | 'vente'
  client_supplier?: string
  amount_ht_cents: number
  tva_rate: number
  tva_cents: number
  tva_sur_encaissements: boolean
  reference_date: string             // date ou encaissement_date selon le cas
  included_in_period: boolean        // Incluse dans le calcul de la période
  reason?: string                    // Explication si exclue
}

// DEPRECATED: Remplacés par VatOperationBreakdown
export interface VatInvoiceBreakdown {
  invoice_id: string
  client: string
  amount_ht_cents: number
  vat_rate: number
  vat_cents: number
  is_service: boolean
  reference_date: string     // payment_date pour services, delivery_date pour biens
  included_in_period: boolean
}

export interface VatExpenseBreakdown {
  expense_id: string
  supplier: string
  amount_ht_cents: number
  vat_rate: number
  vat_cents: number
  is_service: boolean
  reference_date: string     // expense_date
  is_deductible: boolean
  included_in_period: boolean
}

// Calcul URSSAF avec modèle Operation
export interface UrssafCalculation {
  period: string
  revenue_ht_cents: number       // CA encaissé (ventes uniquement)
  urssaf_rate: number            // Taux en %
  urssaf_due_cents: number       // URSSAF à payer
  payment_date: string           // 5 du mois suivant
  operations_included: string[]  // IDs des opérations incluses dans le calcul
}

// Dashboard avec modèle Operation
export interface DashboardData {
  period: string
  encaissements_ht_cents: number   // Ventes encaissées HT
  depenses_ttc_cents: number       // Achats TTC
  tva_due_cents: number           // TVA à payer
  urssaf_due_cents: number        // URSSAF à payer
  disponible_cents: number        // Disponible après taxes et buffer
  operations_count: number        // Nombre total d'opérations
  ventes_count: number           // Nombre de ventes
  achats_count: number           // Nombre d'achats
  next_deadlines: TaxDeadline[]  // Échéances à venir
}

export interface TaxDeadline {
  type: 'TVA_DECLARATION' | 'TVA_PAYMENT' | 'URSSAF_PAYMENT'
  date: string
  amount_cents: number
  period: string
  status: 'upcoming' | 'due' | 'overdue' | 'paid'
}

// Period workflow status
export interface PeriodStatus {
  period: string
  invoices_complete: boolean
  expenses_complete: boolean
  vat_calculated: boolean
  urssaf_calculated: boolean
  declarations_ready: boolean
  is_closed: boolean
  closed_at?: string
}

// UI component types
export interface MetricCardData {
  label: string
  value: string
  icon: any
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  status?: 'success' | 'warning' | 'danger'
  onClick?: () => void
}

// Monthly Declaration Workflow
export type DeclarationWorkflowStep = 
  | 'data_entry'          // Saisie des données
  | 'validation'          // Validation et contrôles
  | 'vat_calculation'     // Calcul TVA
  | 'urssaf_calculation'  // Calcul URSSAF
  | 'export_ready'        // Prêt pour export
  | 'declared'            // Déclarations effectuées
  | 'closed'              // Mois clôturé

export interface MonthDeclaration {
  period: string
  current_step: DeclarationWorkflowStep
  is_bulk_entry: boolean           // Saisie groupée vs quotidienne
  data_complete: boolean
  validation_errors: ValidationError[]
  vat_calculation: VatCalculation
  urssaf_calculation: UrssafCalculation
  export_data?: DeclarationExportData
  declared_at?: string
  closed_at?: string
  created_at: string
  updated_at: string
}

export interface ValidationError {
  type: 'warning' | 'error' | 'info'
  code: string
  message: string
  field?: string
  invoice_id?: string
  expense_id?: string
}

export interface DeclarationExportData {
  vat_export: string       // Données formatées pour copier-coller
  urssaf_export: string    // Données formatées pour copier-coller
  summary_export: string   // Récapitulatif mensuel
  generated_at: string
}

// Enhanced multi-period dashboard data
export interface MultiPeriodDashboardData {
  periods: string[]
  current_period: string
  period_data: Record<string, DashboardData>
  treasury_projection: TreasuryProjection
  yearly_summary: YearlySummary
  alerts: DashboardAlert[]
}

export interface TreasuryProjection {
  next_3_months: PeriodProjection[]
  next_6_months: PeriodProjection[]
  yearly_projection: YearlyProjection
  cash_flow_chart_data: CashFlowDataPoint[]
}

export interface PeriodProjection {
  period: string
  projected_revenue_cents: number
  projected_expenses_cents: number
  projected_vat_cents: number
  projected_urssaf_cents: number
  projected_available_cents: number
  confidence_level: 'low' | 'medium' | 'high'
}

export interface YearlyProjection {
  total_revenue_cents: number
  total_expenses_cents: number
  total_vat_cents: number
  total_urssaf_cents: number
  total_available_cents: number
  effective_rate: number           // Taux de charge effectif
}

export interface YearlySummary {
  year: number
  completed_periods: string[]
  total_revenue_cents: number
  total_expenses_cents: number
  total_vat_paid_cents: number
  total_urssaf_paid_cents: number
  average_monthly_revenue_cents: number
  growth_rate: number              // Taux de croissance vs année précédente
}

export interface CashFlowDataPoint {
  period: string
  date: string
  revenue_cents: number
  expenses_cents: number
  vat_due_cents: number
  urssaf_due_cents: number
  available_cents: number
  cumulative_available_cents: number
}

export interface DashboardAlert {
  id: string
  type: 'deadline' | 'cash_flow' | 'validation' | 'info'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  action_required?: string
  due_date?: string
  period?: string
  created_at: string
}

// Settings
export interface AppSettings {
  urssaf_rate: number           // En % (deprecated - utiliser urssaf_rates)
  tva_declaration_day: number   // 12
  tva_payment_day: number       // 20  
  urssaf_payment_day: number    // 5
  default_tva_rate: number      // 20
  company_name?: string
  siret?: string
  
  // URSSAF rates structure (configurable)
  urssaf_rates: {
    prestations_bic: number     // 21.20% - Prestations de services BIC
    vente_marchandises_bic: number  // 12.30% - Vente de marchandises BIC
    prestations_bnc: number     // 24.60% - Prestations de services BNC
    formation_professionnelle: number // 0.30% - Formation prof. obligatoire
    taxe_cma_vente: number      // 0.22% - Taxe CMA vente obligatoire cas général
    taxe_cma_prestation: number // 0.48% - Taxe CMA prestation oblig cas général
  }
  
  // New settings for enhanced features
  treasury_buffer_cents: number    // Montant de sécurité
  auto_generate_projections: boolean
  projection_confidence_threshold: number
  alert_days_before_deadline: number
}

// DEPRECATED Form types - Remplacés par OperationFormData
export interface InvoiceFormData {
  client: string
  description?: string
  amount_ht: string
  tva_rate: string
  issued_date: string
  payment_date?: string
  due_date?: string
  is_service: boolean
  delivery_date?: string
}

export interface ExpenseFormData {
  label: string
  category: string
  amount_ht: string
  tva_rate: string
  expense_date: string
  payment_date?: string
  supplier?: string
  is_deductible: boolean
  is_service: boolean
}

// Legacy types for backward compatibility (to be gradually removed)
export type MonthId = string
export type ChartDataPoint = CashFlowDataPoint
export type Settings = AppSettings
export type VatReport = VatCalculation
export type UrssafReport = UrssafCalculation

// Re-export dashboard types for consistency
export * from './dashboard'

// DEPRECATED DTOs - Remplacés par CreateOperationDto
export interface CreateInvoiceDto {
  client: string
  description?: string
  amount_ht_cents: number
  tva_rate: number
  issued_date: string
  payment_date?: string
  due_date?: string
  is_service: boolean
  delivery_date?: string
}

export interface CreateExpenseDto {
  label: string
  category: string
  amount_ht_cents: number
  tva_rate: number
  expense_date: string
  payment_date?: string
  supplier?: string
  is_deductible: boolean
  is_service: boolean
}

export interface SimulationParams {
  monthly_revenue: number
  monthly_expenses: number
  vat_rate: number
  urssaf_rate: number
  months: number
}

export interface SimulationResult {
  period: string
  revenue_ht_cents: number
  expenses_ttc_cents: number
  vat_due_cents: number
  urssaf_due_cents: number
  available_cents: number
  cumulative_available_cents: number
}