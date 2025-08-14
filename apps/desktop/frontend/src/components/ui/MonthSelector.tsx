import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import type { DeclarationPeriodInfo } from '../../lib/declarationLogic'

interface MonthSelectorProps {
  selectedPeriod: DeclarationPeriodInfo
  availablePeriods: DeclarationPeriodInfo[]
  onPeriodChange: (period: DeclarationPeriodInfo) => void
  showStatus?: boolean
  className?: string
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedPeriod,
  availablePeriods,
  onPeriodChange,
  showStatus = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Find previous and next periods
  const currentIndex = availablePeriods.findIndex(p => p.periodKey === selectedPeriod.periodKey)
  const hasPrevious = currentIndex < availablePeriods.length - 1
  const hasNext = currentIndex > 0

  const goToPrevious = () => {
    if (hasPrevious) {
      onPeriodChange(availablePeriods[currentIndex + 1])
    }
  }

  const goToNext = () => {
    if (hasNext) {
      onPeriodChange(availablePeriods[currentIndex - 1])
    }
  }

  const getStatusBadge = (period: DeclarationPeriodInfo) => {
    if (!showStatus) return null

    let badge = null
    if (period.isDefault) {
      if (period.reason === 'no_declarations') {
        badge = <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">Suggéré</span>
      } else if (period.reason === 'next_after_closed') {
        badge = <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Prochain</span>
      }
    }

    return badge
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main selector */}
      <div className="flex items-center gap-2">
        {/* Previous month button */}
        <button
          onClick={goToPrevious}
          disabled={!hasPrevious}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          title="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4 text-slate-400" />
        </button>

        {/* Period selector button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <div className="text-left">
              <div className="text-slate-100 font-medium">{selectedPeriod.label}</div>
              {selectedPeriod.isDefault && (
                <div className="text-xs text-slate-400">
                  {selectedPeriod.reason === 'no_declarations' ? 'Aucune déclaration' : 'Période suivante'}
                </div>
              )}
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Next month button */}
        <button
          onClick={goToNext}
          disabled={!hasNext}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
          title="Mois suivant"
        >
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          <div className="py-2">
            {availablePeriods.map((period) => (
              <button
                key={period.periodKey}
                onClick={() => {
                  onPeriodChange(period)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center justify-between ${
                  period.periodKey === selectedPeriod.periodKey ? 'bg-slate-700 text-blue-400' : 'text-slate-200'
                }`}
              >
                <span>{period.label}</span>
                {getStatusBadge(period)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}