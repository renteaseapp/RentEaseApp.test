import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

interface LanguageSwitcherProps {
  isDarkTheme?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ isDarkTheme = false }) => {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language || (typeof window !== 'undefined' && window.localStorage.i18nextLng) || 'en';
  const isThai = currentLanguage.startsWith('th');

  if (isDarkTheme) {
    return (
      <div className="flex items-center space-x-1">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
            !isThai 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          }`}
          aria-pressed={!isThai}
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage('th')}
          className={`px-2 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
            isThai 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
          }`}
          aria-pressed={isThai}
        >
          TH
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <Button
        onClick={() => changeLanguage('en')}
        variant={!isThai ? 'primary' : 'ghost'}
        size="sm"
        className={`px-2 py-1 ${!isThai ? 'font-bold' : ''}`}
        aria-pressed={!isThai}
      >
        {t('languageSwitcher.en')}
      </Button>
      <Button
        onClick={() => changeLanguage('th')}
        variant={isThai ? 'primary' : 'ghost'}
        size="sm"
        className={`px-2 py-1 ${isThai ? 'font-bold' : ''}`}
        aria-pressed={isThai}
      >
        {t('languageSwitcher.th')}
      </Button>
    </div>
  );
};
