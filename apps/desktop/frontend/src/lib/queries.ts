import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TauriClient } from './tauriClient'
import type { MonthId, CreateInvoiceDto, CreateExpenseDto, Settings } from '../types'

// Query keys
export const queryKeys = {
  dashboard: (month: MonthId) => ['dashboard', month] as const,
  invoices: (month?: MonthId) => ['invoices', month] as const,
  expenses: (month?: MonthId) => ['expenses', month] as const,
  vatReport: (month: MonthId) => ['vat-report', month] as const,
  urssafReport: (month: MonthId) => ['urssaf-report', month] as const,
  settings: () => ['settings'] as const,
}

// Dashboard queries
export const useDashboard = (month: MonthId, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.dashboard(month),
    queryFn: () => TauriClient.getDashboard(month),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Invoice queries
export const useInvoices = (month?: MonthId, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.invoices(month),
    queryFn: () => TauriClient.getInvoices(month),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (dto: CreateInvoiceDto) => TauriClient.createInvoice(dto),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vat-report'] })
      queryClient.invalidateQueries({ queryKey: ['urssaf-report'] })
    },
  })
}

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => TauriClient.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vat-report'] })
      queryClient.invalidateQueries({ queryKey: ['urssaf-report'] })
    },
  })
}

// Expense queries
export const useExpenses = (month?: MonthId, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.expenses(month),
    queryFn: () => TauriClient.getExpenses(month),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export const useCreateExpense = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (dto: CreateExpenseDto) => TauriClient.createExpense(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vat-report'] })
      queryClient.invalidateQueries({ queryKey: ['urssaf-report'] })
    },
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => TauriClient.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vat-report'] })
      queryClient.invalidateQueries({ queryKey: ['urssaf-report'] })
    },
  })
}

// VAT queries
export const useVatReport = (month: MonthId, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.vatReport(month),
    queryFn: () => TauriClient.getVatReport(month),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// URSSAF queries
export const useUrssafReport = (month: MonthId, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.urssafReport(month),
    queryFn: () => TauriClient.getUrssafReport(month),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Settings queries
export const useSettings = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => TauriClient.getSettings(),
    enabled,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useSaveSettings = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (settings: Settings) => TauriClient.saveSettings(settings),
    onSuccess: (_, settings) => {
      // Update the cache with the new settings
      queryClient.setQueryData(queryKeys.settings(), settings)
      // Invalidate dashboard as settings affect calculations
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vat-report'] })
      queryClient.invalidateQueries({ queryKey: ['urssaf-report'] })
    },
  })
}

// Month closing
export const useCloseMonth = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (month: MonthId) => TauriClient.closeMonth(month),
    onSuccess: () => {
      // Invalidate all queries as month closing affects everything
      queryClient.invalidateQueries()
    },
  })
}

// Batch operations for declaration modal
export const useDeclarationBatch = () => {
  const createInvoice = useCreateInvoice()
  const createExpense = useCreateExpense()
  
  return {
    createInvoices: async (invoices: CreateInvoiceDto[]) => {
      const promises = invoices.map((invoice) => createInvoice.mutateAsync(invoice))
      return Promise.all(promises)
    },
    createExpenses: async (expenses: CreateExpenseDto[]) => {
      const promises = expenses.map((expense) => createExpense.mutateAsync(expense))
      return Promise.all(promises)
    },
    isLoading: createInvoice.isPending || createExpense.isPending,
  }
}