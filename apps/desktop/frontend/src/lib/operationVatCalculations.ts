/**
 * Calculs TVA optimisés pour le modèle Operation unifié
 * 
 * Simplifie la logique TVA en utilisant le nouveau modèle Operation
 * qui unifie les factures et dépenses avec une logique claire achat/vente.
 */

import type { 
  Operation, VatCalculation, VatOperationBreakdown, UrssafCalculation,
  DashboardAlert, ValidationError
} from '../types'

// =============================================================================
// CALCUL TVA AVEC MODÈLE OPERATION UNIFIÉ
// =============================================================================

/**
 * Calcule la TVA pour une période avec le nouveau modèle Operation
 * Logique simplifiée : 
 * - Ventes : TVA collectée selon tva_sur_encaissements
 * - Achats : TVA déductible toujours à la date de l'opération
 */
export const calculateVatForOperations = (
  period: string,
  operations: Operation[]
): VatCalculation => {
  const now = new Date().toISOString()
  
  // Analyser chaque opération pour le calcul TVA
  const operationsBreakdown = analyzeOperationsForVat(period, operations)
  
  // TVA collectée (ventes)
  const collectedVat = operationsBreakdown
    .filter(op => op.sens === 'vente' && op.included_in_period)
    .reduce((sum, op) => sum + op.tva_cents, 0)
  
  // TVA déductible (achats)
  const deductibleVat = operationsBreakdown
    .filter(op => op.sens === 'achat' && op.included_in_period)
    .reduce((sum, op) => sum + op.tva_cents, 0)
  
  // TVA due = collectée - déductible (minimum 0)
  const vatDue = Math.max(0, collectedVat - deductibleVat)
  
  // Calcul des dates de déclaration et paiement
  const { declarationDate, paymentDate } = calculateVatDates(period)
  
  return {
    period,
    collected_vat_cents: collectedVat,
    deductible_vat_cents: deductibleVat,
    vat_due_cents: vatDue,
    declaration_date: declarationDate,
    payment_date: paymentDate,
    operations_breakdown: operationsBreakdown,
    calculation_method: 'encaissements', // Méthode française standard
    calculated_at: now
  }
}

/**
 * Analyse les opérations pour déterminer leur inclusion dans le calcul TVA
 */
export const analyzeOperationsForVat = (
  period: string,
  operations: Operation[]
): VatOperationBreakdown[] => {
  return operations.map(operation => {
    let included = false
    let referenceDate = operation.date
    let reason: string | undefined
    
    if (operation.sens === 'vente') {
      // VENTES : TVA collectée
      if (operation.tva_sur_encaissements) {
        // TVA sur encaissements : date d'encaissement
        if (operation.encaissement_date) {
          referenceDate = operation.encaissement_date
          included = operation.encaissement_date.startsWith(period)
        } else {
          included = false
          reason = 'Encaissement non renseigné pour TVA sur encaissements'
        }
      } else {
        // TVA sur facturation : date de l'opération
        referenceDate = operation.date
        included = operation.date.startsWith(period)
      }
    } else {
      // ACHATS : TVA déductible toujours à la date d'achat
      referenceDate = operation.date
      included = operation.date.startsWith(period)
      
      // Note: La TVA n'est déductible que si le montant est > 0
      if (operation.tva_cents <= 0) {
        included = false
        reason = 'Pas de TVA sur cette opération'
      }
    }
    
    return {
      operation_id: operation.id,
      label: operation.label,
      sens: operation.sens,
      client_supplier: operation.client_supplier,
      amount_ht_cents: operation.amount_ht_cents,
      tva_rate: operation.tva_rate,
      tva_cents: operation.tva_cents,
      tva_sur_encaissements: operation.tva_sur_encaissements,
      reference_date: referenceDate,
      included_in_period: included,
      reason
    }
  })
}

/**
 * Calcule les dates de déclaration et paiement TVA
 */
export const calculateVatDates = (period: string): {
  declarationDate: string
  paymentDate: string
} => {
  const [year, month] = period.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  
  const declarationDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-12`
  const paymentDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-20`
  
  return { declarationDate, paymentDate }
}

// =============================================================================
// CALCUL URSSAF AVEC MODÈLE OPERATION
// =============================================================================

/**
 * Calcule l'URSSAF basé sur les ventes encaissées
 */
