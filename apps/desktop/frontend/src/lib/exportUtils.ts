import type { VatCalculation, UrssafCalculation, DeclarationExportData, Invoice, Expense } from '../types'

/**
 * Génère les données d'export pour les déclarations officielles
 */
export const generateDeclarationExports = (
  period: string,
  vatCalculation: VatCalculation,
  urssafCalculation: UrssafCalculation,
  invoices: Invoice[],
  expenses: Expense[]
): DeclarationExportData => {
  return {
    vat_export: generateVatExport(vatCalculation),
    urssaf_export: generateUrssafExport(urssafCalculation),
    summary_export: generateSummaryExport(period, vatCalculation, urssafCalculation, invoices, expenses),
    generated_at: new Date().toISOString()
  }
}

/**
 * Génère l'export TVA formaté pour copier-coller
 */
const generateVatExport = (vat: VatCalculation): string => {
  const formatCents = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')
  
  return `=== DÉCLARATION TVA ${vat.period} ===

TVA COLLECTÉE:
- Prestations de services: ${formatCents(vat.services_vat_cents)}€
- Livraisons de biens: ${formatCents(vat.goods_vat_cents)}€
- TOTAL TVA COLLECTÉE: ${formatCents(vat.collected_vat_cents)}€

TVA DÉDUCTIBLE:
- Sur prestations: ${formatCents(vat.services_deductible_cents)}€
- Sur biens/immobilisations: ${formatCents(vat.goods_deductible_cents)}€
- TOTAL TVA DÉDUCTIBLE: ${formatCents(vat.deductible_vat_cents)}€

TVA À PAYER: ${formatCents(vat.vat_due_cents)}€

Dates importantes:
- Déclaration avant le: ${formatDate(vat.declaration_date)}
- Paiement avant le: ${formatDate(vat.payment_date)}

Méthode: ${vat.calculation_method === 'encaissements' ? 'TVA sur les encaissements' : 'TVA sur les débits'}
Calculé le: ${formatDateTime(vat.calculated_at)}

=== DÉTAIL DES FACTURES ===
${vat.invoices_breakdown
  .filter(inv => inv.included_in_period)
  .map(inv => `${inv.client.padEnd(30)} | ${formatCents(inv.amount_ht_cents)}€ HT | ${inv.vat_rate}% | ${formatCents(inv.vat_cents)}€ | ${inv.is_service ? 'Service' : 'Bien'} | ${inv.reference_date}`)
  .join('\n')}

=== DÉTAIL DES DÉPENSES ===
${vat.expenses_breakdown
  .filter(exp => exp.included_in_period && exp.is_deductible)
  .map(exp => `${exp.supplier.padEnd(30)} | ${formatCents(exp.amount_ht_cents)}€ HT | ${exp.vat_rate}% | ${formatCents(exp.vat_cents)}€ | ${exp.is_service ? 'Service' : 'Bien'} | ${exp.reference_date}`)
  .join('\n')}`
}

/**
 * Génère l'export URSSAF formaté pour copier-coller
 */
const generateUrssafExport = (urssaf: UrssafCalculation): string => {
  const formatCents = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')
  
  return `=== DÉCLARATION URSSAF ${urssaf.period} ===

CHIFFRE D'AFFAIRES:
- CA encaissé HT: ${formatCents(urssaf.revenue_ht_cents)}€

COTISATIONS:
- Taux applicable: ${urssaf.urssaf_rate}%
- COTISATIONS À PAYER: ${formatCents(urssaf.urssaf_due_cents)}€

Paiement avant le: ${formatDate(urssaf.payment_date)}`
}

/**
 * Génère le récapitulatif mensuel
 */
const generateSummaryExport = (
  period: string,
  vat: VatCalculation,
  urssaf: UrssafCalculation,
  invoices: Invoice[],
  expenses: Expense[]
): string => {
  const formatCents = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')
  
  // Calculs pour le résumé
  const totalInvoicesHT = invoices.reduce((sum, inv) => {
    const included = inv.is_service 
      ? !!inv.payment_date && inv.payment_date.startsWith(period)
      : (inv.delivery_date || inv.issued_date).startsWith(period)
    return included ? sum + inv.amount_ht_cents : sum
  }, 0)
  
  const totalExpensesTTC = expenses.reduce((sum, exp) => {
    const included = exp.expense_date.startsWith(period)
    return included ? sum + exp.amount_ttc_cents : sum
  }, 0)
  
  const availableAmount = totalInvoicesHT - vat.vat_due_cents - urssaf.urssaf_due_cents - totalExpensesTTC
  
  return `=== RÉCAPITULATIF MENSUEL ${period} ===

REVENUS:
- Chiffre d'affaires HT: ${formatCents(totalInvoicesHT)}€
- Nombre de factures: ${invoices.length}

CHARGES:
- Dépenses TTC: ${formatCents(totalExpensesTTC)}€
- Nombre de dépenses: ${expenses.length}
- TVA à payer: ${formatCents(vat.vat_due_cents)}€
- URSSAF à payer: ${formatCents(urssaf.urssaf_due_cents)}€
- TOTAL CHARGES: ${formatCents(totalExpensesTTC + vat.vat_due_cents + urssaf.urssaf_due_cents)}€

RÉSULTAT:
- Montant disponible: ${formatCents(availableAmount)}€
- Taux de charge effectif: ${totalInvoicesHT > 0 ? ((vat.vat_due_cents + urssaf.urssaf_due_cents) / totalInvoicesHT * 100).toFixed(1) : '0'}%

ÉCHÉANCES À VENIR:
- Déclaration TVA: ${formatDate(vat.declaration_date)}
- Paiement TVA: ${formatDate(vat.payment_date)} (${formatCents(vat.vat_due_cents)}€)
- Paiement URSSAF: ${formatDate(urssaf.payment_date)} (${formatCents(urssaf.urssaf_due_cents)}€)

Généré le ${formatDateTime(new Date().toISOString())}`
}

