import React, { useState } from 'react'
import { X } from 'lucide-react'
import CompactOperationForm from '../CompactOperationForm'
import type { Operation } from '../../types'

interface DeclarationModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DeclarationModal: React.FC<DeclarationModalProps> = ({ isOpen, onClose }) => {
  const [operations, setOperations] = useState<Operation[]>([])

  if (!isOpen) return null

  const handleOperationCreated = (operation: Operation) => {
    setOperations(prev => [...prev, operation])
  }

  const calculerTotaux = () => {
    const ventes = operations.filter(op => op.sens === 'vente')
    const achats = operations.filter(op => op.sens === 'achat')
    
    const totalVentesHT = ventes.reduce((sum, v) => sum + v.amount_ht_cents, 0) / 100
    const totalAchatsHT = achats.reduce((sum, a) => sum + a.amount_ht_cents, 0) / 100
    const tvaDue = ventes.reduce((sum, v) => sum + v.tva_cents, 0) / 100 - achats.reduce((sum, a) => sum + a.tva_cents, 0) / 100
    const urssafDue = totalVentesHT * 0.22

    return { totalVentesHT, totalAchatsHT, tvaDue, urssafDue }
  }

  const totaux = calculerTotaux()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Saisie rapide d'opérations
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Saisissez vos ventes et achats du mois (formulaire ultra-compact)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)] space-y-4">
          {/* Formulaire ultra-compact */}
          <CompactOperationForm
            onOperationCreated={handleOperationCreated}
            className=""
          />

          {/* Liste des opérations saisies */}
          {operations.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Opérations saisies ({operations.length})
              </h4>
              <div className="space-y-2">
                {operations.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between text-xs bg-white dark:bg-gray-800 rounded p-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-white ${
                        operation.sens === 'vente' ? 'bg-green-500' : 'bg-blue-500'
                      }`}>
                        {operation.sens === 'vente' ? 'Vente' : 'Achat'}
                      </span>
                      <span>{operation.date}</span>
                      <span className="font-medium">{(operation.amount_ht_cents / 100).toFixed(2)}€ HT</span>
                      {operation.libelle && <span className="text-gray-600 dark:text-gray-400">{operation.libelle}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      {operation.justificatif_url && <span>📎</span>}
                      {operation.tva_sur_encaissements && <span title="TVA sur encaissement">⏰</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Résumé */}
          {operations.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Résumé des opérations
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Ventes HT</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {totaux.totalVentesHT.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Achats HT</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {totaux.totalAchatsHT.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-orange-600 dark:text-orange-400">TVA due</p>
                  <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                    {totaux.tvaDue.toLocaleString('fr-FR')} €
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-red-600 dark:text-red-400">URSSAF due</p>
                  <p className="text-lg font-bold text-red-900 dark:text-red-100">
                    {totaux.urssafDue.toLocaleString('fr-FR')} €
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {operations.length} opération{operations.length !== 1 ? 's' : ''} saisie{operations.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Fermer
            </button>
            {operations.length > 0 && (
              <button
                onClick={() => {
                  // TODO: Export ou traitement des opérations
                  onClose()
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continuer avec les calculs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeclarationModal