import React, { useState } from 'react'
import { Building, Euro, Calculator, AlertCircle, Check, Calendar } from 'lucide-react'
import { useAppStore, useCurrentPeriod } from '../../stores/useAppStore'
import { formatEuros, formatDate } from '../../lib/utils'

export const UrssafPage: React.FC = () => {
  const currentPeriod = useCurrentPeriod()
  const { getInvoicesForPeriod, settings } = useAppStore()
  
  const [step, setStep] = useState<'calculation' | 'declaration' | 'confirmation'>('calculation')
  const [declarationData, setDeclarationData] = useState({
    period: currentPeriod.key,
    revenue_ht: 0,
    urssaf_rate: settings.urssaf_rate,
    urssaf_due: 0,
    declaration_date: '',
    payment_date: ''
  })

  // Get data for current period
  const invoices = getInvoicesForPeriod(currentPeriod.key)

  // Calculate URSSAF amounts (based on HT revenue received in the month)
  const calculateUrssafData = () => {
    const revenueHT = invoices
      .filter(inv => inv.payment_date) // Only paid invoices
      .reduce((sum, inv) => sum + inv.amount_ht_cents, 0)

    const urssafDue = Math.round(revenueHT * settings.urssaf_rate / 10000) // rate is in ppm (parts per million)

    return { revenueHT, urssafDue }
  }

  const { revenueHT, urssafDue } = calculateUrssafData()

  // Calculate declaration date (5th of following month)
  const getDeclarationDate = () => {
    const [year, month] = currentPeriod.key.split('-')
    const nextMonth = new Date(parseInt(year), parseInt(month), 5) // 5th of next month
    
    return nextMonth.toISOString().split('T')[0]
  }

  const declarationDate = getDeclarationDate()

  const handleStartDeclaration = () => {
    setDeclarationData({
      period: currentPeriod.key,
      revenue_ht: revenueHT,
      urssaf_rate: settings.urssaf_rate,
      urssaf_due: urssafDue,
      declaration_date: declarationDate,
      payment_date: declarationDate // Same date for declaration and payment
    })
    setStep('declaration')
  }

  const paidInvoices = invoices.filter(inv => inv.payment_date)

  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-slate-100 mb-2 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                <Building className="h-5 w-5 text-white" />
              </div>
              Cotisations URSSAF
            </h1>
            <p className="text-body text-slate-400">
              Déclaration pour {currentPeriod.label}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="h-4 w-4" />
            <span>Échéance: {formatDate(declarationDate)}</span>
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
                  <div className="text-sm text-slate-400 mb-1">Chiffre d'affaires HT</div>
                  <div className="text-2xl font-bold text-green-400 mb-1 font-mono">
                    {formatEuros(revenueHT)}
                  </div>
                  <p className="text-sm text-slate-400">
                    Sur {paidInvoices.length} facture{paidInvoices.length > 1 ? 's' : ''} encaissée{paidInvoices.length > 1 ? 's' : ''}
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
                  <div className="text-sm text-slate-400 mb-1">Taux URSSAF</div>
                  <div className="text-2xl font-bold text-blue-400 mb-1 font-mono">
                    {(settings.urssaf_rate / 10000 * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-slate-400">
                    Taux configuré dans les paramètres
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Calculator className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="metric-card animate-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Cotisations à payer</div>
                  <div className="text-2xl font-bold text-red-400 mb-1 font-mono">
                    {formatEuros(urssafDue)}
                  </div>
                  <p className="text-sm text-slate-400">
                    CA HT × Taux URSSAF
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-heading text-slate-200">
                Détail des encaissements ({paidInvoices.length})
              </h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {paidInvoices.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Aucune facture encaissée ce mois-ci
                </div>
              ) : (
                <div className="p-4">
                  <div className="space-y-3">
                    {paidInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-lg">
                        <div>
                          <div className="font-medium text-slate-200">
                            {invoice.client}
                          </div>
                          <div className="text-sm text-slate-400">
                            Encaissé le {formatDate(invoice.payment_date!)}
                          </div>
                          {invoice.description && (
                            <div className="text-sm text-slate-400 mt-1">
                              {invoice.description}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-400">
                            {formatEuros(invoice.amount_ht_cents)}
                          </div>
                          <div className="text-xs text-slate-400">
                            HT
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center font-semibold text-lg">
                      <span className="text-slate-200">Total CA HT</span>
                      <span className="text-green-400">{formatEuros(revenueHT)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Calculation Details */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
              Calcul des cotisations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-800 rounded p-3">
                <div className="text-gray-600 dark:text-gray-400">Chiffre d'affaires HT</div>
                <div className="font-semibold text-green-600">{formatEuros(revenueHT)}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3">
                <div className="text-gray-600 dark:text-gray-400">Taux URSSAF</div>
                <div className="font-semibold text-blue-600">{(settings.urssaf_rate / 10000 * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded p-3">
                <div className="text-gray-600 dark:text-gray-400">Cotisations dues</div>
                <div className="font-semibold text-red-600">{formatEuros(urssafDue)}</div>
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Rappel important
                </h4>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  <li>• Les cotisations URSSAF sont calculées sur le chiffre d'affaires HT encaissé</li>
                  <li>• Déclaration et paiement à effectuer avant le {formatDate(declarationDate)} (5 du mois suivant)</li>
                  <li>• Vérifiez que toutes les dates d'encaissement sont correctes</li>
                  <li>• Le taux peut varier selon votre statut et vos options</li>
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Récapitulatif de déclaration URSSAF
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Période
                  </label>
                  <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {currentPeriod.label}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date limite (déclaration et paiement)
                  </label>
                  <div className="mt-1 text-lg font-semibold text-red-600">
                    {formatDate(declarationData.declaration_date)}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Taux appliqué
                  </label>
                  <div className="mt-1 text-lg font-semibold text-blue-600">
                    {(declarationData.urssaf_rate / 10000 * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Amounts */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Chiffre d'affaires HT</span>
                    <span className="font-semibold text-green-600">
                      {formatEuros(declarationData.revenue_ht)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Taux URSSAF ({(declarationData.urssaf_rate / 10000 * 100).toFixed(1)}%)
                    </span>
                    <span className="font-semibold text-blue-600">
                      × {(declarationData.urssaf_rate / 10000 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">Cotisations à payer</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatEuros(declarationData.urssaf_due)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>Cette déclaration concerne uniquement les cotisations sociales.</p>
                  <p className="mt-1">Les contributions formation professionnelle et CFE sont calculées séparément.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep('calculation')}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Retour au calcul
            </button>
            <button
              onClick={() => setStep('confirmation')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Confirmer la déclaration
            </button>
          </div>
        </>
      )}

      {step === 'confirmation' && (
        <>
          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Check className="h-8 w-8 text-green-600" />
              <h3 className="text-xl font-semibold text-green-800 dark:text-green-200">
                Déclaration URSSAF prête
              </h3>
            </div>
            
            <p className="text-green-700 dark:text-green-300 mb-4">
              Votre déclaration URSSAF pour {currentPeriod.label} a été préparée avec succès.
            </p>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Récapitulatif final
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Chiffre d'affaires HT:</span>
                  <span className="font-medium">{formatEuros(declarationData.revenue_ht)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux URSSAF:</span>
                  <span className="font-medium">{(declarationData.urssaf_rate / 10000 * 100).toFixed(1)}%</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Cotisations à payer:</span>
                    <span className="text-red-600">{formatEuros(declarationData.urssaf_due)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-green-700 dark:text-green-300">
              <p><strong>Prochaines étapes:</strong></p>
              <p>1. Connectez-vous sur autoentrepreneur.urssaf.fr</p>
              <p>2. Effectuer la déclaration avant le {formatDate(declarationData.declaration_date)}</p>
              <p>3. Effectuer le paiement (même date limite)</p>
              <p>4. Conserver une copie de la déclaration</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setStep('calculation')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Nouvelle déclaration
            </button>
          </div>
        </>
      )}
    </div>
  )
}