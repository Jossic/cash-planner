import React, { useState } from 'react'
import { TrendingUp, Calculator, BarChart3, Target, Lightbulb, ArrowRight, Calendar, Edit2, Save, X } from 'lucide-react'
import { useAppStore, useCurrentPeriod } from '../../stores/useAppStore'
import { formatEuros, addMonths } from '../../lib/utils'

interface SimulationScenario {
  id: string
  name: string
  description: string
  monthlyRevenue: number
  monthlyExpenses: number
  vatRate: number
  urssafRate: number
  duration: number
}

interface WorkingDaysPlan {
  month: number
  year: number
  monthName: string
  workingDays: number
  holidays: number
  dailyRate: number
  plannedRevenue: number
  isEditing: boolean
}

interface YearlyPlan {
  year: number
  totalWorkingDays: number
  totalHolidays: number
  averageDailyRate: number
  projectedRevenue: number
  workingDaysPerMonth: WorkingDaysPlan[]
}

export const SimulationsPage: React.FC = () => {
  const currentPeriod = useCurrentPeriod()
  const { settings } = useAppStore()
  
  const [activeTab, setActiveTab] = useState<'cashflow' | 'scenarios' | 'goals' | 'planning'>('cashflow')
  
  const [simulation, setSimulation] = useState({
    monthlyRevenue: 5000,
    monthlyExpenses: 1500,
    vatRate: settings.default_tva_rate,
    urssafRate: settings.urssaf_rate / 100, // Convert from ppm
    duration: 12
  })

  // Initialize yearly plan with current year + 1 (for next year planning)
  const currentYear = new Date().getFullYear()
  const planningYear = currentYear + 1
  
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]
  
  const getDefaultWorkingDays = (month: number, year: number): number => {
    // Calculate working days (excluding weekends and common French holidays)
    const date = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let workingDays = 0
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day)
      const dayOfWeek = currentDate.getDay()
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++
      }
    }
    
    // Subtract common holidays (simplified)
    if (month === 0) workingDays -= 1 // New Year
    if (month === 4) workingDays -= 3 // May holidays (1st, 8th, Ascension)
    if (month === 6) workingDays -= 1 // July 14th
    if (month === 7) workingDays -= 1 // August 15th
    if (month === 10) workingDays -= 2 // November 1st and 11th
    if (month === 11) workingDays -= 2 // Christmas period
    
    return Math.max(workingDays, 0)
  }

  const [yearlyPlan, setYearlyPlan] = useState<YearlyPlan>(() => {
    const workingDaysPerMonth: WorkingDaysPlan[] = Array.from({ length: 12 }, (_, index) => {
      const defaultWorkingDays = getDefaultWorkingDays(index, planningYear)
      return {
        month: index + 1,
        year: planningYear,
        monthName: monthNames[index],
        workingDays: defaultWorkingDays,
        holidays: 0,
        dailyRate: 400, // Default daily rate
        plannedRevenue: defaultWorkingDays * 400,
        isEditing: false
      }
    })
    
    const totalWorkingDays = workingDaysPerMonth.reduce((sum, month) => sum + month.workingDays, 0)
    const projectedRevenue = workingDaysPerMonth.reduce((sum, month) => sum + month.plannedRevenue, 0)
    
    return {
      year: planningYear,
      totalWorkingDays,
      totalHolidays: 0,
      averageDailyRate: 400,
      projectedRevenue,
      workingDaysPerMonth
    }
  })

  // Functions for planning management
  const updateWorkingDays = (monthIndex: number, workingDays: number) => {
    setYearlyPlan(prev => {
      const updated = { ...prev }
      updated.workingDaysPerMonth[monthIndex].workingDays = workingDays
      updated.workingDaysPerMonth[monthIndex].plannedRevenue = workingDays * updated.workingDaysPerMonth[monthIndex].dailyRate
      
      // Recalculate totals
      updated.totalWorkingDays = updated.workingDaysPerMonth.reduce((sum, month) => sum + month.workingDays, 0)
      updated.projectedRevenue = updated.workingDaysPerMonth.reduce((sum, month) => sum + month.plannedRevenue, 0)
      updated.averageDailyRate = updated.projectedRevenue / updated.totalWorkingDays || 0
      
      return updated
    })
  }

  const updateDailyRate = (monthIndex: number, dailyRate: number) => {
    setYearlyPlan(prev => {
      const updated = { ...prev }
      updated.workingDaysPerMonth[monthIndex].dailyRate = dailyRate
      updated.workingDaysPerMonth[monthIndex].plannedRevenue = updated.workingDaysPerMonth[monthIndex].workingDays * dailyRate
      
      // Recalculate totals
      updated.projectedRevenue = updated.workingDaysPerMonth.reduce((sum, month) => sum + month.plannedRevenue, 0)
      updated.averageDailyRate = updated.projectedRevenue / updated.totalWorkingDays || 0
      
      return updated
    })
  }

  const updateHolidays = (monthIndex: number, holidays: number) => {
    setYearlyPlan(prev => {
      const updated = { ...prev }
      updated.workingDaysPerMonth[monthIndex].holidays = holidays
      
      // Recalculate total holidays
      updated.totalHolidays = updated.workingDaysPerMonth.reduce((sum, month) => sum + month.holidays, 0)
      
      return updated
    })
  }

  const toggleEditMode = (monthIndex: number) => {
    setYearlyPlan(prev => {
      const updated = { ...prev }
      updated.workingDaysPerMonth[monthIndex].isEditing = !updated.workingDaysPerMonth[monthIndex].isEditing
      return updated
    })
  }

  const [scenarios] = useState<SimulationScenario[]>([
    {
      id: 'conservative',
      name: 'Scénario Prudent',
      description: 'Croissance modeste avec marge de sécurité',
      monthlyRevenue: 4000,
      monthlyExpenses: 1200,
      vatRate: 20,
      urssafRate: 22,
      duration: 12
    },
    {
      id: 'optimistic',
      name: 'Scénario Optimiste',
      description: 'Croissance forte avec nouveaux clients',
      monthlyRevenue: 7500,
      monthlyExpenses: 2000,
      vatRate: 20,
      urssafRate: 22,
      duration: 12
    },
    {
      id: 'expansion',
      name: 'Scénario Expansion',
      description: 'Investissement et développement',
      monthlyRevenue: 6000,
      monthlyExpenses: 3000,
      vatRate: 20,
      urssafRate: 22,
      duration: 18
    }
  ])

  const calculateProjection = (config: any) => {
    const results = []
    let cumulativeCash = 0

    for (let month = 0; month < config.duration; month++) {
      const revenue = config.monthlyRevenue * (1 + (month * 0.02)) // 2% growth per month
      const expenses = config.monthlyExpenses
      const vat = revenue * config.vatRate / 100
      const urssaf = revenue * config.urssafRate / 100
      const netIncome = revenue - expenses - vat - urssaf
      cumulativeCash += netIncome

      results.push({
        month: month + 1,
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        vat: Math.round(vat),
        urssaf: Math.round(urssaf),
        netIncome: Math.round(netIncome),
        cumulativeCash: Math.round(cumulativeCash)
      })
    }

    return results
  }

  const projection = calculateProjection(simulation)
  const totalNet = projection.reduce((sum, month) => sum + month.netIncome, 0)
  const averageMonthly = totalNet / simulation.duration

  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-slate-100 mb-2 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Simulations & Projections
            </h1>
            <p className="text-body text-slate-400">
              Modélisez votre activité et planifiez votre développement
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp className="h-4 w-4" />
            <span>Période de base: {currentPeriod.label}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-6 py-3 text-sm font-medium rounded-tl-lg transition-colors ${
              activeTab === 'cashflow'
                ? 'bg-blue-900/20 text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Simulation Cashflow
            </div>
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'scenarios'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Scénarios Types
            </div>
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'goals'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Objectifs & KPIs
            </div>
          </button>
          <button
            onClick={() => setActiveTab('planning')}
            className={`px-6 py-3 text-sm font-medium rounded-tr-lg transition-colors ${
              activeTab === 'planning'
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Planning {planningYear}
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'cashflow' && (
            <div className="space-y-6">
              {/* Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Paramètres de simulation
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CA mensuel (€)
                      </label>
                      <input
                        type="number"
                        value={simulation.monthlyRevenue}
                        onChange={(e) => setSimulation({
                          ...simulation,
                          monthlyRevenue: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Charges mensuelles (€)
                      </label>
                      <input
                        type="number"
                        value={simulation.monthlyExpenses}
                        onChange={(e) => setSimulation({
                          ...simulation,
                          monthlyExpenses: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Taux TVA (%)
                      </label>
                      <select
                        value={simulation.vatRate}
                        onChange={(e) => setSimulation({
                          ...simulation,
                          vatRate: parseFloat(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value={0}>0%</option>
                        <option value={5.5}>5,5%</option>
                        <option value={10}>10%</option>
                        <option value={20}>20%</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Durée (mois)
                      </label>
                      <select
                        value={simulation.duration}
                        onChange={(e) => setSimulation({
                          ...simulation,
                          duration: parseInt(e.target.value)
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                      >
                        <option value={6}>6 mois</option>
                        <option value={12}>12 mois</option>
                        <option value={18}>18 mois</option>
                        <option value={24}>24 mois</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Résultats projection
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total net</div>
                      <div className="text-xl font-bold text-green-600">{formatEuros(totalNet * 100)}</div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Moyenne mensuelle</div>
                      <div className="text-xl font-bold text-blue-600">{formatEuros(averageMonthly * 100)}</div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">TVA totale</div>
                      <div className="text-xl font-bold text-orange-600">
                        {formatEuros(projection.reduce((sum, m) => sum + m.vat, 0) * 100)}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">URSSAF total</div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatEuros(projection.reduce((sum, m) => sum + m.urssaf, 0) * 100)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projection Table */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                    Détail mensuel (avec croissance 2%/mois)
                  </h4>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Mois</th>
                        <th className="px-4 py-2 text-right">CA</th>
                        <th className="px-4 py-2 text-right">Charges</th>
                        <th className="px-4 py-2 text-right">TVA</th>
                        <th className="px-4 py-2 text-right">URSSAF</th>
                        <th className="px-4 py-2 text-right">Net</th>
                        <th className="px-4 py-2 text-right">Cumul</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projection.map((month, index) => (
                        <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="px-4 py-2 font-medium">M{month.month}</td>
                          <td className="px-4 py-2 text-right">{formatEuros(month.revenue * 100)}</td>
                          <td className="px-4 py-2 text-right text-red-600">-{formatEuros(month.expenses * 100)}</td>
                          <td className="px-4 py-2 text-right text-orange-600">-{formatEuros(month.vat * 100)}</td>
                          <td className="px-4 py-2 text-right text-purple-600">-{formatEuros(month.urssaf * 100)}</td>
                          <td className="px-4 py-2 text-right font-medium text-green-600">
                            {formatEuros(month.netIncome * 100)}
                          </td>
                          <td className="px-4 py-2 text-right font-bold">
                            {formatEuros(month.cumulativeCash * 100)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scenarios' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Scénarios de développement
                </h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Créer un scénario
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {scenarios.map((scenario) => {
                  const scenarioProjection = calculateProjection(scenario)
                  const scenarioTotal = scenarioProjection.reduce((sum, m) => sum + m.netIncome, 0)
                  
                  return (
                    <div key={scenario.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {scenario.name}
                        </h4>
                        <button className="text-blue-600 hover:text-blue-700">
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {scenario.description}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>CA mensuel:</span>
                          <span className="font-medium">{formatEuros(scenario.monthlyRevenue * 100)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Charges:</span>
                          <span className="font-medium">{formatEuros(scenario.monthlyExpenses * 100)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Durée:</span>
                          <span className="font-medium">{scenario.duration} mois</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div className="flex justify-between font-semibold">
                            <span>Résultat total:</span>
                            <span className="text-green-600">{formatEuros(scenarioTotal * 100)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setSimulation({
                            monthlyRevenue: scenario.monthlyRevenue,
                            monthlyExpenses: scenario.monthlyExpenses,
                            vatRate: scenario.vatRate,
                            urssafRate: scenario.urssafRate,
                            duration: scenario.duration
                          })
                          setActiveTab('cashflow')
                        }}
                        className="w-full mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        Utiliser ce scénario
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Objectifs & Indicateurs Clés
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Objectifs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Objectifs 2025
                    </h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CA annuel cible</span>
                      <span className="font-medium">60 000 €</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <div className="text-xs text-gray-500">45% atteint (27 000 €)</div>
                  </div>

                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Marge nette cible</span>
                      <span className="font-medium">25%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                    <div className="text-xs text-gray-500">Actuellement: 20%</div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      KPIs Actuels
                    </h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400">CA moyen mensuel</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatEuros(simulation.monthlyRevenue * 100)}
                      </div>
                      <div className="text-xs text-green-600">+12% vs mois dernier</div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Taux de marge nette</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {(((simulation.monthlyRevenue - simulation.monthlyExpenses - 
                           (simulation.monthlyRevenue * simulation.vatRate / 100) - 
                           (simulation.monthlyRevenue * simulation.urssafRate / 100)) / 
                           simulation.monthlyRevenue) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-blue-600">Objectif: 25%</div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400">Provisions mensuelles</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formatEuros((simulation.monthlyRevenue * (simulation.vatRate + simulation.urssafRate) / 100) * 100)}
                      </div>
                      <div className="text-xs text-orange-600">TVA + URSSAF</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Recommandations pour atteindre vos objectifs
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• Augmenter le CA mensuel de 15% pour atteindre 60k€ annuel</li>
                      <li>• Optimiser les charges pour améliorer la marge nette</li>
                      <li>• Prévoir 1 nouveau client par mois pour sécuriser la croissance</li>
                      <li>• Maintenir un tampon de trésorerie de 3 mois de charges</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'planning' && (
            <div className="space-y-6">
              {/* Résumé annuel */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Total jours travaillés</div>
                  <div className="text-2xl font-bold text-blue-400">{yearlyPlan.totalWorkingDays}</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400">Total congés</div>
                  <div className="text-2xl font-bold text-orange-400">{yearlyPlan.totalHolidays}</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400">TJM moyen</div>
                  <div className="text-2xl font-bold text-green-400">{yearlyPlan.averageDailyRate.toFixed(0)}€</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="text-sm text-slate-400">CA prévisionnel {planningYear}</div>
                  <div className="text-2xl font-bold text-purple-400">{formatEuros(yearlyPlan.projectedRevenue * 100)}</div>
                </div>
              </div>

              {/* Tableau de planning mensuel */}
              <div className="bg-slate-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-slate-700">
                  <h4 className="font-semibold text-slate-100">
                    Planning {planningYear} - Jours travaillés et revenus prévisionnels
                  </h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Cliquez sur les valeurs pour les modifier
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-200">Mois</th>
                        <th className="px-4 py-3 text-center text-slate-200">Jours travaillés</th>
                        <th className="px-4 py-3 text-center text-slate-200">Congés</th>
                        <th className="px-4 py-3 text-center text-slate-200">TJM (€)</th>
                        <th className="px-4 py-3 text-right text-slate-200">CA prévisionnel</th>
                        <th className="px-4 py-3 text-center text-slate-200">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yearlyPlan.workingDaysPerMonth.map((month, index) => (
                        <tr key={month.month} className="border-b border-slate-700 hover:bg-slate-750">
                          <td className="px-4 py-3 font-medium text-slate-200">
                            {month.monthName}
                          </td>
                          
                          {/* Jours travaillés */}
                          <td className="px-4 py-3 text-center">
                            {month.isEditing ? (
                              <input
                                type="number"
                                value={month.workingDays}
                                onChange={(e) => updateWorkingDays(index, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-center text-slate-100"
                                min="0"
                                max="31"
                                autoFocus
                              />
                            ) : (
                              <span 
                                onClick={() => toggleEditMode(index)}
                                className="cursor-pointer hover:bg-slate-600 px-2 py-1 rounded text-blue-400 font-medium"
                              >
                                {month.workingDays}
                              </span>
                            )}
                          </td>
                          
                          {/* Congés */}
                          <td className="px-4 py-3 text-center">
                            {month.isEditing ? (
                              <input
                                type="number"
                                value={month.holidays}
                                onChange={(e) => updateHolidays(index, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-center text-slate-100"
                                min="0"
                                max="31"
                              />
                            ) : (
                              <span 
                                onClick={() => toggleEditMode(index)}
                                className="cursor-pointer hover:bg-slate-600 px-2 py-1 rounded text-orange-400"
                              >
                                {month.holidays}
                              </span>
                            )}
                          </td>
                          
                          {/* TJM */}
                          <td className="px-4 py-3 text-center">
                            {month.isEditing ? (
                              <input
                                type="number"
                                value={month.dailyRate}
                                onChange={(e) => updateDailyRate(index, parseInt(e.target.value) || 0)}
                                className="w-20 px-2 py-1 bg-slate-600 border border-slate-500 rounded text-center text-slate-100"
                                min="0"
                                step="50"
                              />
                            ) : (
                              <span 
                                onClick={() => toggleEditMode(index)}
                                className="cursor-pointer hover:bg-slate-600 px-2 py-1 rounded text-green-400 font-medium"
                              >
                                {month.dailyRate}€
                              </span>
                            )}
                          </td>
                          
                          {/* CA prévisionnel */}
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-purple-400">
                              {formatEuros(month.plannedRevenue * 100)}
                            </span>
                          </td>
                          
                          {/* Actions */}
                          <td className="px-4 py-3 text-center">
                            {month.isEditing ? (
                              <button
                                onClick={() => toggleEditMode(index)}
                                className="p-1 text-green-400 hover:text-green-300"
                                title="Sauvegarder"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleEditMode(index)}
                                className="p-1 text-slate-400 hover:text-slate-300"
                                title="Modifier"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-400">
                  Les jours fériés français sont déjà déduits automatiquement. 
                  Vous pouvez ajuster les jours travaillés selon vos besoins.
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Exporter le planning
                  </button>
                  <button 
                    onClick={() => {
                      // Reset to default values
                      setYearlyPlan(prev => ({
                        ...prev,
                        workingDaysPerMonth: prev.workingDaysPerMonth.map((month, index) => ({
                          ...month,
                          workingDays: getDefaultWorkingDays(index, planningYear),
                          holidays: 0,
                          dailyRate: 400,
                          plannedRevenue: getDefaultWorkingDays(index, planningYear) * 400,
                          isEditing: false
                        }))
                      }))
                    }}
                    className="px-4 py-2 bg-slate-600 text-slate-200 rounded-lg hover:bg-slate-500 transition-colors"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}