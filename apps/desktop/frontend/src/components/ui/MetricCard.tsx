import React from 'react'
import { clsx } from 'clsx'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { Card } from './Card'
import type { MetricCardData } from '../../types'

export interface MetricCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  data?: MetricCardData
  label?: string
  value?: string
  icon?: any
  trend?: {
    value: number
    isPositive: boolean
    label: string
  }
  status?: 'revenue' | 'vat' | 'urssaf' | 'expense' | 'success' | 'warning' | 'danger'
  loading?: boolean
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ data, label, value, icon, trend, status, loading, className, ...props }, ref) => {
    // Support both data object and individual props
    const finalLabel = data?.label ?? label
    const finalValue = data?.value ?? value
    const finalTrend = data?.trend ?? trend
    const finalStatus = data?.status ?? status
    const Icon = data?.icon ?? icon

    return (
      <div
        ref={ref}
        className={clsx(
          'metric-card relative overflow-hidden',
          // Business color borders
          finalStatus === 'revenue' && 'border-green-500/20',
          finalStatus === 'vat' && 'border-orange-500/20', 
          finalStatus === 'urssaf' && 'border-blue-500/20',
          finalStatus === 'expense' && 'border-red-500/20',
          finalStatus === 'success' && 'border-green-500/20',
          finalStatus === 'warning' && 'border-orange-500/20',
          finalStatus === 'danger' && 'border-red-500/20',
          className
        )}
        {...props}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400 mb-1">{finalLabel}</div>
              {loading ? (
                <div className="h-8 w-32 skeleton mt-1" />
              ) : (
                <div className={clsx(
                  'text-2xl font-bold mb-1 font-mono',
                  finalStatus === 'revenue' && 'text-green-400',
                  finalStatus === 'vat' && 'text-orange-400',
                  finalStatus === 'urssaf' && 'text-blue-400', 
                  finalStatus === 'expense' && 'text-red-400',
                  finalStatus === 'success' && 'text-green-400',
                  finalStatus === 'warning' && 'text-orange-400',
                  finalStatus === 'danger' && 'text-red-400',
                  !finalStatus && 'text-slate-100'
                )}>
                  {finalValue}
                </div>
              )}
            </div>
            {Icon && (
              <div className={clsx(
                'w-12 h-12 rounded-lg flex items-center justify-center',
                finalStatus === 'revenue' && 'bg-green-500/20',
                finalStatus === 'vat' && 'bg-orange-500/20',
                finalStatus === 'urssaf' && 'bg-blue-500/20',
                finalStatus === 'expense' && 'bg-red-500/20',
                finalStatus === 'success' && 'bg-green-500/20',
                finalStatus === 'warning' && 'bg-orange-500/20',
                finalStatus === 'danger' && 'bg-red-500/20',
                !finalStatus && 'bg-slate-700'
              )}>
                <Icon className={clsx(
                  'h-6 w-6',
                  finalStatus === 'revenue' && 'text-green-400',
                  finalStatus === 'vat' && 'text-orange-400',
                  finalStatus === 'urssaf' && 'text-blue-400',
                  finalStatus === 'expense' && 'text-red-400', 
                  finalStatus === 'success' && 'text-green-400',
                  finalStatus === 'warning' && 'text-orange-400',
                  finalStatus === 'danger' && 'text-red-400',
                  !finalStatus && 'text-slate-400'
                )} />
              </div>
            )}
          </div>
          
          {finalTrend && !loading && (
            <div className={clsx(
              'text-sm flex items-center gap-1',
              finalTrend.isPositive ? 'text-green-400' : 'text-red-400'
            )}>
              {finalTrend.isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(finalTrend.value)}% {finalTrend.label}</span>
            </div>
          )}
          
          {/* Progress bar */}
          {finalStatus && (
            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
              <div className={clsx(
                'h-1.5 rounded-full',
                finalStatus === 'revenue' && 'bg-green-500',
                finalStatus === 'vat' && 'bg-orange-500',
                finalStatus === 'urssaf' && 'bg-blue-500',
                finalStatus === 'expense' && 'bg-red-500',
                finalStatus === 'success' && 'bg-green-500',
                finalStatus === 'warning' && 'bg-orange-500',
                finalStatus === 'danger' && 'bg-red-500'
              )} style={{ width: '75%' }}></div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

MetricCard.displayName = 'MetricCard'

export { MetricCard }