import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useState, useCallback } from 'react'
import type { 
  RouteKey, Period, Invoice, Expense, Operation, CreateOperationDto, AppSettings, DashboardData, PeriodStatus,
  MonthDeclaration, MultiPeriodDashboardData, TreasuryProjection, VatCalculation,
  UrssafCalculation, DashboardAlert, ValidationError, DeclarationWorkflowStep,
  YearlySummary, OperationStatus
} from '../types'
import { 
  calculateVatForPeriod, 
  calculateUrssafForPeriod, 
  generateTreasuryProjection,
  generateDashboardAlerts,
  validatePeriodData 
} from '../lib/vatCalculations'
import { generateDeclarationExports } from '../lib/exportUtils'
import { 
  migratePeriodToOperations,
  invoiceToOperation,
  expenseToOperation,
  operationToInvoice,
  operationToExpense,
  calculateOperationAmounts,
  validateOperation,
  createOperationFromForm
} from '../lib/operationMigration'
import {
  calculateVatForOperations,
  calculateUrssafForOperations,
  analyzeOperationsForVat,
  validatePeriodOperations,
  generateOperationsStats
} from '../lib/operationVatCalculations'
import { TauriClient } from '../lib/tauriClient'

// Utility functions
const getMonthLabel = (year: number, month: number): string => {
  const date = new Date(year, month - 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

const getPeriodKey = (year: number, month: number): string => {
  return `${year}-${month.toString().padStart(2, '0')}`
}

const generatePeriods = (): Period[] => {
  const periods: Period[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // Generate periods from January of current year to December of next year
  for (let year = currentYear; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      periods.push({
        year,
        month,
        label: getMonthLabel(year, month),
        key: getPeriodKey(year, month)
      })
    }
  }
  
  return periods
}

// Main store interface
interface AppStore {
  // Navigation
  currentRoute: RouteKey
  setCurrentRoute: (route: RouteKey) => void
  
  // Period management
  currentPeriod: Period
  availablePeriods: Period[]
  selectedPeriods: string[]  // For multi-period dashboard
  setCurrentPeriod: (period: Period) => void
  setSelectedPeriods: (periods: string[]) => void
  
  // =============================================================================
  // NOUVEAU MODÈLE UNIFIÉ - OPERATIONS
  // =============================================================================
  
  // Data stores - Nouveau modèle unifié
  operations: Record<string, Operation[]>  // period -> operations (ventes + achats)
  
  // Actions for operations
  addOperation: (operation: CreateOperationDto) => Promise<void>
  updateOperation: (operationId: string, updates: Partial<Operation>) => Promise<void>
  deleteOperation: (operationId: string) => Promise<void>
  getOperationsForPeriod: (periodKey: string) => Operation[]
  loadOperationsForPeriod: (periodKey: string) => Promise<Operation[]>
  getOperationsBySens: (periodKey: string, operation_type: 'purchase' | 'sale') => Operation[]
  
  // Migration et compatibilité
  migratePeriodData: (periodKey: string) => void  // Migre Invoice/Expense -> Operation
  
  // =============================================================================
  // MODÈLE HÉRITÉ (DEPRECATED - Maintenu pour compatibilité)
  // =============================================================================
  
  // Data stores - Ancien modèle (deprecated)
  invoices: Record<string, Invoice[]>  // period -> invoices
  expenses: Record<string, Expense[]>  // period -> expenses
  periodStatuses: Record<string, PeriodStatus> // period -> status
  monthDeclarations: Record<string, MonthDeclaration> // period -> declaration
  
  // Actions for invoices (deprecated)
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (invoiceId: string, invoice: Partial<Invoice>) => void
  deleteInvoice: (invoiceId: string) => void
  getInvoicesForPeriod: (periodKey: string) => Invoice[]
  
  // Actions for expenses (deprecated)
  addExpense: (expense: Expense) => void
  updateExpense: (expenseId: string, expense: Partial<Expense>) => void
  deleteExpense: (expenseId: string) => void
  getExpensesForPeriod: (periodKey: string) => Expense[]
  
  // Declaration workflow actions
  initializeDeclaration: (periodKey: string) => void
  updateDeclarationStep: (periodKey: string, step: DeclarationWorkflowStep) => void
  addValidationError: (periodKey: string, error: ValidationError) => void
  removeValidationError: (periodKey: string, errorCode: string) => void
  calculateVat: (periodKey: string) => VatCalculation
  calculateUrssaf: (periodKey: string) => UrssafCalculation
  generateExportData: (periodKey: string) => void
  closeMonth: (periodKey: string) => void
  
  // Settings
  settings: AppSettings
  updateSettings: (settings: Partial<AppSettings>) => void
  
  // Modal states
  isDeclarationModalOpen: boolean
  setDeclarationModalOpen: (open: boolean) => void
  
  // Theme (fixed to dark mode)
  theme: 'dark'
  
  // Multi-period dashboard
  getMultiPeriodDashboardData: (periods: string[]) => MultiPeriodDashboardData
  getTreasuryProjection: (basePeriods: string[]) => TreasuryProjection
  getDashboardAlerts: () => DashboardAlert[]
  
  // Computed helpers
  getDashboardData: (periodKey: string) => DashboardData
  getPeriodStatus: (periodKey: string) => PeriodStatus
  getMonthDeclaration: (periodKey: string) => MonthDeclaration | undefined
}

// Default settings
const defaultSettings: AppSettings = {
  urssaf_rate: 22, // Deprecated - kept for compatibility
  tva_declaration_day: 12,
  tva_payment_day: 20,
  urssaf_payment_day: 5,
  default_tva_rate: 20,
  company_name: '',
  siret: '',
  
  // URSSAF rates according to French regulations (2025)
  urssaf_rates: {
    prestations_bic: 21.20,         // Prestations de services BIC
    vente_marchandises_bic: 12.30,  // Vente de marchandises BIC
    prestations_bnc: 24.60,         // Prestations de services BNC
    formation_professionnelle: 0.30, // Formation prof. obligatoire
    taxe_cma_vente: 0.22,           // Taxe CMA vente obligatoire cas général
    taxe_cma_prestation: 0.48       // Taxe CMA prestation oblig cas général
  },
  
  treasury_buffer_cents: 500000, // 5000€ de sécurité
  auto_generate_projections: true,
  projection_confidence_threshold: 0.7,
  alert_days_before_deadline: 7
}

// Get current period (August 2025 as requested)
const getCurrentPeriod = (): Period => {
  return {
    year: 2025,
    month: 8,
    label: 'Août 2025',
    key: '2025-08'
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Navigation
      currentRoute: 'dashboard',
      setCurrentRoute: (route) => set({ currentRoute: route }),
      
      // Period management
      currentPeriod: getCurrentPeriod(),
      availablePeriods: generatePeriods(),
      setCurrentPeriod: (period) => set({ currentPeriod: period }),
      setSelectedPeriods: (periods) => set({ selectedPeriods: periods }),
      
      // =============================================================================
      // NOUVEAU MODÈLE UNIFIÉ - OPERATIONS DATA STORES
      // =============================================================================
      
      // Data stores - Nouveau modèle unifié
      operations: {},
      
      // =============================================================================
      // MODÈLE HÉRITÉ DATA STORES (DEPRECATED)
      // =============================================================================
      
      // Data stores - Ancien modèle (deprecated)
      invoices: {},
      expenses: {},
      periodStatuses: {},
      monthDeclarations: {},
      selectedPeriods: [],
      
      // Invoice actions
      addInvoice: (invoice) => set((state) => {
        const periodKey = state.currentPeriod.key
        const currentInvoices = state.invoices[periodKey] || []
        return {
          invoices: {
            ...state.invoices,
            [periodKey]: [...currentInvoices, { ...invoice, id: Date.now().toString() }]
          }
        }
      }),
      
      updateInvoice: (invoiceId, updates) => set((state) => {
        const periodKey = state.currentPeriod.key
        const currentInvoices = state.invoices[periodKey] || []
        return {
          invoices: {
            ...state.invoices,
            [periodKey]: currentInvoices.map(inv => 
              inv.id === invoiceId ? { ...inv, ...updates } : inv
            )
          }
        }
      }),
      
      deleteInvoice: (invoiceId) => set((state) => {
        const periodKey = state.currentPeriod.key
        const currentInvoices = state.invoices[periodKey] || []
        return {
          invoices: {
            ...state.invoices,
            [periodKey]: currentInvoices.filter(inv => inv.id !== invoiceId)
          }
        }
      }),
      
      getInvoicesForPeriod: (periodKey) => {
        const state = get()
        return state.invoices[periodKey] || []
      },
      
      // Expense actions
      addExpense: (expense) => set((state) => {
        const periodKey = state.currentPeriod.key
        const currentExpenses = state.expenses[periodKey] || []
        return {
          expenses: {
            ...state.expenses,
            [periodKey]: [...currentExpenses, { ...expense, id: Date.now().toString() }]
          }
        }
      }),
      
      updateExpense: (expenseId, updates) => set((state) => {
        const periodKey = state.currentPeriod.key
        const currentExpenses = state.expenses[periodKey] || []
        return {
          expenses: {
            ...state.expenses,
            [periodKey]: currentExpenses.map(exp => 
              exp.id === expenseId ? { ...exp, ...updates } : exp
            )
          }
        }
      }),
      
      deleteExpense: (expenseId) => set((state) => {
        const periodKey = state.currentPeriod.key
        const currentExpenses = state.expenses[periodKey] || []
        return {
          expenses: {
            ...state.expenses,
            [periodKey]: currentExpenses.filter(exp => exp.id !== expenseId)
          }
        }
      }),
      
      getExpensesForPeriod: (periodKey) => {
        const state = get()
        return state.expenses[periodKey] || []
      },
      
      // =============================================================================
      // NOUVELLES ACTIONS POUR LES OPERATIONS
      // =============================================================================
      
      // Actions for operations - Nouveau modèle unifié avec appels Tauri
      addOperation: async (operationDto) => {
        try {
          const newOperation = await TauriClient.createOperation(operationDto)
          
          set((state) => {
            const periodKey = state.currentPeriod.key
            const currentOperations = state.operations[periodKey] || []
            
            return {
              operations: {
                ...state.operations,
                [periodKey]: [...currentOperations, newOperation]
              }
            }
          })
        } catch (error) {
          console.error('Erreur lors de la création de l\'opération:', error)
          throw error
        }
      },
      
      updateOperation: async (operationId, updates) => {
        try {
          const updatedOperation = await TauriClient.updateOperation(operationId, updates)
          
          set((state) => {
            const periodKey = state.currentPeriod.key
            const currentOperations = state.operations[periodKey] || []
            
            return {
              operations: {
                ...state.operations,
                [periodKey]: currentOperations.map(op => 
                  op.id === operationId ? updatedOperation : op
                )
              }
            }
          })
        } catch (error) {
          console.error('Erreur lors de la mise à jour de l\'opération:', error)
          throw error
        }
      },
      
      deleteOperation: async (operationId) => {
        try {
          await TauriClient.deleteOperation(operationId)
          
          set((state) => {
            const periodKey = state.currentPeriod.key
            const currentOperations = state.operations[periodKey] || []
            
            return {
              operations: {
                ...state.operations,
                [periodKey]: currentOperations.filter(op => op.id !== operationId)
              }
            }
          })
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'opération:', error)
          throw error
        }
      },
      
      getOperationsForPeriod: (periodKey) => {
        const state = get()
        return state.operations[periodKey] || []
      },
      
      loadOperationsForPeriod: async (periodKey) => {
        const state = get()
        
        // Si les opérations sont déjà en cache, les retourner
        if (state.operations[periodKey]) {
          return state.operations[periodKey]
        }
        
        try {
          // Sinon, les récupérer depuis le backend
          const operations = await TauriClient.getOperations(periodKey)
          
          set({
            operations: {
              ...state.operations,
              [periodKey]: operations
            }
          })
          
          return operations
        } catch (error) {
          console.error('Erreur lors du chargement des opérations:', error)
          return []
        }
      },
      
      getOperationsBySens: (periodKey, operation_type) => {
        const state = get()
        const operations = state.operations[periodKey] || []
        // Use compatibility mapping through getter
        return operations.filter(op => {
          const mappedType = op.operation_type === 'sale' ? 'sale' : 'purchase'
          return mappedType === operation_type
        })
      },
      
      // Migration des données existantes vers le backend
      migratePeriodData: async (periodKey) => {
        const state = get()
        
        // Vérifier si la migration est déjà faite
        if (state.operations[periodKey] && state.operations[periodKey].length > 0) {
          return // Déjà migré
        }
        
        try {
          // TEMPORAIRE: Migration locale uniquement (commandes Tauri pas encore implémentées)
          console.log('🔄 Migration locale des données pour', periodKey)
          
          const invoices = state.invoices[periodKey] || []
          const expenses = state.expenses[periodKey] || []
          const operations = migratePeriodToOperations(invoices, expenses)
          
          set({
            operations: {
              ...state.operations,
              [periodKey]: operations
            }
          })
          
          console.log(`✅ Migration locale réussie: ${operations.length} opérations créées`)
        } catch (error) {
          console.error('❌ Erreur lors de la migration locale:', error)
        }
      },
      
      // Settings
      settings: defaultSettings,
      updateSettings: (updates) => set((state) => ({
        settings: { ...state.settings, ...updates }
      })),
      
      // Modal states
      isDeclarationModalOpen: false,
      setDeclarationModalOpen: (open) => set({ isDeclarationModalOpen: open }),
      
      // Theme (fixed to dark mode)
      theme: 'dark',
      
      // Declaration workflow actions
      initializeDeclaration: (periodKey) => set((state) => {
        if (state.monthDeclarations[periodKey]) return {} // Already exists
        
        const invoices = state.getInvoicesForPeriod(periodKey)
        const expenses = state.getExpensesForPeriod(periodKey)
        const validationErrors = validatePeriodData(periodKey, invoices, expenses)
        
        const newDeclaration: MonthDeclaration = {
          period: periodKey,
          current_step: 'data_entry',
          is_bulk_entry: false,
          data_complete: false,
          validation_errors: validationErrors,
          vat_calculation: calculateVatForPeriod(periodKey, invoices, expenses),
          urssaf_calculation: calculateUrssafForPeriod(periodKey, invoices, state.settings.urssaf_rate),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        return {
          monthDeclarations: {
            ...state.monthDeclarations,
            [periodKey]: newDeclaration
          }
        }
      }),
      
      updateDeclarationStep: (periodKey, step) => set((state) => {
        const declaration = state.monthDeclarations[periodKey]
        if (!declaration) return {}
        
        return {
          monthDeclarations: {
            ...state.monthDeclarations,
            [periodKey]: {
              ...declaration,
              current_step: step,
              updated_at: new Date().toISOString()
            }
          }
        }
      }),
      
      addValidationError: (periodKey, error) => set((state) => {
        const declaration = state.monthDeclarations[periodKey]
        if (!declaration) return {}
        
        return {
          monthDeclarations: {
            ...state.monthDeclarations,
            [periodKey]: {
              ...declaration,
              validation_errors: [...declaration.validation_errors, error],
              updated_at: new Date().toISOString()
            }
          }
        }
      }),
      
      removeValidationError: (periodKey, errorCode) => set((state) => {
        const declaration = state.monthDeclarations[periodKey]
        if (!declaration) return {}
        
        return {
          monthDeclarations: {
            ...state.monthDeclarations,
            [periodKey]: {
              ...declaration,
              validation_errors: declaration.validation_errors.filter(err => err.code !== errorCode),
              updated_at: new Date().toISOString()
            }
          }
        }
      }),
      
      calculateVat: (periodKey) => {
        const state = get()
        
        // Nouveau modèle : utiliser les operations si disponibles
        const operations = state.operations[periodKey] || []
        let vatCalculation: VatCalculation
        
        if (operations.length > 0) {
          // Utiliser le nouveau calcul avec operations
          vatCalculation = calculateVatForOperations(periodKey, operations)
        } else {
          // Fallback sur l'ancien modèle si pas encore migré
          const invoices = state.getInvoicesForPeriod(periodKey)
          const expenses = state.getExpensesForPeriod(periodKey)
          vatCalculation = calculateVatForPeriod(periodKey, invoices, expenses)
        }
        
        // Update declaration if exists
        const declaration = state.monthDeclarations[periodKey]
        if (declaration) {
          set({
            monthDeclarations: {
              ...state.monthDeclarations,
              [periodKey]: {
                ...declaration,
                vat_calculation: vatCalculation,
                current_step: declaration.current_step === 'data_entry' ? 'vat_calculation' : declaration.current_step,
                updated_at: new Date().toISOString()
              }
            }
          })
        }
        
        return vatCalculation
      },
      
      calculateUrssaf: (periodKey) => {
        const state = get()
        
        // Nouveau modèle : utiliser les operations si disponibles
        const operations = state.operations[periodKey] || []
        let urssafCalculation: UrssafCalculation
        
        if (operations.length > 0) {
          // Utiliser le nouveau calcul avec operations
          urssafCalculation = calculateUrssafForOperations(periodKey, operations, state.settings.urssaf_rate)
        } else {
          // Fallback sur l'ancien modèle si pas encore migré
          const invoices = state.getInvoicesForPeriod(periodKey)
          urssafCalculation = calculateUrssafForPeriod(periodKey, invoices, state.settings.urssaf_rate)
        }
        
        // Update declaration if exists
        const declaration = state.monthDeclarations[periodKey]
        if (declaration) {
          set({
            monthDeclarations: {
              ...state.monthDeclarations,
              [periodKey]: {
                ...declaration,
                urssaf_calculation: urssafCalculation,
                current_step: declaration.current_step === 'vat_calculation' ? 'urssaf_calculation' : declaration.current_step,
                updated_at: new Date().toISOString()
              }
            }
          })
        }
        
        return urssafCalculation
      },
      
      generateExportData: (periodKey) => set((state) => {
        const declaration = state.monthDeclarations[periodKey]
        if (!declaration) return {}
        
        const invoices = state.getInvoicesForPeriod(periodKey)
        const expenses = state.getExpensesForPeriod(periodKey)
        
        const exportData = generateDeclarationExports(
          periodKey,
          declaration.vat_calculation,
          declaration.urssaf_calculation,
          invoices,
          expenses
        )
        
        return {
          monthDeclarations: {
            ...state.monthDeclarations,
            [periodKey]: {
              ...declaration,
              export_data: exportData,
              current_step: 'export_ready',
              updated_at: new Date().toISOString()
            }
          }
        }
      }),
      
      closeMonth: (periodKey) => set((state) => {
        const declaration = state.monthDeclarations[periodKey]
        if (!declaration) return {}
        
        const now = new Date().toISOString()
        
        return {
          monthDeclarations: {
            ...state.monthDeclarations,
            [periodKey]: {
              ...declaration,
              current_step: 'closed',
              closed_at: now,
              updated_at: now
            }
          },
          periodStatuses: {
            ...state.periodStatuses,
            [periodKey]: {
              ...state.periodStatuses[periodKey],
              is_closed: true,
              closed_at: now
            }
          }
        }
      }),
      
      // Multi-period dashboard
      getMultiPeriodDashboardData: (periods) => {
        const state = get()
        const periodData: Record<string, DashboardData> = {}
        
        periods.forEach(period => {
          periodData[period] = state.getDashboardData(period)
        })
        
        // Calculate treasury projection
        const treasuryProjection = generateTreasuryProjection(
          periods,
          state.invoices,
          state.expenses,
          { 
            urssaf_rate: state.settings.urssaf_rate,
            treasury_buffer_cents: state.settings.treasury_buffer_cents
          }
        )
        
        // Calculate yearly summary
        const currentYear = new Date().getFullYear()
        const completedPeriods = periods.filter(period => {
          const declaration = state.monthDeclarations[period]
          return declaration?.current_step === 'closed'
        })
        
        const yearlyRevenue = completedPeriods.reduce((sum, period) => {
          return sum + periodData[period].encaissements_ht_cents
        }, 0)
        
        const yearlyExpenses = completedPeriods.reduce((sum, period) => {
          return sum + periodData[period].depenses_ttc_cents
        }, 0)
        
        const yearlyVat = completedPeriods.reduce((sum, period) => {
          return sum + periodData[period].tva_due_cents
        }, 0)
        
        const yearlyUrssaf = completedPeriods.reduce((sum, period) => {
          return sum + periodData[period].urssaf_due_cents
        }, 0)
        
        const yearlySummary: YearlySummary = {
          year: currentYear,
          completed_periods: completedPeriods,
          total_revenue_cents: yearlyRevenue,
          total_expenses_cents: yearlyExpenses,
          total_vat_paid_cents: yearlyVat,
          total_urssaf_paid_cents: yearlyUrssaf,
          average_monthly_revenue_cents: completedPeriods.length > 0 ? Math.round(yearlyRevenue / completedPeriods.length) : 0,
          growth_rate: 0 // TODO: compare with previous year
        }
        
        // Get alerts
        const vatCalculations: Record<string, VatCalculation> = {}
        periods.forEach(period => {
          const declaration = state.monthDeclarations[period]
          if (declaration) {
            vatCalculations[period] = declaration.vat_calculation
          }
        })
        
        const alerts = generateDashboardAlerts(state.invoices, vatCalculations, state.settings)
        
        return {
          periods,
          current_period: state.currentPeriod.key,
          period_data: periodData,
          treasury_projection: treasuryProjection,
          yearly_summary: yearlySummary,
          alerts
        }
      },
      
      getTreasuryProjection: (basePeriods) => {
        const state = get()
        return generateTreasuryProjection(
          basePeriods,
          state.invoices,
          state.expenses,
          {
            urssaf_rate: state.settings.urssaf_rate,
            treasury_buffer_cents: state.settings.treasury_buffer_cents
          }
        )
      },
      
      getDashboardAlerts: () => {
        const state = get()
        const vatCalculations: Record<string, VatCalculation> = {}
        
        Object.entries(state.monthDeclarations).forEach(([period, declaration]) => {
          vatCalculations[period] = declaration.vat_calculation
        })
        
        return generateDashboardAlerts(state.invoices, vatCalculations, state.settings)
      },
      
      // Computed helpers
      getDashboardData: (periodKey) => {
        const state = get()
        
        // Nouveau modèle : utiliser les operations si disponibles
        const operations = state.operations[periodKey] || []
        
        let encaissements: number, depenses: number, vatCalc: VatCalculation, urssafCalc: UrssafCalculation
        let operationsCount = 0, ventesCount = 0, achatsCount = 0
        
        if (operations.length > 0) {
          // === NOUVEAU MODÈLE OPERATION ===
          
          // Calcul des encaissements (ventes)
          const ventes = operations.filter(op => op.operation_type === 'sale')
          encaissements = ventes.reduce((sum, op) => {
            let included = false
            
            if (op.vat_on_payments) {
              // TVA sur encaissements : date d'encaissement
              included = !!op.payment_date && op.payment_date.startsWith(periodKey)
            } else {
              // TVA sur facturation : date de facturation
              included = op.invoice_date.startsWith(periodKey)
            }
            
            return included ? sum + op.amount_ht_cents : sum
          }, 0)
          
          // Calcul des dépenses (achats)
          const achats = operations.filter(op => op.operation_type === 'purchase')
          depenses = achats
            .filter(op => op.invoice_date.startsWith(periodKey))
            .reduce((sum, op) => sum + op.amount_ttc_cents, 0)
          
          // Calculs TVA et URSSAF avec nouveau modèle
          vatCalc = calculateVatForOperations(periodKey, operations)
          urssafCalc = calculateUrssafForOperations(periodKey, operations, state.settings.urssaf_rate)
          
          // Statistiques
          operationsCount = operations.length
          ventesCount = ventes.length
          achatsCount = achats.length
          
        } else {
          // === ANCIEN MODÈLE (DEPRECATED) ===
          const invoices = state.getInvoicesForPeriod(periodKey)
          const expenses = state.getExpensesForPeriod(periodKey)
          
          // Calculate encaissements using old service/goods logic
          encaissements = invoices.reduce((sum, invoice) => {
            let included = false
            
            if (invoice.is_service) {
              // Prestations: revenue on payment
              included = !!invoice.payment_date && invoice.payment_date.startsWith(periodKey)
            } else {
              // Biens: revenue on delivery (or invoice if no delivery date)
              const referenceDate = invoice.delivery_date || invoice.issued_date
              included = referenceDate.startsWith(periodKey)
            }
            
            return included ? sum + invoice.amount_ht_cents : sum
          }, 0)
          
          // Calculate total expenses for period
          depenses = expenses
            .filter(exp => exp.expense_date.startsWith(periodKey))
            .reduce((sum, exp) => sum + exp.amount_ttc_cents, 0)
          
          // Use old VAT calculation
          vatCalc = calculateVatForPeriod(periodKey, invoices, expenses)
          urssafCalc = calculateUrssafForPeriod(periodKey, invoices, state.settings.urssaf_rate)
          
          // Legacy counts
          operationsCount = invoices.length + expenses.length
          ventesCount = invoices.length
          achatsCount = expenses.length
        }
        
        // Available amount after taxes
        const disponible = encaissements - vatCalc.vat_due_cents - urssafCalc.urssaf_due_cents - depenses - state.settings.treasury_buffer_cents
        
        // Generate deadlines
        const nextDeadlines = []
        const now = new Date()
        const declaration = state.monthDeclarations[periodKey]
        
        if (declaration) {
          if (new Date(vatCalc.declaration_date) > now) {
            nextDeadlines.push({
              type: 'TVA_DECLARATION' as const,
              date: vatCalc.declaration_date,
              amount_cents: 0,
              period: periodKey,
              status: 'upcoming' as const
            })
          }
          
          if (new Date(vatCalc.payment_date) > now && vatCalc.vat_due_cents > 0) {
            nextDeadlines.push({
              type: 'TVA_PAYMENT' as const,
              date: vatCalc.payment_date,
              amount_cents: vatCalc.vat_due_cents,
              period: periodKey,
              status: 'upcoming' as const
            })
          }
          
          if (new Date(urssafCalc.payment_date) > now && urssafCalc.urssaf_due_cents > 0) {
            nextDeadlines.push({
              type: 'URSSAF_PAYMENT' as const,
              date: urssafCalc.payment_date,
              amount_cents: urssafCalc.urssaf_due_cents,
              period: periodKey,
              status: 'upcoming' as const
            })
          }
        }
        
        return {
          period: periodKey,
          encaissements_ht_cents: Math.round(encaissements),
          depenses_ttc_cents: Math.round(depenses),
          tva_due_cents: vatCalc.vat_due_cents,
          urssaf_due_cents: urssafCalc.urssaf_due_cents,
          disponible_cents: Math.round(disponible),
          
          // Nouveau modèle avec operations
          operations_count: operationsCount,
          ventes_count: ventesCount,
          achats_count: achatsCount,
          
          next_deadlines: nextDeadlines
        }
      },
      
      getPeriodStatus: (periodKey) => {
        const state = get()
        const invoices = state.getInvoicesForPeriod(periodKey)
        const expenses = state.getExpensesForPeriod(periodKey)
        const declaration = state.monthDeclarations[periodKey]
        
        return {
          period: periodKey,
          invoices_complete: invoices.length > 0,
          expenses_complete: expenses.length > 0,
          vat_calculated: !!declaration?.vat_calculation,
          urssaf_calculated: !!declaration?.urssaf_calculation,
          declarations_ready: declaration?.current_step === 'export_ready' || declaration?.current_step === 'declared',
          is_closed: declaration?.current_step === 'closed'
        }
      },
      
      getMonthDeclaration: (periodKey) => {
        const state = get()
        return state.monthDeclarations[periodKey]
      }
    }),
    {
      name: 'jla-cash-planner-store',
      partialize: (state) => ({
        // Nouveau modèle unifié
        operations: state.operations,
        
        // Ancien modèle (pour compatibilité)
        invoices: state.invoices,
        expenses: state.expenses,
        
        // Autres données
        settings: state.settings,
        currentPeriod: state.currentPeriod,
        selectedPeriods: state.selectedPeriods,
        monthDeclarations: state.monthDeclarations,
        periodStatuses: state.periodStatuses,
        theme: state.theme
      })
    }
  )
)

