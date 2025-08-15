import React from 'react';
import { Calendar, RefreshCw, TrendingUp, Users, FileText } from 'lucide-react';
import TreasuryTable from '../dashboard/TreasuryTable';
import { CashflowChart } from '../dashboard/CashflowChart';
import TaxProvisionsCard from '../dashboard/TaxProvisionsCard';
import AlertsPanel, { generateSampleAlerts } from '../dashboard/AlertsPanel';
import { useMultiPeriodDashboard, useCurrentPeriod, useAppStore } from '../../stores/useAppStore';
import type { MultiPeriodDashboardData, DashboardPeriodData, PeriodSelection } from '../../types/dashboard';
import type { RouteKey } from '../../types';

interface DashboardPageProps {
  onNavigate: (route: RouteKey) => void;
}

const formatCurrency = (amountInCents: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
};

const formatMonth = (monthId: string): string => {
  const [year, month] = monthId.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('fr-FR', { 
    month: 'long',
    year: 'numeric'
  });
};

// Sample data generator for demo
const generateSampleData = (): MultiPeriodDashboardData => {
  const periods: DashboardPeriodData[] = [];
  const now = new Date();
  
  // Generate 12 months of data
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthId = date.toISOString().slice(0, 7);
    
    // Generate realistic French freelancer data
    const baseRevenue = 3000 + (Math.random() - 0.5) * 1500; // 1500-4500 EUR
    const expenses = 500 + Math.random() * 400; // 500-900 EUR
    const vatRate = 0.2; // 20% VAT
    const urssafRate = 0.22; // 22% URSSAF
    
    const revenueInCents = Math.round(baseRevenue * 100);
    const expensesInCents = Math.round(expenses * 100);
    const vatDueInCents = Math.round(revenueInCents * vatRate);
    const urssafDueInCents = Math.round(revenueInCents * urssafRate);
    const availableInCents = revenueInCents - expensesInCents - vatDueInCents - urssafDueInCents;
    
    periods.push({
      monthId,
      revenue: revenueInCents,
      expenses: expensesInCents,
      vatDue: vatDueInCents,
      urssafDue: urssafDueInCents,
      available: availableInCents,
      invoicesCount: Math.floor(Math.random() * 8) + 2, // 2-10 invoices
      expensesCount: Math.floor(Math.random() * 15) + 5, // 5-20 expenses
    });
  }
  
  // Calculate yearly overview
  const totalRevenue = periods.reduce((sum, p) => sum + p.revenue, 0);
  const totalExpenses = periods.reduce((sum, p) => sum + p.expenses, 0);
  const totalVat = periods.reduce((sum, p) => sum + p.vatDue, 0);
  const totalUrssaf = periods.reduce((sum, p) => sum + p.urssafDue, 0);
  
  const yearlyOverview = {
    totalRevenue,
    totalExpenses,
    totalVat,
    totalUrssaf,
    averageMonthlyRevenue: totalRevenue / periods.length,
    growthRate: periods.length >= 2 ? 
      ((periods[periods.length - 1].revenue - periods[0].revenue) / periods[0].revenue) * 100 : 0
  };
  
  // Generate treasury projection
  const currentCash = periods[periods.length - 1].available;
  const projectedCash: { [month: string]: number } = {};
  
  // Project next 6 months based on average
  const avgRevenue = yearlyOverview.averageMonthlyRevenue;
  const avgExpenses = totalExpenses / periods.length;
  const avgVat = totalVat / periods.length;
  const avgUrssaf = totalUrssaf / periods.length;
  
  let cumulativeCash = currentCash;
  for (let i = 1; i <= 6; i++) {
    const futureDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = futureDate.toISOString().slice(0, 7);
    cumulativeCash += avgRevenue - avgExpenses - avgVat - avgUrssaf;
    projectedCash[monthKey] = cumulativeCash;
  }
  
  const treasuryProjection = {
    currentCash,
    projectedCash,
    confidence: 'medium' as const,
    assumptionsUsed: [
      'Revenus basés sur la moyenne des 12 derniers mois',
      'Charges constantes',
      'Taux de TVA et URSSAF actuels'
    ]
  };
  
  // Generate alerts
  const currentPeriodSample = periods[periods.length - 1];
  const alerts = generateSampleAlerts({
    monthId: currentPeriodSample.monthId,
    vatDue: currentPeriodSample.vatDue,
    urssafDue: currentPeriodSample.urssafDue,
    available: currentPeriodSample.available
  });
  
  return {
    periods,
    yearlyOverview,
    treasuryProjection,
    alerts
  };
};

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [periodSelection, setPeriodSelection] = React.useState<PeriodSelection>({
    current: new Date().toISOString().slice(0, 7),
    range: 'month'
  });
  
  const currentPeriod = useCurrentPeriod();
  const { selectedPeriods, setSelectedPeriods, getDashboardData } = useMultiPeriodDashboard();
  const { loadOperationsForPeriod } = useAppStore((state) => ({ 
    loadOperationsForPeriod: state.loadOperationsForPeriod
  }));
  
  // Generate period list for the last 12 months
  const periods = React.useMemo(() => {
    const now = new Date();
    const periodList = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      periodList.push(periodKey);
    }
    return periodList;
  }, []);
  
  // Initialize selected periods if empty
  React.useEffect(() => {
    if (selectedPeriods.length === 0) {
      setSelectedPeriods(periods);
    }
  }, [periods, selectedPeriods.length, setSelectedPeriods]);
  
  // Load operations data for all selected periods
  React.useEffect(() => {
    const loadAllOperations = async () => {
      if (selectedPeriods.length === 0) return;
      
      try {
        // Load operations for all selected periods
        await Promise.all(
          selectedPeriods.map(period => loadOperationsForPeriod(period))
        );
        console.log('✅ Operations loaded for all periods');
      } catch (error) {
        console.error('❌ Error loading operations:', error);
      }
    };
    
    loadAllOperations();
  }, [selectedPeriods, loadOperationsForPeriod]);
  
  // Get real dashboard data from the store
  const dashboardData = React.useMemo(() => {
    if (selectedPeriods.length === 0) {
      console.log('⚠️ Aucune période sélectionnée');
      return generateSampleData(); // Fallback to sample data
    }
    
    try {
      console.log('🔄 Chargement des données pour périodes:', selectedPeriods);
      const realData = getDashboardData(selectedPeriods);
      console.log('📊 Dashboard data loaded:', realData);
      
      // Vérifier si nous avons des données réelles par période
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      selectedPeriods.forEach(periodKey => {
        const periodData = realData.period_data?.[periodKey];
        if (periodData) {
          totalRevenue += periodData.encaissements_ht_cents || 0;
          totalExpenses += periodData.depenses_ttc_cents || 0;
        }
      });
      
      console.log('💰 Total revenue found:', totalRevenue, 'Total expenses:', totalExpenses);
      
      // Toujours utiliser les vraies données, même si elles sont à zéro
      const dashboardPeriods: DashboardPeriodData[] = selectedPeriods.map(periodKey => {
        const periodData = realData.period_data?.[periodKey] || {
          encaissements_ht_cents: 0,
          depenses_ttc_cents: 0,
          tva_due_cents: 0,
          urssaf_due_cents: 0,
          disponible_cents: 0,
          ventes_count: 0,
          achats_count: 0
        };
        
        console.log(`📅 Données pour ${periodKey}:`, periodData);
        
        return {
          monthId: periodKey,
          revenue: periodData.encaissements_ht_cents,
          expenses: periodData.depenses_ttc_cents,
          vatDue: periodData.tva_due_cents,
          urssafDue: periodData.urssaf_due_cents,
          available: periodData.disponible_cents,
          invoicesCount: periodData.ventes_count || 0,
          expensesCount: periodData.achats_count || 0,
        };
      });
      
      const result = {
        periods: dashboardPeriods,
        yearlyOverview: {
          totalRevenue: realData.yearly_summary?.total_revenue_cents || totalRevenue,
          totalExpenses: realData.yearly_summary?.total_expenses_cents || totalExpenses,
          totalVat: realData.yearly_summary?.total_vat_paid_cents || 0,
          totalUrssaf: realData.yearly_summary?.total_urssaf_paid_cents || 0,
          averageMonthlyRevenue: realData.yearly_summary?.average_monthly_revenue_cents || 0,
          growthRate: realData.yearly_summary?.growth_rate || 0
        },
        treasuryProjection: realData.treasury_projection || { currentCash: 0, projectedCash: {}, confidence: 'low' },
        alerts: realData.alerts || []
      } as MultiPeriodDashboardData;
      
      console.log('✅ Dashboard data final:', result);
      return result;
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      // En cas d'erreur, retourner des données vides plutôt que des données fictives
      return {
        periods: selectedPeriods.map(periodKey => ({
          monthId: periodKey,
          revenue: 0,
          expenses: 0,
          vatDue: 0,
          urssafDue: 0,
          available: 0,
          invoicesCount: 0,
          expensesCount: 0,
        })),
        yearlyOverview: {
          totalRevenue: 0,
          totalExpenses: 0,
          totalVat: 0,
          totalUrssaf: 0,
          averageMonthlyRevenue: 0,
          growthRate: 0
        },
        treasuryProjection: { currentCash: 0, projectedCash: {}, confidence: 'low' },
        alerts: []
      } as MultiPeriodDashboardData;
    }
  }, [selectedPeriods, getDashboardData]);
  
  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };
  
  const currentPeriodData = dashboardData.periods[dashboardData.periods.length - 1];
  const previousPeriodData = dashboardData.periods[dashboardData.periods.length - 2];
  
  // Calculate period-over-period changes
  const revenueChange = previousPeriodData ? 
    ((currentPeriodData.revenue - previousPeriodData.revenue) / previousPeriodData.revenue) * 100 : 0;
  
  const availableChange = previousPeriodData ? 
    ((currentPeriodData.available - previousPeriodData.available) / Math.abs(previousPeriodData.available || 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 p-8 space-y-6 animate-fade-in">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-slate-100 mb-2 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Dashboard CFO
          </h1>
          <p className="text-body text-slate-400 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatMonth(currentPeriodData.monthId)}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn btn-outline"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => onNavigate('operations')}
            className="btn btn-success"
          >
            <FileText className="h-4 w-4" />
            Nouvelle opération
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="metric-card animate-in" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400 mb-1">CA du mois</div>
              <div className="text-2xl font-bold text-green-400 mb-1 font-mono">
                {formatCurrency(currentPeriodData.revenue)}
              </div>
              <div className={`text-sm flex items-center gap-1 ${
                revenueChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className="h-4 w-4" />
                {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs mois dernier
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        {/* Available Cash */}
        <div className="metric-card animate-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400 mb-1">Disponible</div>
              <div className={`text-2xl font-bold mb-1 font-mono ${
                currentPeriodData.available >= 0 
                  ? 'text-blue-400' 
                  : 'text-red-400'
              }`}>
                {formatCurrency(currentPeriodData.available)}
              </div>
              <div className={`text-sm flex items-center gap-1 ${
                availableChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className="h-4 w-4" />
                {availableChange >= 0 ? '+' : ''}{availableChange.toFixed(1)}% vs mois dernier
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className={`h-1.5 rounded-full ${
              currentPeriodData.available >= 0 ? 'bg-blue-500' : 'bg-red-500'
            }`} style={{ width: '73%' }}></div>
          </div>
        </div>

        {/* TVA Due */}
        <div className="metric-card animate-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400 mb-1">TVA due</div>
              <div className="text-2xl font-bold text-orange-400 mb-1 font-mono">
                {formatCurrency(currentPeriodData.vatDue)}
              </div>
              <div className="text-sm text-slate-400">
                Déclaration le 12
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <div className="text-orange-400 text-lg font-bold">%</div>
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* URSSAF Due */}
        <div className="metric-card animate-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400 mb-1">URSSAF due</div>
              <div className="text-2xl font-bold text-blue-400 mb-1 font-mono">
                {formatCurrency(currentPeriodData.urssafDue)}
              </div>
              <div className="text-sm text-slate-400">
                Paiement le 5
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-3">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '55%' }}></div>
          </div>
        </div>
      </div>

      {/* Treasury Table */}
      <TreasuryTable periods={dashboardData.periods.slice(-6)} />

      {/* Charts and Provisions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <CashflowChart 
          periods={dashboardData.periods.slice(-12)} 
          className="xl:col-span-2" 
        />
        <TaxProvisionsCard currentPeriod={currentPeriod} />
      </div>

      {/* Alerts Panel */}
      <AlertsPanel alerts={dashboardData.alerts} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card hover:border-blue-500/50 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-1" 
             onClick={() => onNavigate('operations')}>
          <div className="card-content">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                <FileText className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-heading text-slate-200">Opérations</h3>
                <p className="text-small text-slate-400">{currentPeriodData.invoicesCount} ce mois</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card hover:border-purple-500/50 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-1" 
             onClick={() => onNavigate('simulations')}>
          <div className="card-content">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-heading text-slate-200">Simulations</h3>
                <p className="text-small text-slate-400">Projections</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card hover:border-orange-500/50 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-1" 
             onClick={() => onNavigate('vat')}>
          <div className="card-content">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mr-4">
                <div className="text-orange-400 text-lg font-bold">%</div>
              </div>
              <div>
                <h3 className="text-heading text-slate-200">TVA</h3>
                <p className="text-small text-slate-400">Assistant calcul</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card hover:border-blue-500/50 cursor-pointer transition-all duration-200 hover:shadow-elevated hover:-translate-y-1" 
             onClick={() => onNavigate('urssaf')}>
          <div className="card-content">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-heading text-slate-200">URSSAF</h3>
                <p className="text-small text-slate-400">Assistant calcul</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;