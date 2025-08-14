import React from 'react'
import { 
  Euro, 
  Receipt, 
  CreditCard, 
  PiggyBank,
  TrendingUp,
  TrendingDown,
  AlertCircle 
} from 'lucide-react'
import { MetricCard } from '../ui'
import { formatEuros, centsToEuros, cn } from '../../lib/utils'
import type { DashboardData, MetricCardData } from '../../types'

interface DashboardMetricsProps {
  data: DashboardData | null
  loading: boolean
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ data, loading }) => {
  const metrics: MetricCardData[] = React.useMemo(() => {
    if (!data) {
      return [
        { label: 'Encaissements HT', value: '0,00 €', icon: Euro },
        { label: 'TVA due', value: '0,00 €', icon: Receipt },
        { label: 'URSSAF due', value: '0,00 €', icon: CreditCard },
        { label: 'Disponible', value: '0,00 €', icon: PiggyBank },
      ]
    }

    const encaissements = data.encaissements_ht_cents
    const tvaDue = data.tva_due_cents
    const urssafDue = data.urssaf_due_cents
    const disponible = data.disponible_cents

    // Calculate trends (simulated for now - would come from historical data)
    const encaissementsTrend = Math.random() > 0.5
    const tvaTrend = tvaDue > 0
    const urssafTrend = urssafDue > 0
    const disponibleTrend = disponible > 0

    return [
      {
        label: 'Encaissements HT',
        value: formatEuros(encaissements),
        icon: Euro,
        trend: {
          value: Math.round(Math.random() * 20),
          isPositive: encaissementsTrend,
          label: 'vs mois précédent',
        },
        status: encaissements > 0 ? 'success' : 'warning',
      },
      {
        label: 'TVA due',
        value: formatEuros(tvaDue),
        icon: Receipt,
        trend: {
          value: Math.round(Math.random() * 15),
          isPositive: !tvaTrend,
          label: 'vs mois précédent',
        },
        status: tvaDue > 0 ? 'warning' : 'success',
      },
      {
        label: 'URSSAF due',
        value: formatEuros(urssafDue),
        icon: CreditCard,
        trend: {
          value: Math.round(Math.random() * 12),
          isPositive: !urssafTrend,
          label: 'vs mois précédent',
        },
        status: urssafDue > 0 ? 'warning' : 'success',
      },
      {
        label: 'Disponible',
        value: formatEuros(disponible),
        icon: disponible >= 0 ? PiggyBank : AlertCircle,
        trend: {
          value: Math.round(Math.random() * 25),
          isPositive: disponibleTrend,
          label: 'vs mois précédent',
        },
        status: disponible >= 0 ? 'success' : 'danger',
      },
    ]
  }, [data])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={metric.label}
          data={metric}
          loading={loading}
          className={cn(
            'animate-in',
            // Stagger animation
            index === 1 && 'animation-delay-75',
            index === 2 && 'animation-delay-150',
            index === 3 && 'animation-delay-225'
          )}
        />
      ))}
    </div>
  )
}

export default DashboardMetrics