// Utility hooks
export const useCurrentPeriod = () => useAppStore(state => state.currentPeriod)
export const useCurrentRoute = () => useAppStore(state => state.currentRoute)
export const useSelectedPeriods = () => useAppStore(state => ({
  periods: state.selectedPeriods,
  setPeriods: state.setSelectedPeriods
}))
export const useDeclarationModal = () => useAppStore(state => ({
  isOpen: state.isDeclarationModalOpen,
  setOpen: state.setDeclarationModalOpen
}))
export const useTheme = () => useAppStore(state => ({
  theme: state.theme
}))

// Declaration workflow hooks
export const useDeclarationWorkflow = (periodKey: string) => useAppStore(state => ({
  declaration: state.monthDeclarations[periodKey],
  initializeDeclaration: () => state.initializeDeclaration(periodKey),
  updateStep: (step: DeclarationWorkflowStep) => state.updateDeclarationStep(periodKey, step),
  calculateVat: () => state.calculateVat(periodKey),
  calculateUrssaf: () => state.calculateUrssaf(periodKey),
  generateExport: () => state.generateExportData(periodKey),
  closeMonth: () => state.closeMonth(periodKey)
}))

// Multi-period dashboard hooks
export const useMultiPeriodDashboard = () => useAppStore(state => ({
  selectedPeriods: state.selectedPeriods,
  setSelectedPeriods: state.setSelectedPeriods,
  getDashboardData: (periods: string[]) => state.getMultiPeriodDashboardData(periods),
  getTreasuryProjection: (periods: string[]) => state.getTreasuryProjection(periods),
  getAlerts: () => state.getDashboardAlerts()
}))

