import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { 
  determineDefaultDeclarationPeriod,
  generateAvailablePeriods,
  type DeclarationPeriodInfo
} from '../lib/declarationLogic'

export const useDeclarationPeriod = () => {
  const { monthDeclarations } = useAppStore()
  const [selectedPeriod, setSelectedPeriod] = useState<DeclarationPeriodInfo | null>(null)

  // Generate available periods
  const availablePeriods = useMemo(() => 
    generateAvailablePeriods()
  , [])

  // Determine default period when declarations change
  const defaultPeriod = useMemo(() => 
    determineDefaultDeclarationPeriod(monthDeclarations)
  , [monthDeclarations])

  // Set initial selected period
  useEffect(() => {
    if (!selectedPeriod) {
      setSelectedPeriod(defaultPeriod)
    }
  }, [defaultPeriod, selectedPeriod])

  // Update available periods with default flag
  const periodsWithDefault = useMemo(() => {
    return availablePeriods.map(period => ({
      ...period,
      isDefault: period.periodKey === defaultPeriod.periodKey,
      reason: period.periodKey === defaultPeriod.periodKey ? defaultPeriod.reason : period.reason
    }))
  }, [availablePeriods, defaultPeriod])

  return {
    selectedPeriod: selectedPeriod || defaultPeriod,
    setSelectedPeriod,
    availablePeriods: periodsWithDefault,
    defaultPeriod,
    isDefaultPeriod: selectedPeriod?.periodKey === defaultPeriod.periodKey
  }
}