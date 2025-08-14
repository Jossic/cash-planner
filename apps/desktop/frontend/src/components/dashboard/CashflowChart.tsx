import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardPeriodData, ChartDataPoint } from '../../types/dashboard';

interface CashflowChartProps {
  periods: DashboardPeriodData[];
  className?: string;
  showProjection?: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value / 100);
};

const formatMonth = (monthId: string): string => {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { 
    month: 'short',
    year: '2-digit'
  });
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span>{' '}
            {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const CashflowChart: React.FC<CashflowChartProps> = ({ 
  periods, 
  className
}) => {
  // Transform data for chart
  const chartData: ChartDataPoint[] = [];
  let cumulativeSum = 0;
  
  periods.forEach((period) => {
    const profit = period.revenue - period.expenses - period.vatDue - period.urssafDue;
    cumulativeSum += profit;
    
    chartData.push({
      month: formatMonth(period.monthId),
      revenue: period.revenue,
      expenses: period.expenses + period.vatDue + period.urssafDue,
      profit,
      cumulative: cumulativeSum,
    });
  });

  // Calculate key metrics for display
  const totalRevenue = periods.reduce((sum, p) => sum + p.revenue, 0);
  const totalExpenses = periods.reduce((sum, p) => sum + p.expenses + p.vatDue + p.urssafDue, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const averageMonthly = periods.length > 0 ? totalRevenue / periods.length : 0;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className || ''}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Évolution de la trésorerie
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Revenus vs Charges avec cumul
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">CA total</p>
              <p className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Charges totales</p>
              <p className="font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Résultat</p>
              <p className={`font-semibold ${
                totalProfit >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(totalProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-gray-200 dark:stroke-gray-700" 
            />
            <XAxis 
              dataKey="month" 
              className="text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value)}
              className="text-gray-600 dark:text-gray-400"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* Revenue bars */}
            <Bar 
              dataKey="revenue" 
              name="Revenus"
              fill="#10b981"
              opacity={0.8}
            />
            
            {/* Expenses bars */}
            <Bar 
              dataKey="expenses" 
              name="Charges + Taxes"
              fill="#ef4444"
              opacity={0.8}
            />
            
            {/* Cumulative profit line */}
            <Line 
              type="monotone" 
              dataKey="cumulative" 
              name="Cumul"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Quick stats */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">CA mensuel moyen</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(averageMonthly)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Meilleur mois</p>
            <p className="font-semibold text-green-600 dark:text-green-400">
              {chartData.length > 0 ? formatCurrency(Math.max(...chartData.map(d => d.revenue))) : '0 €'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Marge moyenne</p>
            <p className="font-semibold text-blue-600 dark:text-blue-400">
              {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : '0%'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Tendance</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {chartData.length >= 2 && 
                chartData[chartData.length - 1]?.cumulative && 
                chartData[chartData.length - 2]?.cumulative &&
                chartData[chartData.length - 1].cumulative > chartData[chartData.length - 2].cumulative ? '📈' : '📉'} 
              {chartData.length >= 2 ? 'Positive' : 'Stable'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};