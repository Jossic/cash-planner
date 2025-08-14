import React, { useState } from 'react'
import { Calculator, TrendingUp, Calendar, Euro } from 'lucide-react'

export const Simulations: React.FC = () => {
  const [tjmCible, setTjmCible] = useState('600')
  const [joursParMois, setJoursParMois] = useState('20')
  const [congesParAn, setCongesParAn] = useState('25')
  const [tauxCharges, setTauxCharges] = useState('45')

  const calculerProjections = () => {
    const tjm = parseFloat(tjmCible) || 0
    const jours = parseFloat(joursParMois) || 0
    const conges = parseFloat(congesParAn) || 0
    const charges = parseFloat(tauxCharges) || 0

    const caAnnuelBrut = tjm * jours * 12
    const joursCongesParMois = conges / 12
    const joursEffectifs = jours - joursCongesParMois
    const caAnnuelEffectif = tjm * joursEffectifs * 12
    const chargesAnnuelles = (caAnnuelEffectif * charges) / 100
    const netAnnuel = caAnnuelEffectif - chargesAnnuelles

    return {
      caAnnuelBrut,
      caAnnuelEffectif,
      chargesAnnuelles,
      netAnnuel,
      netMensuel: netAnnuel / 12,
      joursEffectifsParMois: joursEffectifs
    }
  }

  const projections = calculerProjections()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Simulations
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Optimisez votre taux journalier et planifiez vos revenus
          </p>
        </div>
        <Calculator className="h-8 w-8 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire de simulation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Paramètres de simulation
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux journalier moyen (€)
              </label>
              <input
                type="number"
                value={tjmCible}
                onChange={(e) => setTjmCible(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Jours travaillés par mois
              </label>
              <input
                type="number"
                value={joursParMois}
                onChange={(e) => setJoursParMois(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Congés par an (jours)
              </label>
              <input
                type="number"
                value={congesParAn}
                onChange={(e) => setCongesParAn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Taux de charges (%)
              </label>
              <input
                type="number"
                value={tauxCharges}
                onChange={(e) => setTauxCharges(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="45"
              />
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Projections annuelles
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">CA brut annuel</span>
              <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {projections.caAnnuelBrut.toLocaleString('fr-FR')} €
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">CA effectif (avec congés)</span>
              <span className="text-lg font-bold text-green-900 dark:text-green-100">
                {projections.caAnnuelEffectif.toLocaleString('fr-FR')} €
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="text-sm font-medium text-red-800 dark:text-red-200">Charges (TVA + URSSAF)</span>
              <span className="text-lg font-bold text-red-900 dark:text-red-100">
                {projections.chargesAnnuelles.toLocaleString('fr-FR')} €
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Net annuel estimé</span>
              <span className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                {projections.netAnnuel.toLocaleString('fr-FR')} €
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Net mensuel moyen</span>
              <span className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {projections.netMensuel.toLocaleString('fr-FR')} €
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              📊 Détails
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div className="flex justify-between">
                <span>Jours effectifs/mois:</span>
                <span className="font-medium">{projections.joursEffectifsParMois.toFixed(1)} jours</span>
              </div>
              <div className="flex justify-between">
                <span>TJM effectif:</span>
                <span className="font-medium">{tjmCible} €</span>
              </div>
              <div className="flex justify-between">
                <span>Taux de charges:</span>
                <span className="font-medium">{tauxCharges}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Graphique placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Évolution mensuelle prévisionnelle
        </h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Graphique de projection en cours de développement</p>
          </div>
        </div>
      </div>

      {/* Conseils */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
          💡 Conseils d'optimisation
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <li>• Augmentez votre TJM progressivement (5-10% par an)</li>
          <li>• Prévoyez 5-6 semaines de congés par an pour éviter le burnout</li>
          <li>• Provisionnez 45-50% de vos revenus pour les charges fiscales et sociales</li>
          <li>• Diversifiez vos clients pour réduire les risques</li>
        </ul>
      </div>
    </div>
  )
}