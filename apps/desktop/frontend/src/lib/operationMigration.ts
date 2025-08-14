/**
 * Utilitaires de migration pour convertir Invoice/Expense vers le modèle Operation unifié
 * 
 * Cette migration permet de :
 * 1. Convertir les données existantes sans perte d'information
 * 2. Maintenir la compatibilité pendant la transition
 * 3. Simplifier les calculs TVA avec une logique uniforme
 */

import type { Invoice, Expense, Operation, CreateOperationDto } from '../types'

// =============================================================================
// CONVERSION INVOICE → OPERATION
// =============================================================================

/**
 * Convertit une Invoice en Operation (vente)
 */
export function invoiceToOperation(invoice: Invoice): Operation {
  return {
    id: invoice.id,
    date: invoice.issued_date,
    label: invoice.description || `Facture ${invoice.client}`,
    amount_ht_cents: invoice.amount_ht_cents,
    amount_ttc_cents: invoice.amount_ttc_cents,
    tva_cents: invoice.amount_ttc_cents - invoice.amount_ht_cents,
    tva_rate: invoice.tva_rate,
    sens: 'vente',
    tva_sur_encaissements: invoice.is_service, // Les prestations sont sur encaissement
    encaissement_date: invoice.payment_date,
    client_supplier: invoice.client,
    reference: invoice.number,
    payment_due_date: invoice.due_date,
    status: mapInvoiceStatusToOperation(invoice.status),
    created_at: invoice.created_at,
    notes: undefined
  }
}

/**
 * Mappe les statuts d'Invoice vers Operation
 */
function mapInvoiceStatusToOperation(status: Invoice['status']): Operation['status'] {
  switch (status) {
    case 'draft': return 'draft'
    case 'sent': return 'confirmed'
    case 'paid': return 'paid'
    case 'overdue': return 'confirmed' // Toujours confirmée même si en retard
    default: return 'confirmed'
  }
}

// =============================================================================
// CONVERSION EXPENSE → OPERATION
// =============================================================================

/**
 * Convertit une Expense en Operation (achat)
 */
export function expenseToOperation(expense: Expense): Operation {
  return {
    id: expense.id,
    date: expense.expense_date,
    label: expense.label,
    amount_ht_cents: expense.amount_ht_cents,
    amount_ttc_cents: expense.amount_ttc_cents,
    tva_cents: expense.amount_ttc_cents - expense.amount_ht_cents,
    tva_rate: expense.tva_rate,
    sens: 'achat',
    tva_sur_encaissements: false, // Les achats sont toujours à la facturation
    encaissement_date: expense.payment_date,
    category: expense.category,
    client_supplier: expense.supplier,
    status: 'paid', // Les dépenses sont considérées comme payées
    receipt_path: expense.receipt_path,
    created_at: expense.created_at,
    notes: expense.is_deductible ? 'TVA déductible' : 'TVA non déductible'
  }
}

// =============================================================================
// CONVERSION OPERATION → LEGACY (POUR COMPATIBILITÉ)
// =============================================================================

/**
 * Convertit une Operation (vente) en Invoice pour compatibilité
 */
export function operationToInvoice(operation: Operation): Invoice {
  if (operation.sens !== 'vente') {
    throw new Error('Cannot convert achat operation to Invoice')
  }

  return {
    id: operation.id,
    number: operation.reference,
    client: operation.client_supplier || 'Client',
    description: operation.label,
    amount_ht_cents: operation.amount_ht_cents,
    tva_rate: operation.tva_rate,
    amount_ttc_cents: operation.amount_ttc_cents,
    issued_date: operation.date,
    payment_date: operation.encaissement_date,
    due_date: operation.payment_due_date,
    status: mapOperationStatusToInvoice(operation.status),
    is_service: operation.tva_sur_encaissements,
    delivery_date: operation.tva_sur_encaissements ? undefined : operation.date,
    created_at: operation.created_at
  }
}

/**
 * Convertit une Operation (achat) en Expense pour compatibilité
 */
export function operationToExpense(operation: Operation): Expense {
  if (operation.sens !== 'achat') {
    throw new Error('Cannot convert vente operation to Expense')
  }

  return {
    id: operation.id,
    label: operation.label,
    category: operation.category || 'Autre',
    amount_ht_cents: operation.amount_ht_cents,
    tva_rate: operation.tva_rate,
    amount_ttc_cents: operation.amount_ttc_cents,
    expense_date: operation.date,
    payment_date: operation.encaissement_date,
    supplier: operation.client_supplier,
    receipt_path: operation.receipt_path,
    is_deductible: !operation.notes?.includes('non déductible'),
    is_service: false, // Simplification : considérons tous les achats comme biens
    created_at: operation.created_at
  }
}

function mapOperationStatusToInvoice(status?: Operation['status']): Invoice['status'] {
  switch (status) {
    case 'draft': return 'draft'
    case 'confirmed': return 'sent'
    case 'paid': return 'paid'
    case 'cancelled': return 'draft'
    default: return 'sent'
  }
}

// =============================================================================
// VALIDATION ET CALCULS AUTOMATIQUES
// =============================================================================

/**
 * Calcule automatiquement les montants TTc et TVA à partir du HT
 */
export function calculateOperationAmounts(amountHtCents: number, tvaRate: number) {
  const tvaCents = Math.round(amountHtCents * tvaRate / 100)
  const amountTtcCents = amountHtCents + tvaCents

  return {
    amount_ht_cents: amountHtCents,
    amount_ttc_cents: amountTtcCents,
    tva_cents: tvaCents
  }
}

