
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language || (typeof window !== 'undefined' && window.localStorage.i18nextLng) || 'en';
  const isThai = currentLanguage.startsWith('th');

  return (
    <div className="flex items-center space-x-1">
      <Button
        onClick={() => changeLanguage('en')}
        variant={!isThai ? 'primary' : 'ghost'}
        size="sm"
        className={`px-2 py-1 ${!isThai ? 'font-bold' : ''}`}
        aria-pressed={!isThai}
      >
        EN
      </Button>
      <Button
        onClick={() => changeLanguage('th')}
        variant={isThai ? 'primary' : 'ghost'}
        size="sm"
        className={`px-2 py-1 ${isThai ? 'font-bold' : ''}`}
        aria-pressed={isThai}
      >
        TH
      </Button>
    </div>
  );
};
