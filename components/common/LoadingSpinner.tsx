import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string; // Can be a translation key or a direct string
  tMessageKey?: string; // Optional key for translation
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', message, tMessageKey }) => {
  const { t } = useTranslation();
  const displayMessage = tMessageKey ? t(tMessageKey) : (message || t('general.loading'));

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-20 w-20',
  };

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <svg
        className={`animate-spin text-blue-600 ${sizeClasses[size]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {displayMessage && <p className="mt-4 text-gray-600">{displayMessage}</p>}
    </div>
  );
};