/**
 * Valide les données d'une opération avec règles métier françaises
 */
export function validateOperation(operation: Partial<Operation>): string[] {
  const errors: string[] = []

  if (!operation.label?.trim()) {
    errors.push('Le libellé est obligatoire')
  }

  if (!operation.sens) {
    errors.push('Le sens (achat/vente) est obligatoire')
  }

  if (!operation.date) {
    errors.push('La date est obligatoire')
  }

  if (!operation.amount_ht_cents || operation.amount_ht_cents <= 0) {
    errors.push('Le montant HT doit être positif')
  }

  if (operation.tva_rate === undefined || operation.tva_rate < 0 || operation.tva_rate > 30) {
    errors.push('Le taux de TVA doit être entre 0 et 30%')
  }

  if (operation.sens === 'achat' && !operation.category?.trim()) {
    errors.push('La catégorie est obligatoire pour les achats')
  }

  if (operation.tva_sur_encaissements && !operation.encaissement_date) {
    errors.push('La date d\'encaissement est obligatoire pour la TVA sur encaissements')
  }

  // Validation des dates
  if (operation.date && operation.encaissement_date && 
      new Date(operation.encaissement_date) < new Date(operation.date)) {
    errors.push('La date d\'encaissement ne peut pas être antérieure à la date de l\'opération')
  }

  // Validation des cohérences comptables
  if (operation.amount_ht_cents && operation.tva_rate && operation.tva_cents !== undefined) {
    const expectedTvaCents = Math.round(operation.amount_ht_cents * operation.tva_rate / 100)
    if (Math.abs(operation.tva_cents - expectedTvaCents) > 1) {
      errors.push('Incohérence dans le calcul TVA')
    }
  }

  if (operation.amount_ht_cents && operation.tva_cents && operation.amount_ttc_cents) {
    if (Math.abs((operation.amount_ht_cents + operation.tva_cents) - operation.amount_ttc_cents) > 1) {
      errors.push('Incohérence HT + TVA ≠ TTC')
    }
  }

  // Validation des seuils réglementaires français
  if (operation.amount_ht_cents) {
    const amountEuros = operation.amount_ht_cents / 100
    
    // Seuil franchise en base (micro-entreprise prestations)
    if (operation.sens === 'vente' && amountEuros > 85800 && operation.tva_rate === 0) {
      errors.push('Montant dépassant le seuil de franchise en base avec TVA à 0%')
    }
    
    // Seuil de déclaration d'existence (montant très élevé)
    if (amountEuros > 500000) {
      errors.push('Montant exceptionnellement élevé - vérification requise')
    }
  }

  return errors
}

/**
 * Crée une opération à partir des données de formulaire
 */
export function createOperationFromForm(formData: any): CreateOperationDto {
  const amountHtCents = Math.round(parseFloat(formData.amount_ht) * 100)
  const tvaRate = parseFloat(formData.tva_rate)
  
  return {
    label: formData.label.trim(),
    sens: formData.sens,
    amount_ht_cents: amountHtCents,
    tva_rate: tvaRate,
    tva_sur_encaissements: formData.tva_sur_encaissements,
    date: formData.date,
    encaissement_date: formData.encaissement_date || undefined,
    category: formData.category?.trim() || undefined,
    client_supplier: formData.client_supplier?.trim() || undefined,
    reference: formData.reference?.trim() || undefined,
    payment_due_date: formData.payment_due_date || undefined,
    notes: formData.notes?.trim() || undefined,
    receipt_path: formData.receipt_path?.trim() || undefined
  }
}

// =============================================================================
// MIGRATION EN MASSE
// =============================================================================

/**
 * Migre toutes les invoices et expenses d'une période vers operations
 */
export function migratePeriodToOperations(
  invoices: Invoice[],
  expenses: Expense[]
): Operation[] {
  const operations: Operation[] = []

  // Convertir les factures
  invoices.forEach(invoice => {
    try {
      operations.push(invoiceToOperation(invoice))
    } catch (error) {
      console.warn(`Erreur migration invoice ${invoice.id}:`, error)
    }
  })

  // Convertir les dépenses
  expenses.forEach(expense => {
    try {
      operations.push(expenseToOperation(expense))
    } catch (error) {
      console.warn(`Erreur migration expense ${expense.id}:`, error)
    }
  })

  // Trier par date décroissante
  return operations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// =============================================================================
// UTILITAIRES DE FILTRAGE
// =============================================================================

/**
 * Filtre les opérations par sens
 */
export function filterOperationsBySens(operations: Operation[], sens: 'achat' | 'vente'): Operation[] {
  return operations.filter(op => op.sens === sens)
}

/**
 * Filtre les opérations pour une période donnée
 */
export function filterOperationsForPeriod(operations: Operation[], periodKey: string): Operation[] {
  return operations.filter(op => op.date.startsWith(periodKey))
}

/**
 * Calcule le total HT des opérations
 */
export function calculateOperationsTotal(operations: Operation[]): {
  total_ht_cents: number
  total_ttc_cents: number
  total_tva_cents: number
  count: number
} {
  return operations.reduce((acc, op) => ({
    total_ht_cents: acc.total_ht_cents + op.amount_ht_cents,
    total_ttc_cents: acc.total_ttc_cents + op.amount_ttc_cents,
    total_tva_cents: acc.total_tva_cents + op.tva_cents,
    count: acc.count + 1
  }), {
    total_ht_cents: 0,
    total_ttc_cents: 0,
    total_tva_cents: 0,
    count: 0
  })
}