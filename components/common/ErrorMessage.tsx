import React from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorMessageProps {
  message: string | null | undefined;
  title?: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, title, onDismiss }) => {
  const { t } = useTranslation();
  const displayTitle = title || t('general.error');

  if (!message) return null;

  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-4 rounded-md" role="alert">
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-5h2V7h-2v6zm0 4h2v-2h-2v2z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold">{displayTitle}</p>
          <p className="text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-auto -mx-1.5 -my-1.5 bg-red-100 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex h-8 w-8" aria-label={t('alerts.dismiss')}>
            <span className="sr-only">{t('alerts.dismiss')}</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          </button>
        )}
      </div>
    </div>
  );
};