// Enhanced data hooks
export const useEnhancedInvoices = (periodKey: string) => useAppStore(state => ({
  invoices: state.getInvoicesForPeriod(periodKey),
  addInvoice: state.addInvoice,
  updateInvoice: state.updateInvoice,
  deleteInvoice: state.deleteInvoice
}))

export const useEnhancedExpenses = (periodKey: string) => useAppStore(state => ({
  expenses: state.getExpensesForPeriod(periodKey),
  addExpense: state.addExpense,
  updateExpense: state.updateExpense,
  deleteExpense: state.deleteExpense
}))

// =============================================================================
// NOUVEAUX HOOKS POUR LE MODÈLE OPERATION UNIFIÉ
// =============================================================================

// Hook principal pour les opérations avec gestion asynchrone
export const useOperations = (periodKey: string) => {
  const {
    operations,
    addOperation,
    updateOperation,
    deleteOperation,
    migratePeriodData,
    loadOperationsForPeriod,
    getOperationsBySens
  } = useAppStore()
  
  // Chargement initial des opérations
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const loadOperations = useCallback(async () => {
    if (isLoading) return
    
    try {
      setIsLoading(true)
      setError(null)
      await loadOperationsForPeriod(periodKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [periodKey, loadOperationsForPeriod, isLoading])
  
  const currentOperations = operations[periodKey] || []
  const ventes = currentOperations.filter(op => op.operation_type === 'sale')
  const achats = currentOperations.filter(op => op.operation_type === 'purchase')
  
  return {
    operations: currentOperations,
    ventes,
    achats,
    isLoading,
    error,
    loadOperations,
    addOperation,
    updateOperation,
    deleteOperation,
    migratePeriod: () => migratePeriodData(periodKey)
  }
}

// Hook spécialisé pour les ventes
export const useVentes = (periodKey: string) => {
  const { operations, addOperation, updateOperation, deleteOperation } = useAppStore()
  
  const ventes = (operations[periodKey] || []).filter(op => op.operation_type === 'sale')
  
  return {
    ventes,
    addVente: (vente: Omit<CreateOperationDto, 'operation_type'>) => addOperation({ ...vente, operation_type: 'sale' }),
    updateOperation,
    deleteOperation
  }
}

// Hook spécialisé pour les achats  
export const useAchats = (periodKey: string) => {
  const { operations, addOperation, updateOperation, deleteOperation } = useAppStore()
  
  const achats = (operations[periodKey] || []).filter(op => op.operation_type === 'purchase')
  
  return {
    achats,
    addAchat: (achat: Omit<CreateOperationDto, 'operation_type'>) => addOperation({ ...achat, operation_type: 'purchase' }),
    updateOperation,
    deleteOperation
  }
}

// Hook pour la migration progressive
export const useMigration = () => useAppStore(state => ({
  migratePeriodData: state.migratePeriodData,
  operations: state.operations,
  invoices: state.invoices,
  expenses: state.expenses
}))

// Force dark theme on initialization
if (typeof window !== 'undefined') {
  document.documentElement.classList.add('dark')
  document.body.classList.add('dark')
}