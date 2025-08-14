/**
 * Hook de gestion d'état pour les formulaires Operation
 * 
 * Fournit une interface complète pour :
 * - Gestion des données de formulaire
 * - Validation en temps réel
 * - Calculs automatiques
 * - Soumission et gestion des erreurs
 */

import { createSignal, createMemo, createEffect, onCleanup } from 'solid-js'
import type { 
  OperationFormData, CreateOperationDto, Operation, 
  OperationFormValidation, OperationFormCalculation 
} from '../types'
import {
  formDataToCreateDto, operationToFormData, validateOperationForm,
  calculateFormAmounts, createDefaultOperationForm, isEncaissementRequired,
  isCategoryRequired, generateAutoReference, calculateDefaultDueDate
} from '../lib/operationFormUtils'
import { useAppStore } from '../stores/useAppStore'

// =============================================================================
// HOOK PRINCIPAL DE FORMULAIRE OPERATION
// =============================================================================

export interface UseOperationFormOptions {
  operation?: Operation // Pour édition
  sens?: 'achat' | 'vente' // Pour création
  defaults?: Partial<OperationFormData>
  onSubmit?: (operation: CreateOperationDto) => Promise<void> | void
  onCancel?: () => void
  autoCalculate?: boolean // Calcul automatique des montants
  validateOnChange?: boolean // Validation en temps réel
}

