import React, { useState, useMemo, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Coffee,
  CalendarDays,
  Calculator,
  Settings,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react'

// Types pour la planification annuelle (compatibles avec le backend Rust)
interface MonthPlanning {
  id: string
  year: number
  month: number // 1-12
  max_working_days: number
  holidays_taken: number
  public_holidays: number
  working_days: number
  estimated_revenue_cents: number // en centimes
  created_at: string
  updated_at: string
}

interface YearlyPlanning {
  id: string
  year: number
  tjm_cents: number // Tarif journalier moyen en centimes
  max_working_days_limit: number
  months: MonthPlanning[]
  created_at: string
  updated_at: string
}

interface CreateYearlyPlanningDto {
  year: number
  tjm_cents: number
  max_working_days_limit: number
  months: CreateMonthPlanningDto[]
}

interface CreateMonthPlanningDto {
  month: number
  max_working_days: number
  holidays_taken: number
  public_holidays: number
  working_days: number
  estimated_revenue_cents: number
}

interface UpdateYearlyPlanningDto {
  year: number
  tjm_cents: number
  max_working_days_limit: number
  months: UpdateMonthPlanningDto[]
}

interface UpdateMonthPlanningDto {
  id: string
  month: number
  max_working_days: number
  holidays_taken: number
  public_holidays: number
  working_days: number
  estimated_revenue_cents: number
}

// Jours fériés français fixes (approximation)
const FRENCH_PUBLIC_HOLIDAYS_2025 = {
  1: 1, // Jour de l'an
  5: 3, // 1er mai + 8 mai + Ascension
  7: 1, // 14 juillet
  8: 1, // 15 août
  11: 2, // 11 novembre + 1 variable
  12: 1, // 25 décembre
}

// Fonction pour obtenir le nombre de jours ouvrables dans un mois
const getWorkingDaysInMonth = (year: number, month: number): number => {
  const daysInMonth = new Date(year, month, 0).getDate()
  let workingDays = 0
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    // Lundi (1) à Vendredi (5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      workingDays++
    }
  }
  
  return workingDays
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const YearlyPlanningPage: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [tjm, setTjm] = useState(400) // Tarif journalier moyen par défaut
  const [maxWorkingDaysLimit] = useState(214) // Limite client principal
  const [isLoading, setIsLoading] = useState(false)
  
  // Initialisation des données pour l'année
  const [planningData, setPlanningData] = useState<YearlyPlanningData>(() => {
    const months: MonthPlanningData[] = []
    
    for (let month = 1; month <= 12; month++) {
      const maxDays = getWorkingDaysInMonth(selectedYear, month)
      const publicHolidays = FRENCH_PUBLIC_HOLIDAYS_2025[month as keyof typeof FRENCH_PUBLIC_HOLIDAYS_2025] || 0
      
      months.push({
        month,
        year: selectedYear,
        maxDays,
        holidaysTaken: 0,
        publicHolidays,
        workingDays: maxDays - publicHolidays,
        estimatedRevenue: 0
      })
    }
    
    return {
      year: selectedYear,
      tjm,
      targetAnnualRevenue: 0, // Supprimé - pas utile
      months
    }
  })

  // Calculs automatiques avec ratio limite client
  const calculations = useMemo(() => {
    const totalWorkingDays = planningData.months.reduce((sum, month) => sum + month.workingDays, 0)
    const totalEstimatedRevenue = planningData.months.reduce((sum, month) => sum + month.estimatedRevenue, 0)
    const totalHolidaysTaken = planningData.months.reduce((sum, month) => sum + month.holidaysTaken, 0)
    const totalPublicHolidays = planningData.months.reduce((sum, month) => sum + month.publicHolidays, 0)
    const totalMaxDays = planningData.months.reduce((sum, month) => sum + month.maxDays, 0)
    
    // Ratio par rapport à la limite client
    const workingDaysRatio = (totalWorkingDays / maxWorkingDaysLimit) * 100
    const isOverLimit = totalWorkingDays > maxWorkingDaysLimit
    const remainingDays = maxWorkingDaysLimit - totalWorkingDays
    
    return {
      totalWorkingDays,
      totalEstimatedRevenue,
      totalHolidaysTaken,
      totalPublicHolidays,
      totalMaxDays,
      averageDailyRate: totalWorkingDays > 0 ? totalEstimatedRevenue / totalWorkingDays : 0,
      workingDaysRatio,
      isOverLimit,
      remainingDays,
      maxWorkingDaysLimit
    }
  }, [planningData, maxWorkingDaysLimit])

  // Mise à jour du nombre de congés pris pour un mois
  const updateHolidaysTaken = (monthIndex: number, holidaysTaken: number) => {
    setPlanningData(prev => {
      const newMonths = [...prev.months]
      const month = newMonths[monthIndex]
      const newWorkingDays = Math.max(0, month.maxDays - month.publicHolidays - holidaysTaken)
      
      newMonths[monthIndex] = {
        ...month,
        holidaysTaken,
        workingDays: newWorkingDays,
        estimatedRevenue: newWorkingDays * tjm
      }
      
      return {
        ...prev,
        months: newMonths
      }
    })
  }

  // Mise à jour du CA estimé pour un mois
  const updateEstimatedRevenue = (monthIndex: number, revenue: number) => {
    setPlanningData(prev => {
      const newMonths = [...prev.months]
      newMonths[monthIndex] = {
        ...newMonths[monthIndex],
        estimatedRevenue: revenue
      }
      
      return {
        ...prev,
        months: newMonths
      }
    })
  }

  // Recalculer automatiquement avec le TJM
  const recalculateWithTJM = () => {
    setPlanningData(prev => {
      const newMonths = prev.months.map(month => ({
        ...month,
        estimatedRevenue: month.workingDays * tjm
      }))
      
      return {
        ...prev,
        tjm,
        months: newMonths
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-6 animate-fade-in">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-slate-100 mb-2 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
              <Target className="h-5 w-5 text-white" />
            </div>
            Planification Annuelle {selectedYear}
          </h1>
          <p className="text-body text-slate-400 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Optimisez votre planning freelance et vos objectifs de revenus
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-300">Année:</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="form-input form-select w-auto"
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => setIsLoading(!isLoading)}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* TJM Card */}
        <div className="metric-card animate-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">TJM (Tarif Journalier)</div>
              <div className="text-2xl font-bold text-purple-400 mb-1 font-mono">
                {tjm.toLocaleString('fr-FR')} €
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={tjm}
              onChange={(e) => setTjm(parseFloat(e.target.value) || 0)}
              variant="currency"
              className="flex-1 text-sm"
            />
            <Button 
              onClick={recalculateWithTJM}
              variant="outline"
              size="sm"
            >
              <Calculator className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Working Days Ratio Card */}
        <div className="metric-card animate-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">Limite Client Principal</div>
              <div className={`text-2xl font-bold mb-1 font-mono ${calculations.isOverLimit ? 'text-red-400' : 'text-blue-400'}`}>
                {calculations.totalWorkingDays} / {calculations.maxWorkingDaysLimit}
              </div>
              <div className={`text-sm flex items-center gap-1 ${calculations.isOverLimit ? 'text-red-400' : 'text-green-400'}`}>
                <Calendar className="h-4 w-4" />
                {calculations.workingDaysRatio.toFixed(1)}% utilisé
              </div>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              calculations.isOverLimit ? 'bg-red-500/20' : 'bg-blue-500/20'
            }`}>
              <Target className={`h-6 w-6 ${calculations.isOverLimit ? 'text-red-400' : 'text-blue-400'}`} />
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${calculations.isOverLimit ? 'bg-red-500' : 'bg-blue-500'}`} 
              style={{ width: `${Math.min(100, calculations.workingDaysRatio)}%` }}
            />
          </div>
          {calculations.isOverLimit ? (
            <div className="text-xs text-red-400 mt-2">⚠️ Dépassement de {Math.abs(calculations.remainingDays)} jours</div>
          ) : (
            <div className="text-xs text-green-400 mt-2">✅ {calculations.remainingDays} jours restants</div>
          )}
        </div>

        {/* Revenue Card - Amélioration de la visibilité */}
        <div className="metric-card animate-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="text-sm text-slate-400 mb-1">CA Estimé Total</div>
              <div className="text-3xl font-bold text-green-400 mb-2 font-mono">
                {calculations.totalEstimatedRevenue.toLocaleString('fr-FR')} €
              </div>
              <div className="text-sm text-slate-300 flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                TJM moyen: <span className="font-semibold text-green-400">{calculations.averageDailyRate.toFixed(0)} €</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Répartition</div>
            <div className="text-sm text-slate-300">
              {calculations.totalWorkingDays} jours × {calculations.averageDailyRate.toFixed(0)} € = {calculations.totalEstimatedRevenue.toLocaleString('fr-FR')} €
            </div>
          </div>
        </div>
      </div>

      {/* Compact Monthly Planning Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-400" />
            Planification Mensuelle - Vue Compacte
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Horizontal Scrollable Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3 text-slate-400 font-medium w-20">Metric</th>
                  {planningData.months.map((month, index) => {
                    const isCurrentMonth = new Date().getMonth() === month.month - 1 && new Date().getFullYear() === month.year
                    return (
                      <th 
                        key={index} 
                        className={`text-center p-3 font-medium w-20 ${
                          isCurrentMonth 
                            ? 'text-purple-400 bg-purple-500/10 rounded-t-lg' 
                            : 'text-slate-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs">{MONTH_NAMES[month.month - 1].slice(0, 3)}</span>
                          {isCurrentMonth && <div className="w-1 h-1 bg-purple-400 rounded-full"></div>}
                        </div>
                      </th>
                    )
                  })}
                  <th className="text-center p-3 text-slate-300 font-bold w-24 bg-slate-800/50 rounded-t-lg">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {/* Max Working Days Row */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 text-slate-400 font-medium">J.Max</td>
                  {planningData.months.map((month, index) => (
                    <td key={index} className="p-3 text-center text-slate-200 font-mono">
                      {month.maxDays}
                    </td>
                  ))}
                  <td className="p-3 text-center text-slate-200 font-bold font-mono bg-slate-800/30">
                    {calculations.totalMaxDays}
                  </td>
                </tr>
                
                {/* Public Holidays Row */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 text-slate-400 font-medium">Fériés</td>
                  {planningData.months.map((month, index) => (
                    <td key={index} className="p-3 text-center text-red-400 font-mono">
                      {month.publicHolidays}
                    </td>
                  ))}
                  <td className="p-3 text-center text-red-400 font-bold font-mono bg-slate-800/30">
                    {calculations.totalPublicHolidays}
                  </td>
                </tr>
                
                {/* Holidays Taken Row (Editable) */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 text-slate-400 font-medium">Congés</td>
                  {planningData.months.map((month, index) => (
                    <td key={index} className="p-2">
                      <Input
                        type="number"
                        value={month.holidaysTaken}
                        onChange={(e) => updateHolidaysTaken(index, parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center text-xs font-mono border-orange-500/30 focus:border-orange-500"
                        min="0"
                        max={month.maxDays}
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center text-orange-400 font-bold font-mono bg-slate-800/30">
                    {calculations.totalHolidaysTaken}
                  </td>
                </tr>
                
                {/* Working Days Row */}
                <tr className="hover:bg-slate-800/30 transition-colors border-b-2 border-slate-600">
                  <td className="p-3 text-slate-300 font-bold">J.Trav</td>
                  {planningData.months.map((month, index) => (
                    <td key={index} className="p-3 text-center text-blue-400 font-bold font-mono">
                      {month.workingDays}
                    </td>
                  ))}
                  <td className="p-3 text-center text-blue-400 font-bold font-mono bg-slate-800/50">
                    {calculations.totalWorkingDays}
                  </td>
                </tr>
                
                {/* TJM Row */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 text-slate-400 font-medium">TJM</td>
                  {planningData.months.map((month, index) => {
                    const effectiveDailyRate = month.workingDays > 0 ? month.estimatedRevenue / month.workingDays : 0
                    return (
                      <td key={index} className="p-3 text-center font-mono">
                        <span className={`${
                          effectiveDailyRate >= tjm ? 'text-green-400' : 'text-orange-400'
                        }`}>
                          {effectiveDailyRate.toFixed(0)}€
                        </span>
                      </td>
                    )
                  })}
                  <td className="p-3 text-center text-purple-400 font-bold font-mono bg-slate-800/30">
                    {calculations.averageDailyRate.toFixed(0)}€
                  </td>
                </tr>
                
                {/* Revenue Row (Editable) */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 text-slate-400 font-medium">CA Est</td>
                  {planningData.months.map((month, index) => (
                    <td key={index} className="p-2">
                      <Input
                        type="number"
                        value={month.estimatedRevenue}
                        onChange={(e) => updateEstimatedRevenue(index, parseFloat(e.target.value) || 0)}
                        className="w-20 h-8 text-center text-xs font-mono border-green-500/30 focus:border-green-500"
                        step="100"
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center text-green-400 font-bold font-mono bg-slate-800/30">
                    {(calculations.totalEstimatedRevenue / 1000).toFixed(1)}k€
                  </td>
                </tr>
                
                {/* Status Row */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3 text-slate-400 font-medium">Status</td>
                  {planningData.months.map((month, index) => {
                    const effectiveDailyRate = month.workingDays > 0 ? month.estimatedRevenue / month.workingDays : 0
                    const targetMonthlyRevenue = (targetRevenue / 12)
                    const isOnTrack = month.estimatedRevenue >= targetMonthlyRevenue * 0.8
                    const isGood = effectiveDailyRate >= tjm && month.estimatedRevenue >= targetMonthlyRevenue * 0.9
                    
                    return (
                      <td key={index} className="p-3 text-center">
                        <div className="flex justify-center">
                          <div className={`w-4 h-4 rounded-full ${
                            isGood 
                              ? 'bg-green-500' 
                              : isOnTrack 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                          }`}></div>
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-3 text-center bg-slate-800/30">
                    <div className="flex justify-center">
                      <div className={`w-4 h-4 rounded-full ${
                        calculations.totalEstimatedRevenue >= targetRevenue 
                          ? 'bg-green-500' 
                          : calculations.totalEstimatedRevenue >= targetRevenue * 0.8
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Status Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Objectif atteint</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>En cours (80%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>En retard</span>
            </div>
          </div>

          {/* Quick Analysis Summary */}
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-400" />
              Analyse Rapide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Objectif annuel:</span>
                  <span className="font-mono text-slate-200">{targetRevenue.toLocaleString('fr-FR')}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">CA estimé:</span>
                  <span className={`font-mono font-semibold ${
                    calculations.totalEstimatedRevenue >= targetRevenue ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {calculations.totalEstimatedRevenue.toLocaleString('fr-FR')}€ 
                    ({((calculations.totalEstimatedRevenue / targetRevenue) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Jours travaillés:</span>
                  <span className="font-mono text-blue-400">{calculations.totalWorkingDays}/{calculations.totalMaxDays} ({((calculations.totalWorkingDays / calculations.totalMaxDays) * 100).toFixed(0)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TJM nécessaire/actuel:</span>
                  <span className="font-mono text-slate-200">
                    {calculations.totalWorkingDays > 0 ? (targetRevenue / calculations.totalWorkingDays).toFixed(0) : '0'}€ / {calculations.averageDailyRate.toFixed(0)}€
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work-Life Balance Card */}
        <Card className="animate-in" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-orange-400" />
              Équilibre Travail-Vie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Jours ouvrables totaux</span>
                <span className="font-semibold text-slate-200">{calculations.totalMaxDays}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Congés prévus</span>
                <span className="font-semibold text-orange-400">{calculations.totalHolidaysTaken}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Jours fériés</span>
                <span className="font-semibold text-red-400">{calculations.totalPublicHolidays}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                <span className="text-slate-300 font-medium">Jours travaillés</span>
                <span className="font-bold text-blue-400">{calculations.totalWorkingDays}</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Charge de travail</span>
                  <span>{((calculations.totalWorkingDays / calculations.totalMaxDays) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${(calculations.totalWorkingDays / calculations.totalMaxDays) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance & Goals Card */}
        <Card className="animate-in" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Performance & Objectifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Objectif annuel</span>
                <span className="font-semibold text-slate-200">
                  {targetRevenue.toLocaleString('fr-FR')} €
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">CA estimé total</span>
                <span className="font-semibold text-green-400">
                  {calculations.totalEstimatedRevenue.toLocaleString('fr-FR')} €
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Réalisation prévue</span>
                <span className={`font-semibold ${
                  calculations.totalEstimatedRevenue >= targetRevenue ? 'text-green-400' : 'text-orange-400'
                }`}>
                  {((calculations.totalEstimatedRevenue / targetRevenue) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Écart à l'objectif</span>
                <span className={`font-semibold ${
                  calculations.totalEstimatedRevenue >= targetRevenue 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {(calculations.totalEstimatedRevenue - targetRevenue).toLocaleString('fr-FR')} €
                </span>
              </div>
              <div className="border-t border-slate-700 pt-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">TJM nécessaire</span>
                  <span className="font-bold text-slate-200">
                    {calculations.totalWorkingDays > 0 
                      ? (targetRevenue / calculations.totalWorkingDays).toFixed(0) 
                      : '0'} €
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">TJM actuel moyen</span>
                  <span className={`font-bold ${
                    calculations.averageDailyRate >= (targetRevenue / calculations.totalWorkingDays) 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    {calculations.averageDailyRate.toFixed(0)} €
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Progression objectif</span>
                  <span>{Math.min(100, (calculations.totalEstimatedRevenue / targetRevenue) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      calculations.totalEstimatedRevenue >= targetRevenue 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                        : 'bg-gradient-to-r from-orange-500 to-red-500'
                    }`} 
                    style={{ width: `${Math.min(100, (calculations.totalEstimatedRevenue / targetRevenue) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default YearlyPlanningPage