/**
 * Exporte les données au format CSV pour Excel
 */
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(';'),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        if (typeof value === 'string' && value.includes(';')) {
          return `"${value}"`
        }
        return value
      }).join(';')
    )
  ].join('\n')
  
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8')
}

/**
 * Exporte les factures au format CSV
 */
export const exportInvoicesCSV = (invoices: Invoice[], period: string): void => {
  const csvData = invoices.map(invoice => ({
    'Numéro': invoice.number || '',
    'Client': invoice.client,
    'Description': invoice.description || '',
    'Montant HT (€)': (invoice.amount_ht_cents / 100).toFixed(2),
    'Taux TVA (%)': invoice.tva_rate,
    'Montant TTC (€)': (invoice.amount_ttc_cents / 100).toFixed(2),
    'Date facturation': invoice.issued_date,
    'Date encaissement': invoice.payment_date || '',
    'Date livraison': invoice.delivery_date || '',
    'Type': invoice.is_service ? 'Prestation' : 'Bien',
    'Statut': invoice.status,
    'Échéance': invoice.due_date || ''
  }))
  
  exportToCSV(csvData, `factures_${period}.csv`)
}

/**
 * Exporte les dépenses au format CSV
 */
export const exportExpensesCSV = (expenses: Expense[], period: string): void => {
  const csvData = expenses.map(expense => ({
    'Libellé': expense.label,
    'Catégorie': expense.category,
    'Fournisseur': expense.supplier || '',
    'Montant HT (€)': (expense.amount_ht_cents / 100).toFixed(2),
    'Taux TVA (%)': expense.tva_rate,
    'Montant TTC (€)': (expense.amount_ttc_cents / 100).toFixed(2),
    'Date dépense': expense.expense_date,
    'Date paiement': expense.payment_date || '',
    'Type': expense.is_service ? 'Prestation' : 'Bien',
    'Déductible': expense.is_deductible ? 'Oui' : 'Non'
  }))
  
  exportToCSV(csvData, `depenses_${period}.csv`)
}

/**
 * Génère un rapport de trésorerie
 */
export const generateTreasuryReport = (
  periods: string[],
  allInvoices: Record<string, Invoice[]>,
  allExpenses: Record<string, Expense[]>,
  vatCalculations: Record<string, VatCalculation>,
  urssafCalculations: Record<string, UrssafCalculation>
): string => {
  const formatCents = (cents: number) => (cents / 100).toFixed(2).replace('.', ',')
  
  let report = `=== RAPPORT DE TRÉSORERIE ===\nGénéré le ${formatDateTime(new Date().toISOString())}\n\n`
  
  periods.forEach(period => {
    const invoices = allInvoices[period] || []
    const expenses = allExpenses[period] || []
    const vat = vatCalculations[period]
    const urssaf = urssafCalculations[period]
    
    const revenue = invoices.reduce((sum, inv) => {
      const included = inv.is_service 
        ? !!inv.payment_date && inv.payment_date.startsWith(period)
        : (inv.delivery_date || inv.issued_date).startsWith(period)
      return included ? sum + inv.amount_ht_cents : sum
    }, 0)
    
    const expensesTotal = expenses.reduce((sum, exp) => {
      const included = exp.expense_date.startsWith(period)
      return included ? sum + exp.amount_ttc_cents : sum
    }, 0)
    
    const vatDue = vat?.vat_due_cents || 0
    const urssafDue = urssaf?.urssaf_due_cents || 0
    const available = revenue - expensesTotal - vatDue - urssafDue
    
    report += `${period.toUpperCase()}:\n`
    report += `  Revenus HT: ${formatCents(revenue)}€\n`
    report += `  Dépenses TTC: ${formatCents(expensesTotal)}€\n`
    report += `  TVA due: ${formatCents(vatDue)}€\n`
    report += `  URSSAF due: ${formatCents(urssafDue)}€\n`
    report += `  Disponible: ${formatCents(available)}€\n\n`
  })
  
  return report
}

// Fonctions utilitaires
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR')
}

const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('fr-FR') + ' à ' + 
         new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}