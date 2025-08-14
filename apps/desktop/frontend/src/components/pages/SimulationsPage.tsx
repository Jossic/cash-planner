import React, { useState } from 'react'
import { TrendingUp, Calculator, BarChart3, Target, Lightbulb, ArrowRight } from 'lucide-react'
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

export const SimulationsPage: React.FC = () => {
  const currentPeriod = useCurrentPeriod()
  const { settings } = useAppStore()
  
  const [activeTab, setActiveTab] = useState<'cashflow' | 'scenarios' | 'goals'>('cashflow')
  
  const [simulation, setSimulation] = useState({
    monthlyRevenue: 5000,
    monthlyExpenses: 1500,
    vatRate: settings.default_tva_rate,
    urssafRate: settings.urssaf_rate / 100, // Convert from ppm
    duration: 12
  })

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
            className={`px-6 py-3 text-sm font-medium rounded-tr-lg transition-colors ${
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
        </div>
      </div>
    </div>
  )
}