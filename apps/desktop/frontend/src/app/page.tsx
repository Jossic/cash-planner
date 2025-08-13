'use client'

import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface DashboardData {
  month: { year: number; month: number }
  encaissements_ht_cents: number
  tva_due_cents: number
  urssaf_due_cents: number
  disponible_cents: number
}

export default function HomePage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const now = new Date()
  const currentMonth = { year: now.getFullYear(), month: now.getMonth() + 1 }

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      const data = await invoke<DashboardData>('cmd_dashboard', {
        month: currentMonth.year,
        m: currentMonth.month
      })
      setDashboardData(data)
      setError(null)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement du dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-medium">Erreur</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button onClick={loadDashboard} className="mt-3 btn">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Mois: {currentMonth.year}-{String(currentMonth.month).padStart(2, '0')}
        </p>
      </header>

      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Encaissements HT</h3>
            <p className="text-2xl font-bold text-gray-900">
              {formatEuros(dashboardData.encaissements_ht_cents)}
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">TVA due</h3>
            <p className="text-2xl font-bold text-orange-600">
              {formatEuros(dashboardData.tva_due_cents)}
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">URSSAF due</h3>
            <p className="text-2xl font-bold text-orange-600">
              {formatEuros(dashboardData.urssaf_due_cents)}
            </p>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Disponible</h3>
            <p className={`text-2xl font-bold ${
              dashboardData.disponible_cents >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatEuros(dashboardData.disponible_cents)}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-blue-800 font-medium">🎉 Application fonctionnelle !</h3>
        <p className="text-blue-600 text-sm mt-1">
          JLA Cash Planner fonctionne maintenant avec Next.js + Tauri sans erreurs.
        </p>
      </div>
    </div>
  )
}