import React from 'react'
import { 
  LayoutDashboard, 
  FileText, 
  Receipt, 
  Calculator, 
  Building, 
  Settings, 
  TrendingUp,
  Calendar,
  ChevronDown,
  ArrowLeftRight,
  ClipboardList,
  CalendarDays
} from 'lucide-react'
import type { RouteKey, Period } from '../types'
import { useAppStore, useCurrentPeriod } from '../stores/useAppStore'
import { cn } from '../lib/utils'

const navigation = [
  { 
    key: 'dashboard' as RouteKey, 
    name: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Vue d\'ensemble'
  },
  { 
    key: 'operations' as RouteKey, 
    name: 'Opérations', 
    icon: ArrowLeftRight,
    description: 'Ventes et achats'
  },
  { 
    key: 'declaration' as RouteKey, 
    name: 'Déclaration Mensuelle', 
    icon: ClipboardList,
    description: 'TVA et URSSAF'
  },
  { 
    key: 'tax-annual' as RouteKey, 
    name: 'Déclaration d\'Impôts', 
    icon: Calendar,
    description: 'Déclaration annuelle'
  },
  { 
    key: 'yearly-planning' as RouteKey, 
    name: 'Planification Annuelle', 
    icon: CalendarDays,
    description: 'Planning et objectifs'
  },
  { 
    key: 'simulations' as RouteKey, 
    name: 'Simulations', 
    icon: TrendingUp,
    description: 'Projections financières'
  },
  { 
    key: 'vat' as RouteKey, 
    name: 'TVA', 
    icon: Calculator,
    description: 'Assistant TVA'
  },
  { 
    key: 'urssaf' as RouteKey, 
    name: 'URSSAF', 
    icon: Building,
    description: 'Cotisations sociales'
  },
  { 
    key: 'settings' as RouteKey, 
    name: 'Paramètres', 
    icon: Settings,
    description: 'Configuration'
  },
] as const

interface LayoutProps {
  children: React.ReactNode
  currentRoute?: RouteKey
  onNavigate?: (route: RouteKey) => void
}

// Sélecteur de période - Supprimé du sidebar principal
// Sera intégré uniquement dans la page "Déclaration Mensuelle"
const PeriodSelector: React.FC<{ showInSidebar?: boolean }> = ({ showInSidebar = false }) => {
  const currentPeriod = useCurrentPeriod()
  const { availablePeriods, setCurrentPeriod } = useAppStore()
  const [isOpen, setIsOpen] = React.useState(false)

  // Ne pas afficher dans la sidebar par défaut
  if (!showInSidebar) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 text-left bg-slate-800 hover:bg-slate-700 rounded-lg transition-all duration-200"
      >
        <Calendar className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-100">
          {currentPeriod.label}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 text-slate-400 transition-transform ml-auto",
          isOpen && "rotate-180"
        )} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-slate-850 border border-slate-700 rounded-lg shadow-floating max-h-64 overflow-y-auto">
            {availablePeriods.map((period) => (
              <button
                key={period.key}
                onClick={() => {
                  setCurrentPeriod(period)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm hover:bg-slate-700 transition-all duration-200 text-slate-200",
                  period.key === currentPeriod.key && "bg-blue-600/20 text-blue-400 border-r-2 border-blue-500"
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export const Layout: React.FC<LayoutProps> = ({ children, currentRoute = 'dashboard', onNavigate }) => {
  // Force dark mode on mount and ensure it stays
  React.useEffect(() => {
    document.documentElement.classList.add('dark')
    document.body.classList.add('dark')
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 animate-fade-in">
      {/* Modern Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 shadow-floating">
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">JLA</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-100">
                Cash Planner
              </h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item, index) => (
            <button
              key={item.key}
              onClick={() => onNavigate?.(item.key)}
              className={`w-full flex items-center px-3 py-2.5 text-left rounded-lg transition-all duration-200 group animate-in ${
                currentRoute === item.key
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <item.icon className={`h-5 w-5 mr-3 transition-colors ${
                currentRoute === item.key
                  ? 'text-blue-400'
                  : 'text-slate-400 group-hover:text-slate-300'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {item.name}
                </div>
                {item.description && (
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="text-center">
            <p className="text-xs text-slate-500">
              JLA Cash Planner v1.0
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Gestion financière freelance
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <div className="min-h-screen bg-slate-950">
          {children}
        </div>
      </div>
    </div>
  )
}