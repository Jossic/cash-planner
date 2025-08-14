import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { DashboardPeriodData, TreasuryTableRow } from '../../types/dashboard';

interface TreasuryTableProps {
  periods: DashboardPeriodData[];
  className?: string;
}

const formatCurrency = (amountInCents: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountInCents / 100);
};

const formatMonth = (monthId: string): string => {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { 
    month: 'short', 
    year: '2-digit' 
  });
};

const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
  const diff = current - previous;
  const threshold = Math.abs(current) * 0.05; // 5% threshold
  
  if (Math.abs(diff) < threshold) return 'stable';
  return diff > 0 ? 'up' : 'down';
};

const TrendIcon: React.FC<{ trend: 'up' | 'down' | 'stable' }> = ({ trend }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-400" />;
    case 'stable':
      return <Minus className="h-4 w-4 text-slate-400" />;
  }
};

const TreasuryTable: React.FC<TreasuryTableProps> = ({ periods, className }) => {
  // Transform periods to table rows with trend calculation
  const tableRows: TreasuryTableRow[] = periods.map((period, index) => {
    const previousPeriod = index > 0 ? periods[index - 1] : null;
    
    return {
      month: period.monthId,
      revenue: period.revenue,
      expenses: period.expenses,
      vatDue: period.vatDue,
      urssafDue: period.urssafDue,
      available: period.available,
      trend: previousPeriod 
        ? calculateTrend(period.available, previousPeriod.available)
        : 'stable'
    };
  });

  // Calculate totals
  const totals = periods.reduce(
    (acc, period) => ({
      revenue: acc.revenue + period.revenue,
      expenses: acc.expenses + period.expenses,
      vatDue: acc.vatDue + period.vatDue,
      urssafDue: acc.urssafDue + period.urssafDue,
      available: acc.available + period.available,
    }),
    { revenue: 0, expenses: 0, vatDue: 0, urssafDue: 0, available: 0 }
  );

  return (
    <div className={`card animate-in ${className || ''}`}>
      <div className="card-header">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <h3 className="card-title">Tableau de trésorerie</h3>
            <p className="card-description">Vue d'ensemble sur {periods.length} mois</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-slate-400 uppercase tracking-wider text-xs">
                Mois
              </th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 uppercase tracking-wider text-xs">
                CA HT
              </th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 uppercase tracking-wider text-xs">
                Charges
              </th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 uppercase tracking-wider text-xs">
                TVA due
              </th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 uppercase tracking-wider text-xs">
                URSSAF due
              </th>
              <th className="px-6 py-3 text-right font-medium text-slate-400 uppercase tracking-wider text-xs">
                Disponible
              </th>
              <th className="px-6 py-3 text-center font-medium text-slate-400 uppercase tracking-wider text-xs">
                Tendance
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {tableRows.map((row) => (
              <tr 
                key={row.month} 
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-slate-100">
                    {formatMonth(row.month)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="font-medium text-green-400 font-mono">
                    {formatCurrency(row.revenue)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-slate-100 font-mono">
                    {formatCurrency(row.expenses)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-orange-400 font-mono">
                    {formatCurrency(row.vatDue)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-blue-400 font-mono">
                    {formatCurrency(row.urssafDue)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span 
                    className={`font-semibold font-mono ${
                      row.available >= 0 
                        ? 'text-green-400' 
                        : 'text-red-400'
                    }`}
                  >
                    {formatCurrency(row.available)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <TrendIcon trend={row.trend} />
                </td>
              </tr>
            ))}
          </tbody>
          
          {/* Totals row */}
          <tfoot className="bg-slate-800 border-t-2 border-slate-600">
            <tr className="font-semibold">
              <td className="px-6 py-4 text-slate-100">
                Total
              </td>
              <td className="px-6 py-4 text-right text-green-400 font-mono">
                {formatCurrency(totals.revenue)}
              </td>
              <td className="px-6 py-4 text-right text-slate-100 font-mono">
                {formatCurrency(totals.expenses)}
              </td>
              <td className="px-6 py-4 text-right text-orange-400 font-mono">
                {formatCurrency(totals.vatDue)}
              </td>
              <td className="px-6 py-4 text-right text-blue-400 font-mono">
                {formatCurrency(totals.urssafDue)}
              </td>
              <td className="px-6 py-4 text-right">
                <span 
                  className={`font-bold font-mono ${
                    totals.available >= 0 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}
                >
                  {formatCurrency(totals.available)}
                </span>
              </td>
              <td className="px-6 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TreasuryTable;