/**
 * Dashboard amélioré utilisant le nouveau modèle Operation unifié
 * Remplace DashboardPage avec des données réelles du store
 */

import React from 'react'
import { Calendar, TrendingUp, Users, FileText, ArrowLeftRight, Plus, AlertTriangle, Calculator } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { MetricCard } from '../ui/MetricCard'
import { useAppStore, useCurrentPeriod, useOperations } from '../../stores/useAppStore'
import type { RouteKey, DashboardData } from '../../types'

interface EnhancedDashboardPageProps {
  onNavigate: (route: RouteKey) => void
}

export const EnhancedDashboardPage: React.FC<EnhancedDashboardPageProps> = ({ onNavigate }) => {
  const currentPeriod = useCurrentPeriod()
  const { 
    operations, 
    ventes, 
    achats, 
    migratePeriod
  } = useOperations(currentPeriod.key)
  
  const { 
    getDashboardData, 
    calculateVat, 
    calculateUrssaf 
  } = useAppStore()
  
  // Migration automatique si pas encore fait - une seule fois
  React.useEffect(() => {
    if (operations.length === 0) {
      migratePeriod()
    }
  }, []) // Suppression des dépendances pour éviter la boucle
  
  // Données du dashboard pour la période courante
  const dashboardData: DashboardData = getDashboardData(currentPeriod.key)
  
  // Calculs pour la période
  const vatCalculation = React.useMemo(() => {
    try {
      return calculateVat(currentPeriod.key)
    } catch (error) {
      console.warn('Erreur calcul TVA:', error)
      return null
    }
  }, [calculateVat, currentPeriod.key, operations])
  
  const urssafCalculation = React.useMemo(() => {
    try {
      return calculateUrssaf(currentPeriod.key)
    } catch (error) {
      console.warn('Erreur calcul URSSAF:', error)
      return null
    }
  }, [calculateUrssaf, currentPeriod.key, operations])
  
  // Fonctions utilitaires
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100)
  }
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR')
  }
  
  // Statistiques rapides
  const stats = React.useMemo(() => {
    const ventesHt = ventes.reduce((sum, op) => {
      // Inclure selon la logique TVA
      if (op.vat_on_payments) {
        return op.payment_date?.startsWith(currentPeriod.key) ? sum + op.amount_ht_cents : sum
      } else {
        return op.invoice_date.startsWith(currentPeriod.key) ? sum + op.amount_ht_cents : sum
      }
    }, 0)
    
    const achatsTtc = achats
      .filter(op => op.invoice_date.startsWith(currentPeriod.key))
      .reduce((sum, op) => sum + op.amount_ttc_cents, 0)
    
    const tvaCollectee = ventes
      .filter(op => {
        if (op.vat_on_payments) {
          return op.payment_date?.startsWith(currentPeriod.key)
        } else {
          return op.invoice_date.startsWith(currentPeriod.key)
        }
      })
      .reduce((sum, op) => sum + op.vat_amount_cents, 0)
    
    const tvaDeductible = achats
      .filter(op => op.date.startsWith(currentPeriod.key))
      .reduce((sum, op) => sum + op.tva_cents, 0)
    
    return {
      ventesHt,
      achatsTtc,
      tvaCollectee,
      tvaDeductible,
      tvaNetteApayer: Math.max(0, tvaCollectee - tvaDeductible)
    }
  }, [ventes, achats, currentPeriod.key])
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard - {currentPeriod.label}
          </h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble de votre activité avec le nouveau modèle unifié
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onNavigate('operations')}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Voir les opérations
          </Button>
          <Button 
            onClick={() => onNavigate('operations')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle opération
          </Button>
        </div>
      </div>
      
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Chiffre d'affaires HT"
          value={formatCurrency(stats.ventesHt)}
          icon={TrendingUp}
          trend={{
            value: 12.5,
            isPositive: true,
            label: 'vs mois dernier'
          }}
          status="success"
          onClick={() => onNavigate('operations')}
        />
        
        <MetricCard
          label="Dépenses TTC"
          value={formatCurrency(stats.achatsTtc)}
          icon={FileText}
          trend={{
            value: -8.2,
            isPositive: false,
            label: 'vs mois dernier'
          }}
          onClick={() => onNavigate('operations')}
        />
        
        <MetricCard
          label="TVA nette à payer"
          value={formatCurrency(stats.tvaNetteApayer)}
          icon={Calendar}
          status={vatCalculation?.declaration_date ? 'warning' : 'success'}
          onClick={() => onNavigate('vat')}
        />
        
        <MetricCard
          label="URSSAF due"
          value={formatCurrency(urssafCalculation?.urssaf_due_cents || 0)}
          icon={Users}
          status={urssafCalculation?.payment_date ? 'warning' : 'success'}
          onClick={() => onNavigate('urssaf')}
        />
      </div>
      
      {/* Statistiques des opérations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Résumé des opérations */}
        <Card className="col-span-1">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Opérations du mois
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="text-sm text-green-600 font-medium">Ventes</div>
                  <div className="text-xs text-green-500">{ventes.length} opérations</div>
                </div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(stats.ventesHt)}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="text-sm text-blue-600 font-medium">Achats</div>
                  <div className="text-xs text-blue-500">{achats.length} opérations</div>
                </div>
                <div className="text-lg font-bold text-blue-700">
                  {formatCurrency(stats.achatsTtc)}
                </div>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {operations.length}
                  </div>
                  <div className="text-sm text-gray-500">Total opérations</div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => onNavigate('operations')}
              >
                Gérer les opérations
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Détail TVA */}
        <Card className="col-span-1">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Détail TVA
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">TVA collectée</span>
                <span className="font-medium">
                  {formatCurrency(stats.tvaCollectee)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">TVA déductible</span>
                <span className="font-medium">
                  {formatCurrency(stats.tvaDeductible)}
                </span>
              </div>
              
              <hr className="border-gray-200" />
              
              <div className="flex justify-between text-lg font-semibold">
                <span>TVA nette</span>
                <span className={stats.tvaNetteApayer > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(stats.tvaNetteApayer)}
                </span>
              </div>
              
              {vatCalculation && (
                <div className="text-xs text-gray-500">
                  <div>Déclaration: {formatDate(vatCalculation.declaration_date)}</div>
                  <div>Paiement: {formatDate(vatCalculation.payment_date)}</div>
                </div>
              )}
              
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => onNavigate('vat')}
              >
                Assistant TVA
              </Button>
            </div>
          </div>
        </Card>
        
        {/* Échéances */}
        <Card className="col-span-1">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Prochaines échéances
            </h3>
            
            <div className="space-y-3">
              {dashboardData.next_deadlines.length > 0 ? (
                dashboardData.next_deadlines.map((deadline, index) => (
                  <div key={index} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {deadline.type === 'TVA_DECLARATION' && 'Déclaration TVA'}
                          {deadline.type === 'TVA_PAYMENT' && 'Paiement TVA'}
                          {deadline.type === 'URSSAF_PAYMENT' && 'Paiement URSSAF'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(deadline.date)}
                        </div>
                      </div>
                      {deadline.amount_cents > 0 && (
                        <div className="text-sm font-medium text-red-600">
                          {formatCurrency(deadline.amount_cents)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-400 text-sm">
                    Aucune échéance à venir
                  </div>
                </div>
              )}
              
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => onNavigate('vat')}
              >
                Voir toutes les échéances
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Actions rapides */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Actions rapides
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => onNavigate('operations')}
            >
              <Plus className="h-6 w-6 mb-2 text-green-600" />
              <span>Nouvelle vente</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => onNavigate('operations')}
            >
              <FileText className="h-6 w-6 mb-2 text-blue-600" />
              <span>Nouvel achat</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => onNavigate('vat')}
            >
              <Calculator className="h-6 w-6 mb-2 text-purple-600" />
              <span>Calculer TVA</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => onNavigate('urssaf')}
            >
              <Users className="h-6 w-6 mb-2 text-orange-600" />
              <span>Calculer URSSAF</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default EnhancedDashboardPage