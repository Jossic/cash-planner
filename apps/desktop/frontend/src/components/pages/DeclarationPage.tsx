import React, { useState, useEffect } from 'react'
import { Calendar, Calculator, FileText, Info, AlertCircle } from 'lucide-react'
import { TauriClient } from '../../lib/tauriClient'
import { useDeclarationPeriod } from '../../hooks/useDeclarationPeriod'
import { MonthSelector } from '../ui/MonthSelector'
import type { Operation } from '../../types'

// Types pour les calculs de déclaration
interface DeclarationCalculation {
  periodKey: string
  operations: Operation[]
  ventes: Operation[]
  achats: Operation[]
  tvaCollectee: number // en centimes
  tvaDeductible: number // en centimes
  tvaNetteAPayer: number // en centimes
  caEncaisse: number // CA encaissé pour URSSAF (centimes)
  urssafDue: number // en centimes
}

interface DeclarationStatus {
  periodKey: string
  status: 'draft' | 'validated' | 'submitted'
  validatedAt?: string
  submittedAt?: string
}

interface DeclarationCases {
  // Cases TVA
  caseA1: string // Base HT ventes 20% (services)
  case08: string // Base HT total
  case16: string // TVA brute due
  case21: string // TVA déductible - Autre TVA à déduire
  case23: string // Total TVA déductible 
  caseTD: string // TVA nette due (case 16 - case 23)
  case28: string // TVA nette due (identique à caseTD)
  case32: string // Total à payer
  
  // Cases URSSAF - Structure exacte du formulaire français
  prestationsBIC: string      // 21.20% - Prestations de services (bic)
  venteMarchandisesBIC: string // 12.30% - Vente de marchandises (bic)
  prestationsBNC: string      // 24.60% - Prestations de services (bnc)
  formationProfessionnelle: string // 0.30% - Formation prof. obligatoire
  taxeCMAVente: string        // 0.22% - Taxe cma vente obligatoire cas général
  taxeCMAPrestation: string   // 0.48% - Taxe cma prestation oblig cas général
  totalURSSAF: string         // Total de la déclaration
  
  // Revenue de base pour URSSAF
  revenueURSSAF: number       // CA encaissé HT pour calcul URSSAF
}

