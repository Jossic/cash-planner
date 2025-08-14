/**
 * Index central pour le modèle Operation unifié
 * 
 * Exporte tous les utilitaires, hooks et types liés aux opérations
 * pour un accès centralisé et cohérent dans l'application.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  Operation,
  CreateOperationDto,
  OperationFormData,
  OperationStatus,
  VatOperationBreakdown,
  VatCalculation,
  UrssafCalculation
} from '../types'

// =============================================================================
// UTILITAIRES DE MIGRATION ET CONVERSION
// =============================================================================

export {
  // Migration Invoice/Expense → Operation
  invoiceToOperation,
  expenseToOperation,
  operationToInvoice,
  operationToExpense,
  migratePeriodToOperations,
  
  // Calculs et validation
  calculateOperationAmounts,
  validateOperation,
  createOperationFromForm,
  
  // Filtrage et utilitaires
  filterOperationsBySens,
  filterOperationsForPeriod,
  calculateOperationsTotal
} from './operationMigration'

// =============================================================================
// CALCULS TVA AVEC MODÈLE OPERATION
// =============================================================================

export {
  // Calculs TVA/URSSAF
  calculateVatForOperations,
  calculateUrssafForOperations,
  analyzeOperationsForVat,
  calculateVatDates,
  
  // Validation et statistiques
  validatePeriodOperations,
  generateOperationsStats,
  compareWithLegacyCalculation
} from './operationVatCalculations'

// =============================================================================
// UTILITAIRES DE FORMULAIRE
// =============================================================================

export {
  // Conversion formulaire
  formDataToCreateDto,
  operationToFormData,
  
  // Calculs de formulaire
  calculateFormAmounts,
  validateOperationForm,
  
  // Valeurs par défaut et helpers
  createDefaultOperationForm,
  cloneOperationForm,
  isEncaissementRequired,
  isCategoryRequired,
  generateAutoReference,
  calculateDefaultDueDate,
  
  // Formatage
  formatEuros,
  formatEurosInput,
  parseEurosInput
} from './operationFormUtils'

// Types de formulaire
export type {
  OperationFormCalculation,
  OperationFormValidation
} from './operationFormUtils'

// =============================================================================
// UTILITAIRES MONÉTAIRES
// =============================================================================

export {
  // Conversion base
  eurosTocents,
  eurosTocentimes,
  centsToEuros,
  parseAmountToCents,
  parseAmountToEuros,
  
  // Formatage avancé
  formatCentsToEuros,
  formatEuros as formatEurosDisplay,
  formatCentsForInput,
  formatEurosForInput,
  
  // Calculs TVA
  calculateTvaCents,
  calculateTtcCents,
  calculateHtFromTtc,
  calculateAllAmountsFromHt,
  calculateAllAmountsFromTtc,
  
  // Validation
  isValidAmountString,
  isValidVatRate,
  isValidAmountRange,
  
  // Helpers pour composants
  createAmountInputFormatter,
  createRealtimeCalculator,
  
  // Constantes
  VAT_RATES,
  CURRENCY_CONFIG,
  getVatRateOptions,
  getDefaultVatRate
} from './currencyUtils'

// Types monétaires
export type {
  AmountCalculation,
  AmountInputFormatter,
  RealtimeCalculator
} from './currencyUtils'

// =============================================================================
// CATÉGORIES D'OPÉRATIONS
// =============================================================================

export {
  // Données de catégories
  VENTE_CATEGORIES,
  ACHAT_CATEGORIES,
  CATEGORY_GROUPS,
  CATEGORY_DATA,
  
  // Utilitaires de catégories
  getCategoriesForSens,
  getCategoryById,
  getDefaultVatRateForCategory,
  isCategoryDeductible,
  getCategoryOptions,
  getGroupedCategoriesForSens,
  searchCategories,
  suggestCategory,
  validateCategoryForSens
} from './operationCategories'

// Types de catégories
export type {
  OperationCategory,
  CategoryGroup
} from './operationCategories'

// =============================================================================
// HOOKS SOLIDJS
// =============================================================================

export {
  // Hook principal de formulaire
  useOperationForm,
  useVenteForm,
  useAchatForm,
  
  // Hook de liste
  useOperationsList,
  
  // Hook de filtrage
  useOperationsFilter
} from '../hooks/useOperationForm'

// Types de hooks
export type {
  UseOperationFormOptions,
  UseOperationsListOptions,
  UseOperationsFilterOptions,
  OperationFilters
} from '../hooks/useOperationForm'

// =============================================================================
// CONSTANTES UTILES
// =============================================================================

export const OPERATION_CONSTANTS = {
  // Taux TVA français
  VAT_RATES: {
    NORMAL: 20,
    REDUCED_1: 10,
    REDUCED_2: 5.5,
    REDUCED_3: 2.1,
    ZERO: 0
  },
  
  // Seuils réglementaires
  THRESHOLDS: {
    FRANCHISE_BASE_SERVICES: 85800, // Seuil franchise en base prestations (€)
    FRANCHISE_BASE_GOODS: 176200,   // Seuil franchise en base marchandises (€)
    DECLARATION_THRESHOLD: 10000,   // Seuil déclaratif (€)
    MAX_AMOUNT: 999999999          // Montant maximum autorisé (centimes)
  },
  
  // Délais par défaut
  DEFAULT_DELAYS: {
    PAYMENT_TERM_DAYS: 30,         // Délai de paiement par défaut
    VAT_DECLARATION_DAY: 12,       // Jour de déclaration TVA
    VAT_PAYMENT_DAY: 20,           // Jour de paiement TVA
    URSSAF_PAYMENT_DAY: 5          // Jour de paiement URSSAF
  },
  
  // Status d'opération
  STATUS: {
    DRAFT: 'draft' as const,
    CONFIRMED: 'confirmed' as const,
    PAID: 'paid' as const,
    CANCELLED: 'cancelled' as const
  }
} as const

// =============================================================================
// HELPERS DE VALIDATION GLOBALE
// =============================================================================

/**
 * Valide complètement une opération (données + règles métier)
 */
