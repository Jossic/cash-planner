import React from 'react';
import { AlertTriangle, Info, CheckCircle, X, Calendar, Euro } from 'lucide-react';
import type { DashboardAlert } from '../../types/dashboard';

interface AlertsPanelProps {
  alerts: DashboardAlert[];
  onDismissAlert?: (alertId: string) => void;
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
    month: 'long',
    year: 'numeric'
  });
};

const getAlertIcon = (type: DashboardAlert['type']) => {
  switch (type) {
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    case 'info':
      return <Info className="h-5 w-5 text-blue-500" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
  }
};

const getAlertStyles = (type: DashboardAlert['type']) => {
  switch (type) {
    case 'error':
      return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200';
    case 'warning':
      return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200';
    case 'info':
      return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200';
    case 'success':
      return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200';
  }
};

const AlertsPanel: React.FC<AlertsPanelProps> = ({ 
  alerts, 
  onDismissAlert,
  className 
}) => {
  // Sort alerts by priority (actionRequired first, then by type)
  const sortedAlerts = React.useMemo(() => {
    return [...alerts].sort((a, b) => {
      // Action required alerts first
      if (a.actionRequired && !b.actionRequired) return -1;
      if (!a.actionRequired && b.actionRequired) return 1;
      
      // Then by type priority
      const typePriority = { error: 0, warning: 1, info: 2, success: 3 };
      return typePriority[a.type] - typePriority[b.type];
    });
  }, [alerts]);

  const urgentAlertsCount = alerts.filter(alert => 
    alert.actionRequired || alert.type === 'error'
  ).length;

  if (alerts.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className || ''}`}>
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notifications
          </h3>
        </div>
        <div className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucune notification en attente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className || ''}`}>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Notifications
          </h3>
          <div className="flex items-center gap-2">
            {urgentAlertsCount > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {urgentAlertsCount} urgent{urgentAlertsCount > 1 ? 's' : ''}
              </span>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {alerts.length} notification{alerts.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="p-6 space-y-3">
          {sortedAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertStyles(alert.type)} ${
                alert.actionRequired ? 'ring-2 ring-offset-2 ring-current' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium">
                        {alert.title}
                        {alert.actionRequired && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-current/20">
                            Action requise
                          </span>
                        )}
                      </h4>
                      <p className="text-sm mt-1 opacity-90">
                        {alert.message}
                      </p>
                      
                      {/* Additional info */}
                      <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                        {alert.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Échéance: {formatDate(alert.dueDate)}</span>
                          </div>
                        )}
                        {alert.amount && (
                          <div className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            <span>{formatCurrency(alert.amount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {onDismissAlert && (
                      <button
                        onClick={() => onDismissAlert(alert.id)}
                        className="flex-shrink-0 p-1 rounded hover:bg-current/10 transition-colors"
                        title="Ignorer cette notification"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions for urgent alerts */}
      {urgentAlertsCount > 0 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
              Traiter urgent ({urgentAlertsCount})
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium">
              Tout marquer lu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sample alerts generator for demo purposes
export const generateSampleAlerts = (currentPeriod: { monthId: string; vatDue: number; urssafDue: number; available: number }): DashboardAlert[] => {
  const alerts: DashboardAlert[] = [];
  const [year, month] = currentPeriod.monthId.split('-');
  const nextMonth = new Date(parseInt(year), parseInt(month), 1);
  
  // VAT deadline alert
  if (currentPeriod.vatDue > 0) {
    const vatDueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 12);
    const daysUntilVat = Math.ceil((vatDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilVat <= 7) {
      alerts.push({
        id: 'vat-deadline',
        type: daysUntilVat <= 3 ? 'error' : 'warning',
        title: 'Déclaration TVA à faire',
        message: `La déclaration TVA doit être faite avant le ${vatDueDate.toLocaleDateString('fr-FR')}`,
        dueDate: vatDueDate.toISOString(),
        amount: currentPeriod.vatDue,
        actionRequired: daysUntilVat <= 3
      });
    }
  }
  
  // URSSAF deadline alert
  if (currentPeriod.urssafDue > 0) {
    const urssafDueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 5);
    const daysUntilUrssaf = Math.ceil((urssafDueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilUrssaf <= 7) {
      alerts.push({
        id: 'urssaf-deadline',
        type: daysUntilUrssaf <= 3 ? 'error' : 'warning',
        title: 'Paiement URSSAF à effectuer',
        message: `Le paiement URSSAF doit être effectué avant le ${urssafDueDate.toLocaleDateString('fr-FR')}`,
        dueDate: urssafDueDate.toISOString(),
        amount: currentPeriod.urssafDue,
        actionRequired: daysUntilUrssaf <= 3
      });
    }
  }
  
  // Cash flow alert
  if (currentPeriod.available < 0) {
    alerts.push({
      id: 'negative-cashflow',
      type: 'error',
      title: 'Trésorerie négative',
      message: 'Votre trésorerie disponible est négative. Vérifiez vos provisions.',
      amount: currentPeriod.available,
      actionRequired: true
    });
  } else if (currentPeriod.available < (currentPeriod.vatDue + currentPeriod.urssafDue)) {
    alerts.push({
      id: 'insufficient-provisions',
      type: 'warning',
      title: 'Provisions insuffisantes',
      message: 'Votre trésorerie disponible ne couvre pas entièrement les charges à venir.',
      amount: currentPeriod.available,
      actionRequired: false
    });
  }
  
  return alerts;
};

export default AlertsPanel;