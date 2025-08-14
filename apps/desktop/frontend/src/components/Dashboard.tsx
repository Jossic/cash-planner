import React, { useState, useEffect } from 'react'
import { RefreshCw, Calendar, Euro, Receipt, CreditCard, PiggyBank, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import type { RouteKey, DashboardData, Period } from '../types'

interface DashboardProps {
  onNavigate: (route: RouteKey) => void
}

type ViewMode = 'year' | 'month'

interface PeriodNavigation {
  currentYear: number
  currentMonth?: number
  viewMode: ViewMode
}

// Utilitaires pour la navigation des périodes
const getMonthName = (month: number): string => {
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  return months[month - 1]
}

const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(cents / 100)
}

// Composant pour les métriques avec design moderne
const MetricCard: React.FC<{
  label: string
  value: string
  icon: React.ComponentType<any>
  color: string
  trend?: { value: number; isPositive: boolean }
  loading?: boolean
  onClick?: () => void
}> = ({ label, value, icon: Icon, color, trend, loading = false, onClick }) => {
  if (loading) {
    return (
      <Card className="bg-slate-850 border-slate-700 hover:border-slate-600 transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-slate-700 rounded animate-shimmer mb-3"></div>
              <div className="h-8 bg-slate-700 rounded animate-shimmer"></div>
            </div>
            <div className="h-12 w-12 bg-slate-700 rounded-lg animate-shimmer"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card 
      className={`bg-slate-850 border-slate-700 hover:border-slate-600 transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-elevated' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-300 mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-slate-100 mb-2">
              {value}
            </p>
            {trend && (
              <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center bg-opacity-20 ${color}`}>
            <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Composant de navigation des périodes
const PeriodNavigator: React.FC<{
  navigation: PeriodNavigation
  onNavigationChange: (nav: PeriodNavigation) => void
}> = ({ navigation, onNavigationChange }) => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  const handlePreviousPeriod = () => {
    if (navigation.viewMode === 'year') {
      onNavigationChange({
        ...navigation,
        currentYear: navigation.currentYear - 1
      })
    } else {
      const newMonth = navigation.currentMonth === 1 ? 12 : navigation.currentMonth! - 1
      const newYear = navigation.currentMonth === 1 ? navigation.currentYear - 1 : navigation.currentYear
      onNavigationChange({
        ...navigation,
        currentYear: newYear,
        currentMonth: newMonth
      })
    }
  }

  const handleNextPeriod = () => {
    if (navigation.viewMode === 'year') {
      onNavigationChange({
        ...navigation,
        currentYear: navigation.currentYear + 1
      })
    } else {
      const newMonth = navigation.currentMonth === 12 ? 1 : navigation.currentMonth! + 1
      const newYear = navigation.currentMonth === 12 ? navigation.currentYear + 1 : navigation.currentYear
      onNavigationChange({
        ...navigation,
        currentYear: newYear,
        currentMonth: newMonth
      })
    }
  }

  const getPeriodLabel = () => {
    if (navigation.viewMode === 'year') {
      return `Année ${navigation.currentYear}`
    } else {
      return `${getMonthName(navigation.currentMonth!)} ${navigation.currentYear}`
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigationChange({ ...navigation, viewMode: 'year', currentMonth: undefined })}
          className={navigation.viewMode === 'year' ? 'bg-blue-600 text-white border-blue-600' : ''}
        >
          Année
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigationChange({ ...navigation, viewMode: 'month', currentMonth: currentMonth })}
          className={navigation.viewMode === 'month' ? 'bg-blue-600 text-white border-blue-600' : ''}
        >
          Mois
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handlePreviousPeriod}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="min-w-[160px] text-center">
          <span className="text-lg font-semibold text-slate-100">
            {getPeriodLabel()}
          </span>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleNextPeriod}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Bouton retour à la période courante */}
      {(navigation.currentYear !== currentYear || 
        (navigation.viewMode === 'month' && navigation.currentMonth !== currentMonth)) && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onNavigationChange({
            currentYear,
            currentMonth: navigation.viewMode === 'month' ? currentMonth : undefined,
            viewMode: navigation.viewMode
          })}
        >
          Aujourd'hui
        </Button>
      )}
    </div>
  )
}

