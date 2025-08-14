import React, { useState } from 'react'
import { Calculator, FileText, Euro, AlertCircle, Check } from 'lucide-react'
import { useAppStore, useCurrentPeriod } from '../../stores/useAppStore'
import { formatEuros, formatDate, addMonths } from '../../lib/utils'

export const VatPage: React.FC = () => {
  const currentPeriod = useCurrentPeriod()
  const { getInvoicesForPeriod, getExpensesForPeriod } = useAppStore()
  
  const [step, setStep] = useState<'calculation' | 'declaration' | 'confirmation'>('calculation')
  const [declarationData, setDeclarationData] = useState({
    period: currentPeriod.key,
    vat_collected: 0,
    vat_deductible: 0,
    vat_due: 0,
    declaration_date: '',
    payment_date: ''
  })

  // Get data for current period
  const invoices = getInvoicesForPeriod(currentPeriod.key)
  const expenses = getExpensesForPeriod(currentPeriod.key)

  // Calculate VAT amounts with proper service/goods distinction
  const calculateVATData = () => {
    // VAT collected - different logic for services vs goods
    const vatCollected = invoices
      .filter(inv => {
        if (inv.is_service) {
          // Services: TVA on payment (encaissement)
          return inv.payment_date && inv.payment_date.startsWith(currentPeriod.key)
        } else {
          // Goods: TVA on delivery (livraison)
          const deliveryDate = inv.delivery_date || inv.issued_date
          return deliveryDate.startsWith(currentPeriod.key)
        }
      })
      .reduce((sum, inv) => {
        const vatAmount = inv.amount_ht_cents * inv.tva_rate / 100
        return sum + vatAmount
      }, 0)

    // VAT deductible from expenses (same logic for services and goods)
    const vatDeductible = expenses
      .filter(exp => {
        // For expenses, we use the expense_date regardless of is_service
        return exp.is_deductible && exp.expense_date.startsWith(currentPeriod.key)
      })
      .reduce((sum, exp) => {
        const vatAmount = exp.amount_ht_cents * exp.tva_rate / 100
        return sum + vatAmount
      }, 0)

    const vatDue = Math.max(0, vatCollected - vatDeductible)

    return { vatCollected, vatDeductible, vatDue }
  }

  const { vatCollected, vatDeductible, vatDue } = calculateVATData()

  // Calculate declaration dates (12th of following month for declaration, 20th for payment)
  const getDeclarationDates = () => {
    const [year, month] = currentPeriod.key.split('-')
    const nextMonth = new Date(parseInt(year), parseInt(month), 1) // Next month
    
    const declarationDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 12)
    const paymentDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20)
    
    return {
      declaration: declarationDate.toISOString().split('T')[0],
      payment: paymentDate.toISOString().split('T')[0]
    }
  }

  const dates = getDeclarationDates()

  const handleStartDeclaration = () => {
    setDeclarationData({
      period: currentPeriod.key,
      vat_collected: vatCollected,
      vat_deductible: vatDeductible,
      vat_due: vatDue,
      declaration_date: dates.declaration,
      payment_date: dates.payment
    })
    setStep('declaration')
  }

  // Filter invoices for display based on VAT calculation logic
  const vatApplicableInvoices = invoices.filter(inv => {
    if (inv.is_service) {
      return inv.payment_date && inv.payment_date.startsWith(currentPeriod.key)
    } else {
      const deliveryDate = inv.delivery_date || inv.issued_date
      return deliveryDate.startsWith(currentPeriod.key)
    }
  })
  
  const deductibleExpenses = expenses.filter(exp => 
    exp.is_deductible && exp.expense_date.startsWith(currentPeriod.key)
  )

  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-slate-100 mb-2 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              TVA sur encaissements
            </h1>
            <p className="text-body text-slate-400">
              Déclaration pour {currentPeriod.label}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calculator className="h-4 w-4" />
            <span>Échéance: {formatDate(dates.declaration)}</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center gap-2 ${step === 'calculation' ? 'text-blue-400' : 'text-green-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'calculation' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
              }`}>
                {step === 'calculation' ? '1' : <Check className="h-5 w-5" />}
              </div>
              <span className="font-medium text-slate-200">Calcul</span>
            </div>
            
            <div className={`flex items-center gap-2 ${
              step === 'declaration' ? 'text-blue-400' : 
              step === 'confirmation' ? 'text-green-400' : 'text-slate-500'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'declaration' ? 'bg-blue-500/20 text-blue-400' :
                step === 'confirmation' ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'
              }`}>
                {step === 'confirmation' ? <Check className="h-5 w-5" /> : '2'}
              </div>
              <span className="font-medium text-slate-200">Déclaration</span>
            </div>
            
            <div className={`flex items-center gap-2 ${step === 'confirmation' ? 'text-blue-400' : 'text-slate-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'confirmation' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'
              }`}>
                3
              </div>
              <span className="font-medium text-slate-200">Confirmation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {step === 'calculation' && (
        <>
          {/* Calculation Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="metric-card animate-in" style={{ animationDelay: '0ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400 mb-1">TVA Collectée</div>
                  <div className="text-2xl font-bold text-green-400 mb-1 font-mono">
                    {formatEuros(vatCollected)}
                  </div>
                  <p className="text-sm text-slate-400">
                    Sur {vatApplicableInvoices.length} facture{vatApplicableInvoices.length > 1 ? 's' : ''} {vatApplicableInvoices.length > 1 ? 'concernées' : 'concernée'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Euro className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="metric-card animate-in" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400 mb-1">TVA Déductible</div>
                  <div className="text-2xl font-bold text-blue-400 mb-1 font-mono">
                    {formatEuros(vatDeductible)}
                  </div>
                  <p className="text-sm text-slate-400">
                    Sur {deductibleExpenses.length} dépense{deductibleExpenses.length > 1 ? 's' : ''} déductible{deductibleExpenses.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="metric-card animate-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400 mb-1">TVA à payer</div>
                  <div className="text-2xl font-bold text-red-400 mb-1 font-mono">
                    {formatEuros(vatDue)}
                  </div>
                  <p className="text-sm text-slate-400">
                    Collectée - Déductible
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoices Breakdown */}
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-heading text-slate-200">
                  Factures concernées ({vatApplicableInvoices.length})
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {vatApplicableInvoices.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    Aucune facture concernée par la TVA
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {vatApplicableInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex justify-between items-center text-sm">
                        <div>
                          <div className="font-medium text-slate-200">
                            {invoice.client}
                          </div>
                          <div className="text-slate-400">
                            {invoice.is_service 
                              ? `Encaissé le ${formatDate(invoice.payment_date!)}` 
                              : `Livré le ${formatDate(invoice.delivery_date || invoice.issued_date)}`
                            }
                          </div>
                          <div className="text-xs text-blue-400">
                            {invoice.is_service ? 'Prestation' : 'Bien'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-400">
                            {formatEuros(invoice.amount_ht_cents * invoice.tva_rate / 100)}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {invoice.tva_rate}% TVA
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Expenses Breakdown */}
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-heading text-slate-200">
                  Dépenses déductibles ({deductibleExpenses.length})
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {deductibleExpenses.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    Aucune dépense déductible
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {deductibleExpenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between items-center text-sm">
                        <div>
                          <div className="font-medium text-slate-200">
                            {expense.label}
                          </div>
                          <div className="text-slate-400">
                            {formatDate(expense.expense_date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-blue-400">
                            {formatEuros(expense.amount_ht_cents * expense.tva_rate / 100)}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {expense.tva_rate}% TVA
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-300 mb-2">
                  Rappel important
                </h4>
                <ul className="text-sm text-amber-200 space-y-1">
                  <li>• La TVA est calculée sur les encaissements (factures payées)</li>
                  <li>• Déclaration à effectuer avant le {formatDate(dates.declaration)}</li>
                  <li>• Paiement à effectuer avant le {formatDate(dates.payment)}</li>
                  <li>• Vérifiez que toutes les dates d'encaissement sont correctes</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={handleStartDeclaration}
              className="btn btn-primary"
            >
              Procéder à la déclaration
            </button>
          </div>
        </>
      )}

      {step === 'declaration' && (
        <>
          {/* Declaration Form */}
          <div className="card">
            <div className="card-content">
              <h3 className="text-heading text-slate-200 mb-6">
                Récapitulatif de déclaration TVA
              </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Période
                  </label>
                  <div className="mt-1 text-lg font-semibold text-slate-100">
                    {currentPeriod.label}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Date limite de déclaration
                  </label>
                  <div className="mt-1 text-lg font-semibold text-red-400">
                    {formatDate(declarationData.declaration_date)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Date limite de paiement
                  </label>
                  <div className="mt-1 text-lg font-semibold text-red-400">
                    {formatDate(declarationData.payment_date)}
                  </div>
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">TVA Collectée</span>
                    <span className="font-semibold text-green-400">
                      {formatEuros(declarationData.vat_collected)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-400">TVA Déductible</span>
                    <span className="font-semibold text-blue-400">
                      -{formatEuros(declarationData.vat_deductible)}
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-200">TVA à payer</span>
                      <span className="text-xl font-bold text-red-400">
                        {formatEuros(declarationData.vat_due)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep('calculation')}
              className="btn btn-outline"
            >
              Retour au calcul
            </button>
            <button
              onClick={() => setStep('confirmation')}
              className="btn btn-primary"
            >
              Confirmer la déclaration
            </button>
          </div>
        </>
      )}

      {step === 'confirmation' && (
        <>
          {/* Success Message */}
          <div className="bg-green-900/20 border border-green-700 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Check className="h-8 w-8 text-green-400" />
              <h3 className="text-xl font-semibold text-green-300">
                Déclaration TVA prête
              </h3>
            </div>
            
            <p className="text-green-200 mb-4">
              Votre déclaration TVA pour {currentPeriod.label} a été préparée avec succès.
            </p>

            <div className="bg-slate-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-slate-200 mb-3">
                Récapitulatif final
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">TVA Collectée:</span>
                  <span className="font-medium text-slate-100">{formatEuros(declarationData.vat_collected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TVA Déductible:</span>
                  <span className="font-medium text-slate-100">-{formatEuros(declarationData.vat_deductible)}</span>
                </div>
                <div className="border-t border-slate-700 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-200">TVA à payer:</span>
                    <span className="text-red-400">{formatEuros(declarationData.vat_due)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-green-200">
              <p className="text-green-300"><strong>Prochaines étapes:</strong></p>
              <p>1. Effectuer la déclaration sur impots.gouv.fr avant le {formatDate(declarationData.declaration_date)}</p>
              <p>2. Effectuer le paiement avant le {formatDate(declarationData.payment_date)}</p>
              <p>3. Conserver une copie de la déclaration</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setStep('calculation')}
              className="btn btn-primary"
            >
              Nouvelle déclaration
            </button>
          </div>
        </>
      )}
    </div>
  )
}