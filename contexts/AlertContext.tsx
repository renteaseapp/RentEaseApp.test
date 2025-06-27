import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert, AlertType } from '../components/common/Alert';

interface AlertItem {
  id: string;
  type: AlertType;
  title?: string;
  message: string;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

interface AlertContextType {
  showAlert: (alert: Omit<AlertItem, 'id'>) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  clearAlerts: () => void;
  removeAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const generateId = () => `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showAlert = useCallback((alert: Omit<AlertItem, 'id'>) => {
    const newAlert: AlertItem = {
      ...alert,
      id: generateId(),
    };
    setAlerts(prev => [...prev, newAlert]);
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showAlert({ type: 'success', message, title, autoDismiss: true, autoDismissDelay: 4000 });
  }, [showAlert]);

  const showError = useCallback((message: string, title?: string) => {
    showAlert({ type: 'error', message, title, autoDismiss: false });
  }, [showAlert]);

  const showWarning = useCallback((message: string, title?: string) => {
    showAlert({ type: 'warning', message, title, autoDismiss: true, autoDismissDelay: 6000 });
  }, [showAlert]);

  const showInfo = useCallback((message: string, title?: string) => {
    showAlert({ type: 'info', message, title, autoDismiss: true, autoDismissDelay: 5000 });
  }, [showAlert]);

  const removeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const value: AlertContextType = {
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAlerts,
    removeAlert,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {/* Alert Container - Fixed position at top-right */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            type={alert.type}
            title={alert.title}
            message={alert.message}
            autoDismiss={alert.autoDismiss}
            autoDismissDelay={alert.autoDismissDelay}
            onDismiss={() => removeAlert(alert.id)}
            className="shadow-lg border-0"
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}; 