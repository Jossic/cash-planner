// Dashboard types for multi-period data and treasury projections

export interface DashboardPeriodData {
  monthId: string; // "2025-01"
  revenue: number; // in cents
  expenses: number; // in cents
  vatDue: number; // in cents
  urssafDue: number; // in cents
  available: number; // in cents
  invoicesCount: number;
  expensesCount: number;
}

export interface YearlySummary {
  totalRevenue: number; // in cents
  totalExpenses: number; // in cents
  totalVat: number; // in cents
  totalUrssaf: number; // in cents
  averageMonthlyRevenue: number; // in cents
  growthRate: number; // percentage
}

export interface TreasuryProjection {
  currentCash: number; // in cents
  projectedCash: { [month: string]: number }; // month -> amount in cents
  confidence: 'low' | 'medium' | 'high';
  assumptionsUsed: string[];
}

export interface DashboardAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  dueDate?: string; // ISO date string
  amount?: number; // in cents
  actionRequired?: boolean;
}

export interface MultiPeriodDashboardData {
  periods: DashboardPeriodData[];
  yearlyOverview: YearlySummary;
  treasuryProjection: TreasuryProjection;
  alerts: DashboardAlert[];
}

// Chart data types for recharts
export interface ChartDataPoint {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  cumulative?: number;
}

export interface TreasuryTableRow {
  month: string;
  revenue: number;
  expenses: number;
  vatDue: number;
  urssafDue: number;
  available: number;
  trend: 'up' | 'down' | 'stable';
}

// Period selection types
export interface PeriodSelection {
  current: string; // "2025-01"
  comparison?: string; // "2024-01" for year-over-year
  range: 'month' | 'quarter' | 'year';
}