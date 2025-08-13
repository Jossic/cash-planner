import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'JLA Cash Planner',
  description: 'Application de gestion de trésorerie pour freelances',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-50">
          <Navigation />
          <main className="container mx-auto px-4 py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}