import { createSignal, onMount, For } from 'solid-js'
import { invoke } from '@tauri-apps/api/core'

interface DashboardData {
  month: { year: number; month: number }
  encaissements_ht_cents: number
  tva_due_cents: number
  urssaf_due_cents: number
  disponible_cents: number
}

const navItems = [
  { href: '#dashboard', label: 'Dashboard', active: true },
  { href: '#invoices', label: 'Encaissements', active: false },
  { href: '#expenses', label: 'Dépenses', active: false },
  { href: '#vat', label: 'TVA', active: false },
  { href: '#urssaf', label: 'URSSAF', active: false },
  { href: '#settings', label: 'Paramètres', active: false },
]

function App() {
  const [dashboardData, setDashboardData] = createSignal<DashboardData | null>(null)
  const [loading, setLoading] = createSignal(true)
  const [error, setError] = createSignal<string | null>(null)

  const now = new Date()
  const currentMonth = { year: now.getFullYear(), month: now.getMonth() + 1 }

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await invoke<DashboardData>('cmd_dashboard', {
        month: currentMonth.year,
        m: currentMonth.month
      })
      setDashboardData(data)
    } catch (err) {
      console.error('Dashboard error:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const formatEuros = (cents: number) => {
    return (cents / 100).toFixed(2) + '€'
  }

  onMount(() => {
    loadDashboard()
  })

  return (
    <div class="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header Navigation */}
      <header class="bg-slate-900 text-white shadow-lg">
        <div class="container mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center space-x-4">
              <h1 class="text-xl font-bold">JLA Cash Planner</h1>
              <span class="text-xs text-slate-400">Local-first • SQLite • SolidJS</span>
            </div>
            
            <nav class="hidden md:flex space-x-1">
              <For each={navItems}>
                {(item) => (
                  <a
                    href={item.href}
                    class={`nav-link ${
                      item.active 
                        ? 'bg-slate-700 text-white' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </a>
                )}
              </For>
            </nav>

            <div class="text-sm text-slate-400">
              {new Date().toLocaleDateString('fr-FR', { 
                year: 'numeric', 
                month: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="container mx-auto px-4 py-6">
        <div class="space-y-6">
          <header class="border-b pb-4">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p class="text-gray-600 dark:text-gray-400">
              Mois: {currentMonth.year}-{String(currentMonth.month).padStart(2, '0')}
            </p>
          </header>

          {loading() && (
            <div class="flex items-center justify-center h-64">
              <div class="text-lg text-gray-600 dark:text-gray-400">
                Chargement du dashboard...
              </div>
            </div>
          )}

          {error() && (
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <h3 class="text-red-800 dark:text-red-300 font-medium">Erreur</h3>
              <p class="text-red-600 dark:text-red-400 text-sm mt-1">{error()}</p>
              <button 
                onClick={loadDashboard} 
                class="mt-3 btn"
              >
                Réessayer
              </button>
            </div>
          )}

          {dashboardData() && (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="card">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Encaissements HT
                </h3>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatEuros(dashboardData()!.encaissements_ht_cents)}
                </p>
              </div>

              <div class="card">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  TVA due
                </h3>
                <p class="text-2xl font-bold text-orange-600">
                  {formatEuros(dashboardData()!.tva_due_cents)}
                </p>
              </div>

              <div class="card">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  URSSAF due
                </h3>
                <p class="text-2xl font-bold text-orange-600">
                  {formatEuros(dashboardData()!.urssaf_due_cents)}
                </p>
              </div>

              <div class="card">
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Disponible
                </h3>
                <p class={`text-2xl font-bold ${
                  dashboardData()!.disponible_cents >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatEuros(dashboardData()!.disponible_cents)}
                </p>
              </div>
            </div>
          )}

          <div class="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
            <h3 class="text-green-800 dark:text-green-300 font-medium">
              🎉 Application SolidJS + Tauri fonctionnelle !
            </h3>
            <p class="text-green-600 dark:text-green-400 text-sm mt-1">
              JLA Cash Planner fonctionne maintenant avec SolidJS + Tauri, une stack moderne et performante.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App