export const validateCompleteOperation = (operation: Partial<Operation>) => {
  const basicErrors = validateOperation(operation)
  const formValidation = operation.sens ? validateOperationForm({
    label: operation.label || '',
    sens: operation.sens,
    amount_ht: operation.amount_ht_cents ? (operation.amount_ht_cents / 100).toString() : '',
    tva_rate: operation.tva_rate?.toString() || '',
    tva_sur_encaissements: operation.tva_sur_encaissements || false,
    date: operation.date || '',
    encaissement_date: operation.encaissement_date || '',
    category: operation.category || '',
    client_supplier: operation.client_supplier || '',
    reference: operation.reference || '',
    payment_due_date: operation.payment_due_date || '',
    notes: operation.notes || '',
    receipt_path: operation.receipt_path || ''
  }) : { is_valid: false, field_errors: {}, global_errors: ['Sens manquant'], warnings: [] }
  
  return {
    basic_errors: basicErrors,
    form_validation: formValidation,
    is_completely_valid: basicErrors.length === 0 && formValidation.is_valid,
    all_errors: [
      ...basicErrors,
      ...formValidation.global_errors,
      ...Object.values(formValidation.field_errors).flat()
    ],
    warnings: formValidation.warnings
  }
}

/**
 * Créateur d'opération avec validation complète
 */
export const createValidatedOperation = (
  formData: OperationFormData
): { success: true; operation: CreateOperationDto } | { success: false; errors: string[] } => {
  const validation = validateOperationForm(formData)
  
  if (!validation.is_valid) {
    const errors = [
      ...validation.global_errors,
      ...Object.values(validation.field_errors).flat()
    ]
    return { success: false, errors }
  }
  
  try {
    const operation = formDataToCreateDto(formData)
    return { success: true, operation }
  } catch (error) {
    return { 
      success: false, 
      errors: [error instanceof Error ? error.message : 'Erreur de création'] 
    }
  }
}

// =============================================================================
// EXPORT DEFAULT POUR COMPATIBILITÉ
// =============================================================================

export default {
  // Core utilities
  validate: validateCompleteOperation,
  create: createValidatedOperation,
  
  // Categories
  categories: CATEGORY_DATA,
  
  // Constants
  constants: OPERATION_CONSTANTS,
  
  // Currency
  currency: {
    format: formatCentsToEuros,
    parse: parseAmountToCents,
    calculate: createRealtimeCalculator()
  }
} as const