import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency utilities (work with cents to avoid floating point issues)
export const eurosToRents = (euros: number): number => {
  return Math.round(euros * 100)
}

export const centsToEuros = (cents: number): number => {
  return cents / 100
}

export const formatEuros = (cents: number): string => {
  const euros = centsToEuros(cents)
  return euros.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  }) + ' €'
}

export const parseEuros = (euroString: string): number => {
  // Remove all non-numeric characters except decimal separator
  const cleaned = euroString.replace(/[^\d,.-]/g, '').replace(',', '.')
  const number = parseFloat(cleaned) || 0
  return eurosToRents(number)
}

// Date utilities
export const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR')
}

export const formatMonth = (monthKey: string): string => {
  if (!monthKey) return ''
  const [year, month] = monthKey.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1)
  return date.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  }).replace(/^\w/, c => c.toUpperCase())
}

export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0]
}

export const addMonths = (dateString: string, months: number): string => {
  const date = new Date(dateString)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().split('T')[0]
}

export const getMonthFromDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

// Tax calculations
export const calculateVAT = (amountHTCents: number, vatRate: number): number => {
  return Math.round(amountHTCents * vatRate / 100)
}

export const calculateTTC = (amountHTCents: number, vatRate: number): number => {
  return amountHTCents + calculateVAT(amountHTCents, vatRate)
}

// Status utilities
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'paid':
      return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
    case 'sent':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
    case 'overdue':
      return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
    case 'draft':
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400'
  }
}

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'paid': return 'Payée'
    case 'sent': return 'Envoyée'
    case 'overdue': return 'En retard'
    case 'draft': return 'Brouillon'
    default: return status
  }
}

// Validation utilities
export const validateEuros = (value: string): boolean => {
  const euros = parseEuros(value)
  return euros >= 0 && euros < 10000000 // Max 100k euros
}

export const validateNumber = (value: string): boolean => {
  const num = parseFloat(value)
  return !isNaN(num) && num >= 0
}

export const validateDate = (value: string): boolean => {
  if (!value) return false
  const date = new Date(value)
  return date instanceof Date && !isNaN(date.getTime())
}

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0
}

// Formatting utilities
export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`
}

// Form utilities
export const createEmptyInvoice = (periodKey: string) => {
  const today = getTodayString()
  return {
    id: '',
    client: '',
    description: '',
    amount_ht_cents: 0,
    tva_rate: 20,
    amount_ttc_cents: 0,
    issued_date: today,
    payment_date: '',
    due_date: addMonths(today, 1),
    status: 'draft' as const,
    is_service: true, // Default to service
    delivery_date: '',
    created_at: new Date().toISOString()
  }
}

export const createEmptyExpense = (periodKey: string) => {
  const today = getTodayString()
  return {
    id: '',
    label: '',
    category: '',
    amount_ht_cents: 0,
    tva_rate: 20,
    amount_ttc_cents: 0,
    expense_date: today,
    payment_date: today,
    supplier: '',
    receipt_path: '',
    is_deductible: true,
    is_service: true, // Default to service
    created_at: new Date().toISOString()
  }
}