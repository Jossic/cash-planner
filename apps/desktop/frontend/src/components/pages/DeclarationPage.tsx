import React, { useState, useEffect } from 'react'
import { Calendar, Calculator, FileText, Info } from 'lucide-react'
import { useCurrentPeriod, useOperations } from '../../stores/useAppStore'
import type { Operation, Period } from '../../types'
import { cn } from '../../lib/utils'

// Types pour les calculs de déclaration
interface DeclarationCalculation {
  period: Period
  operations: Operation[]
  ventes: Operation[]
  achats: Operation[]
  tvaCollectee: number // en centimes
  tvaDeductible: number // en centimes
  tvaNetteAPayer: number // en centimes
  caEncaisse: number // CA encaissé pour URSSAF (centimes)
  urssafDue: number // en centimes
}

interface DeclarationCases {
  // Cases TVA
  caseA1: string // Base HT ventes 10%
  case08: string // Base HT total
  case16: string // TVA due
  
  // Cases URSSAF  
  prestationsBNC: string // 21.20%
  formation: string // 0.30% 
  taxeCMA: string // 0.48%
  totalURSSAF: string
}

export const DeclarationPage: React.FC = () => {
  const currentPeriod = useCurrentPeriod()
  const { operations, loadOperations, isLoading, error } = useOperations(currentPeriod.key)
  
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(currentPeriod)
  const [calculation, setCalculation] = useState<DeclarationCalculation | null>(null)
  const [cases, setCases] = useState<DeclarationCases | null>(null)

  // Charger les opérations au changement de période
  useEffect(() => {
    loadOperations()
  }, [selectedPeriod.key, loadOperations])

  // Calculer la déclaration quand les opérations changent
  useEffect(() => {
    if (operations && operations.length > 0) {
      const calc = calculateDeclaration(selectedPeriod, operations)
      setCalculation(calc)
      setCases(generateDeclarationCases(calc))
    }
  }, [operations, selectedPeriod])

  const calculateDeclaration = (period: Period, operations: Operation[]): DeclarationCalculation => {
    const ventes = operations.filter(op => op.sens === 'vente')
    const achats = operations.filter(op => op.sens === 'achat')
    
    // TVA collectée (sur ventes encaissées)
    let tvaCollectee = 0
    let caEncaisse = 0 // Pour URSSAF
    
    ventes.forEach(vente => {
      let includeInPeriod = false
      
      if (vente.tva_sur_encaissements) {
        // TVA sur encaissements : vérifier date d'encaissement
        if (vente.encaissement_date && vente.encaissement_date.startsWith(period.key)) {
          includeInPeriod = true
        }
      } else {
        // TVA sur facturation : vérifier date d'opération
        if (vente.date.startsWith(period.key)) {
          includeInPeriod = true
        }
      }
      
      if (includeInPeriod) {
        tvaCollectee += vente.tva_cents
        caEncaisse += vente.amount_ht_cents // CA pour URSSAF
      }
    })
    
    // TVA déductible (sur achats)
    let tvaDeductible = 0
    
    achats.forEach(achat => {
      if (achat.date.startsWith(period.key)) {
        tvaDeductible += achat.tva_cents
      }
    })
    
    // TVA nette à payer
    const tvaNetteAPayer = Math.max(0, tvaCollectee - tvaDeductible)
    
    // URSSAF (22% du CA encaissé + compléments)
    const urssafBNC = Math.round(caEncaisse * 0.212) // 21.20%
    const formation = Math.round(caEncaisse * 0.003) // 0.30%
    const taxeCMA = Math.round(caEncaisse * 0.0048) // 0.48%
    const urssafDue = urssafBNC + formation + taxeCMA
    
    return {
      period,
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
    
    return {
      // Cases TVA
      caseA1: baseHTTotal.toString(), // Base HT (supposant du 10% pour l'exemple)
      case08: baseHTTotal.toString(), // Base HT total
      case16: Math.round(calc.tvaNetteAPayer / 100).toString(), // TVA due en euros
      
      // Cases URSSAF
      prestationsBNC: Math.round(calc.caEncaisse * 0.212 / 100).toString(),
      formation: Math.round(calc.caEncaisse * 0.003 / 100).toString(),
      taxeCMA: Math.round(calc.caEncaisse * 0.0048 / 100).toString(),
      totalURSSAF: Math.round(calc.urssafDue / 100).toString()
    }
  }

  const formatCurrency = (cents: number): string => {
    return (cents / 100).toFixed(2) + ' €'
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

      {/* Période sélectionnée */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-400 mr-2" />
              <h2 className="text-heading text-slate-200">Période</h2>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-slate-100">{selectedPeriod.label}</p>
              <p className="text-small text-slate-400">{operations?.length || 0} opérations</p>
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
                    <span className="text-slate-400">Prestations BNC (21.20%)</span>
                    <span className="text-slate-100 font-medium">{cases.prestationsBNC} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Formation (0.30%)</span>
                    <span className="text-slate-100 font-medium">{cases.formation} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Taxe CMA (0.48%)</span>
                    <span className="text-slate-100 font-medium">{cases.taxeCMA} €</span>
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
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="font-medium text-slate-300 mb-3">Cases à remplir</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Case A1 (Base HT 10%)</span>
                        <div className="flex items-center">
                          <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">{cases.caseA1}</span>
                          <span className="text-slate-400 ml-2">€</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Case 08 (Base HT total)</span>
                        <div className="flex items-center">
                          <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">{cases.case08}</span>
                          <span className="text-slate-400 ml-2">€</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Case 16 (TVA due)</span>
                        <div className="flex items-center">
                          <span className="bg-green-900/30 border border-green-700 px-3 py-1 rounded font-mono text-green-400">{cases.case16}</span>
                          <span className="text-slate-400 ml-2">€</span>
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
                    <h4 className="font-medium text-slate-300 mb-3">Montants à déclarer</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Prestations BNC</span>
                        <div className="flex items-center">
                          <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">{cases.prestationsBNC}</span>
                          <span className="text-slate-400 ml-2">€</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Formation professionnelle</span>
                        <div className="flex items-center">
                          <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">{cases.formation}</span>
                          <span className="text-slate-400 ml-2">€</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Taxe CMA</span>
                        <div className="flex items-center">
                          <span className="bg-slate-700 px-3 py-1 rounded font-mono text-slate-200">{cases.taxeCMA}</span>
                          <span className="text-slate-400 ml-2">€</span>
                        </div>
                      </div>
                      <div className="border-t border-slate-700 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-300 font-medium">Total à payer</span>
                          <div className="flex items-center">
                            <span className="bg-orange-900/30 border border-orange-700 px-3 py-1 rounded font-mono text-orange-400 font-bold">{cases.totalURSSAF}</span>
                            <span className="text-slate-400 ml-2">€</span>
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
              <button className="btn btn-primary">
                Copier les montants
              </button>
            </div>
          </div>
        </>
      )}

      {(!operations || operations.length === 0) && !isLoading && (
        <div className="card">
          <div className="card-content text-center">
            <Calendar className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-heading text-slate-300 mb-2">Aucune opération trouvée</h3>
            <p className="text-slate-400 mb-4">
              Ajoutez des opérations pour générer votre déclaration mensuelle.
            </p>
            <button className="btn btn-primary">
              Ajouter des opérations
            </button>
          </div>
        </div>
      )}
    </div>
  )
}