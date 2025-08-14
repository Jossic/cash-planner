import type { 
  Invoice, Expense, VatCalculation, VatInvoiceBreakdown, VatExpenseBreakdown,
  UrssafCalculation, TreasuryProjection, PeriodProjection, YearlyProjection,
  CashFlowDataPoint, DashboardAlert, ValidationError
} from '../types'

/**
 * Calcule la TVA pour une période donnée en respectant les règles prestations vs biens
 */
export const calculateVatForPeriod = (
  period: string,
  invoices: Invoice[],
  expenses: Expense[]
): VatCalculation => {
  const now = new Date().toISOString()
  
  // Analyse des factures
  const invoicesBreakdown = analyzeInvoicesForVat(period, invoices)
  const servicesVat = invoicesBreakdown
    .filter(inv => inv.is_service && inv.included_in_period)
    .reduce((sum, inv) => sum + inv.vat_cents, 0)
  
  const goodsVat = invoicesBreakdown
    .filter(inv => !inv.is_service && inv.included_in_period)
    .reduce((sum, inv) => sum + inv.vat_cents, 0)
  
  // Analyse des dépenses
  const expensesBreakdown = analyzeExpensesForVat(period, expenses)
  const servicesDeductible = expensesBreakdown
    .filter(exp => exp.is_service && exp.is_deductible && exp.included_in_period)
    .reduce((sum, exp) => sum + exp.vat_cents, 0)
  
  const goodsDeductible = expensesBreakdown
    .filter(exp => !exp.is_service && exp.is_deductible && exp.included_in_period)
    .reduce((sum, exp) => sum + exp.vat_cents, 0)
  
  const collectedVat = servicesVat + goodsVat
  const deductibleVat = servicesDeductible + goodsDeductible
  const vatDue = Math.max(0, collectedVat - deductibleVat)
  
  // Dates de déclaration et paiement
  const [year, month] = period.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  
  const declarationDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-12`
  const paymentDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-20`
  
  return {
    period,
    services_vat_cents: Math.round(servicesVat),
    goods_vat_cents: Math.round(goodsVat),
    collected_vat_cents: Math.round(collectedVat),
    services_deductible_cents: Math.round(servicesDeductible),
    goods_deductible_cents: Math.round(goodsDeductible),
    deductible_vat_cents: Math.round(deductibleVat),
    vat_due_cents: Math.round(vatDue),
    declaration_date: declarationDate,
    payment_date: paymentDate,
    invoices_breakdown: invoicesBreakdown,
    expenses_breakdown: expensesBreakdown,
    calculation_method: 'encaissements',
    calculated_at: now
  }
}

/**
 * Analyse les factures pour le calcul TVA
 */
const analyzeInvoicesForVat = (period: string, invoices: Invoice[]): VatInvoiceBreakdown[] => {
  return invoices.map(invoice => {
    const vatCents = Math.round(invoice.amount_ht_cents * invoice.tva_rate / 100)
    
    // Date de référence selon le type
    let referenceDate: string
    let includedInPeriod = false
    
    if (invoice.is_service) {
      // Prestations: TVA sur encaissement
      referenceDate = invoice.payment_date || invoice.issued_date
      includedInPeriod = !!invoice.payment_date && invoice.payment_date.startsWith(period)
    } else {
      // Biens: TVA sur livraison (ou facturation si pas de date de livraison)
      referenceDate = invoice.delivery_date || invoice.issued_date
      includedInPeriod = referenceDate.startsWith(period)
    }
    
    return {
      invoice_id: invoice.id,
      client: invoice.client,
      amount_ht_cents: invoice.amount_ht_cents,
      vat_rate: invoice.tva_rate,
      vat_cents: vatCents,
      is_service: invoice.is_service,
      reference_date: referenceDate,
      included_in_period: includedInPeriod
    }
  })
}

/**
 * Analyse les dépenses pour le calcul TVA
 */
