/**
 * Utilitaires de formulaire pour le modèle Operation unifié
 * 
 * Fournit des fonctions pour :
 * - Conversion des données de formulaire
 * - Validation des champs
 * - Calculs automatiques
 * - Gestion des états de formulaire
 */

import type { 
  Operation, CreateOperationDto, OperationFormData, OperationStatus,
  ValidationError
} from '../types'
import { calculateOperationAmounts, validateOperation } from './operationMigration'

// =============================================================================
// CONVERSION FORMULAIRE → DTO
// =============================================================================

/**
 * Convertit les données de formulaire en DTO pour création d'opération
 */
export const formDataToCreateDto = (formData: OperationFormData): CreateOperationDto => {
  const amountHtCents = Math.round(parseFloat(formData.amount_ht || '0') * 100)
  const tvaRate = parseFloat(formData.tva_rate || '0')
  
  return {
    label: formData.label.trim(),
    sens: formData.sens,
    amount_ht_cents: amountHtCents,
    tva_rate: tvaRate,
    tva_sur_encaissements: formData.tva_sur_encaissements,
    date: formData.date,
    encaissement_date: formData.encaissement_date?.trim() || undefined,
    category: formData.category?.trim() || undefined,
    client_supplier: formData.client_supplier?.trim() || undefined,
    reference: formData.reference?.trim() || undefined,
    payment_due_date: formData.payment_due_date?.trim() || undefined,
    notes: formData.notes?.trim() || undefined,
    receipt_path: formData.receipt_path?.trim() || undefined
  }
}

/**
 * Convertit une Operation existante en données de formulaire pour édition
 */
export const operationToFormData = (operation: Operation): OperationFormData => {
  return {
    label: operation.label,
    sens: operation.sens,
    amount_ht: (operation.amount_ht_cents / 100).toFixed(2),
    tva_rate: operation.tva_rate.toString(),
    tva_sur_encaissements: operation.tva_sur_encaissements,
    date: operation.date,
    encaissement_date: operation.encaissement_date || '',
    category: operation.category || '',
    client_supplier: operation.client_supplier || '',
    reference: operation.reference || '',
    payment_due_date: operation.payment_due_date || '',
    notes: operation.notes || '',
    receipt_path: operation.receipt_path || ''
  }
}

// =============================================================================
// CALCULS DYNAMIQUES DE FORMULAIRE
// =============================================================================

/**
 * Interface pour les calculs de formulaire
 */
export interface OperationFormCalculation {
  amount_ht_cents: number
  amount_ttc_cents: number
  tva_cents: number
  amount_ht_display: string
  amount_ttc_display: string
  tva_display: string
  is_valid: boolean
  errors: string[]
}

/**
 * Calcule les montants en temps réel pendant la saisie
 */
export const calculateFormAmounts = (
  amountHt: string, 
  tvaRate: string
): OperationFormCalculation => {
  const amountHtNum = parseFloat(amountHt || '0')
  const tvaRateNum = parseFloat(tvaRate || '0')
  
  const errors: string[] = []
  
  // Validation basique
  if (isNaN(amountHtNum) || amountHtNum < 0) {
    errors.push('Montant HT invalide')
  }
  
  if (isNaN(tvaRateNum) || tvaRateNum < 0 || tvaRateNum > 30) {
    errors.push('Taux TVA invalide (0-30%)')
  }
  
  // Calculs si données valides
  let amounts = { amount_ht_cents: 0, amount_ttc_cents: 0, tva_cents: 0 }
  if (errors.length === 0) {
    const amountHtCents = Math.round(amountHtNum * 100)
    amounts = calculateOperationAmounts(amountHtCents, tvaRateNum)
  }
  
  return {
    ...amounts,
    amount_ht_display: formatEuros(amounts.amount_ht_cents),
    amount_ttc_display: formatEuros(amounts.amount_ttc_cents),
    tva_display: formatEuros(amounts.tva_cents),
    is_valid: errors.length === 0 && amountHtNum > 0,
    errors
  }
}

