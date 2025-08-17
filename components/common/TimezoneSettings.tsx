import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaGlobe, FaClock, FaSave, FaUndo } from 'react-icons/fa';
import { 
  getTimezoneConfig, 
  setTimezoneConfig, 
  getAvailableTimezones, 
  getUserTimezone,
  initializeTimezone 
} from '../../utils/timezoneUtils';

interface TimezoneSettingsProps {
  onClose?: () => void;
  showAsModal?: boolean;
}

export const TimezoneSettings: React.FC<TimezoneSettingsProps> = ({ 
  onClose, 
  showAsModal = false 
}) => {
  const { t, i18n } = useTranslation();
  const [selectedTimezone, setSelectedTimezone] = useState('');
  const [selectedLocale, setSelectedLocale] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const timezones = getAvailableTimezones();
  const locales = [
    { value: 'en', label: 'English' },
    { value: 'th', label: 'ไทย' },
  ];

  useEffect(() => {
    const config = getTimezoneConfig();
    setSelectedTimezone(config.timezone);
    setSelectedLocale(config.locale);
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const newConfig = {
        timezone: selectedTimezone,
        locale: selectedLocale
      };

      setTimezoneConfig(newConfig);
      
      // Update i18n locale if it changed
      if (i18n.language !== selectedLocale) {
        await i18n.changeLanguage(selectedLocale);
      }

      // Reinitialize timezone
      initializeTimezone();

      setMessage({
        type: 'success',
        text: t('timezoneSettings.savedSuccessfully', 'Timezone settings saved successfully!')
      });

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
        if (onClose) onClose();
      }, 3000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: t('timezoneSettings.saveError', 'Failed to save timezone settings')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const detectedTimezone = getUserTimezone();
    const detectedLocale = navigator.language || 'en';
    
    setSelectedTimezone(detectedTimezone);
    setSelectedLocale(detectedLocale);
    
    setMessage({
      type: 'success',
      text: t('timezoneSettings.resetToDefault', 'Reset to detected settings')
    });
  };

  const handleCancel = () => {
    if (onClose) onClose();
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FaGlobe className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('timezoneSettings.title', 'Timezone Settings')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('timezoneSettings.description', 'Configure your local timezone and language preferences')}
          </p>
        </div>
      </div>

      {/* Timezone Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          <FaClock className="inline h-4 w-4 mr-2 text-gray-500" />
          {t('timezoneSettings.timezoneLabel', 'Timezone')}
        </label>
        <select
          value={selectedTimezone}
          onChange={(e) => setSelectedTimezone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {timezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          {t('timezoneSettings.timezoneHelp', 'This affects how dates and times are displayed throughout the application')}
        </p>
      </div>

      {/* Language Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {t('timezoneSettings.languageLabel', 'Language')}
        </label>
        <select
          value={selectedLocale}
          onChange={(e) => setSelectedLocale(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {locales.map((locale) => (
            <option key={locale.value} value={locale.value}>
              {locale.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500">
          {t('timezoneSettings.languageHelp', 'This affects the language of date formats and relative time displays')}
        </p>
      </div>

      {/* Current Time Display */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          {t('timezoneSettings.currentTime', 'Current Time')}
        </h4>
        <p className="text-lg font-mono text-gray-900">
          {new Date().toLocaleString(selectedLocale || 'en', {
            timeZone: selectedTimezone || 'Asia/Bangkok',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          })}
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaSave className="h-4 w-4" />
          {isLoading 
            ? t('timezoneSettings.saving', 'Saving...') 
            : t('timezoneSettings.save', 'Save Settings')
          }
        </button>
        
        <button
          onClick={handleReset}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          <FaUndo className="h-4 w-4" />
        </button>
        
        {showAsModal && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {t('timezoneSettings.cancel', 'Cancel')}
          </button>
        )}
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {content}
    </div>
  );
}; 