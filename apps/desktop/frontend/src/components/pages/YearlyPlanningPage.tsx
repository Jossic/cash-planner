import React, {useEffect, useMemo, useState} from 'react'
import {invoke} from '@tauri-apps/api/core'
import {Button} from '../ui/Button'
import {AlertTriangle, RefreshCw, Save} from 'lucide-react'

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

// Jours fériés français (plus précis)
const getFrenchPublicHolidays = (year: number): Record<number, number> => {
    // Jours fériés fixes + estimation des jours variables
    // Les jours fériés variables (Pâques, Ascension, Pentecôte) varient selon l'année
    const holidays: Record<number, number> = {
        1: 1,  // 1er janvier (Jour de l'an)
        4: 1,  // Lundi de Pâques (approximation - tombe souvent en avril)
        5: 3,  // 1er mai (Fête du travail) + 8 mai (Victoire 1945) + Ascension (souvent en mai)
        6: 1,  // Parfois Pentecôte en juin
        7: 1,  // 14 juillet (Fête nationale)
        8: 1,  // 15 août (Assomption)
        11: 1, // 1er novembre (Toussaint) + 11 novembre (Armistice)
        12: 1, // 25 décembre (Noël)
    }

    // Ajustements selon l'année (Pâques bouge)
    if (year === 2025) {
        holidays[4] = 1 // Lundi de Pâques: 21 avril 2025
        holidays[5] = 3 // 1er mai + 8 mai + Ascension (29 mai)
    } else if (year === 2026) {
        holidays[4] = 1 // Lundi de Pâques: 6 avril 2026
        holidays[5] = 3 // 1er mai + 8 mai + Ascension (14 mai)
    } else if (year === 2027) {
        holidays[3] = 1 // Lundi de Pâques: 29 mars 2027
        holidays[4] = 0 // Pas en avril
        holidays[5] = 4 // 1er mai + 8 mai + Ascension (6 mai) + Pentecôte
    } else if (year === 2028) {
        holidays[4] = 1 // Lundi de Pâques: 17 avril 2028
        holidays[5] = 3 // 1er mai + 8 mai + Ascension (25 mai)
    } else if (year === 2024) {
        holidays[4] = 1 // Lundi de Pâques: 1er avril 2024
        holidays[5] = 4 // 1er mai + 8 mai + Ascension (9 mai) + Pentecôte (20 mai)
    }

    return holidays
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
    const [planningData, setPlanningData] = useState<YearlyPlanning | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    // Charger les données depuis le backend
    const loadYearlyPlanning = async (year: number) => {
        setIsLoading(true)
        try {
            const result = await invoke<YearlyPlanning | null>('cmd_get_yearly_planning', {year})
            if (result) {
                setPlanningData(result)
            } else {
                // Créer une nouvelle planification avec des valeurs par défaut
                const defaultPlanning = createDefaultPlanning(year)
                setPlanningData(defaultPlanning)
            }
        } catch (error) {
            console.error('Erreur lors du chargement de la planification:', error)
            // En cas d'erreur, créer une planification par défaut
            const defaultPlanning = createDefaultPlanning(year)
            setPlanningData(defaultPlanning)
        } finally {
            setIsLoading(false)
        }
    }

    // Créer une planification par défaut
    const createDefaultPlanning = (year: number): YearlyPlanning => {
        const months: MonthPlanning[] = []
        const holidays = getFrenchPublicHolidays(year)

        for (let month = 1; month <= 12; month++) {
            const maxDays = getWorkingDaysInMonth(year, month)
            const publicHolidays = holidays[month] || 0
            const workingDays = Math.max(0, maxDays - publicHolidays)

            months.push({
                id: `temp-${year}-${month}`, // ID temporaire
                year,
                month,
                max_working_days: maxDays,
                holidays_taken: 0,
                public_holidays: publicHolidays,
                working_days: workingDays,
                estimated_revenue_cents: workingDays * 40000, // 400€ par défaut
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
        }

        return {
            id: `temp-${year}`, // ID temporaire
            year,
            tjm_cents: 40000, // 400€ par défaut
            max_working_days_limit: 214,
            months,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }
    }

    // Charger les données au montage du composant et lors du changement d'année
    useEffect(() => {
        loadYearlyPlanning(selectedYear)
    }, [selectedYear])

    // Sauvegarder la planification
    const savePlanning = async () => {
        if (!planningData) return

        setIsLoading(true)
        try {
            const isNewPlanning = planningData.id.startsWith('temp-')

            if (isNewPlanning) {
                // Créer une nouvelle planification
                const createDto: CreateYearlyPlanningDto = {
                    year: planningData.year,
                    tjm_cents: planningData.tjm_cents,
                    max_working_days_limit: planningData.max_working_days_limit,
                    months: planningData.months.map(month => ({
                        month: month.month,
                        max_working_days: month.max_working_days,
                        holidays_taken: month.holidays_taken,
                        public_holidays: month.public_holidays,
                        working_days: month.working_days,
                        estimated_revenue_cents: month.estimated_revenue_cents,
                    }))
                }

                await invoke('cmd_create_yearly_planning', {dto: createDto})
            } else {
                // Mettre à jour la planification existante
                const updateDto: UpdateYearlyPlanningDto = {
                    year: planningData.year,
                    tjm_cents: planningData.tjm_cents,
                    max_working_days_limit: planningData.max_working_days_limit,
                    months: planningData.months.map(month => ({
                        id: month.id,
                        month: month.month,
                        max_working_days: month.max_working_days,
                        holidays_taken: month.holidays_taken,
                        public_holidays: month.public_holidays,
                        working_days: month.working_days,
                        estimated_revenue_cents: month.estimated_revenue_cents,
                    }))
                }

                await invoke('cmd_update_yearly_planning', {dto: updateDto})
            }

            // Recharger les données pour obtenir les IDs corrects
            await loadYearlyPlanning(selectedYear)
            setHasUnsavedChanges(false)
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error)
            alert('Erreur lors de la sauvegarde de la planification')
        } finally {
            setIsLoading(false)
        }
    }

    // Calculs automatiques
    const calculations = useMemo(() => {
        if (!planningData) return {
            totalWorkingDays: 0,
            totalEstimatedRevenue: 0,
            totalHolidaysTaken: 0,
            totalPublicHolidays: 0,
            totalMaxDays: 0,
            averageDailyRate: 0,
            workingDaysRatio: 0,
            isOverLimit: false,
            remainingDays: 0,
        }

        const totalWorkingDays = planningData.months.reduce((sum, month) => sum + month.working_days, 0)
        const totalEstimatedRevenue = planningData.months.reduce((sum, month) => sum + month.estimated_revenue_cents, 0)
        const totalHolidaysTaken = planningData.months.reduce((sum, month) => sum + month.holidays_taken, 0)
        const totalPublicHolidays = planningData.months.reduce((sum, month) => sum + month.public_holidays, 0)
        const totalMaxDays = planningData.months.reduce((sum, month) => sum + month.max_working_days, 0)

        // Ratio par rapport à la limite client
        const workingDaysRatio = (totalWorkingDays / planningData.max_working_days_limit) * 100
        const isOverLimit = totalWorkingDays > planningData.max_working_days_limit
        const remainingDays = planningData.max_working_days_limit - totalWorkingDays

        return {
            totalWorkingDays,
            totalEstimatedRevenue: totalEstimatedRevenue / 100, // Convertir en euros
            totalHolidaysTaken,
            totalPublicHolidays,
            totalMaxDays,
            averageDailyRate: totalWorkingDays > 0 ? (totalEstimatedRevenue / 100) / totalWorkingDays : 0,
            workingDaysRatio,
            isOverLimit,
            remainingDays,
        }
    }, [planningData])

    // Mise à jour du TJM
    const updateTjm = (newTjm: number) => {
        if (!planningData) return

        const tjmCents = newTjm * 100
        const updatedPlanning: YearlyPlanning = {
            ...planningData,
            tjm_cents: tjmCents,
            months: planningData.months.map(month => ({
                ...month,
                estimated_revenue_cents: month.working_days * tjmCents
            }))
        }

        setPlanningData(updatedPlanning)
        setHasUnsavedChanges(true)
    }

    // Mise à jour des congés pour un mois
    const updateHolidaysTaken = (monthIndex: number, holidaysTaken: number) => {
        if (!planningData) return

        const updatedMonths = [...planningData.months]
        const month = updatedMonths[monthIndex]
        const newWorkingDays = Math.max(0, month.max_working_days - month.public_holidays - holidaysTaken)

        updatedMonths[monthIndex] = {
            ...month,
            holidays_taken: holidaysTaken,
            working_days: newWorkingDays,
            estimated_revenue_cents: newWorkingDays * planningData.tjm_cents
        }

        setPlanningData({
            ...planningData,
            months: updatedMonths
        })
        setHasUnsavedChanges(true)
    }

    // Mise à jour du CA estimé pour un mois
    const updateEstimatedRevenue = (monthIndex: number, revenueInEuros: number) => {
        if (!planningData) return

        const updatedMonths = [...planningData.months]
        updatedMonths[monthIndex] = {
            ...updatedMonths[monthIndex],
            estimated_revenue_cents: revenueInEuros * 100
        }

        setPlanningData({
            ...planningData,
            months: updatedMonths
        })
        setHasUnsavedChanges(true)
    }

    if (isLoading && !planningData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-400"/>
                <span className="ml-2 text-slate-300">Chargement de la planification...</span>
            </div>
        )
    }

    if (!planningData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
                    <p className="text-lg text-slate-300">Erreur lors du chargement de la planification</p>
                    <Button onClick={() => loadYearlyPlanning(selectedYear)} className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2"/>
                        Réessayer
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header Section */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-slate-100">
                            Planification Annuelle
                        </h1>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {[2024, 2025, 2026, 2027, 2028].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* TJM Input */}
                        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                            <label className="text-sm font-medium text-slate-300">TJM:</label>
                            <input
                                type="number"
                                value={planningData.tjm_cents / 100}
                                onChange={(e) => updateTjm(parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-lg font-bold bg-slate-900 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100 text-center"
                            />
                            <span className="text-lg font-medium text-slate-300">€</span>
                        </div>

                        <Button
                            onClick={savePlanning}
                            disabled={isLoading || !hasUnsavedChanges}
                            className={hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        >
                            <Save className="h-4 w-4 mr-2"/>
                            {isLoading ? 'Sauvegarde...' : hasUnsavedChanges ? 'Sauvegarder*' : 'Sauvegardé'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-6 py-6">
                {/* Key Metrics - Compact Row */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    {/* Total Revenue */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Chiffre d'Affaires Total</h3>
                        <div className="text-2xl font-bold text-green-400">
                            {calculations.totalEstimatedRevenue.toLocaleString('fr-FR')} €
                        </div>
                        <div className="text-sm text-slate-500 mt-1">
                            TJM moyen: {calculations.averageDailyRate.toFixed(0)} €/j
                        </div>
                    </div>

                    {/* Working Days with 214 limit */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Limite 214 jours</h3>
                        <div className={`text-2xl font-bold ${calculations.isOverLimit ? 'text-red-400' : 'text-green-400'}`}>
                            {calculations.totalWorkingDays} / 214
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-slate-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${calculations.isOverLimit ? 'bg-red-500' : 'bg-green-500'}`}
                                    style={{width: `${Math.min(calculations.workingDaysRatio, 100)}%`}}
                                />
                            </div>
                            <span className={`text-sm font-medium ${calculations.isOverLimit ? 'text-red-400' : 'text-green-400'}`}>
                {calculations.workingDaysRatio.toFixed(1)}%
              </span>
                        </div>
                        {calculations.isOverLimit && (
                            <div className="text-sm text-red-400 mt-1 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1"/>
                                Dépassement: {Math.abs(calculations.remainingDays)}j
                            </div>
                        )}
                        {!calculations.isOverLimit && calculations.remainingDays > 0 && (
                            <div className="text-sm text-slate-500 mt-1">
                                Marge restante: {calculations.remainingDays}j
                            </div>
                        )}
                    </div>

                    {/* Summary Stats */}
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-slate-400 mb-2">Résumé</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Jours disponibles:</span>
                                <span className="font-medium text-slate-300">{calculations.totalMaxDays}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Congés pris:</span>
                                <span className="font-medium text-orange-400">{calculations.totalHolidaysTaken}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Jours fériés:</span>
                                <span className="font-medium text-red-400">{calculations.totalPublicHolidays}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Monthly Planning Table - Compact Horizontal Layout */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800 bg-slate-850">
                        <h2 className="text-lg font-semibold text-slate-100">Planification Mensuelle</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="bg-slate-850 border-b border-slate-800">
                                <th className="px-3 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-24">
                                    Mois
                                </th>
                                {planningData.months.map((month) => (
                                    <th key={month.id} className="px-2 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider min-w-[90px]">
                                        {MONTH_NAMES[month.month - 1].substring(0, 3)}
                                    </th>
                                ))}
                                <th className="px-3 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider w-20">
                                    Total
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-slate-900 divide-y divide-slate-800">
                            {/* Row 1: Jours Max */}
                            <tr>
                                <td className="px-3 py-2 text-sm font-medium text-slate-300 bg-slate-850">
                                    Jours max
                                </td>
                                {planningData.months.map((month) => (
                                    <td key={month.id} className="px-2 py-2 text-center text-sm text-slate-400">
                                        {month.max_working_days}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-slate-300 bg-slate-850">
                                    {calculations.totalMaxDays}
                                </td>
                            </tr>

                            {/* Row 2: Congés (Editable) */}
                            <tr className="bg-slate-900/50">
                                <td className="px-3 py-2 text-sm font-medium text-orange-400 bg-slate-850">
                                    Congés
                                </td>
                                {planningData.months.map((month, index) => (
                                    <td key={month.id} className="px-2 py-2 text-center">
                                        <input
                                            type="number"
                                            value={month.holidays_taken}
                                            onChange={(e) => updateHolidaysTaken(index, parseInt(e.target.value) || 0)}
                                            className="w-full px-1 py-1 text-sm text-center bg-slate-800 border border-orange-500/30 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-orange-400"
                                            min="0"
                                            max={month.max_working_days}
                                        />
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-orange-400 bg-slate-850">
                                    {calculations.totalHolidaysTaken}
                                </td>
                            </tr>

                            {/* Row 3: Jours Fériés */}
                            <tr>
                                <td className="px-3 py-2 text-sm font-medium text-red-400 bg-slate-850">
                                    Fériés
                                </td>
                                {planningData.months.map((month) => (
                                    <td key={month.id} className="px-2 py-2 text-center text-sm text-red-400">
                                        {month.public_holidays}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-red-400 bg-slate-850">
                                    {calculations.totalPublicHolidays}
                                </td>
                            </tr>

                            {/* Row 4: Jours Travaillés */}
                            <tr className="bg-slate-900/50">
                                <td className="px-3 py-2 text-sm font-medium text-green-400 bg-slate-850">
                                    Travaillés
                                </td>
                                {planningData.months.map((month) => (
                                    <td key={month.id} className="px-2 py-2 text-center text-sm font-bold text-green-400">
                                        {month.working_days}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-green-400 bg-slate-850">
                                    {calculations.totalWorkingDays}
                                </td>
                            </tr>

                            {/* Row 5: CA Estimé (Editable) */}
                            <tr className="bg-slate-900/50">
                                <td className="px-3 py-2 text-sm font-medium text-blue-400 bg-slate-850">
                                    CA estimé (€)
                                </td>
                                {planningData.months.map((month, index) => (
                                    <td key={month.id} className="px-2 py-2 text-center">
                                        <input
                                            type="number"
                                            value={Math.round(month.estimated_revenue_cents / 100)}
                                            onChange={(e) => updateEstimatedRevenue(index, parseInt(e.target.value) || 0)}
                                            className="w-full px-1 py-1 text-sm text-center bg-slate-800 border border-blue-500/30 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-blue-400"
                                        />
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-blue-400 bg-slate-850">
                                    {Math.round(calculations.totalEstimatedRevenue).toLocaleString('fr-FR')}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Floating Save Notification */}
            {hasUnsavedChanges && (
                <div className="fixed bottom-6 right-6 bg-slate-900 border border-orange-500/50 rounded-lg p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-orange-400">
                            <AlertTriangle className="h-5 w-5"/>
                            <span className="font-medium">Modifications non sauvegardées</span>
                        </div>
                        <Button
                            onClick={savePlanning}
                            disabled={isLoading}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Sauvegarder
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default YearlyPlanningPage