export const DeclarationPage: React.FC = () => {
  const { selectedPeriod, setSelectedPeriod, availablePeriods, defaultPeriod, isDefaultPeriod } = useDeclarationPeriod()
  
  const [operations, setOperations] = useState<Operation[]>([])
  const [calculation, setCalculation] = useState<DeclarationCalculation | null>(null)
  const [cases, setCases] = useState<DeclarationCases | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Gestion des statuts de déclaration (stockage local pour le moment)
  const [declarationStatuses, setDeclarationStatuses] = useState<Record<string, DeclarationStatus>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('declaration-statuses')
      return stored ? JSON.parse(stored) : {}
    }
    return {}
  })
  
  const currentStatus = declarationStatuses[selectedPeriod.periodKey]
  const canValidate = calculation && !currentStatus?.status || currentStatus?.status === 'draft'
  const isValidated = currentStatus?.status === 'validated' || currentStatus?.status === 'submitted'

  // Charger les opérations au changement de période
  useEffect(() => {
    const loadOperations = async () => {
      if (!selectedPeriod.periodKey) return
      
      // Optimisation: Ne pas charger pour les périodes trop loin dans le futur
      const [year, month] = selectedPeriod.periodKey.split('-').map(Number)
      const periodDate = new Date(year, month - 1)
      const now = new Date()
      const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2)
      
      if (periodDate > twoMonthsFromNow) {
        console.log('⏩ Période trop future, pas de chargement:', selectedPeriod.periodKey)
        setOperations([])
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        console.log('🔍 Chargement des opérations pour période:', selectedPeriod.periodKey)
        const loadedOperations = await TauriClient.getOperations(selectedPeriod.periodKey)
        console.log('✅ Opérations chargées:', loadedOperations.length, 'opérations')
        setOperations(loadedOperations)
      } catch (err) {
        console.error('❌ Erreur chargement opérations:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
        setOperations([])
      } finally {
        setIsLoading(false)
      }
    }

    loadOperations()
  }, [selectedPeriod.periodKey])

  // Calculer la déclaration quand les opérations changent
  useEffect(() => {
    if (operations && operations.length > 0) {
      const calc = calculateDeclaration(selectedPeriod.periodKey, operations)
      setCalculation(calc)
      setCases(generateDeclarationCases(calc))
    } else {
      setCalculation(null)
      setCases(null)
    }
  }, [operations, selectedPeriod.periodKey])

  const calculateDeclaration = (periodKey: string, operations: Operation[]): DeclarationCalculation => {
    const ventes = operations.filter(op => op.operation_type === 'sale')
    const achats = operations.filter(op => op.operation_type === 'purchase')
    
    console.log('📊 Calcul déclaration pour', periodKey)
    console.log('  - Ventes:', ventes.length)
    console.log('  - Achats:', achats.length)
    
    // TVA collectée et CA encaissé (basé sur les paiements reçus dans la période)
    let tvaCollectee = 0
    let caEncaisse = 0 // Pour URSSAF - basé sur les encaissements
    
    ventes.forEach(vente => {
      if (!vente) {
        console.log('  ⚠️ Vente undefined, ignorée')
        return
      }
      
      let includeInPeriod = false
      
      console.log('  Vente:', {
        id: vente.id,
        invoice_date: vente.invoice_date,
        payment_date: vente.payment_date,
        amount_ht_cents: vente.amount_ht_cents,
        vat_on_payments: vente.vat_on_payments
      })
      
      // Pour les freelancers français : TVA sur encaissements est la règle
      // Si pas de date d'encaissement, on utilise la date de l'opération
      if (vente.payment_date) {
        // Vérifier si la date d'encaissement est dans la période
        if (vente.payment_date.startsWith(periodKey)) {
          includeInPeriod = true
          console.log('    ✓ Incluse (encaissement dans période)')
        }
      } else {
        // Si pas de date d'encaissement, on vérifie la date de facturation
        // C'est le cas pour les factures pas encore payées mais qu'on veut déclarer
        if (vente.invoice_date && vente.invoice_date.startsWith(periodKey)) {
          includeInPeriod = true
          console.log('    ✓ Incluse (date facturation dans période, pas d\'encaissement)')
        }
      }
      
      if (includeInPeriod) {
        tvaCollectee += vente.vat_amount_cents || 0
        caEncaisse += vente.amount_ht_cents || 0
        console.log('    → TVA:', vente.vat_amount_cents, 'CA:', vente.amount_ht_cents)
      }
    })
    
    // TVA déductible (sur achats payés dans la période)
    let tvaDeductible = 0
    
    achats.forEach(achat => {
      if (!achat) {
        console.log('  ⚠️ Achat undefined, ignoré')
        return
      }
      
      // Pour les achats, on regarde généralement la date de paiement
      let includeInPeriod = false
      
      console.log('  Achat:', {
        id: achat.id,
        invoice_date: achat.invoice_date,
        payment_date: achat.payment_date,
        amount_ttc_cents: achat.amount_ttc_cents,
        vat_amount_cents: achat.vat_amount_cents
      })
      
      if (achat.payment_date) {
        // Si on a une date de paiement, l'utiliser
        if (achat.payment_date.startsWith(periodKey)) {
          includeInPeriod = true
          console.log('    ✓ Inclus (paiement dans période)')
        }
      } else if (achat.invoice_date && achat.invoice_date.startsWith(periodKey)) {
        // Sinon utiliser la date de facturation
        includeInPeriod = true
        console.log('    ✓ Inclus (date facturation dans période)')
      }
      
      if (includeInPeriod) {
        tvaDeductible += achat.vat_amount_cents || 0
        console.log('    → TVA déductible:', achat.vat_amount_cents)
      }
    })
    
    // TVA nette à payer
    const tvaNetteAPayer = Math.max(0, tvaCollectee - tvaDeductible)
    
    // URSSAF (basé sur le CA encaissé dans la période)
    // Pour les prestations de services BNC (freelancers)
    const prestationsBNC = Math.round(caEncaisse * 0.246) // 24.60%
    const formationProf = Math.round(caEncaisse * 0.003) // 0.30%
    const taxeCMAPrestation = Math.round(caEncaisse * 0.0048) // 0.48%
    const urssafDue = prestationsBNC + formationProf + taxeCMAPrestation
    
    console.log('📈 Résultat calcul:', {
      caEncaisse,
      tvaCollectee,
      tvaDeductible,
      tvaNetteAPayer,
      urssafDue
    })
    
    return {
      periodKey,
      operations,
      ventes,
      achats,
      tvaCollectee,
      tvaDeductible,
      tvaNetteAPayer,
      caEncaisse,
      urssafDue
    }
  }

  const generateDeclarationCases = (calc: DeclarationCalculation): DeclarationCases => {
    const baseHTTotal = Math.round(calc.caEncaisse / 100) // en euros
    
    // Pour les prestations de service en France : TVA 20% uniquement
    // Base pour TVA 20% = total du CA encaissé
    const baseHT20 = baseHTTotal
    const tvaBrute = Math.round(calc.tvaCollectee / 100) // TVA brute collectée
    const tvaDeductible = Math.round(calc.tvaDeductible / 100) // TVA déductible
    const tvaNetteAPayer = Math.round(calc.tvaNetteAPayer / 100) // TVA nette à payer
    
    return {
      // Cases TVA (prestations de service - TVA 20% uniquement)
      caseA1: baseHT20.toString(), // Base HT prestations 20%
      case08: baseHTTotal.toString(), // Base HT total 
      case16: tvaBrute.toString(), // TVA brute due
      case21: tvaDeductible.toString(), // Autre TVA à déduire
      case23: tvaDeductible.toString(), // Total TVA déductible
      caseTD: tvaNetteAPayer.toString(), // TVA due (ligne 16 - ligne 23)
      case28: tvaNetteAPayer.toString(), // TVA nette due
      case32: tvaNetteAPayer.toString(), // Total à payer
      
      // Cases URSSAF - Structure exacte du formulaire français
      prestationsBIC: '0', // 21.20% - Pas utilisé pour les freelancers BNC
      venteMarchandisesBIC: '0', // 12.30% - Pas utilisé pour les prestations
      prestationsBNC: Math.round(calc.caEncaisse * 0.246 / 100).toString(), // 24.60%
      formationProfessionnelle: Math.round(calc.caEncaisse * 0.003 / 100).toString(), // 0.30%
      taxeCMAVente: '0', // 0.22% - Pas utilisé pour les prestations
      taxeCMAPrestation: Math.round(calc.caEncaisse * 0.0048 / 100).toString(), // 0.48%
      totalURSSAF: Math.round(calc.urssafDue / 100).toString(),
      revenueURSSAF: Math.round(calc.caEncaisse / 100) // Revenue de base en euros
    }
  }

  const formatCurrency = (cents: number): string => {
    return (cents / 100).toFixed(2) + ' €'
  }

  // Fonctions de gestion des déclarations
  const validateDeclaration = () => {
    if (!calculation) return
    
    const newStatus: DeclarationStatus = {
      periodKey: selectedPeriod.periodKey,
      status: 'validated',
      validatedAt: new Date().toISOString()
    }
    
    const updatedStatuses = {
      ...declarationStatuses,
      [selectedPeriod.periodKey]: newStatus
    }
    
    setDeclarationStatuses(updatedStatuses)
    localStorage.setItem('declaration-statuses', JSON.stringify(updatedStatuses))
  }

  const resetDeclaration = () => {
    const updatedStatuses = { ...declarationStatuses }
    delete updatedStatuses[selectedPeriod.periodKey]
    
    setDeclarationStatuses(updatedStatuses)
    localStorage.setItem('declaration-statuses', JSON.stringify(updatedStatuses))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 animate-fade-in">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Chargement des données...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 animate-fade-in">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-200">Erreur : {error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-display text-slate-100 mb-2 flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
            <Calculator className="h-5 w-5 text-white" />
          </div>
          Déclaration Mensuelle
        </h1>
        <p className="text-body text-slate-400">
          Génération automatique des montants à reporter dans vos déclarations TVA et URSSAF
        </p>
      </div>

      {/* Sélecteur de période */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-heading text-slate-200 mb-2">Période de déclaration</h2>
              {isDefaultPeriod && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Info className="h-4 w-4" />
                  <span>
                    {defaultPeriod.reason === 'no_declarations' 
                      ? 'Période suggérée (aucune déclaration précédente)' 
                      : 'Période suivante basée sur vos déclarations'
                    }
                  </span>
                </div>
              )}
              
              {currentStatus && (
                <div className="flex items-center gap-2 text-sm">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentStatus.status === 'validated' ? 'bg-green-900/30 text-green-400' :
                    currentStatus.status === 'submitted' ? 'bg-blue-900/30 text-blue-400' :
                    'bg-yellow-900/30 text-yellow-400'
                  }`}>
                    {currentStatus.status === 'validated' ? '✓ Validée' :
                     currentStatus.status === 'submitted' ? '✓ Soumise' :
                     'Brouillon'}
                  </div>
                  {currentStatus.validatedAt && (
                    <span className="text-slate-400 text-xs">
                      le {new Date(currentStatus.validatedAt).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <MonthSelector 
                selectedPeriod={selectedPeriod}
                availablePeriods={availablePeriods}
                onPeriodChange={setSelectedPeriod}
                showStatus={true}
                className="min-w-0"
              />
              <div className="text-right">
                <p className="text-slate-400 text-sm">{operations?.length || 0} opérations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {calculation && cases && (
        <>
          {/* Résumé des calculs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-content">
                <h3 className="text-heading text-slate-200 mb-4">Chiffre d'affaires</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">CA encaissé HT</span>
                    <span className="text-slate-100 font-medium">{formatCurrency(calculation.caEncaisse)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ventes</span>
                    <span className="text-slate-300">{calculation.ventes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Achats</span>
                    <span className="text-slate-300">{calculation.achats.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <h3 className="text-heading text-slate-200 mb-4">TVA</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">TVA collectée</span>
                    <span className="text-slate-100 font-medium">{formatCurrency(calculation.tvaCollectee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TVA déductible</span>
                    <span className="text-slate-100 font-medium">{formatCurrency(calculation.tvaDeductible)}</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-200 font-medium">TVA à payer</span>
                      <span className="text-green-400 font-bold">{formatCurrency(calculation.tvaNetteAPayer)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <h3 className="text-heading text-slate-200 mb-4">URSSAF</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Revenue à déclarer</span>
                    <span className="text-slate-100 font-medium">{cases.revenueURSSAF} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Prestations BNC (24.60%)</span>
                    <span className="text-slate-100 font-medium">{cases.prestationsBNC} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Formation (0.30%)</span>
                    <span className="text-slate-100 font-medium">{cases.formationProfessionnelle} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Taxe CMA (0.48%)</span>
                    <span className="text-slate-100 font-medium">{cases.taxeCMAPrestation} €</span>
                  </div>
                  <div className="border-t border-slate-700 pt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-200 font-medium">Total URSSAF</span>
                      <span className="text-orange-400 font-bold">{cases.totalURSSAF} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cases à remplir */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Déclaration TVA */}
            <div className="card">
              <div className="card-content">
                <div className="flex items-center mb-4">
                  <Calculator className="h-5 w-5 text-green-400 mr-2" />
                  <h3 className="text-heading text-slate-200">Déclaration TVA</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-800 rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="font-medium text-slate-300 mb-3">A - Montant des opérations réalisées</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Case A1 (Ventes, prestations de services)</span>
                          <div className="flex items-center">
                            <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">{cases.caseA1}</span>
                            <span className="text-slate-400 ml-2">€</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Case 08 (Taux normal 20% - Base HT)</span>
                          <div className="flex items-center">
                            <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">{cases.case08}</span>
                            <span className="text-slate-400 ml-2">€</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-slate-300 mb-3">B - Décompte de la TVA à payer</h4>
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium text-slate-400 mb-2">TVA BRUTE</h5>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Case 16 (Total de la TVA brute due)</span>
                            <div className="flex items-center">
                              <span className="bg-blue-900/30 border border-blue-700 px-3 py-1 rounded font-mono text-blue-400">{cases.case16}</span>
                              <span className="text-slate-400 ml-2">€</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-slate-400 mb-2">TVA DÉDUCTIBLE</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Case 21 (Autre TVA à déduire)</span>
                              <div className="flex items-center">
                                <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">{cases.case21}</span>
                                <span className="text-slate-400 ml-2">€</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Case 23 (Total TVA déductible)</span>
                              <div className="flex items-center">
                                <span className="bg-orange-900/30 border border-orange-700 px-3 py-1 rounded font-mono text-orange-400">{cases.case23}</span>
                                <span className="text-slate-400 ml-2">€</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-slate-700 pt-2">
                          <h5 className="text-sm font-medium text-slate-400 mb-2">TAXE DUE</h5>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Case TD (TVA due - ligne 16 - ligne 23)</span>
                            <div className="flex items-center">
                              <span className="bg-green-900/30 border border-green-700 px-3 py-1 rounded font-mono text-green-400 font-bold">{cases.caseTD}</span>
                              <span className="text-slate-400 ml-2">€</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-slate-600 pt-2">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Case 28 (TVA nette due)</span>
                              <div className="flex items-center">
                                <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">{cases.case28}</span>
                                <span className="text-slate-400 ml-2">€</span>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-300 font-medium">Case 32 (Total à payer)</span>
                              <div className="flex items-center">
                                <span className="bg-green-900/30 border border-green-700 px-3 py-1 rounded font-mono text-green-400 font-bold">{cases.case32}</span>
                                <span className="text-slate-400 ml-2">€</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Info className="h-4 w-4 text-blue-400 mr-2" />
                      <span className="text-blue-400 font-medium">Échéances</span>
                    </div>
                    <p className="text-blue-200 text-sm">
                      Déclaration : 12 du mois suivant<br/>
                      Paiement : 20 du mois suivant
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Déclaration URSSAF */}
            <div className="card">
              <div className="card-content">
                <div className="flex items-center mb-4">
                  <FileText className="h-5 w-5 text-orange-400 mr-2" />
                  <h3 className="text-heading text-slate-200">Déclaration URSSAF</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="font-medium text-slate-300 mb-3">Revenue à déclarer</h4>
                    <div className="mb-4 p-3 bg-slate-700 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300 font-medium">CA encaissé HT total</span>
                        <span className="text-orange-400 font-bold text-lg">{cases.revenueURSSAF} €</span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        Saisissez ce montant dans les cases appropriées ci-dessous selon votre activité
                      </p>
                    </div>
                    
                    <h4 className="font-medium text-slate-300 mb-3">Cotisations, contributions et impôts</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center py-2">
                          <div className="flex-1">
                            <span className="text-slate-300">Prestations de services (bic)</span>
                            <span className="text-blue-400 ml-2">21,20 %</span>
                          </div>
                          <div className="flex items-center">
                            <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200 w-16 text-center">{cases.prestationsBIC}</span>
                            <span className="text-slate-400 ml-2">€</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <div className="flex-1">
                            <span className="text-slate-300">Vente de marchandises (bic)</span>
                            <span className="text-blue-400 ml-2">12,30 %</span>
                          </div>
                          <div className="flex items-center">
                            <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200 w-16 text-center">{cases.venteMarchandisesBIC}</span>
                            <span className="text-slate-400 ml-2">€</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 bg-blue-900/20 px-3 rounded">
                          <div className="flex-1">
                            <span className="text-slate-200 font-medium">Prestations de services (bnc)</span>
                            <span className="text-blue-400 ml-2">24,60 %</span>
                          </div>
                          <div className="flex items-center">
                            <span className="bg-blue-900/40 border border-blue-700 px-3 py-1 rounded font-mono text-blue-300 font-bold w-16 text-center">{cases.prestationsBNC}</span>
                            <span className="text-slate-300 ml-2">€</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <div className="flex-1">
                            <span className="text-slate-300">Formation prof. obligatoire</span>
                            <span className="text-blue-400 ml-2">0,30 %</span>
                          </div>
                          <div className="flex items-center">
                            <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200 w-16 text-center">{cases.formationProfessionnelle}</span>
                            <span className="text-slate-400 ml-2">€</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <div className="flex-1">
                            <span className="text-slate-300">Taxe cma vente obligatoire cas général</span>
                            <span className="text-blue-400 ml-2">0,22 %</span>
                          </div>
                          <div className="flex items-center">
                            <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200 w-16 text-center">{cases.taxeCMAVente}</span>
                            <span className="text-slate-400 ml-2">€</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <div className="flex-1">
                            <span className="text-slate-300">Taxe cma prestation oblig cas général</span>
                            <span className="text-blue-400 ml-2">0,48 %</span>
                          </div>
                          <div className="flex items-center">
                            <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200 w-16 text-center">{cases.taxeCMAPrestation}</span>
                            <span className="text-slate-400 ml-2">€</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-slate-600 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-200 font-bold">Total de la déclaration</span>
                          <div className="flex items-center">
                            <span className="bg-orange-900/30 border border-orange-700 px-4 py-2 rounded font-mono text-orange-400 font-bold text-lg">{cases.totalURSSAF}</span>
                            <span className="text-slate-300 ml-2 font-bold">€</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-700">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Paiement(s) déjà effectué(s)</span>
                            <div className="flex items-center">
                              <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">0</span>
                              <span className="text-slate-400 ml-2">€</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-600">
                            <span className="text-slate-200 font-bold text-lg">Total à payer</span>
                            <div className="flex items-center">
                              <span className="bg-green-900/30 border border-green-700 px-4 py-2 rounded font-mono text-green-400 font-bold text-xl">{cases.totalURSSAF}</span>
                              <span className="text-slate-300 ml-2 font-bold">€</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-900/20 border border-orange-700 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Info className="h-4 w-4 text-orange-400 mr-2" />
                      <span className="text-orange-400 font-medium">Échéance</span>
                    </div>
                    <p className="text-orange-200 text-sm">
                      Paiement : 5 du mois suivant
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center pt-6">
            <div className="flex space-x-4">
              <button className="btn btn-outline">
                Exporter PDF
              </button>
              <button className="btn btn-outline">
                Copier les montants
              </button>
              
              {canValidate && (
                <button 
                  onClick={validateDeclaration}
                  className="btn btn-primary"
                >
                  Valider la déclaration
                </button>
              )}
              
              {isValidated && (
                <button 
                  onClick={resetDeclaration}
                  className="btn btn-outline text-orange-400 border-orange-400 hover:bg-orange-400/10"
                >
                  Modifier
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {(!operations || operations.length === 0) && !isLoading && (
        <div className="card">
          <div className="card-content text-center">
            <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-heading text-slate-300 mb-2">
              {(() => {
                const [year, month] = selectedPeriod.periodKey.split('-').map(Number)
                const periodDate = new Date(year, month - 1)
                const now = new Date()
                const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2)
                
                if (periodDate > twoMonthsFromNow) {
                  return 'Période future'
                } else {
                  return 'Aucune opération trouvée'
                }
              })()}
            </h3>
            <p className="text-slate-400 mb-4">
              {(() => {
                const [year, month] = selectedPeriod.periodKey.split('-').map(Number)
                const periodDate = new Date(year, month - 1)
                const now = new Date()
                const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2)
                
                if (periodDate > twoMonthsFromNow) {
                  return 'Les déclarations ne sont pas encore disponibles pour cette période.'
                } else {
                  return 'Ajoutez des opérations pour générer votre déclaration mensuelle.'
                }
              })()}
            </p>
            {(() => {
              const [year, month] = selectedPeriod.periodKey.split('-').map(Number)
              const periodDate = new Date(year, month - 1)
              const now = new Date()
              const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2)
              
              if (periodDate <= twoMonthsFromNow) {
                return (
                  <button className="btn btn-primary">
                    Ajouter des opérations
                  </button>
                )
              }
              return null
            })()}
          </div>
        </div>
      )}
    </div>
  )
}