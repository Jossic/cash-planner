import React from 'react'
import { Layout } from './components/Layout'
import DashboardPage from './components/pages/DashboardPage'
import EnhancedDashboardPage from './components/pages/EnhancedDashboardPage'
import { Dashboard } from './components/Dashboard'
import { OperationsPage } from './components/pages/OperationsPage'
import { InvoicesPage } from './components/pages/InvoicesPage'
import { ExpensesPage } from './components/pages/ExpensesPage'
import { VatPage } from './components/pages/VatPage'
import { UrssafPage } from './components/pages/UrssafPage'
import { SettingsPage } from './components/pages/SettingsPage'
import { SimulationsPage } from './components/pages/SimulationsPage'
import { DeclarationPage } from './components/pages/DeclarationPage'
import { TaxAnnualPage } from './components/pages/TaxAnnualPage'
import YearlyPlanningPage from './components/pages/YearlyPlanningPage'
import type { RouteKey } from './types'

function App() {
  const [currentRoute, setCurrentRoute] = React.useState<RouteKey>('dashboard')

  const handleNavigate = (route: RouteKey) => {
    setCurrentRoute(route)
  }

  const renderCurrentPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />
      case 'operations':
        return <OperationsPage />
      case 'declaration':
        return <DeclarationPage />
      case 'tax-annual':
        return <TaxAnnualPage />
      case 'yearly-planning':
        return <YearlyPlanningPage />
      case 'simulations':
        return <SimulationsPage />
      case 'invoices':
        return <InvoicesPage />
      case 'expenses':
        return <ExpensesPage />
      case 'vat':
        return <VatPage />
      case 'urssaf':
        return <UrssafPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <DashboardPage onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="App">
      <Layout currentRoute={currentRoute} onNavigate={handleNavigate}>
        {renderCurrentPage()}
      </Layout>
      
    </div>
  )
}

export default App