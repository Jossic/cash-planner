import React from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { 
  Euro, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  Target,
  PiggyBank
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, MetricCard } from '../ui'
import { formatEuros, formatPercent } from '../../lib/utils'
import type { SimulationResult, MetricCardData } from '../../types'

interface SimulationResultsProps {
  result: SimulationResult
  className?: string
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({ result, className }) => {
  // Prepare metrics data
  const metrics: MetricCardData[] = [
    {
      label: 'CA Annuel Projeté',
      value: formatEuros(result.annual_revenue * 100),
      icon: Euro,
      status: 'success',
    },
    {
      label: 'TJM Recommandé',
      value: `${result.daily_rate_needed.toFixed(0)} €`,
      icon: Target,
      status: result.daily_rate_needed > 500 ? 'warning' : 'success',
    },
    {
      label: 'Jours à Facturer',
      value: `${result.working_days_needed} jours`,
      icon: Calendar,
      status: result.working_days_needed > 220 ? 'warning' : 'success',
    },
    {
      label: 'Net Après Charges',
      value: formatEuros(result.net_after_taxes * 100),
      icon: PiggyBank,
      status: 'success',
    },
  ]

  // Prepare breakdown data for pie chart
  const breakdownData = [
    {
      name: 'Net',
      value: result.net_after_taxes,
      color: '#10b981', // secondary-500
    },
    {
      name: 'TVA',
      value: result.vat_annual,
      color: '#f43f5e', // accent-500
    },
    {
      name: 'URSSAF',
      value: result.urssaf_annual,
      color: '#3b82f6', // primary-500
    },
  ]

  // Prepare monthly projection data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(2024, i).toLocaleDateString('fr-FR', { month: 'short' })
    const monthlyRevenue = result.annual_revenue / 12
    const monthlyNet = result.net_after_taxes / 12
    
    return {
      month,
      revenue: monthlyRevenue,
      net: monthlyNet,
      charges: (result.vat_annual + result.urssaf_annual) / 12,
    }
  })

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {entry.dataKey === 'revenue' ? 'CA' : 
                   entry.dataKey === 'net' ? 'Net' : 'Charges'}:
                </span>
              </div>
              <span className="text-xs font-medium">
                {formatEuros(entry.value * 100)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} data={metric} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatEuros(value * 100), 'Montant']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {breakdownData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Projection */}
        <Card>
          <CardHeader>
            <CardTitle>Projection mensuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" />
                  <XAxis 
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'rgb(100 116 139)' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'rgb(100 116 139)' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                  />
                  <Tooltip content={customTooltip} />
                  <Bar 
                    dataKey="revenue" 
                    fill="#3b82f6" 
                    radius={[2, 2, 0, 0]}
                    name="CA"
                  />
                  <Bar 
                    dataKey="net" 
                    fill="#10b981" 
                    radius={[2, 2, 0, 0]}
                    name="Net"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Impact des congés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800">
              <AlertTriangle className="h-8 w-8 text-accent-600 mx-auto mb-2" />
              <p className="text-lg font-semibold text-accent-900 dark:text-accent-100">
                {formatEuros(result.vacation_impact * 100)}
              </p>
              <p className="text-sm text-accent-700 dark:text-accent-300">
                Manque à gagner annuel
              </p>
            </div>
            
            <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <Calendar className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <p className="text-lg font-semibold text-primary-900 dark:text-primary-100">
                {((result.vacation_impact / result.daily_rate_needed) || 0).toFixed(0)} jours
              </p>
              <p className="text-sm text-primary-700 dark:text-primary-300">
                Jours de congés prévus
              </p>
            </div>
            
            <div className="text-center p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-800">
              <TrendingUp className="h-8 w-8 text-secondary-600 mx-auto mb-2" />
              <p className="text-lg font-semibold text-secondary-900 dark:text-secondary-100">
                {((result.vacation_impact / result.annual_revenue) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-secondary-700 dark:text-secondary-300">
                Impact sur le CA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.daily_rate_needed > 600 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    TJM élevé requis
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Votre objectif nécessite un TJM de {result.daily_rate_needed.toFixed(0)}€, 
                    qui pourrait être difficile à atteindre selon votre marché.
                  </p>
                </div>
              </div>
            )}
            
            {result.working_days_needed > 220 && (
              <div className="flex items-start gap-3 p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800">
                <AlertTriangle className="h-5 w-5 text-accent-600 mt-0.5" />
                <div>
                  <p className="font-medium text-accent-900 dark:text-accent-100">
                    Charge de travail importante
                  </p>
                  <p className="text-sm text-accent-800 dark:text-accent-200">
                    {result.working_days_needed} jours facturables par an représentent 
                    une charge importante. Considérez réduire vos objectifs ou augmenter votre TJM.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3 p-4 bg-secondary-50 dark:bg-secondary-900/20 rounded-lg border border-secondary-200 dark:border-secondary-800">
              <TrendingUp className="h-5 w-5 text-secondary-600 mt-0.5" />
              <div>
                <p className="font-medium text-secondary-900 dark:text-secondary-100">
                  Optimisation fiscale
                </p>
                <p className="text-sm text-secondary-800 dark:text-secondary-200">
                  Avec {formatPercent(220000)} d'URSSAF, pensez à optimiser vos charges déductibles 
                  pour réduire votre base imposable.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}