const analyzeExpensesForVat = (period: string, expenses: Expense[]): VatExpenseBreakdown[] => {
  return expenses.map(expense => {
    const vatCents = Math.round(expense.amount_ht_cents * expense.tva_rate / 100)
    const includedInPeriod = expense.expense_date.startsWith(period)
    
    return {
      expense_id: expense.id,
      supplier: expense.supplier || 'Non renseigné',
      amount_ht_cents: expense.amount_ht_cents,
      vat_rate: expense.tva_rate,
      vat_cents: vatCents,
      is_service: expense.is_service,
      reference_date: expense.expense_date,
      is_deductible: expense.is_deductible,
      included_in_period: includedInPeriod
    }
  })
}

/**
 * Calcule l'URSSAF pour une période donnée
 */
export const calculateUrssafForPeriod = (
  period: string,
  invoices: Invoice[],
  urssafRate: number
): UrssafCalculation => {
  // Revenue encaissé (HT) pour les prestations, livré pour les biens
  const revenue = invoices.reduce((sum, invoice) => {
    let included = false
    
    if (invoice.is_service) {
      // Prestations: CA sur encaissement
      included = !!invoice.payment_date && invoice.payment_date.startsWith(period)
    } else {
      // Biens: CA sur livraison
      const referenceDate = invoice.delivery_date || invoice.issued_date
      included = referenceDate.startsWith(period)
    }
    
    return included ? sum + invoice.amount_ht_cents : sum
  }, 0)
  
  const urssafDue = Math.round(revenue * urssafRate / 100)
  
  // Date de paiement (5 du mois suivant)
  const [year, month] = period.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const paymentDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-05`
  
  return {
    period,
    revenue_ht_cents: Math.round(revenue),
    urssaf_rate: urssafRate,
    urssaf_due_cents: urssafDue,
    payment_date: paymentDate
  }
}

/**
 * Génère les projections de trésorerie
 */
export const generateTreasuryProjection = (
  basePeriods: string[],
  allInvoices: Record<string, Invoice[]>,
  allExpenses: Record<string, Expense[]>,
  settings: { urssaf_rate: number; treasury_buffer_cents: number }
): TreasuryProjection => {
  // Calculs pour les 3 et 6 prochains mois
  const now = new Date()
  const next3Months = generateFuturePeriods(now, 3)
  const next6Months = generateFuturePeriods(now, 6)
  
  const projection3 = next3Months.map(period => 
    calculatePeriodProjection(period, basePeriods, allInvoices, allExpenses, settings)
  )
  
  const projection6 = next6Months.map(period => 
    calculatePeriodProjection(period, basePeriods, allInvoices, allExpenses, settings)
  )
  
  // Projection annuelle
  const yearlyProjection = calculateYearlyProjection(projection6)
  
  // Données pour le graphique de cash flow
  const cashFlowData = generateCashFlowData(projection6)
  
  return {
    next_3_months: projection3,
    next_6_months: projection6,
    yearly_projection: yearlyProjection,
    cash_flow_chart_data: cashFlowData
  }
}

/**
 * Calcule la projection pour une période
 */
const calculatePeriodProjection = (
  period: string,
  basePeriods: string[],
  allInvoices: Record<string, Invoice[]>,
  allExpenses: Record<string, Expense[]>,
  settings: { urssaf_rate: number; treasury_buffer_cents: number }
): PeriodProjection => {
  // Moyennes basées sur les périodes historiques
  const avgRevenue = calculateAverageRevenue(basePeriods, allInvoices)
  const avgExpenses = calculateAverageExpenses(basePeriods, allExpenses)
  
  // Ajustements saisonniers (simplifié)
  const seasonalFactor = 1.0 // TODO: implémenter la saisonnalité
  
  const projectedRevenue = Math.round(avgRevenue * seasonalFactor)
  const projectedExpenses = Math.round(avgExpenses * seasonalFactor)
  const projectedVat = Math.round(projectedRevenue * 0.2) // Estimation 20%
  const projectedUrssaf = Math.round(projectedRevenue * settings.urssaf_rate / 100)
  const projectedAvailable = projectedRevenue - projectedExpenses - projectedVat - projectedUrssaf
  
  // Niveau de confiance basé sur la variance historique
  const confidenceLevel = calculateConfidenceLevel(basePeriods, allInvoices)
  
  return {
    period,
    projected_revenue_cents: projectedRevenue,
    projected_expenses_cents: projectedExpenses,
    projected_vat_cents: projectedVat,
    projected_urssaf_cents: projectedUrssaf,
    projected_available_cents: projectedAvailable,
    confidence_level: confidenceLevel
  }
}

/**
 * Génère les alertes du dashboard
 */
export const generateDashboardAlerts = (
  allInvoices: Record<string, Invoice[]>,
  vatCalculations: Record<string, VatCalculation>,
  settings: { alert_days_before_deadline: number }
): DashboardAlert[] => {
  const alerts: DashboardAlert[] = []
  const now = new Date()
  const alertThreshold = new Date(now.getTime() + settings.alert_days_before_deadline * 24 * 60 * 60 * 1000)
  
  // Alertes échéances TVA
  Object.values(vatCalculations).forEach(vat => {
    const declarationDate = new Date(vat.declaration_date)
    const paymentDate = new Date(vat.payment_date)
    
    if (declarationDate <= alertThreshold && declarationDate >= now) {
      alerts.push({
        id: `vat-declaration-${vat.period}`,
        type: 'deadline',
        severity: declarationDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000) ? 'critical' : 'high',
        title: 'Déclaration TVA à venir',
        message: `Déclaration TVA pour ${vat.period} à effectuer avant le ${vat.declaration_date}`,
        action_required: 'Préparer la déclaration TVA',
        due_date: vat.declaration_date,
        period: vat.period,
        created_at: now.toISOString()
      })
    }
    
    if (paymentDate <= alertThreshold && paymentDate >= now && vat.vat_due_cents > 0) {
      alerts.push({
        id: `vat-payment-${vat.period}`,
        type: 'deadline',
        severity: paymentDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000) ? 'critical' : 'high',
        title: 'Paiement TVA à venir',
        message: `Paiement TVA de ${(vat.vat_due_cents / 100).toFixed(2)}€ pour ${vat.period}`,
        action_required: 'Effectuer le paiement TVA',
        due_date: vat.payment_date,
        period: vat.period,
        created_at: now.toISOString()
      })
    }
  })
  
  // Alertes factures impayées
  Object.entries(allInvoices).forEach(([period, invoices]) => {
    invoices.forEach(invoice => {
      if (invoice.status === 'overdue') {
        alerts.push({
          id: `overdue-invoice-${invoice.id}`,
          type: 'cash_flow',
          severity: 'high',
          title: 'Facture impayée',
          message: `Facture ${invoice.client} de ${(invoice.amount_ttc_cents / 100).toFixed(2)}€ en retard`,
          action_required: 'Relancer le client',
          due_date: invoice.due_date,
          period: period,
          created_at: now.toISOString()
        })
      }
    })
  })
  
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })
}

// Fonctions utilitaires

const generateFuturePeriods = (startDate: Date, months: number): string[] => {
  const periods: string[] = []
  const date = new Date(startDate)
  
  for (let i = 1; i <= months; i++) {
    date.setMonth(date.getMonth() + 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    periods.push(`${year}-${month.toString().padStart(2, '0')}`)
  }
  
  return periods
}

const calculateAverageRevenue = (periods: string[], allInvoices: Record<string, Invoice[]>): number => {
  const totalRevenue = periods.reduce((sum, period) => {
    const invoices = allInvoices[period] || []
    const periodRevenue = invoices.reduce((periodSum, invoice) => {
      const included = invoice.is_service 
        ? !!invoice.payment_date && invoice.payment_date.startsWith(period)
        : (invoice.delivery_date || invoice.issued_date).startsWith(period)
      
      return included ? periodSum + invoice.amount_ht_cents : periodSum
    }, 0)
    
    return sum + periodRevenue
  }, 0)
  
  return periods.length > 0 ? totalRevenue / periods.length : 0
}

const calculateAverageExpenses = (periods: string[], allExpenses: Record<string, Expense[]>): number => {
  const totalExpenses = periods.reduce((sum, period) => {
    const expenses = allExpenses[period] || []
    const periodExpenses = expenses.reduce((periodSum, expense) => {
      const included = expense.expense_date.startsWith(period)
      return included ? periodSum + expense.amount_ttc_cents : periodSum
    }, 0)
    
    return sum + periodExpenses
  }, 0)
  
  return periods.length > 0 ? totalExpenses / periods.length : 0
}

const calculateConfidenceLevel = (periods: string[], allInvoices: Record<string, Invoice[]>): 'low' | 'medium' | 'high' => {
  if (periods.length < 3) return 'low'
  if (periods.length < 6) return 'medium'
  return 'high'
}

const calculateYearlyProjection = (monthlyProjections: PeriodProjection[]): YearlyProjection => {
  const totalRevenue = monthlyProjections.reduce((sum, p) => sum + p.projected_revenue_cents, 0)
  const totalExpenses = monthlyProjections.reduce((sum, p) => sum + p.projected_expenses_cents, 0)
  const totalVat = monthlyProjections.reduce((sum, p) => sum + p.projected_vat_cents, 0)
  const totalUrssaf = monthlyProjections.reduce((sum, p) => sum + p.projected_urssaf_cents, 0)
  const totalAvailable = monthlyProjections.reduce((sum, p) => sum + p.projected_available_cents, 0)
  
  const effectiveRate = totalRevenue > 0 ? ((totalVat + totalUrssaf) / totalRevenue) * 100 : 0
  
  return {
    total_revenue_cents: Math.round(totalRevenue * 2), // Projection sur 12 mois
    total_expenses_cents: Math.round(totalExpenses * 2),
    total_vat_cents: Math.round(totalVat * 2),
    total_urssaf_cents: Math.round(totalUrssaf * 2),
    total_available_cents: Math.round(totalAvailable * 2),
    effective_rate: Math.round(effectiveRate * 100) / 100
  }
}

const generateCashFlowData = (projections: PeriodProjection[]): CashFlowDataPoint[] => {
  let cumulativeAvailable = 0
  
  return projections.map(projection => {
    cumulativeAvailable += projection.projected_available_cents
    
    return {
      period: projection.period,
      date: `${projection.period}-15`, // 15 du mois
      revenue_cents: projection.projected_revenue_cents,
      expenses_cents: projection.projected_expenses_cents,
      vat_due_cents: projection.projected_vat_cents,
      urssaf_due_cents: projection.projected_urssaf_cents,
      available_cents: projection.projected_available_cents,
      cumulative_available_cents: cumulativeAvailable
    }
  })
}

/**
 * Valide les données d'une période
 */
export const validatePeriodData = (
  period: string,
  invoices: Invoice[],
  expenses: Expense[]
): ValidationError[] => {
  const errors: ValidationError[] = []
  
  // Validation des factures
  invoices.forEach(invoice => {
    if (invoice.is_service && invoice.status === 'paid' && !invoice.payment_date) {
      errors.push({
        type: 'error',
        code: 'MISSING_PAYMENT_DATE',
        message: 'Date d\'encaissement manquante pour une prestation payée',
        invoice_id: invoice.id
      })
    }
    
    if (!invoice.is_service && !invoice.delivery_date && !invoice.issued_date) {
      errors.push({
        type: 'warning',
        code: 'MISSING_DELIVERY_DATE',
        message: 'Date de livraison recommandée pour les biens',
        invoice_id: invoice.id
      })
    }
    
    if (invoice.tva_rate < 0 || invoice.tva_rate > 25) {
      errors.push({
        type: 'warning',
        code: 'UNUSUAL_VAT_RATE',
        message: `Taux de TVA inhabituel: ${invoice.tva_rate}%`,
        invoice_id: invoice.id
      })
    }
  })
  
  // Validation des dépenses
  expenses.forEach(expense => {
    if (expense.is_deductible && expense.tva_rate === 0) {
      errors.push({
        type: 'warning',
        code: 'NO_VAT_ON_DEDUCTIBLE',
        message: 'Dépense déductible sans TVA',
        expense_id: expense.id
      })
    }
  })
  
  return errors
}