// =============================================================================
// VALIDATION DE FORMULAIRE AVANCÉE
// =============================================================================

/**
 * Interface pour les résultats de validation de formulaire
 */
export interface OperationFormValidation {
  is_valid: boolean
  field_errors: Record<string, string[]>
  global_errors: string[]
  warnings: string[]
}

/**
 * Valide un formulaire d'opération avec règles métier françaises
 */
export const validateOperationForm = (formData: OperationFormData): OperationFormValidation => {
  const fieldErrors: Record<string, string[]> = {}
  const globalErrors: string[] = []
  const warnings: string[] = []
  
  // Validation des champs obligatoires
  if (!formData.label?.trim()) {
    fieldErrors.label = ['Le libellé est obligatoire']
  }
  
  if (!formData.sens) {
    fieldErrors.sens = ['Le type d\'opération est obligatoire']
  }
  
  if (!formData.date) {
    fieldErrors.date = ['La date est obligatoire']
  }
  
  if (!formData.amount_ht?.trim()) {
    fieldErrors.amount_ht = ['Le montant HT est obligatoire']
  }
  
  if (!formData.tva_rate?.trim()) {
    fieldErrors.tva_rate = ['Le taux de TVA est obligatoire']
  }
  
  // Validation des montants
  const amountHt = parseFloat(formData.amount_ht || '0')
  if (formData.amount_ht && (isNaN(amountHt) || amountHt <= 0)) {
    fieldErrors.amount_ht = [...(fieldErrors.amount_ht || []), 'Le montant HT doit être positif']
  }
  
  const tvaRate = parseFloat(formData.tva_rate || '0')
  if (formData.tva_rate && (isNaN(tvaRate) || tvaRate < 0 || tvaRate > 30)) {
    fieldErrors.tva_rate = [...(fieldErrors.tva_rate || []), 'Le taux de TVA doit être entre 0 et 30%']
  }
  
  // Validation spécifique aux achats
  if (formData.sens === 'achat') {
    if (!formData.category?.trim()) {
      fieldErrors.category = ['La catégorie est obligatoire pour les achats']
    }
  }
  
  // Validation TVA sur encaissements
  if (formData.tva_sur_encaissements) {
    if (!formData.encaissement_date?.trim()) {
      fieldErrors.encaissement_date = ['La date d\'encaissement est obligatoire pour la TVA sur encaissements']
    } else if (formData.date && formData.encaissement_date) {
      const operationDate = new Date(formData.date)
      const encaissementDate = new Date(formData.encaissement_date)
      
      if (encaissementDate < operationDate) {
        fieldErrors.encaissement_date = [...(fieldErrors.encaissement_date || []), 'La date d\'encaissement ne peut pas être antérieure à la date d\'opération']
      }
      
      // Avertissement si encaissement très éloigné
      const daysDiff = Math.abs(encaissementDate.getTime() - operationDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > 90) {
        warnings.push('Délai d\'encaissement supérieur à 90 jours')
      }
    }
  }
  
  // Validation des dates
  if (formData.date) {
    const operationDate = new Date(formData.date)
    const now = new Date()
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    
    if (operationDate < oneYearAgo) {
      warnings.push('Date d\'opération très ancienne (plus d\'un an)')
    }
    
    if (operationDate > oneYearFromNow) {
      fieldErrors.date = [...(fieldErrors.date || []), 'La date ne peut pas être si éloignée dans le futur']
    }
  }
  
  // Validation de la date d'échéance
  if (formData.payment_due_date && formData.date) {
    const dueDate = new Date(formData.payment_due_date)
    const operationDate = new Date(formData.date)
    
    if (dueDate < operationDate) {
      fieldErrors.payment_due_date = ['La date d\'échéance ne peut pas être antérieure à la date d\'opération']
    }
  }
  
  // Validation des montants avec seuils réglementaires
  if (amountHt > 0) {
    // Seuil TVA (franchise en base = 85 800€ pour prestations)
    if (amountHt > 85800 && formData.sens === 'vente' && tvaRate === 0) {
      warnings.push('Montant élevé avec TVA à 0% : vérifiez votre régime fiscal')
    }
    
    // Seuil déclaratif (10 000€)
    if (amountHt >= 10000) {
      warnings.push('Opération ≥ 10 000€ : obligations déclaratives spécifiques')
    }
  }
  
  return {
    is_valid: Object.keys(fieldErrors).length === 0 && globalErrors.length === 0,
    field_errors: fieldErrors,
    global_errors: globalErrors,
    warnings
  }
}

