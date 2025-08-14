import React from 'react'
import { 
  Plus, 
  FileText, 
  Calculator, 
  Settings, 
  Download,
  TrendingUp 
} from 'lucide-react'
import { Button, Card, CardContent } from '../ui'
import type { MonthId } from '../../types'

interface QuickActionsProps {
  currentMonth: MonthId
  onNewDeclaration: () => void
  onNavigate: (route: string) => void
  className?: string
}

export const QuickActions: React.FC<QuickActionsProps> = ({ 
  currentMonth, 
  onNewDeclaration,
  onNavigate,
  className 
}) => {
  const actions = [
    {
      label: 'Nouvelle déclaration',
      description: 'Saisir vos données du mois',
      icon: Plus,
      action: onNewDeclaration,
      variant: 'default' as const,
      featured: true,
    },
    {
      label: 'Encaissements',
      description: 'Gérer vos factures',
      icon: FileText,
      action: () => onNavigate('invoices'),
      variant: 'outline' as const,
    },
    {
      label: 'Simulations',
      description: 'Calculer votre TJM optimal',
      icon: TrendingUp,
      action: () => onNavigate('simulations'),
      variant: 'outline' as const,
    },
    {
      label: 'Calculatrices',
      description: 'TVA et URSSAF',
      icon: Calculator,
      action: () => onNavigate('vat'),
      variant: 'outline' as const,
    },
    {
      label: 'Paramètres',
      description: 'Configurer l\'application',
      icon: Settings,
      action: () => onNavigate('settings'),
      variant: 'ghost' as const,
    },
    {
      label: 'Export',
      description: 'Télécharger vos données',
      icon: Download,
      action: () => {
        // TODO: Implement export functionality
        console.log('Export functionality to be implemented')
      },
      variant: 'ghost' as const,
    },
  ]

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Actions rapides
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon
            
            return (
              <Button
                key={action.label}
                variant={action.variant}
                size="default"
                onClick={action.action}
                className={`h-auto p-4 flex-col items-start text-left justify-start gap-2 ${
                  action.featured 
                    ? 'ring-2 ring-primary-500/20 bg-primary-50 hover:bg-primary-100 dark:bg-primary-900/20 dark:hover:bg-primary-900/30' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon className={`h-4 w-4 flex-shrink-0 ${
                    action.featured 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`} />
                  <span className="font-medium text-sm">{action.label}</span>
                </div>
                <p className="text-xs opacity-70 text-left">
                  {action.description}
                </p>
              </Button>
            )
          })}
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Période active: {currentMonth}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}