export const calculateUrssafForOperations = (
  period: string,
  operations: Operation[],
  urssafRate: number
): UrssafCalculation => {
  // Filtrer les ventes encaissées dans la période
  const revenueOperations = operations.filter(op => {
    if (op.sens !== 'vente') return false
    
    // Selon la méthode TVA de l'opération
    if (op.tva_sur_encaissements) {
      // Basé sur la date d'encaissement
      return op.encaissement_date && op.encaissement_date.startsWith(period)
    } else {
      // Basé sur la date de facturation
      return op.date.startsWith(period)
    }
  })
  
  const revenueHtCents = revenueOperations.reduce((sum, op) => sum + op.amount_ht_cents, 0)
  const urssafDueCents = Math.round(revenueHtCents * urssafRate / 100)
  
  // Date de paiement URSSAF : 5 du mois suivant
  const [year, month] = period.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const paymentDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-05`
  
  return {
    period,
    revenue_ht_cents: revenueHtCents,
    urssaf_rate: urssafRate,
    urssaf_due_cents: urssafDueCents,
    payment_date: paymentDate,
    operations_included: revenueOperations.map(op => op.id)
  }
}

// =============================================================================
// VALIDATION ET CONTRÔLES
// =============================================================================

/**
 * Valide les données d'une période pour les calculs TVA/URSSAF
 */
export const validatePeriodOperations = (
  period: string,
  operations: Operation[]
): ValidationError[] => {
  const errors: ValidationError[] = []
  
  operations.forEach(operation => {
    // Vérification des ventes avec TVA sur encaissements
    if (operation.sens === 'vente' && 
        operation.tva_sur_encaissements && 
        !operation.encaissement_date) {
      errors.push({
        type: 'warning',
        code: 'MISSING_PAYMENT_DATE',
        message: `Vente "${operation.label}" : Date d'encaissement manquante pour TVA sur encaissements`,
        field: 'encaissement_date',
        invoice_id: operation.id
      })
    }
    
    // Vérification des montants
    if (operation.amount_ht_cents <= 0) {
      errors.push({
        type: 'error',
        code: 'INVALID_AMOUNT',
        message: `Opération "${operation.label}" : Montant HT invalide`,
        field: 'amount_ht_cents',
        invoice_id: operation.id
      })
    }
    
    // Vérification cohérence TVA
    const expectedTvaCents = Math.round(operation.amount_ht_cents * operation.tva_rate / 100)
    if (Math.abs(operation.tva_cents - expectedTvaCents) > 1) {
      errors.push({
        type: 'warning',
        code: 'VAT_CALCULATION_MISMATCH',
        message: `Opération "${operation.label}" : Incohérence dans le calcul TVA`,
        field: 'tva_cents',
        invoice_id: operation.id
      })
    }
    
    // Vérification dates
    if (operation.encaissement_date && 
        new Date(operation.encaissement_date) < new Date(operation.date)) {
      errors.push({
        type: 'error',
        code: 'INVALID_DATE_ORDER',
        message: `Opération "${operation.label}" : Date d'encaissement antérieure à la date d'opération`,
        field: 'encaissement_date',
        invoice_id: operation.id
      })
    }
  })
  
  return errors
}

// =============================================================================
// STATISTIQUES ET RAPPORTS
// =============================================================================

/**
 * Génère des statistiques sur les opérations d'une période
 */
export const generateOperationsStats = (
  period: string,
  operations: Operation[]
) => {
  const ventes = operations.filter(op => op.sens === 'vente')
  const achats = operations.filter(op => op.sens === 'achat')
  
  const ventesTotalHt = ventes.reduce((sum, op) => sum + op.amount_ht_cents, 0)
  const achatsTotalTtc = achats.reduce((sum, op) => sum + op.amount_ttc_cents, 0)
  const totalTvaCents = operations.reduce((sum, op) => sum + op.tva_cents, 0)
  
  return {
    period,
    operations_count: operations.length,
    ventes_count: ventes.length,
    achats_count: achats.length,
    ventes_total_ht_cents: ventesTotalHt,
    achats_total_ttc_cents: achatsTotalTtc,
    total_tva_cents: totalTvaCents,
    
    // Répartition par TVA sur encaissements
    ventes_sur_encaissements: ventes.filter(op => op.tva_sur_encaissements).length,
    ventes_sur_facturation: ventes.filter(op => !op.tva_sur_encaissements).length,
    
    // Alertes potentielles
    ventes_sans_encaissement: ventes.filter(op => 
      op.tva_sur_encaissements && !op.encaissement_date
    ).length
  }
}

/**
 * Compare les calculs avec l'ancien modèle (pour migration)
 */
export const compareWithLegacyCalculation = (
  period: string,
  operations: Operation[],
  legacyVatCalculation?: VatCalculation
): {
  matches: boolean
  differences: string[]
  newCalculation: VatCalculation
} => {
  const newCalculation = calculateVatForOperations(period, operations)
  
  if (!legacyVatCalculation) {
    return {
      matches: true,
      differences: [],
      newCalculation
    }
  }
  
  const differences: string[] = []
  
  if (Math.abs(newCalculation.collected_vat_cents - legacyVatCalculation.collected_vat_cents) > 1) {
    differences.push(`TVA collectée: ${newCalculation.collected_vat_cents/100}€ vs ${legacyVatCalculation.collected_vat_cents/100}€`)
  }
  
  if (Math.abs(newCalculation.deductible_vat_cents - legacyVatCalculation.deductible_vat_cents) > 1) {
    differences.push(`TVA déductible: ${newCalculation.deductible_vat_cents/100}€ vs ${legacyVatCalculation.deductible_vat_cents/100}€`)
  }
  
  if (Math.abs(newCalculation.vat_due_cents - legacyVatCalculation.vat_due_cents) > 1) {
    differences.push(`TVA due: ${newCalculation.vat_due_cents/100}€ vs ${legacyVatCalculation.vat_due_cents/100}€`)
  }
  
  return {
    matches: differences.length === 0,
    differences,
    newCalculation
  }
}