// =============================================================================
// UTILITAIRES DE FORMATAGE
// =============================================================================

/**
 * Formate un montant en centimes vers un affichage en euros
 */
export const formatEuros = (cents: number): string => {
  return (cents / 100).toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Formate un montant en centimes vers une chaîne de saisie (2 décimales)
 */
export const formatEurosInput = (cents: number): string => {
  return (cents / 100).toFixed(2)
}

/**
 * Parse une chaîne de montant vers des centimes
 */
export const parseEurosInput = (value: string): number => {
  const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.')
  const amount = parseFloat(cleaned)
  return isNaN(amount) ? 0 : Math.round(amount * 100)
}

// =============================================================================
// GESTION DES VALEURS PAR DÉFAUT
// =============================================================================

/**
 * Crée un formulaire d'opération avec valeurs par défaut
 */
export const createDefaultOperationForm = (
  sens: 'achat' | 'vente',
  defaults?: Partial<OperationFormData>
): OperationFormData => {
  const today = new Date().toISOString().split('T')[0]
  
  return {
    label: '',
    sens,
    amount_ht: '',
    tva_rate: '20', // TVA normale par défaut
    tva_sur_encaissements: sens === 'vente', // Ventes sur encaissements par défaut
    date: today,
    encaissement_date: '',
    category: sens === 'achat' ? '' : undefined,
    client_supplier: '',
    reference: '',
    payment_due_date: '',
    notes: '',
    receipt_path: '',
    ...defaults
  }
}

/**
 * Clone un formulaire d'opération pour duplication
 */
export const cloneOperationForm = (
  original: OperationFormData,
  overrides?: Partial<OperationFormData>
): OperationFormData => {
  const today = new Date().toISOString().split('T')[0]
  
  return {
    ...original,
    label: `${original.label} (copie)`,
    date: today,
    encaissement_date: '',
    reference: '', // Reset référence pour éviter les doublons
    ...overrides
  }
}

// =============================================================================
// HELPERS POUR LES COMPOSANTS
// =============================================================================

/**
 * Détermine si l'encaissement est requis basé sur le type d'opération
 */
export const isEncaissementRequired = (formData: Partial<OperationFormData>): boolean => {
  return formData.sens === 'vente' && formData.tva_sur_encaissements === true
}

/**
 * Détermine si la catégorie est requise
 */
export const isCategoryRequired = (formData: Partial<OperationFormData>): boolean => {
  return formData.sens === 'achat'
}

/**
 * Génère une référence automatique basée sur le type et la date
 */
export const generateAutoReference = (sens: 'achat' | 'vente', date: string): string => {
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0')
  const day = dateObj.getDate().toString().padStart(2, '0')
  
  const prefix = sens === 'vente' ? 'FA' : 'AC'
  const timestamp = Date.now().toString().slice(-4) // 4 derniers chiffres du timestamp
  
  return `${prefix}${year}${month}${day}-${timestamp}`
}

/**
 * Calcule la date d'échéance par défaut basée sur la date et le type
 */
export const calculateDefaultDueDate = (
  operationDate: string, 
  sens: 'achat' | 'vente',
  paymentTermDays: number = 30
): string => {
  const date = new Date(operationDate)
  date.setDate(date.getDate() + paymentTermDays)
  return date.toISOString().split('T')[0]
}