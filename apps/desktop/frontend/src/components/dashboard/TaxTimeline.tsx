import React from 'react'
import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui'
import { formatEuros, formatDate } from '../../lib/utils'
import type { TaxDeadline, MonthId } from '../../types'

interface TaxTimelineProps {
  currentMonth: MonthId
  className?: string
}

export const TaxTimeline: React.FC<TaxTimelineProps> = ({ currentMonth, className }) => {
  // Generate upcoming tax deadlines
  const deadlines: TaxDeadline[] = React.useMemo(() => {
    const now = new Date()
    const deadlines: TaxDeadline[] = []
    
    // Generate next 6 months of deadlines
    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const year = month.getFullYear()
      const monthNum = month.getMonth() + 1
      
      // VAT declaration (12th of each month)
      const vatDeclareDate = new Date(year, monthNum - 1, 12)
      deadlines.push({
        date: vatDeclareDate.toISOString().split('T')[0],
        type: 'vat_declare',
        label: 'Déclaration TVA',
        isPast: vatDeclareDate < now,
      })
      
      // VAT payment (20th of each month)
      const vatPayDate = new Date(year, monthNum - 1, 20)
      deadlines.push({
        date: vatPayDate.toISOString().split('T')[0],
        type: 'vat_pay',
        label: 'Paiement TVA',
        amount_cents: Math.round((Math.random() * 1000 + 200) * 100), // Random amount for demo
        isPast: vatPayDate < now,
      })
      
      // URSSAF payment (5th of each month)
      const urssafDate = new Date(year, monthNum - 1, 5)
      deadlines.push({
        date: urssafDate.toISOString().split('T')[0],
        type: 'urssaf_pay',
        label: 'Paiement URSSAF',
        amount_cents: Math.round((Math.random() * 800 + 300) * 100), // Random amount for demo
        isPast: urssafDate < now,
      })
    }
    
    return deadlines
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10) // Show next 10 deadlines
  }, [currentMonth])

  const getDeadlineIcon = (deadline: TaxDeadline) => {
    if (deadline.isPast) {
      return <CheckCircle className="h-4 w-4 text-secondary-600" />
    }
    
    const daysUntil = Math.ceil(
      (new Date(deadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntil <= 7) {
      return <AlertTriangle className="h-4 w-4 text-accent-600" />
    }
    
    return <Clock className="h-4 w-4 text-gray-400" />
  }

  const getDeadlineStatus = (deadline: TaxDeadline) => {
    if (deadline.isPast) return 'past'
    
    const daysUntil = Math.ceil(
      (new Date(deadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysUntil <= 3) return 'urgent'
    if (daysUntil <= 7) return 'soon'
    return 'future'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-600" />
          <CardTitle>Échéances fiscales</CardTitle>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Prochaines déclarations et paiements
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {deadlines.map((deadline, index) => {
            const status = getDeadlineStatus(deadline)
            const daysUntil = Math.ceil(
              (new Date(deadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            )
            
            return (
              <div
                key={`${deadline.type}-${deadline.date}`}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  status === 'urgent'
                    ? 'bg-accent-50 border-accent-200 dark:bg-accent-900/10 dark:border-accent-800'
                    : status === 'soon'
                    ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800'
                    : status === 'past'
                    ? 'bg-secondary-50 border-secondary-200 dark:bg-secondary-900/10 dark:border-secondary-800 opacity-60'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {getDeadlineIcon(deadline)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {deadline.label}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDate(deadline.date)} 
                      {!deadline.isPast && daysUntil >= 0 && (
                        <span className="ml-2">
                          ({daysUntil === 0 ? "Aujourd'hui" : `dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {deadline.amount_cents && (
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      status === 'urgent' 
                        ? 'text-accent-700 dark:text-accent-300' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {formatEuros(deadline.amount_cents)}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-accent-600" />
                <span className="text-gray-600 dark:text-gray-400">Urgent</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-yellow-600" />
                <span className="text-gray-600 dark:text-gray-400">Bientôt</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-secondary-600" />
                <span className="text-gray-600 dark:text-gray-400">Passé</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}