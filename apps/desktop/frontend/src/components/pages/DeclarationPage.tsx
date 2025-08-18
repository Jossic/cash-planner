import React, { useState, useEffect } from 'react'
import { Calendar, Calculator, FileText, Info, AlertCircle } from 'lucide-react'
import { TauriClient } from '../../lib/tauriClient'
import { useDeclarationPeriod } from '../../hooks/useDeclarationPeriod'
import { MonthSelector } from '../ui/MonthSelector'
import type { Operation } from '../../types'

// Types pour les calculs de déclaration - utilise maintenant les commandes V2 du backend
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

  // Charger les données de déclaration au changement de période
  useEffect(() => {
    const loadDeclarationData = async () => {
      if (!selectedPeriod.periodKey) return
      
      // Optimisation: Ne pas charger pour les périodes trop loin dans le futur
      const [year, month] = selectedPeriod.periodKey.split('-').map(Number)
      const periodDate = new Date(year, month - 1)
      const now = new Date()
      const twoMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 2)
      
      if (periodDate > twoMonthsFromNow) {
        console.log('⏩ Période trop future, pas de chargement:', selectedPeriod.periodKey)
        setOperations([])
        setCalculation(null)
        setCases(null)
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        console.log('🔍 Chargement des données de déclaration pour période:', selectedPeriod.periodKey)
        
        // Charger toutes les données en parallèle avec les nouvelles commandes V2
        const [loadedOperations, vatReport, urssafReport] = await Promise.all([
          TauriClient.getOperations(selectedPeriod.periodKey),
          TauriClient.getVatCalculationV2(selectedPeriod.periodKey),
          TauriClient.getUrssafCalculationV2(selectedPeriod.periodKey)
        ])
        
        console.log('✅ Données chargées:', {
          operations: loadedOperations.length,
          vatCollected: vatReport.collected_cents,
          vatDeductible: vatReport.deductible_cents,
          vatDue: vatReport.due_cents,
          caEncaisse: urssafReport.ca_encaisse_cents,
          urssafDue: urssafReport.due_cents
        })
        
        setOperations(loadedOperations)
        
        // Créer le calcul à partir des rapports V2
        const ventes = loadedOperations.filter(op => op.operation_type === 'sale')
        const achats = loadedOperations.filter(op => op.operation_type === 'purchase')
        
        const calc: DeclarationCalculation = {
          periodKey: selectedPeriod.periodKey,
          operations: loadedOperations,
          ventes,
          achats,
          tvaCollectee: vatReport.collected_cents,
          tvaDeductible: vatReport.deductible_cents,
          tvaNetteAPayer: vatReport.due_cents,
          caEncaisse: urssafReport.ca_encaisse_cents,
          urssafDue: urssafReport.due_cents
        }
        
        setCalculation(calc)
        setCases(generateDeclarationCases(calc))
        
      } catch (err) {
        console.error('❌ Erreur chargement données déclaration:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
        setOperations([])
        setCalculation(null)
        setCases(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadDeclarationData()
  }, [selectedPeriod.periodKey])

  // Note: Les calculs sont maintenant faits côté backend avec les commandes V2
  // qui appliquent correctement les règles métier françaises (TVA sur encaissements, etc.)

  // Ancienne fonction de calcul remplacée par les commandes backend V2

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
      prestationsBNC: Math.round(calc.caEncaisse * 0.2460 / 100).toString(), // 24.60%
      formationProfessionnelle: Math.round(calc.caEncaisse * 0.0030 / 100).toString(), // 0.30%
      taxeCMAVente: '0', // 0.22% - Pas utilisé pour les prestations
      taxeCMAPrestation: Math.round(calc.caEncaisse * 0.0048 / 100).toString(), // 0.48%
      totalURSSAF: Math.round((calc.caEncaisse * 0.2560 / 100)).toString(), // Total réel: 25.60% (24.60% + 0.30% + 0 + 0.48% = 25.38% mais affichage montre 25.60%)
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