import React, { useState, useMemo, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Search, Filter, Trash2, Edit, FileText, ArrowUpDown } from 'lucide-react'
import type { Operation } from '../../types'
import { useCurrentPeriod } from '../../stores/useAppStore'
import { cn } from '../../lib/utils'
import { TauriClient } from '../../lib/tauriClient'
import { invoke } from '@tauri-apps/api/core'

interface OperationsListProps {
  showFilters?: boolean
}

type SortField = 'date' | 'amount_ht' | 'sens' | 'libelle'
type SortOrder = 'asc' | 'desc'
type FilterSens = 'all' | 'vente' | 'achat'

export const OperationsList: React.FC<OperationsListProps> = ({ showFilters = true }) => {
  const currentPeriod = useCurrentPeriod()
  
  const [operations, setOperations] = useState<Operation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSens, setFilterSens] = useState<FilterSens>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [expandedMonths, setExpandedMonths] = useState<string[]>([currentPeriod.key])
  
  // Chargement des opérations
  const loadOperations = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('📊 Chargement des opérations via TauriClient...')
      const ops = await TauriClient.getOperations() // Charger toutes les opérations
      setOperations(ops || [])
      console.log('✅ Opérations chargées dans OperationsList:', ops.length, 'opérations')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
      console.error('❌ Erreur chargement opérations OperationsList:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Chargement initial et écoute des événements
  useEffect(() => {
    loadOperations()
    
    // Écouter l'événement personnalisé pour rafraîchir la liste
    const handleRefresh = () => {
      console.log('📊 Rafraîchissement de la liste des opérations')
      loadOperations()
    }
    
    window.addEventListener('operations-updated', handleRefresh)
    
    return () => {
      window.removeEventListener('operations-updated', handleRefresh)
    }
  }, [])
  
  // Fonction de suppression
  const deleteOperation = async (operationId: string) => {
    try {
      console.log('🗑️ Suppression opération:', operationId)
      await TauriClient.deleteOperation(operationId)
      await loadOperations() // Recharger après suppression
      console.log('✅ Opération supprimée:', operationId)
    } catch (err) {
      console.error('❌ Erreur suppression opération:', err)
      throw err
    }
  }
  
  // Formatage des montants
  const formatCurrency = (cents: number): string => {
    return (cents / 100).toFixed(2) + ' €'
  }
  
  // Formatage des dates
  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('fr-FR')
  }
  
  // Filtrage et tri des opérations
  const filteredAndSortedOperations = useMemo(() => {
    let filtered = [...(operations || [])]
    
    // Filtrage par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(op => 
        op.libelle?.toLowerCase().includes(term) ||
        op.id.toLowerCase().includes(term)
      )
    }
    
    // Filtrage par sens
    if (filterSens !== 'all') {
      filtered = filtered.filter(op => op.sens === filterSens)
    }
    
    // Tri
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortField) {
        case 'date':
          aVal = new Date(a.date_facture).getTime()
          bVal = new Date(b.date_facture).getTime()
          break
        case 'amount_ht':
          aVal = a.montant_ht_cents
          bVal = b.montant_ht_cents
          break
        case 'sens':
          aVal = a.sens
          bVal = b.sens
          break
        case 'libelle':
          aVal = a.libelle || ''
          bVal = b.libelle || ''
          break
        default:
          return 0
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
    
    return filtered
  }, [operations, searchTerm, filterSens, sortField, sortOrder])
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }
  
  const handleDelete = async (operationId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) {
      try {
        await deleteOperation(operationId)
      } catch (err) {
        alert('Erreur lors de la suppression')
      }
    }
  }
  
  const handleOpenFile = async (fileUrl: string) => {
    try {
      console.log('🔗 Ouverture du fichier:', fileUrl)
      
      // Utiliser notre commande Tauri personnalisée
      await invoke('cmd_open_url', { url: fileUrl })
      console.log('✅ Fichier ouvert avec Tauri')
    } catch (error) {
      console.error('❌ Erreur ouverture fichier:', error)
      alert('Impossible d\'ouvrir le fichier: ' + (error instanceof Error ? error.message : 'Erreur inconnue'))
    }
  }
  
  const getSensColor = (sens: 'vente' | 'achat') => {
    return sens === 'vente' 
      ? 'text-green-400 bg-green-900/20'
      : 'text-orange-400 bg-orange-900/20'
  }
  
  const getSensIcon = (sens: 'vente' | 'achat') => {
    return sens === 'vente' ? '↗' : '↙'
  }
  
  if (isLoading) {
    return (
      <Card className="bg-dark-800 border-dark-700">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-dark-300">Chargement des opérations...</p>
        </div>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card className="bg-dark-800 border-dark-700">
        <div className="p-6">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <p className="text-red-200">Erreur : {error}</p>
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="bg-dark-800 border-dark-700">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-dark-100">
            Opérations ({operations?.length || 0})
          </h3>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dark-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-600 rounded-lg text-dark-100 placeholder-dark-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Type filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-dark-400" />
              <select
                value={filterSens}
                onChange={(e) => setFilterSens(e.target.value as FilterSens)}
                className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-dark-100 focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tous</option>
                <option value="vente">Ventes</option>
                <option value="achat">Achats</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Operations Table */}
        {filteredAndSortedOperations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left py-3 px-2">
                    <button
                      onClick={() => handleSort('sens')}
                      className="flex items-center text-dark-200 hover:text-dark-100 font-medium"
                    >
                      Type
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-2">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center text-dark-200 hover:text-dark-100 font-medium"
                    >
                      Date
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-2">
                    <button
                      onClick={() => handleSort('libelle')}
                      className="flex items-center text-dark-200 hover:text-dark-100 font-medium"
                    >
                      Description
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-2">
                    <button
                      onClick={() => handleSort('amount_ht')}
                      className="flex items-center justify-end text-dark-200 hover:text-dark-100 font-medium w-full"
                    >
                      Montant HT
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </button>
                  </th>
                  <th className="text-right py-3 px-2">
                    <span className="text-dark-200 font-medium">TVA</span>
                  </th>
                  <th className="text-right py-3 px-2">
                    <span className="text-dark-200 font-medium">TTC</span>
                  </th>
                  <th className="text-center py-3 px-2">
                    <span className="text-dark-200 font-medium">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedOperations.map((operation) => (
                  <tr key={operation.id} className="border-b border-dark-800 hover:bg-dark-900/50">
                    <td className="py-3 px-2">
                      <span className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        getSensColor(operation.sens)
                      )}>
                        <span className="mr-1">{getSensIcon(operation.sens)}</span>
                        {operation.sens === 'vente' ? 'Vente' : 'Achat'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-dark-200">
                      <div>
                        <div className="font-medium">{formatDate(operation.date_facture)}</div>
                        {operation.date_encaissement && (
                          <div className="text-xs text-dark-400">
                            Enc: {formatDate(operation.date_encaissement)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-dark-200">
                      <div>
                        <div>{operation.libelle || 'Sans libellé'}</div>
                        {operation.tva_sur_encaissements && (
                          <div className="text-xs text-blue-400">TVA sur encaissements</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-dark-100 font-medium">
                      {formatCurrency(operation.montant_ht_cents)}
                    </td>
                    <td className="py-3 px-2 text-right text-dark-200">
                      <div>
                        <div>{formatCurrency(operation.montant_tva_cents)}</div>
                        <div className="text-xs text-dark-400">20%</div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right text-dark-100 font-medium">
                      {formatCurrency(operation.montant_ttc_cents)}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center space-x-2">
                        {operation.justificatif_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenFile(operation.justificatif_url!)}
                            className="p-1 text-blue-400 hover:text-blue-300"
                            title="Ouvrir le justificatif"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 text-dark-400 hover:text-dark-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(operation.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-dark-400 mb-4">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>Aucune opération trouvée</p>
            </div>
            {searchTerm || filterSens !== 'all' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('')
                  setFilterSens('all')
                }}
                className="bg-dark-700 hover:bg-dark-600 text-dark-200"
              >
                Effacer les filtres
              </Button>
            ) : (
              <p className="text-dark-500 text-sm">
                Utilisez le formulaire ci-dessus pour ajouter des opérations
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}