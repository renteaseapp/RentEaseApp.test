import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
  showIcon?: boolean;
  className?: string;
}

const alertStyles = {
  success: {
    container: 'bg-green-50 border-l-4 border-green-400 text-green-800',
    icon: 'text-green-400',
    button: 'bg-green-100 text-green-500 hover:bg-green-200 focus:ring-green-400',
    iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
  },
  error: {
    container: 'bg-red-50 border-l-4 border-red-400 text-red-800',
    icon: 'text-red-400',
    button: 'bg-red-100 text-red-500 hover:bg-red-200 focus:ring-red-400',
    iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
  },
  warning: {
    container: 'bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800',
    icon: 'text-yellow-400',
    button: 'bg-yellow-100 text-yellow-500 hover:bg-yellow-200 focus:ring-yellow-400',
    iconPath: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
  },
  info: {
    container: 'bg-blue-50 border-l-4 border-blue-400 text-blue-800',
    icon: 'text-blue-400',
    button: 'bg-blue-100 text-blue-500 hover:bg-blue-200 focus:ring-blue-400',
    iconPath: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
  }
};

const defaultTitles = {
  success: 'Success',
  error: 'Error',
  warning: 'Warning',
  info: 'Information'
};

export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
  showIcon = true,
  className = ''
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const styles = alertStyles[type];
  const displayTitle = title || t(`alerts.${type}Title`, defaultTitles[type]);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDelay]);

  const handleDismiss = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        ${styles.container} 
        p-4 my-4 rounded-md shadow-sm
        transition-all duration-300 ease-in-out
        ${isAnimating ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        {showIcon && (
          <div className="flex-shrink-0 mr-3">
            <svg
              className={`h-5 w-5 ${styles.icon}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fillRule="evenodd" d={styles.iconPath} clipRule="evenodd" />
            </svg>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold mb-1">{displayTitle}</p>
          )}
          <p className="text-sm leading-relaxed">{message}</p>
        </div>

        {onDismiss && (
          <div className="flex-shrink-0 ml-3">
            <button
              onClick={handleDismiss}
              className={`
                ${styles.button}
                rounded-lg focus:ring-2 focus:ring-offset-2
                p-1.5 inline-flex h-8 w-8 items-center justify-center
                transition-colors duration-200
              `}
              aria-label={t('alerts.dismiss')}
              type="button"
            >
              <span className="sr-only">{t('alerts.dismiss')}</span>
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Convenience components for each alert type
export const SuccessAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="success" {...props} />
);

export const ErrorAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="error" {...props} />
);

export const WarningAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="warning" {...props} />
);

export const InfoAlert: React.FC<Omit<AlertProps, 'type'>> = (props) => (
  <Alert type="info" {...props} />
); 