export const useOperationForm = (options: UseOperationFormOptions = {}) => {
  const { addOperation, updateOperation, currentPeriod } = useAppStore()
  
  // === STATE MANAGEMENT ===
  
  // Initialisation des données de formulaire
  const [formData, setFormData] = createSignal<OperationFormData>(() => {
    if (options.operation) {
      return operationToFormData(options.operation)
    }
    
    return createDefaultOperationForm(
      options.sens || 'vente',
      {
        date: currentPeriod().key + '-01', // Premier jour de la période courante
        ...options.defaults
      }
    )
  })
  
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [submitError, setSubmitError] = createSignal<string>('')
  const [isDirty, setIsDirty] = createSignal(false)
  
  // === COMPUTED VALUES ===
  
  // Validation du formulaire
  const validation = createMemo(() => {
    if (!options.validateOnChange && !isDirty()) return { is_valid: true, field_errors: {}, global_errors: [], warnings: [] }
    return validateOperationForm(formData())
  })
  
  // Calculs des montants
  const calculations = createMemo(() => {
    if (!options.autoCalculate) return null
    const data = formData()
    return calculateFormAmounts(data.amount_ht, data.tva_rate)
  })
  
  // État des champs requis dynamiques
  const requiredFields = createMemo(() => ({
    encaissement_date: isEncaissementRequired(formData()),
    category: isCategoryRequired(formData())
  }))
  
  // === ACTIONS ===
  
  const updateField = <K extends keyof OperationFormData>(
    field: K,
    value: OperationFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
    setSubmitError('') // Clear previous error
  }
  
  const updateMultipleFields = (updates: Partial<OperationFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
    setSubmitError('')
  }
  
  const resetForm = () => {
    const defaultForm = options.operation 
      ? operationToFormData(options.operation)
      : createDefaultOperationForm(options.sens || 'vente', options.defaults)
    
    setFormData(defaultForm)
    setIsDirty(false)
    setSubmitError('')
  }
  
  const generateReference = () => {
    const data = formData()
    const ref = generateAutoReference(data.sens, data.date)
    updateField('reference', ref)
  }
  
  const calculateDueDate = (paymentTermDays = 30) => {
    const data = formData()
    const dueDate = calculateDefaultDueDate(data.date, data.sens, paymentTermDays)
    updateField('payment_due_date', dueDate)
  }
  
  const submit = async () => {
    // Validation finale
    const validationResult = validateOperationForm(formData())
    if (!validationResult.is_valid) {
      setSubmitError('Veuillez corriger les erreurs du formulaire')
      return
    }
    
    try {
      setIsSubmitting(true)
      setSubmitError('')
      
      const dto = formDataToCreateDto(formData())
      
      if (options.onSubmit) {
        // Callback personnalisé
        await options.onSubmit(dto)
      } else if (options.operation) {
        // Mode édition
        updateOperation(options.operation.id, dto)
      } else {
        // Mode création
        addOperation(dto)
      }
      
      setIsDirty(false)
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      setSubmitError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const cancel = () => {
    if (options.onCancel) {
      options.onCancel()
    } else {
      resetForm()
    }
  }
  
  // === EFFECTS ===
  
  // Auto-génération de référence si vide
  createEffect(() => {
    const data = formData()
    if (data.date && data.sens && !data.reference?.trim()) {
      // Délai pour éviter les cycles
      setTimeout(() => {
        if (!formData().reference?.trim()) {
          generateReference()
        }
      }, 100)
    }
  })
  
  // Auto-calculation de la date d'échéance pour les ventes
  createEffect(() => {
    const data = formData()
    if (data.sens === 'vente' && data.date && !data.payment_due_date?.trim()) {
      setTimeout(() => {
        if (!formData().payment_due_date?.trim()) {
          calculateDueDate()
        }
      }, 100)
    }
  })
  
  return {
    // State
    formData: formData(),
    isSubmitting: isSubmitting(),
    isDirty: isDirty(),
    submitError: submitError(),
    
    // Computed
    validation: validation(),
    calculations: calculations(),
    requiredFields: requiredFields(),
    
    // Actions
    updateField,
    updateMultipleFields,
    resetForm,
    generateReference,
    calculateDueDate,
    submit,
    cancel,
    
    // Helpers
    isValid: validation().is_valid,
    hasErrors: validation().field_errors && Object.keys(validation().field_errors).length > 0,
    hasWarnings: validation().warnings.length > 0
  }
}

// =============================================================================
// HOOKS SPÉCIALISÉS
// =============================================================================

/**
 * Hook spécialisé pour les formulaires de vente
 */
export const useVenteForm = (options: Omit<UseOperationFormOptions, 'sens'> = {}) => {
  return useOperationForm({
    ...options,
    sens: 'vente',
    autoCalculate: true,
    validateOnChange: true
  })
}

/**
 * Hook spécialisé pour les formulaires d'achat
 */
export const useAchatForm = (options: Omit<UseOperationFormOptions, 'sens'> = {}) => {
  return useOperationForm({
    ...options,
    sens: 'achat',
    autoCalculate: true,
    validateOnChange: true
  })
}

// =============================================================================
// HOOK DE LISTE D'OPÉRATIONS
// =============================================================================

export interface UseOperationsListOptions {
  periodKey?: string
  sens?: 'achat' | 'vente'
  autoMigrate?: boolean
}

export const useOperationsList = (options: UseOperationsListOptions = {}) => {
  const store = useAppStore()
  const periodKey = options.periodKey || store.currentPeriod.key
  
  // Migration automatique si nécessaire
  createEffect(() => {
    if (options.autoMigrate) {
      const operations = store.getOperationsForPeriod(periodKey)
      const invoices = store.getInvoicesForPeriod(periodKey)
      const expenses = store.getExpensesForPeriod(periodKey)
      
      if (operations.length === 0 && (invoices.length > 0 || expenses.length > 0)) {
        console.log(`Migration automatique pour la période ${periodKey}`)
        store.migratePeriodData(periodKey)
      }
    }
  })
  
  const operations = createMemo(() => {
    if (options.sens) {
      return store.getOperationsBySens(periodKey, options.sens)
    }
    return store.getOperationsForPeriod(periodKey)
  })
  
  const stats = createMemo(() => {
    const ops = operations()
    const ventes = ops.filter(op => op.sens === 'vente')
    const achats = ops.filter(op => op.sens === 'achat')
    
    return {
      total: ops.length,
      ventes: ventes.length,
      achats: achats.length,
      totalHtCents: ops.reduce((sum, op) => sum + op.amount_ht_cents, 0),
      totalTtcCents: ops.reduce((sum, op) => sum + op.amount_ttc_cents, 0),
      totalTvaCents: ops.reduce((sum, op) => sum + op.tva_cents, 0)
    }
  })
  
  return {
    operations: operations(),
    stats: stats(),
    periodKey,
    
    // Actions
    addOperation: store.addOperation,
    updateOperation: store.updateOperation,
    deleteOperation: store.deleteOperation,
    migratePeriod: () => store.migratePeriodData(periodKey)
  }
}

// =============================================================================
// HOOK DE RECHERCHE ET FILTRAGE
// =============================================================================

export interface UseOperationsFilterOptions {
  operations: Operation[]
  defaultFilters?: OperationFilters
}

export interface OperationFilters {
  search: string
  sens: 'all' | 'achat' | 'vente'
  dateFrom: string
  dateTo: string
  minAmount: string
  maxAmount: string
  categories: string[]
  status: string[]
}

export const useOperationsFilter = (options: UseOperationsFilterOptions) => {
  const [filters, setFilters] = createSignal<OperationFilters>({
    search: '',
    sens: 'all',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    categories: [],
    status: [],
    ...options.defaultFilters
  })
  
  const filteredOperations = createMemo(() => {
    const currentFilters = filters()
    let filtered = options.operations
    
    // Filtre par recherche textuelle
    if (currentFilters.search.trim()) {
      const searchTerm = currentFilters.search.toLowerCase()
      filtered = filtered.filter(op => 
        op.label.toLowerCase().includes(searchTerm) ||
        op.client_supplier?.toLowerCase().includes(searchTerm) ||
        op.reference?.toLowerCase().includes(searchTerm)
      )
    }
    
    // Filtre par sens
    if (currentFilters.sens !== 'all') {
      filtered = filtered.filter(op => op.sens === currentFilters.sens)
    }
    
    // Filtre par dates
    if (currentFilters.dateFrom) {
      filtered = filtered.filter(op => op.date >= currentFilters.dateFrom)
    }
    if (currentFilters.dateTo) {
      filtered = filtered.filter(op => op.date <= currentFilters.dateTo)
    }
    
    // Filtre par montants
    if (currentFilters.minAmount) {
      const minCents = Math.round(parseFloat(currentFilters.minAmount) * 100)
      filtered = filtered.filter(op => op.amount_ht_cents >= minCents)
    }
    if (currentFilters.maxAmount) {
      const maxCents = Math.round(parseFloat(currentFilters.maxAmount) * 100)
      filtered = filtered.filter(op => op.amount_ht_cents <= maxCents)
    }
    
    // Filtre par catégories
    if (currentFilters.categories.length > 0) {
      filtered = filtered.filter(op => 
        op.category && currentFilters.categories.includes(op.category)
      )
    }
    
    // Filtre par statut
    if (currentFilters.status.length > 0) {
      filtered = filtered.filter(op => 
        op.status && currentFilters.status.includes(op.status)
      )
    }
    
    return filtered
  })
  
  const updateFilter = <K extends keyof OperationFilters>(
    key: K,
    value: OperationFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }
  
  const resetFilters = () => {
    setFilters({
      search: '',
      sens: 'all',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      categories: [],
      status: []
    })
  }
  
  return {
    filters: filters(),
    filteredOperations: filteredOperations(),
    updateFilter,
    resetFilters,
    resultCount: filteredOperations().length,
    totalCount: options.operations.length
  }
}