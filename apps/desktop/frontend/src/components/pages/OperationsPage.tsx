/**
 * Page unifiée pour la gestion des opérations (ventes + achats)
 * Version simplifiée avec saisie rapide au clavier
 */

import React, { useState, useEffect } from 'react'
import { CompactOperationForm, OperationsList } from '../operations'
import { Card } from '../ui/Card'
import { TrendingUp, Zap, List, ArrowLeftRight } from 'lucide-react'
import { useOperations } from '../../stores/useAppStore'

export const OperationsPage: React.FC = () => {
  const { operations, ventes, achats, isLoading, error, loadOperations } = useOperations()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  // Chargement initial
  useEffect(() => {
    loadOperations()
  }, [refreshTrigger, loadOperations])
  
  // Formatage des montants
  const formatCurrency = (cents: number): string => {
    return (cents / 100).toFixed(2) + ' €'
  }
  
  // Statistiques rapides
  const stats = {
    totalOperations: operations?.length || 0,
    totalVentes: ventes?.length || 0,
    totalAchats: achats?.length || 0,
    totalVentesHt: ventes?.reduce((sum, op) => sum + op.montant_ht, 0) || 0,
    totalAchatsHt: achats?.reduce((sum, op) => sum + op.montant_ht, 0) || 0,
    totalTva: operations?.reduce((sum, op) => sum + op.tva_cents, 0) || 0
  }
  
  const handleOperationAdded = () => {
    // Déclencher un refresh de la liste
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 animate-fade-in">
      {/* Modern Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-slate-100 mb-2 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center mr-4">
                <ArrowLeftRight className="h-5 w-5 text-white" />
              </div>
              Toutes les opérations
            </h1>
            <p className="text-body text-slate-400">
              Gestion unifiée des ventes et achats avec calcul automatique TTC
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard métriques avec nouveau design */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Total Operations */}
        <div className="metric-card animate-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-slate-100 mb-1">{stats.totalOperations}</div>
              <div className="text-sm text-slate-400">Opérations totales</div>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <List className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        {/* Ventes */}
        <div className="metric-card animate-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1 font-mono">{formatCurrency(stats.totalVentesHt)}</div>
              <div className="text-sm text-slate-400">Ventes HT • {stats.totalVentes} opérations</div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        
        {/* Achats */}
        <div className="metric-card animate-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-400 mb-1 font-mono">{formatCurrency(stats.totalAchatsHt)}</div>
              <div className="text-sm text-slate-400">Achats HT • {stats.totalAchats} opérations</div>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
              <div className="text-red-400 text-xl font-bold">↓</div>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </div>
        
        {/* TVA */}
        <div className="metric-card animate-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-400 mb-1 font-mono">{formatCurrency(stats.totalTva)}</div>
              <div className="text-sm text-slate-400">TVA collectée</div>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <div className="text-orange-400 text-lg font-bold">%</div>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>

      {/* Formulaire de saisie rapide - COMPACT */}
      <CompactOperationForm onOperationAdded={handleOperationAdded} />

      {/* Liste des opérations */}
      <OperationsList />
    </div>
  )
}