import React from 'react';
import { Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { DashboardPeriodData } from '../../types/dashboard';

interface TaxProvision {
  type: 'VAT' | 'URSSAF';
  amount: number; // in cents
  dueDate: string; // ISO date string
  status: 'pending' | 'overdue' | 'paid';
  declarationDate?: string; // For VAT
}

interface TaxProvisionsCardProps {
  currentPeriod: DashboardPeriodData;
  provisions?: TaxProvision[];
  className?: string;
}

const formatCurrency = (amountInCents: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amountInCents / 100);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric',
    month: 'long'
  });
};

const getDaysUntilDue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getStatusIcon = (status: 'pending' | 'overdue' | 'paid') => {
  switch (status) {
    case 'paid':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'overdue':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'pending':
      return <Clock className="h-5 w-5 text-orange-500" />;
  }
};

const getStatusBadge = (status: 'pending' | 'overdue' | 'paid', daysUntilDue: number) => {
  if (status === 'paid') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
        Payé
      </span>
    );
  }
  
  if (status === 'overdue') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        En retard
      </span>
    );
  }
  
  if (daysUntilDue <= 7) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
        Urgent ({daysUntilDue}j)
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
      À venir ({daysUntilDue}j)
    </span>
  );
};

const TaxProvisionsCard: React.FC<TaxProvisionsCardProps> = ({ 
  currentPeriod, 
  provisions = [],
  className 
}) => {
  // Generate default provisions based on current period if none provided
  const defaultProvisions: TaxProvision[] = React.useMemo(() => {
    if (provisions.length > 0) return provisions;
    if (!currentPeriod || !currentPeriod.monthId) return [];
    
    const [year, month] = currentPeriod.monthId.split('-');
    const nextMonth = new Date(parseInt(year), parseInt(month), 1);
    
    return [
      {
        type: 'VAT',
        amount: currentPeriod.vatDue,
        dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 20).toISOString(), // 20th of next month
        declarationDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 12).toISOString(), // 12th of next month
        status: currentPeriod.vatDue > 0 ? 'pending' : 'paid'
      },
      {
        type: 'URSSAF',
        amount: currentPeriod.urssafDue,
        dueDate: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5).toISOString(), // 5th of next month
        status: currentPeriod.urssafDue > 0 ? 'pending' : 'paid'
      }
    ];
  }, [currentPeriod, provisions]);

  const totalDue = defaultProvisions.reduce((sum, provision) => 
    provision.status !== 'paid' ? sum + provision.amount : sum, 0
  );

  const urgentCount = defaultProvisions.filter(provision => {
    if (provision.status === 'paid') return false;
    const daysUntil = getDaysUntilDue(provision.dueDate);
    return daysUntil <= 7 || provision.status === 'overdue';
  }).length;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className || ''}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Provisions fiscales
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Échéances TVA & URSSAF
            </p>
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {urgentCount} échéance{urgentCount > 1 ? 's' : ''} urgente{urgentCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total à provisionner</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalDue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Disponible actuel</p>
            <p className={`text-xl font-bold ${
              currentPeriod.available >= totalDue 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatCurrency(currentPeriod.available)}
            </p>
          </div>
        </div>

        {/* Provisions list */}
        <div className="space-y-3">
          {defaultProvisions.map((provision, index) => {
            const daysUntilDue = getDaysUntilDue(provision.dueDate);
            
            return (
              <div 
                key={`${provision.type}-${index}`}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(provision.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {provision.type === 'VAT' ? 'TVA' : 'URSSAF'}
                      </p>
                      {getStatusBadge(provision.status, daysUntilDue)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {provision.type === 'VAT' && provision.declarationDate && (
                        <span>Déclaration {formatDate(provision.declarationDate)} • </span>
                      )}
                      <span>Paiement {formatDate(provision.dueDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${
                    provision.type === 'VAT' 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {formatCurrency(provision.amount)}
                  </p>
                  {provision.status === 'pending' && daysUntilDue < 0 && (
                    <p className="text-xs text-red-500">
                      Retard de {Math.abs(daysUntilDue)} jour{Math.abs(daysUntilDue) > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Provisionner
          </button>
          <button className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
            Calendrier fiscal
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaxProvisionsCard;