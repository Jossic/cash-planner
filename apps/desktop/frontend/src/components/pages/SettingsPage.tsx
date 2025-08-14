import React, { useState } from 'react'
import { Save, RotateCcw, Settings, Percent, Calculator, Euro, Bell } from 'lucide-react'
import { useAppStore } from '../../stores/useAppStore'
import { formatEuros } from '../../lib/utils'

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useAppStore()
  
  const [formData, setFormData] = useState({
    default_tva_rate: settings.default_tva_rate.toString(),
    urssaf_rate: (settings.urssaf_rate / 10000 * 100).toString(), // Convert from ppm to percentage
    cash_buffer_cents: (settings.cash_buffer_cents / 100).toString(),
    payment_delay_days: settings.payment_delay_days.toString(),
    company_name: settings.company_name || '',
    siret: settings.siret || '',
    vat_regime: settings.vat_regime || 'reel',
    fiscal_year_start: settings.fiscal_year_start || '01-01'
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateSettings({
      default_tva_rate: parseFloat(formData.default_tva_rate),
      urssaf_rate: Math.round(parseFloat(formData.urssaf_rate) * 100), // Convert to ppm
      cash_buffer_cents: Math.round(parseFloat(formData.cash_buffer_cents) * 100),
      payment_delay_days: parseInt(formData.payment_delay_days),
      company_name: formData.company_name,
      siret: formData.siret,
      vat_regime: formData.vat_regime as 'reel' | 'simplifie',
      fiscal_year_start: formData.fiscal_year_start
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setFormData({
      default_tva_rate: '20',
      urssaf_rate: '22',
      cash_buffer_cents: '1000',
      payment_delay_days: '30',
      company_name: '',
      siret: '',
      vat_regime: 'reel',
      fiscal_year_start: '01-01'
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-slate-100 mb-2 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center mr-4">
                <Settings className="h-5 w-5 text-white" />
              </div>
              Paramètres
            </h1>
            <p className="text-body text-slate-400">
              Configuration de votre profil fiscal et préférences
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="btn btn-outline"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </button>
            <button
              onClick={handleSave}
              className={`btn transition-colors ${
                saved 
                  ? 'btn-success' 
                  : 'btn-primary'
              }`}
            >
              <Save className="h-4 w-4" />
              {saved ? 'Sauvegardé!' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-blue-400" />
              <h2 className="text-heading text-slate-200">
                Informations entreprise
              </h2>
            </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nom de l'entreprise
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
                placeholder="JLA Consulting"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                SIRET
              </label>
              <input
                type="text"
                value={formData.siret}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
                placeholder="12345678901234"
                maxLength={14}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Régime de TVA
              </label>
              <select
                value={formData.vat_regime}
                onChange={(e) => setFormData({ ...formData, vat_regime: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
              >
                <option value="reel">Régime réel</option>
                <option value="simplifie">Régime simplifié</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Début exercice fiscal (MM-DD)
              </label>
              <input
                type="text"
                value={formData.fiscal_year_start}
                onChange={(e) => setFormData({ ...formData, fiscal_year_start: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
                placeholder="01-01"
                pattern="[0-9]{2}-[0-9]{2}"
              />
              <p className="text-xs text-slate-400 mt-1">
                Format: MM-DD (ex: 01-01 pour janvier)
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-2 mb-4">
              <Percent className="h-5 w-5 text-green-400" />
              <h2 className="text-heading text-slate-200">
                Taux et fiscalité
              </h2>
            </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Taux TVA par défaut (%)
              </label>
              <select
                value={formData.default_tva_rate}
                onChange={(e) => setFormData({ ...formData, default_tva_rate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
              >
                <option value="0">0%</option>
                <option value="5.5">5,5%</option>
                <option value="10">10%</option>
                <option value="20">20%</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Taux URSSAF (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={formData.urssaf_rate}
                onChange={(e) => setFormData({ ...formData, urssaf_rate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
              />
              <p className="text-xs text-slate-400 mt-1">
                Taux standard: 22% (peut varier selon statut)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Délai de paiement client (jours)
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={formData.payment_delay_days}
                onChange={(e) => setFormData({ ...formData, payment_delay_days: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
              />
              <p className="text-xs text-slate-400 mt-1">
                Délai moyen pour calculer les projections
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* Cash Management */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-2 mb-4">
              <Euro className="h-5 w-5 text-yellow-400" />
              <h2 className="text-heading text-slate-200">
                Gestion de trésorerie
              </h2>
            </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Tampon de sécurité (€)
              </label>
              <input
                type="number"
                step="100"
                min="0"
                value={formData.cash_buffer_cents}
                onChange={(e) => setFormData({ ...formData, cash_buffer_cents: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-100"
              />
              <p className="text-xs text-slate-400 mt-1">
                Montant gardé en réserve pour imprévus
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4">
              <h4 className="font-medium text-slate-200 mb-2">
                Aperçu trésorerie
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tampon configuré:</span>
                  <span className="font-medium text-slate-100">{formatEuros(parseFloat(formData.cash_buffer_cents || '0') * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Délai paiement:</span>
                  <span className="font-medium text-slate-100">{formData.payment_delay_days} jours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">URSSAF:</span>
                  <span className="font-medium text-slate-100">{formData.urssaf_rate}%</span>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-content">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-purple-400" />
              <h2 className="text-heading text-slate-200">
                Notifications et rappels
              </h2>
            </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Rappels déclarations TVA
                </div>
                <div className="text-xs text-slate-400">
                  Alertes 5 jours avant échéance
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Rappels paiements URSSAF
                </div>
                <div className="text-xs text-slate-400">
                  Alertes 3 jours avant échéance
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Alertes trésorerie faible
                </div>
                <div className="text-xs text-slate-400">
                  Quand le disponible passe sous le tampon
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-200">
                  Factures en retard
                </div>
                <div className="text-xs text-slate-400">
                  Suivi des impayés clients
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-red-400" />
            <h2 className="text-heading text-slate-200">
              Gestion des données
            </h2>
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors">
            <div className="text-sm font-medium text-slate-200 mb-1">
              Exporter les données
            </div>
            <div className="text-xs text-slate-400">
              Télécharger toutes vos données en CSV
            </div>
          </button>

          <button className="p-4 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors">
            <div className="text-sm font-medium text-slate-200 mb-1">
              Importer des données
            </div>
            <div className="text-xs text-slate-400">
              Charger des factures depuis un fichier
            </div>
          </button>

          <button className="p-4 border border-red-600 rounded-lg hover:bg-red-900/20 transition-colors text-red-400">
            <div className="text-sm font-medium mb-1">
              Réinitialiser l'app
            </div>
            <div className="text-xs">
              Supprimer toutes les données
            </div>
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}