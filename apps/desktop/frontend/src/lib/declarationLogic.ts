/**
 * Logic for determining which month should be declared based on current date and existing declarations
 */

export interface DeclarationPeriodInfo {
  periodKey: string
  year: number
  month: number
  label: string
  isDefault: boolean
  reason: 'no_declarations' | 'next_after_closed' | 'manual_selection'
}

/**
 * Get the previous month from current date
 */
export const getPreviousMonth = (referenceDate: Date = new Date()): { year: number; month: number } => {
  const prevMonth = new Date(referenceDate)
  prevMonth.setMonth(prevMonth.getMonth() - 1)
  
  return {
    year: prevMonth.getFullYear(),
    month: prevMonth.getMonth() + 1
  }
}

/**
 * Get the next month from a given period
 */
export const getNextMonth = (year: number, month: number): { year: number; month: number } => {
  const nextMonth = new Date(year, month - 1)
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  
  return {
    year: nextMonth.getFullYear(),
    month: nextMonth.getMonth() + 1
  }
}

/**
 * Format period as string (YYYY-MM)
 */
export const formatPeriodKey = (year: number, month: number): string => {
  return `${year}-${month.toString().padStart(2, '0')}`
}

/**
 * Parse period key to year/month
 */
export const parsePeriodKey = (periodKey: string): { year: number; month: number } => {
  const [yearStr, monthStr] = periodKey.split('-')
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10)
  }
}

/**
 * Get month label in French
 */
export const getMonthLabel = (year: number, month: number): string => {
  const date = new Date(year, month - 1)
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
}

/**
 * Find the latest closed declaration period
 */
export const findLatestClosedDeclaration = (
  declarations: Record<string, { current_step: string; closed_at?: string }>
): string | null => {
  const closedDeclarations = Object.entries(declarations)
    .filter(([_, decl]) => decl.current_step === 'closed')
    .sort(([a], [b]) => b.localeCompare(a)) // Sort by period key descending
  
  return closedDeclarations.length > 0 ? closedDeclarations[0][0] : null
}

/**
 * Determine which month should be declared by default
 */
export const determineDefaultDeclarationPeriod = (
  declarations: Record<string, { current_step: string; closed_at?: string }>,
  referenceDate: Date = new Date()
): DeclarationPeriodInfo => {
  const latestClosedPeriod = findLatestClosedDeclaration(declarations)
  
  if (!latestClosedPeriod) {
    // No closed declarations: use previous month
    const { year, month } = getPreviousMonth(referenceDate)
    const periodKey = formatPeriodKey(year, month)
    
    return {
      periodKey,
      year,
      month,
      label: getMonthLabel(year, month),
      isDefault: true,
      reason: 'no_declarations'
    }
  }
  
  // There are closed declarations: use the month after the latest closed one
  const { year, month } = parsePeriodKey(latestClosedPeriod)
  const nextPeriod = getNextMonth(year, month)
  const periodKey = formatPeriodKey(nextPeriod.year, nextPeriod.month)
  
  return {
    periodKey,
    year: nextPeriod.year,
    month: nextPeriod.month,
    label: getMonthLabel(nextPeriod.year, nextPeriod.month),
    isDefault: true,
    reason: 'next_after_closed'
  }
}

/**
 * Generate a list of available periods for the month selector
 * Returns periods from 2 years ago to 1 year in the future
 */
export const generateAvailablePeriods = (referenceDate: Date = new Date()): DeclarationPeriodInfo[] => {
  const periods: DeclarationPeriodInfo[] = []
  const currentYear = referenceDate.getFullYear()
  const startYear = currentYear - 2
  const endYear = currentYear + 1
  
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const periodKey = formatPeriodKey(year, month)
      
      periods.push({
        periodKey,
        year,
        month,
        label: getMonthLabel(year, month),
        isDefault: false,
        reason: 'manual_selection'
      })
    }
  }
  
  return periods.sort((a, b) => b.periodKey.localeCompare(a.periodKey)) // Most recent first
}

/**
 * Check if a period is in the future relative to reference date
 */
export const isPeriodInFuture = (year: number, month: number, referenceDate: Date = new Date()): boolean => {
  const periodDate = new Date(year, month - 1, 1)
  const refDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
  
  return periodDate > refDate
}

/**
 * Get display status for a period
 */
export const getPeriodDisplayStatus = (
  periodKey: string,
  declarations: Record<string, { current_step: string; closed_at?: string }>,
  referenceDate: Date = new Date()
): 'future' | 'current' | 'declared' | 'closed' | 'available' => {
  const { year, month } = parsePeriodKey(periodKey)
  const declaration = declarations[periodKey]
  
  if (isPeriodInFuture(year, month, referenceDate)) {
    return 'future'
  }
  
  if (declaration) {
    if (declaration.current_step === 'closed') return 'closed'
    if (declaration.current_step === 'declared') return 'declared'
  }
  
  const currentPeriodKey = formatPeriodKey(referenceDate.getFullYear(), referenceDate.getMonth() + 1)
  if (periodKey === currentPeriodKey) {
    return 'current'
  }
  
  return 'available'
}