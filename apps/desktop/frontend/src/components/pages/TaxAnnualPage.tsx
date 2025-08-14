import React from 'react'
import { Calendar, FileText, Calculator, TrendingUp, AlertCircle } from 'lucide-react'

/**
 * Page Déclaration d'Impôts Annuelle
 * Nouvelle page intégrée dans la navigation simplifiée
 */
export const TaxAnnualPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 p-8 animate-fade-in">
      {/* Modern Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-slate-100 mb-2 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              Déclaration d'Impôts
            </h1>
            <p className="text-body text-slate-400">
              Assistant pour votre déclaration annuelle de revenus freelance
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-300">Année fiscale 2024</div>
            <div className="text-xs text-slate-500">Échéance: Mai 2025</div>
          </div>
        </div>
      </div>

      {/* Statut de la déclaration */}
      <div className="card mb-8 animate-in">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h3 className="card-title">Statut de votre déclaration 2024</h3>
                <p className="card-description">Suivi de votre progression</p>
              </div>
            </div>
            <div className="status-warning">
              En préparation
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-400 text-xl font-bold">✓</span>
              </div>
              <h4 className="text-sm font-medium text-slate-200 mb-1">Revenus</h4>
              <p className="text-xs text-slate-400">Données collectées</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-yellow-400 text-xl font-bold">⚡</span>
              </div>
              <h4 className="text-sm font-medium text-slate-200 mb-1">Charges</h4>
              <p className="text-xs text-slate-400">En cours</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-slate-400 text-xl font-bold">⏳</span>
              </div>
              <h4 className="text-sm font-medium text-slate-200 mb-1">Optimisation</h4>
              <p className="text-xs text-slate-400">À venir</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-slate-400 text-xl font-bold">📄</span>
              </div>
              <h4 className="text-sm font-medium text-slate-200 mb-1">Export</h4>
              <p className="text-xs text-slate-400">À venir</p>
            </div>
          </div>
        </div>
      </div>

      {/* Synthèse annuelle */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="metric-card animate-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1 font-mono">45,250.00 €</div>
              <div className="text-sm text-slate-400">Revenus bruts 2024</div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        <div className="metric-card animate-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-400 mb-1 font-mono">12,180.50 €</div>
              <div className="text-sm text-slate-400">Charges déductibles</div>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <div className="text-red-400 text-xl font-bold">↓</div>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '35%' }}></div>
          </div>
        </div>

        <div className="metric-card animate-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-400 mb-1 font-mono">33,069.50 €</div>
              <div className="text-sm text-slate-400">Bénéfice imposable</div>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calculator className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '73%' }}></div>
          </div>
        </div>
      </div>

      {/* Actions disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card animate-in" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                <FileText className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <h3 className="card-title">Export comptable</h3>
                <p className="card-description">Récapitulatif pour votre expert-comptable</p>
              </div>
            </div>
          </div>
          <div className="card-content">
            <p className="text-sm text-slate-400 mb-4">
              Générez un export détaillé de toutes vos opérations 2024 au format Excel/PDF.
            </p>
            <button className="btn btn-success w-full">
              <FileText className="h-4 w-4 mr-2" />
              Générer l'export
            </button>
          </div>
        </div>

        <div className="card animate-in" style={{ animationDelay: '500ms' }}>
          <div className="card-header">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                <Calculator className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <h3 className="card-title">Simulateur fiscal</h3>
                <p className="card-description">Estimez votre impôt sur le revenu</p>
              </div>
            </div>
          </div>
          <div className="card-content">
            <p className="text-sm text-slate-400 mb-4">
              Simulation basée sur vos revenus et charges réels pour anticiper votre imposition.
            </p>
            <button className="btn btn-outline w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Lancer la simulation
            </button>
          </div>
        </div>
      </div>

      {/* Alertes et conseils */}
      <div className="card animate-in" style={{ animationDelay: '600ms' }}>
        <div className="card-header">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-3">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <h3 className="card-title">Conseils fiscaux</h3>
              <p className="card-description">Optimisations possibles pour 2024</p>
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-start p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs font-bold">💡</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-300 mb-1">Frais de repas</h4>
                <p className="text-xs text-blue-400/70">
                  Vous pouvez déduire 4,85€ par repas pris hors domicile dans le cadre professionnel.
                </p>
              </div>
            </div>

            <div className="flex items-start p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs font-bold">📱</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-300 mb-1">Équipement informatique</h4>
                <p className="text-xs text-green-400/70">
                  Les achats d'équipement de moins de 500€ HT sont déductibles immédiatement.
                </p>
              </div>
            </div>

            <div className="flex items-start p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs font-bold">🏠</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-300 mb-1">Bureau à domicile</h4>
                <p className="text-xs text-purple-400/70">
                  Déduction possible d'une partie des frais de logement si vous avez un espace dédié.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}