// Composant pour l'évolution de la trésorerie avec design moderne
const CashflowChart: React.FC<{ className?: string, viewMode: ViewMode }> = ({ className, viewMode }) => (
  <Card className={`bg-slate-850 border-slate-700 ${className || ''}`}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-slate-100">
        <BarChart3 className="h-5 w-5" />
        {viewMode === 'year' ? 'Évolution annuelle' : 'Évolution mensuelle'}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-64 flex items-center justify-center bg-slate-900 rounded-lg border border-slate-700">
        <div className="text-center">
          <Activity className="h-12 w-12 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">Graphique en cours de développement</p>
          <p className="text-slate-500 text-sm mt-1">
            {viewMode === 'year' ? 'Vue synthèse par mois' : 'Vue détaillée du mois'}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Composant pour les échéances fiscales avec design moderne
const TaxTimeline: React.FC<{ navigation: PeriodNavigation }> = ({ navigation }) => (
  <Card className="bg-slate-850 border-slate-700">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-slate-100">
        <Calendar className="h-5 w-5" />
        Échéances fiscales
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-orange-900/20 rounded-lg border border-orange-800/30">
          <div>
            <p className="font-medium text-orange-200">TVA</p>
            <p className="text-sm text-orange-400">Déclaration le 12</p>
          </div>
          <span className="text-orange-300 font-semibold">2 500,00 €</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
          <div>
            <p className="font-medium text-blue-200">URSSAF</p>
            <p className="text-sm text-blue-400">Paiement le 5</p>
          </div>
          <span className="text-blue-300 font-semibold">2 750,00 €</span>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Composant pour les actions rapides avec design moderne
const QuickActions: React.FC<{
  onNavigate: (route: RouteKey) => void
}> = ({ onNavigate }) => (
  <Card className="bg-slate-850 border-slate-700">
    <CardHeader>
      <CardTitle className="text-slate-100">Actions rapides</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          onClick={() => onNavigate('operations')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Nouvelle opération
        </Button>
        <Button
          onClick={() => onNavigate('simulations')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Simulations
        </Button>
        <Button
          onClick={() => onNavigate('vat')}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          TVA
        </Button>
        <Button
          onClick={() => onNavigate('urssaf')}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          URSSAF
        </Button>
      </div>
    </CardContent>
  </Card>
)

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  
  // État de navigation des périodes
  const currentDate = new Date()
  const [navigation, setNavigation] = useState<PeriodNavigation>({
    currentYear: currentDate.getFullYear(),
    currentMonth: undefined, // Commence en vue année
    viewMode: 'year'
  })

  // Données de démo - À remplacer par de vraies données du backend
  const mockMetrics = {
    year: {
      encaissements_ht_cents: 150000000, // 150 000€
      depenses_ttc_cents: 36000000,      // 36 000€
      tva_due_cents: 24000000,           // 24 000€
      urssaf_due_cents: 33000000,        // 33 000€
      disponible_cents: 87000000         // 87 000€
    },
    month: {
      encaissements_ht_cents: 12500000,  // 12 500€
      depenses_ttc_cents: 3000000,       // 3 000€
      tva_due_cents: 2500000,            // 2 500€
      urssaf_due_cents: 2750000,         // 2 750€
      disponible_cents: 7250000          // 7 250€
    }
  }

  const currentMetrics = navigation.viewMode === 'year' ? mockMetrics.year : mockMetrics.month

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulation d'un appel API
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  const getMetricsConfig = () => [
    {
      label: navigation.viewMode === 'year' ? 'CA annuel HT' : 'Encaissements HT',
      value: formatCurrency(currentMetrics.encaissements_ht_cents),
      icon: Euro,
      color: 'bg-green-600',
      trend: { value: 12.5, isPositive: true },
      onClick: () => onNavigate('operations')
    },
    {
      label: navigation.viewMode === 'year' ? 'Dépenses annuelles' : 'Dépenses TTC',
      value: formatCurrency(currentMetrics.depenses_ttc_cents),
      icon: Receipt,
      color: 'bg-slate-600',
      trend: { value: 8.2, isPositive: false },
      onClick: () => onNavigate('operations')
    },
    {
      label: navigation.viewMode === 'year' ? 'TVA annuelle' : 'TVA due',
      value: formatCurrency(currentMetrics.tva_due_cents),
      icon: CreditCard,
      color: 'bg-orange-600',
      onClick: () => onNavigate('vat')
    },
    {
      label: navigation.viewMode === 'year' ? 'URSSAF annuelle' : 'URSSAF due',
      value: formatCurrency(currentMetrics.urssaf_due_cents),
      icon: PiggyBank,
      color: 'bg-blue-600',
      onClick: () => onNavigate('urssaf')
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-6 animate-fade-in">
      {/* Header avec navigation des périodes */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Vue d'ensemble de votre activité
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Actualiser
          </Button>
        </div>
      </div>

      {/* Navigation des périodes */}
      <Card className="bg-slate-850 border-slate-700">
        <CardContent className="p-4">
          <PeriodNavigator 
            navigation={navigation} 
            onNavigationChange={setNavigation}
          />
        </CardContent>
      </Card>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getMetricsConfig().map((metric, index) => (
          <div key={metric.label} className={`animation-delay-${index * 75}`}>
            <MetricCard
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
              trend={metric.trend}
              loading={isLoading}
              onClick={metric.onClick}
            />
          </div>
        ))}
      </div>

      {/* Graphiques et chronologie */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <CashflowChart 
          className="xl:col-span-2" 
          viewMode={navigation.viewMode}
        />
        <TaxTimeline navigation={navigation} />
      </div>

      {/* Actions rapides */}
      <QuickActions onNavigate={onNavigate} />

      {/* Insights et conseils */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-200 mb-2 flex items-center gap-2">
              💡 Conseil du {navigation.viewMode === 'year' ? 'année' : 'mois'}
            </h3>
            <p className="text-sm text-blue-300">
              {navigation.viewMode === 'year' 
                ? "Analysez vos tendances annuelles pour optimiser votre stratégie fiscale."
                : "N'oubliez pas de déclarer votre TVA avant le 12 du mois suivant."
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-green-200 mb-2 flex items-center gap-2">
              📊 Performance
            </h3>
            <p className="text-sm text-green-300">
              {navigation.viewMode === 'year'
                ? "Croissance de +12.5% par rapport à l'année précédente."
                : "Votre trésorerie est positive. Consultez vos simulations pour optimiser."
              }
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-purple-200 mb-2 flex items-center gap-2">
              ⚡ Automatisation
            </h3>
            <p className="text-sm text-purple-300">
              {navigation.viewMode === 'year'
                ? "Configurez des simulations récurrentes pour anticiper vos charges."
                : "Utilisez la saisie rapide pour gagner du temps dans vos déclarations."
              }
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}