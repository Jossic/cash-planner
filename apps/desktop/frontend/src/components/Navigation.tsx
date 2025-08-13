'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/invoices', label: 'Encaissements' },
  { href: '/expenses', label: 'Dépenses' },
  { href: '/vat', label: 'TVA' },
  { href: '/urssaf', label: 'URSSAF' },
  { href: '/settings', label: 'Paramètres' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">JLA Cash Planner</h1>
            <span className="text-xs text-slate-400">Local-first • SQLite</span>
          </div>
          
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${
                  pathname === item.href 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="text-sm text-slate-400">
            {new Date().toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </header>
  )
}