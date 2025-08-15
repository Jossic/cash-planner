import { invoke } from '@tauri-apps/api/core'
import type {
  DashboardData,
  Invoice,
  Expense,
  VatReport,
  UrssafReport,
  Settings,
  CreateInvoiceDto,
  CreateExpenseDto,
  MonthId,
  // Nouveau modèle unifié
  Operation,
  CreateOperationDto,
  VatCalculation,
  UrssafCalculation
} from '../types'

/**
 * Tauri command client for JLA Cash Planner
 * Provides typed interface to Rust backend commands
 * 
 * NOTE: Cette classe supporte à la fois l'ancien modèle (Invoice/Expense)
 * et le nouveau modèle unifié (Operation) pour faciliter la migration.
 */
export class TauriClient {
  // Check if we're running in Tauri environment
  static isTauriEnvironment(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window
  }

  // Safe wrapper for Tauri invoke calls
  static async safeInvoke<T>(command: string, args?: Record<string, any>): Promise<T> {
    if (!this.isTauriEnvironment()) {
      throw new Error(`Tauri environment not available. Command: ${command}`)
    }
    return invoke(command, args)
  }
  // Dashboard operations
  static async getDashboard(month: MonthId): Promise<DashboardData> {
    return invoke('cmd_dashboard', { month: month.year, m: month.month })
  }

  // Invoice operations
  static async getInvoices(month?: MonthId): Promise<Invoice[]> {
    const params = month ? { month: month.year, m: month.month } : { month: null, m: null }
    return invoke('cmd_list_invoices', params)
  }

  static async createInvoice(dto: CreateInvoiceDto): Promise<Invoice> {
    return invoke('cmd_create_invoice_simple', { dto })
  }

  static async updateInvoice(id: string, dto: Partial<CreateInvoiceDto>): Promise<Invoice> {
    return invoke('cmd_update_invoice', { id, dto })
  }

  static async deleteInvoice(id: string): Promise<void> {
    return invoke('cmd_delete_invoice', { id })
  }

  // Expense operations
  static async getExpenses(month?: MonthId): Promise<Expense[]> {
    const params = month ? { month: month.year, m: month.month } : { month: null, m: null }
    return invoke('cmd_list_expenses', params)
  }

  static async createExpense(dto: CreateExpenseDto): Promise<Expense> {
    return invoke('cmd_create_expense', { dto })
  }

  static async updateExpense(id: string, dto: Partial<CreateExpenseDto>): Promise<Expense> {
    return invoke('cmd_update_expense', { id, dto })
  }

  static async deleteExpense(id: string): Promise<void> {
    return invoke('cmd_delete_expense', { id })
  }

  // VAT operations
  static async getVatReport(month: MonthId): Promise<VatReport> {
    return invoke('cmd_prepare_vat', { y: month.year, m: month.month })
  }

  // URSSAF operations
  static async getUrssafReport(month: MonthId): Promise<UrssafReport> {
    return invoke('cmd_prepare_urssaf', { y: month.year, m: month.month })
  }

  // =============================================================================
  // NOUVEAU MODÈLE UNIFIÉ - OPERATIONS
  // =============================================================================

  // Transformation des données brutes du backend en Operation avec propriétés calculées
  private static transformOperation(rawOp: any): Operation {
    const operation = {
      ...rawOp,
      // Ajout des propriétés calculées pour compatibilité
      get date() { return this.date_facture },
      get encaissement_date() { return this.date_encaissement },
      get amount_ht_cents() { return this.montant_ht_cents },
      get amount_ttc_cents() { return this.montant_ttc_cents },
      get tva_cents() { return this.montant_tva_cents }
    } as Operation
    
    return operation
  }

  // Operation operations - Nouveau modèle unifié
  static async getOperations(period?: string): Promise<Operation[]> {
    let rawOperations: any[]
    if (period) {
      const [year, month] = period.split('-').map(Number)
      rawOperations = await invoke('cmd_list_operations', { month: year, m: month })
    } else {
      rawOperations = await invoke('cmd_list_operations', { month: null, m: null })
    }
    
    return rawOperations.map(op => TauriClient.transformOperation(op))
  }

  static async createOperation(dto: CreateOperationDto): Promise<Operation> {
    const rawOperation = await invoke('cmd_create_operation', { dto })
    return TauriClient.transformOperation(rawOperation)
  }

  static async updateOperation(id: string, dto: Partial<CreateOperationDto>): Promise<Operation> {
    const rawOperation = await invoke('cmd_update_operation', { id, dto })
    return TauriClient.transformOperation(rawOperation)
  }

  static async deleteOperation(id: string): Promise<void> {
    return invoke('cmd_delete_operation', { id })
  }

  // VAT calculation with operations
  static async getVatCalculationForOperations(period: string): Promise<VatCalculation> {
    return invoke('cmd_calculate_vat_operations', { period })
  }

  // URSSAF calculation with operations
  static async getUrssafCalculationForOperations(period: string): Promise<UrssafCalculation> {
    return invoke('cmd_calculate_urssaf_operations', { period })
  }

  // Migration utilities
  static async migrateInvoicesToOperations(period: string): Promise<Operation[]> {
    return invoke('cmd_migrate_invoices_to_operations', { period })
  }

  static async migrateExpensesToOperations(period: string): Promise<Operation[]> {
    return invoke('cmd_migrate_expenses_to_operations', { period })
  }

  // Settings operations
  static async getSettings(): Promise<Settings> {
    return invoke('cmd_get_settings')
  }

  static async saveSettings(settings: Settings): Promise<void> {
    return invoke('cmd_save_settings', { s: settings })
  }

  // Month closing operations
  static async closeMonth(month: MonthId): Promise<void> {
    return invoke('cmd_close_month', { y: month.year, m: month.month })
  }

  // File upload operations
  static async uploadJustificatif(
    fileContent: number[],
    originalFilename: string,
    contentType?: string
  ): Promise<string> {
    return invoke('cmd_upload_justificatif', {
      fileContent,
      originalFilename,
      contentType: contentType || null
    })
  }

  // Utility operations
  static async formatEuros(cents: number): Promise<string> {
    return (cents / 100).toFixed(2) + '€'
  }

  static centsToEuros(cents: number): number {
    return cents / 100
  }

  static eurosToCents(euros: number): number {
    return Math.round(euros * 100)
  }

  static ppmToPercent(ppm: number): number {
    return ppm / 10000
  }

  static percentToPpm(percent: number): number {
    return Math.round(percent * 10000)
  }

  static formatMonth(month: MonthId): string {
    return `${month.year}-${String(month.month).padStart(2, '0')}`
  }

  static parseMonth(monthString: string): MonthId | null {
    const match = monthString.match(/^(\d{4})-(\d{2})$/)
    if (!match) return null
    
    const year = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    
    if (month < 1 || month > 12) return null
    
    return { year, month }
  }
}

// Error handling utility
export class TauriError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message)
    this.name = 'TauriError'
  }
}

// Wrapper for invoke calls with error handling
export async function safeInvoke<T>(command: string, args?: Record<string, any>): Promise<T> {
  try {
    return await invoke(command, args)
  } catch (error) {
    console.error(`Tauri command ${command} failed:`, error)
    throw new TauriError(
      error instanceof Error ? error.message : 'Unknown Tauri error',
      typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined
    )
  }
}