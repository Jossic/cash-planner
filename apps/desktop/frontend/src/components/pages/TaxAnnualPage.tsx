import React, { useState, useEffect } from 'react'
import { Calendar, FileText, Calculator, TrendingUp, AlertCircle, Download, ExternalLink } from 'lucide-react'
import { invoke } from '@tauri-apps/api/core'

interface MonthlyTaxBreakdown {
  month_id: {
    year: number
    month: number
  }
  revenue_ht_cents: number
  expenses_cents: number
  vat_due_cents: number
  urssaf_due_cents: number
}

interface AnnualTaxData {
  year: number
  total_revenue_ht_cents: number
  total_revenue_ttc_cents: number
  total_expenses_cents: number
  total_vat_collected_cents: number
  total_vat_deductible_cents: number
  net_vat_due_cents: number
  total_urssaf_paid_cents: number
  case_5hq: string
  case_5hh: string
  case_5iu: string
  months_worked: number
  average_monthly_revenue: number
  monthly_breakdown: MonthlyTaxBreakdown[]
}

/**
 * Page Déclaration d'Impôts Annuelle
 * Calcule et affiche les données pour la déclaration fiscale auto-entrepreneur
 */
export const TaxAnnualPage: React.FC = () => {
  const [taxData, setTaxData] = useState<AnnualTaxData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState(2025)

  const formatCurrency = (amountInCents: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amountInCents / 100)
  }

  const fetchAnnualTaxData = async (year: number) => {
    try {
      setLoading(true)
      setError(null)
      const data = await invoke<AnnualTaxData>('cmd_get_annual_tax_data', { year })
      setTaxData(data)
    } catch (err) {
      console.error('Erreur lors du chargement des données fiscales:', err)
      setError(err as string)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnualTaxData(selectedYear)
  }, [selectedYear])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-slate-400">Chargement des données fiscales...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
        <div className="text-red-400">Erreur: {error}</div>
      </div>
    )
  }
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
              Assistant pour votre déclaration annuelle de revenus auto-entrepreneur
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 text-sm"
            >
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
            </select>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-300">Année fiscale {selectedYear}</div>
              <div className="text-xs text-slate-500">Échéance: Mai {selectedYear + 1}</div>
            </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="metric-card animate-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-400 mb-1 font-mono">
                {taxData ? formatCurrency(taxData.total_revenue_ht_cents) : '0,00 €'}
              </div>
              <div className="text-sm text-slate-400">Chiffre d'affaires encaissé {selectedYear}</div>
              {taxData && (
                <div className="text-xs text-slate-500 mt-1">
                  {taxData.months_worked} mois d'activité • Moyenne: {formatCurrency(taxData.average_monthly_revenue)}/mois
                </div>
              )}
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="metric-card animate-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-400 mb-1 font-mono">
                {taxData ? formatCurrency(taxData.total_urssaf_paid_cents) : '0,00 €'}
              </div>
              <div className="text-sm text-slate-400">Cotisations sociales versées</div>
              <div className="text-xs text-slate-500 mt-1">
                Charges sociales auto-entrepreneur
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Calculator className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Guide de déclaration Auto-Entrepreneur */}
      <div className="card mb-8 animate-in" style={{ animationDelay: '400ms' }}>
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h3 className="card-title">Déclaration Auto-Entrepreneur</h3>
                <p className="card-description">Case à remplir pour votre déclaration d'impôts</p>
              </div>
            </div>
            <button className="btn btn-outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir le formulaire
            </button>
          </div>
        </div>
        <div className="card-content">
          <div className="max-w-2xl mx-auto">
            <div className="p-6 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
              <div className="flex items-center justify-center mb-4">
                <h4 className="text-lg font-medium text-green-300">Case 5TA - Chiffre d'affaires (Prestations de services)</h4>
              </div>
              <div className="text-4xl font-bold text-green-400 mb-3 font-mono">
                {taxData ? formatCurrency(taxData.total_revenue_ht_cents) : '0,00 €'}
              </div>
              <p className="text-sm text-green-400/80 mb-4">
                Montant à reporter dans la case 5TA de votre déclaration d'impôts {selectedYear}
              </p>
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                <div className="text-xs text-green-300 space-y-2">
                  <div className="font-medium">📋 Instructions :</div>
                  <div>• Reportez ce montant exact dans la case 5TA</div>
                  <div>• Il s'agit du total de vos encaissements HT sur l'année {selectedYear}</div>
                  <div>• Pas de charges à déduire en auto-entrepreneur</div>
                  <div>• L'abattement fiscal sera appliqué automatiquement par l'administration</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions disponibles */}
      <div className="card animate-in" style={{ animationDelay: '500ms' }}>
        <div className="card-header">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
              <Calendar className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h3 className="card-title">Détail mensuel {selectedYear}</h3>
              <p className="card-description">Répartition de vos encaissements par mois</p>
            </div>
          </div>
        </div>
        <div className="card-content">
          <p className="text-sm text-slate-400 mb-4">
            Consultez la répartition mensuelle de vos encaissements pour vérifier vos données.
          </p>
          <button className="btn btn-outline w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Voir le détail mensuel
          </button>
        </div>
      </div>

      {/* Rappels Auto-Entrepreneur */}
      <div className="card animate-in" style={{ animationDelay: '600ms' }}>
        <div className="card-header">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-3">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </div>
            <div>
              <h3 className="card-title">Rappels Auto-Entrepreneur</h3>
              <p className="card-description">Points importants pour votre déclaration {selectedYear}</p>
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-start p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs font-bold">💰</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-300 mb-1">Encaissements uniquement</h4>
                <p className="text-xs text-blue-400/70">
                  Seuls les revenus effectivement encaissés en {selectedYear} sont à déclarer dans la case 5TA.
                </p>
              </div>
            </div>

            <div className="flex items-start p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs font-bold">🚫</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-300 mb-1">Pas de charges déductibles</h4>
                <p className="text-xs text-green-400/70">
                  En auto-entrepreneur, vous ne pouvez pas déduire vos frais professionnels. L'abattement se fait automatiquement.
                </p>
              </div>
            </div>

            <div className="flex items-start p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs font-bold">📉</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-300 mb-1">Abattement automatique</h4>
                <p className="text-xs text-purple-400/70">
                  L'administration appliquera automatiquement 34% d'abattement sur vos revenus de prestations de services.
                </p>
              </div>
            </div>

            <div className="flex items-start p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-xs font-bold">📋</span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-orange-300 mb-1">Justificatifs à conserver</h4>
                <p className="text-xs text-orange-400/70">
                  Gardez vos factures clients et relevés URSSAF pendant 10 ans en cas de contrôle fiscal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}