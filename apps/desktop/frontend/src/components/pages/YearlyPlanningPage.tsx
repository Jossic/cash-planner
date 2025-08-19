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

// Plus de calcul automatique des jours fériés - l'utilisateur les saisit manuellement

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
    const [showSaveToast, setShowSaveToast] = useState(false)
    const [previousDecemberRevenue, setPreviousDecemberRevenue] = useState<number>(0)

    // Charger le CA de décembre de l'année précédente
    const loadPreviousDecemberRevenue = async (year: number) => {
        try {
            const previousYear = year - 1
            const previousYearPlanning = await invoke<YearlyPlanning | null>('cmd_get_yearly_planning', {year: previousYear})
            if (previousYearPlanning && previousYearPlanning.months.length >= 12) {
                const decemberMonth = previousYearPlanning.months.find(m => m.month === 12)
                if (decemberMonth) {
                    setPreviousDecemberRevenue(decemberMonth.estimated_revenue_cents / 100)
                    return
                }
            }
        } catch (error) {
            console.log('Pas de données pour décembre de l\'année précédente')
        }
        setPreviousDecemberRevenue(0)
    }

    // Charger les données depuis le backend
    const loadYearlyPlanning = async (year: number) => {
        setIsLoading(true)
        try {
            // Charger les données de l'année courante
            const result = await invoke<YearlyPlanning | null>('cmd_get_yearly_planning', {year})
            if (result) {
                setPlanningData(result)
            } else {
                // Créer une nouvelle planification avec des valeurs par défaut
                const defaultPlanning = createDefaultPlanning(year)
                setPlanningData(defaultPlanning)
            }
            
            // Charger le CA de décembre de l'année précédente pour le calcul de janvier
            await loadPreviousDecemberRevenue(year)
            
        } catch (error) {
            console.error('Erreur lors du chargement de la planification:', error)
            // En cas d'erreur, créer une planification par défaut
            const defaultPlanning = createDefaultPlanning(year)
            setPlanningData(defaultPlanning)
            setPreviousDecemberRevenue(0)
        } finally {
            setIsLoading(false)
        }
    }

    // Créer une planification par défaut
    const createDefaultPlanning = (year: number): YearlyPlanning => {
        const months: MonthPlanning[] = []

        for (let month = 1; month <= 12; month++) {
            const maxDays = getWorkingDaysInMonth(year, month)

            months.push({
                id: `temp-${year}-${month}`, // ID temporaire
                year,
                month,
                max_working_days: maxDays,
                holidays_taken: 0,
                public_holidays: 0, // L'utilisateur saisira manuellement
                working_days: maxDays, // Par défaut = jours max (avant saisie congés/fériés)
                estimated_revenue_cents: maxDays * 40000, // 400€ * jours max par défaut
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
            
            // Afficher le toast de confirmation
            setShowSaveToast(true)
            setTimeout(() => setShowSaveToast(false), 3000)
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
            monthlyTaxCalculations: [],
            totalVat: 0,
            totalUrssaf: 0,
            totalTax: 0,
            totalEncaissed: 0,
            totalAvailable: 0,
        }

        const totalWorkingDays = planningData.months.reduce((sum, month) => sum + month.working_days, 0)
        const totalEstimatedRevenue = planningData.months.reduce((sum, month) => sum + month.estimated_revenue_cents, 0)
        const totalHolidaysTaken = planningData.months.reduce((sum, month) => sum + month.holidays_taken, 0)
        const totalPublicHolidays = planningData.months.reduce((sum, month) => sum + month.public_holidays, 0)
        const totalMaxDays = planningData.months.reduce((sum, month) => sum + month.max_working_days, 0)

        // Calculs TVA + URSSAF par mois avec décalage
        const VAT_RATE = 0.20 // 20% sur HT
        const URSSAF_RATE = 0.261 // 26.1% sur HT
        
        const monthlyTaxCalculations = planningData.months.map((month, index) => {
            const estimatedRevenue = month.estimated_revenue_cents / 100 // CA estimé (facturé ce mois)
            
            // CA HT estimé facturé le mois précédent (décalage d'encaissement)
            let encaissedRevenueHT = 0
            if (index > 0) {
                // Mois 2-12: prendre le CA estimé HT du mois précédent de la même année
                encaissedRevenueHT = planningData.months[index - 1].estimated_revenue_cents / 100
            } else if (index === 0) {
                // Janvier: prendre le CA estimé HT de décembre de l'année précédente
                encaissedRevenueHT = previousDecemberRevenue
            }
            
            // CA HT pour calculs TVA/URSSAF = CA encaissé le mois précédent (donc facturé 2 mois avant)
            let taxableRevenueHT = 0
            if (index > 1) {
                // Mois 3-12: prendre le CA estimé HT de 2 mois avant
                taxableRevenueHT = planningData.months[index - 2].estimated_revenue_cents / 100
            } else if (index === 1) {
                // Février: prendre décembre N-1
                taxableRevenueHT = previousDecemberRevenue
            } else {
                // Janvier: pas de données (besoin novembre N-1)
                taxableRevenueHT = 0
            }
            
            // CA TTC théorique = CA HT + TVA
            const encaissedRevenueTTCTheorique = encaissedRevenueHT * (1 + VAT_RATE)
            
            // Commission Malt prélevée AVANT virement (sur le HT puis avec TVA)
            const maltCommissionHT = encaissedRevenueHT * 0.05 // Commission Malt HT = 5% du HT
            const maltCommissionTTC = maltCommissionHT * (1 + VAT_RATE) // Commission Malt TTC
            
            // CA réellement encaissé sur le compte = TTC théorique - Commission Malt TTC
            const encaissedRevenueNet = encaissedRevenueTTCTheorique - maltCommissionTTC
            
            // Calculs des charges sur le CA HT encaissé le mois précédent (facturé 2 mois avant)
            const vatAmount = taxableRevenueHT * VAT_RATE // TVA = 20% du HT encaissé N-1
            const urssafAmount = taxableRevenueHT * URSSAF_RATE // URSSAF = 26.1% du HT encaissé N-1
            
            const totalTaxes = vatAmount + urssafAmount // Total charges = TVA + URSSAF (Malt déjà déduit)
            const availableAmount = encaissedRevenueNet - totalTaxes // CA disponible = Net encaissé - charges
            
            return {
                monthIndex: index,
                estimatedRevenue, // CA facturé ce mois
                encaissedRevenue: encaissedRevenueNet, // CA net reçu ce mois (TTC - Com. Malt TTC)
                vatAmount, // TVA sur CA encaissé N-1 (facturé N-2)
                urssafAmount, // URSSAF sur CA encaissé N-1 (facturé N-2)
                maltCommission: maltCommissionTTC, // Commission Malt TTC prélevée par Malt
                totalTaxes, // Total charges (TVA + URSSAF)
                availableAmount, // CA disponible après charges
            }
        })
        
        const totalVat = monthlyTaxCalculations.reduce((sum, calc) => sum + calc.vatAmount, 0)
        const totalUrssaf = monthlyTaxCalculations.reduce((sum, calc) => sum + calc.urssafAmount, 0)
        const totalMaltCommission = monthlyTaxCalculations.reduce((sum, calc) => sum + calc.maltCommission, 0)
        const totalTax = monthlyTaxCalculations.reduce((sum, calc) => sum + calc.totalTaxes, 0)
        const totalEncaissed = monthlyTaxCalculations.reduce((sum, calc) => sum + calc.encaissedRevenue, 0)
        const totalAvailable = monthlyTaxCalculations.reduce((sum, calc) => sum + calc.availableAmount, 0)

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
            monthlyTaxCalculations,
            totalVat,
            totalUrssaf,
            totalMaltCommission,
            totalTax,
            totalEncaissed,
            totalAvailable,
        }
    }, [planningData, previousDecemberRevenue])

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

    // Mise à jour des congés pour un mois (accepte les demi-journées)
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

    // Mise à jour des jours fériés pour un mois
    const updatePublicHolidays = (monthIndex: number, publicHolidays: number) => {
        if (!planningData) return

        const updatedMonths = [...planningData.months]
        const month = updatedMonths[monthIndex]
        const newWorkingDays = Math.max(0, month.max_working_days - publicHolidays - month.holidays_taken)

        updatedMonths[monthIndex] = {
            ...month,
            public_holidays: publicHolidays,
            working_days: newWorkingDays,
            estimated_revenue_cents: newWorkingDays * planningData.tjm_cents
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
                                            type="text"
                                            value={month.holidays_taken === 0 ? '' : month.holidays_taken.toString()}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(',', '.')
                                                const numValue = parseFloat(value)
                                                if (!isNaN(numValue) && numValue >= 0 && numValue <= month.max_working_days) {
                                                    updateHolidaysTaken(index, numValue)
                                                } else if (value === '') {
                                                    updateHolidaysTaken(index, 0)
                                                }
                                            }}
                                            placeholder="0"
                                            className="w-full px-1 py-1 text-sm text-center bg-slate-800 border border-orange-500/30 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-orange-400"
                                        />
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-orange-400 bg-slate-850">
                                    {calculations.totalHolidaysTaken}
                                </td>
                            </tr>

                            {/* Row 3: Jours Fériés (Editable) */}
                            <tr>
                                <td className="px-3 py-2 text-sm font-medium text-red-400 bg-slate-850">
                                    Fériés
                                </td>
                                {planningData.months.map((month, index) => (
                                    <td key={month.id} className="px-2 py-2 text-center">
                                        <input
                                            type="number"
                                            value={month.public_holidays}
                                            onChange={(e) => updatePublicHolidays(index, parseInt(e.target.value) || 0)}
                                            className="w-full px-1 py-1 text-sm text-center bg-slate-800 border border-red-500/30 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-400"
                                            min="0"
                                            max={month.max_working_days}
                                        />
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

                            {/* Row 5: CA Estimé (Calculé automatiquement) */}
                            <tr className="bg-slate-900/50">
                                <td className="px-3 py-2 text-sm font-medium text-blue-400 bg-slate-850">
                                    CA estimé (€)
                                </td>
                                {planningData.months.map((month) => (
                                    <td key={month.id} className="px-2 py-2 text-center text-sm font-bold text-blue-400">
                                        {Math.round(month.estimated_revenue_cents / 100).toLocaleString('fr-FR')}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-blue-400 bg-slate-850">
                                    {Math.round(calculations.totalEstimatedRevenue).toLocaleString('fr-FR')}
                                </td>
                            </tr>

                            {/* Row 6: Commission Malt */}
                            <tr>
                                <td className="px-3 py-2 text-sm font-medium text-cyan-400 bg-slate-850">
                                    Com. Malt TTC (€)
                                </td>
                                {calculations.monthlyTaxCalculations.map((calc) => (
                                    <td key={calc.monthIndex} className="px-2 py-2 text-center text-sm text-cyan-400">
                                        {calc.maltCommission === 0 ? '-' : Math.round(calc.maltCommission).toLocaleString('fr-FR')}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-cyan-400 bg-slate-850">
                                    {Math.round(calculations.totalMaltCommission).toLocaleString('fr-FR')}
                                </td>
                            </tr>

                            {/* Row 7: CA Encaissé (décalé N-1) */}
                            <tr className="bg-slate-900/50 border-t border-slate-600">
                                <td className="px-3 py-2 text-sm font-medium text-purple-400 bg-slate-850">
                                    CA encaissé net (€)
                                </td>
                                {calculations.monthlyTaxCalculations.map((calc) => (
                                    <td key={calc.monthIndex} className="px-2 py-2 text-center text-sm font-bold text-purple-400">
                                        {calc.encaissedRevenue === 0 ? '-' : Math.round(calc.encaissedRevenue).toLocaleString('fr-FR')}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-purple-400 bg-slate-850">
                                    {Math.round(calculations.totalEncaissed).toLocaleString('fr-FR')}
                                </td>
                            </tr>

                            {/* Row 7: TVA */}
                            <tr>
                                <td className="px-3 py-2 text-sm font-medium text-yellow-400 bg-slate-850">
                                    TVA (€)
                                </td>
                                {calculations.monthlyTaxCalculations.map((calc) => (
                                    <td key={calc.monthIndex} className="px-2 py-2 text-center text-sm text-yellow-400">
                                        {calc.vatAmount === 0 ? '-' : Math.round(calc.vatAmount).toLocaleString('fr-FR')}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-yellow-400 bg-slate-850">
                                    {Math.round(calculations.totalVat).toLocaleString('fr-FR')}
                                </td>
                            </tr>

                            {/* Row 9: URSSAF */}
                            <tr className="bg-slate-900/50">
                                <td className="px-3 py-2 text-sm font-medium text-orange-400 bg-slate-850">
                                    URSSAF (€)
                                </td>
                                {calculations.monthlyTaxCalculations.map((calc) => (
                                    <td key={calc.monthIndex} className="px-2 py-2 text-center text-sm text-orange-400">
                                        {calc.urssafAmount === 0 ? '-' : Math.round(calc.urssafAmount).toLocaleString('fr-FR')}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-orange-400 bg-slate-850">
                                    {Math.round(calculations.totalUrssaf).toLocaleString('fr-FR')}
                                </td>
                            </tr>

                            {/* Row 10: Total Charges */}
                            <tr>
                                <td className="px-3 py-2 text-sm font-medium text-red-400 bg-slate-850">
                                    Total charges à payer (€)
                                </td>
                                {calculations.monthlyTaxCalculations.map((calc) => (
                                    <td key={calc.monthIndex} className="px-2 py-2 text-center text-sm font-bold text-red-400">
                                        {calc.totalTaxes === 0 ? '-' : Math.round(calc.totalTaxes).toLocaleString('fr-FR')}
                                    </td>
                                ))}
                                <td className="px-3 py-2 text-center text-sm font-bold text-red-400 bg-slate-850">
                                    {Math.round(calculations.totalTax).toLocaleString('fr-FR')}
                                </td>
                            </tr>

                            {/* Row 11: CA Disponible */}
                            <tr className="bg-slate-900/50 border-t-2 border-emerald-600">
                                <td className="px-3 py-2 text-sm font-medium text-emerald-400 bg-slate-850">
                                    CA disponible (€)
                                </td>
                                {calculations.monthlyTaxCalculations.map((calc, index) => {
                                    const monthName = new Date(2024, index, 1).toLocaleDateString('fr-FR', { month: 'long' })
                                    
                                    // Calcul du mois source pour les charges
                                    let sourceTaxMonth = 'N/A'
                                    if (index > 1) {
                                        sourceTaxMonth = new Date(2024, index - 2, 1).toLocaleDateString('fr-FR', { month: 'long' })
                                    } else if (index === 1) {
                                        sourceTaxMonth = 'décembre N-1'
                                    }
                                    
                                    const tooltipContent = calc.availableAmount === 0 ? 
                                        `Aucun CA encaissé en ${monthName}` :
                                        `CA disponible ${monthName}:
CA net encaissé: ${Math.round(calc.encaissedRevenue).toLocaleString('fr-FR')}€
- TVA (sur CA ${sourceTaxMonth}): ${Math.round(calc.vatAmount).toLocaleString('fr-FR')}€
- URSSAF (sur CA ${sourceTaxMonth}): ${Math.round(calc.urssafAmount).toLocaleString('fr-FR')}€
= Disponible: ${Math.round(calc.availableAmount).toLocaleString('fr-FR')}€`
                                    
                                    return (
                                        <td key={calc.monthIndex} 
                                            className="px-2 py-2 text-center text-sm font-bold text-emerald-400 cursor-help"
                                            title={tooltipContent}
                                        >
                                            {calc.availableAmount === 0 ? '-' : Math.round(calc.availableAmount).toLocaleString('fr-FR')}
                                        </td>
                                    )
                                })}
                                <td className="px-3 py-2 text-center text-sm font-bold text-emerald-400 bg-slate-850">
                                    {Math.round(calculations.totalAvailable).toLocaleString('fr-FR')}
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Note explicative */}
                    <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/50">
                        <p className="text-xs text-slate-400">
                            <strong>CA encaissé net</strong> : CA reçu sur compte = (CA HT + TVA) - Commission Malt 5%. 
                            <strong>CA disponible</strong> : CA net encaissé ce mois - TVA - URSSAF (charges calculées sur CA encaissé mois précédent).
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Décalages : CA encaissé = facturé N-1 • TVA/URSSAF = sur CA encaissé N-1 (donc facturé N-2) • Commission Malt prélevée AVANT virement
                        </p>
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

            {/* Toast de confirmation de sauvegarde */}
            {showSaveToast && (
                <div className="fixed top-6 right-6 bg-green-600 border border-green-500 rounded-lg p-4 shadow-lg z-50 animate-pulse">
                    <div className="flex items-center gap-2 text-white">
                        <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                            ✓
                        </div>
                        <span className="font-medium">Planification sauvegardée avec succès !</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default YearlyPlanningPage