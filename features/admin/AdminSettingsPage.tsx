import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  FaCog, 
  FaSave, 
  FaUndo, 
  FaCheck, 
  FaTimes, 
  FaEdit,
  FaEye,
  FaEyeSlash,
  FaShieldAlt,
  FaDollarSign,
  FaClock,
  FaPercent,
  FaInfoCircle
} from 'react-icons/fa';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Textarea } from '../../components/ui/Textarea';
import { adminGetSystemSettings, adminUpdateSystemSettings } from '../../services/adminService';

interface SystemSetting {
  setting_key: string;
  setting_value: string;
  description: string;
  data_type: 'string' | 'integer' | 'float' | 'boolean' | 'json' | 'text';
  is_publicly_readable: boolean;
  is_encrypted: boolean;
  validation_rules?: string;
  created_at: string;
  updated_at: string;
  updated_by_admin_id?: number;
}

interface EditableSetting extends SystemSetting {
  isEditing: boolean;
  originalValue: string;
  newValue: string;
  error?: string;
}

const SettingCard: React.FC<{
  setting: EditableSetting;
  onEdit: (key: string) => void;
  onSave: (key: string) => void;
  onCancel: (key: string) => void;
  onValueChange: (key: string, value: string) => void;
}> = ({ setting, onEdit, onSave, onCancel, onValueChange }) => {
  const { t } = useTranslation('adminSettingsPage');
  
  const getIcon = (key: string) => {
    if (key.includes('fee') || key.includes('commission')) return <FaDollarSign className="h-5 w-5 text-green-500" />;
    if (key.includes('time') || key.includes('duration')) return <FaClock className="h-5 w-5 text-blue-500" />;
    if (key.includes('percentage') || key.includes('rate')) return <FaPercent className="h-5 w-5 text-purple-500" />;
    if (key.includes('security') || key.includes('encrypt')) return <FaShieldAlt className="h-5 w-5 text-red-500" />;
    return <FaCog className="h-5 w-5 text-gray-500" />;
  };

  const renderInput = () => {
    switch (setting.data_type) {
      case 'boolean':
        return (
          <select
            value={setting.newValue}
            onChange={(e) => onValueChange(setting.setting_key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'integer':
      case 'float':
        return (
          <InputField
            type="number"
            value={setting.newValue}
            onChange={(e) => onValueChange(setting.setting_key, e.target.value)}
            className="w-full"
          />
        );
      case 'text':
        return (
          <Textarea
            value={setting.newValue}
            onChange={(e) => onValueChange(setting.setting_key, e.target.value)}
            rows={3}
            className="w-full"
          />
        );
      default:
        return (
          <InputField
            type="text"
            value={setting.newValue}
            onChange={(e) => onValueChange(setting.setting_key, e.target.value)}
            className="w-full"
          />
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-gray-200 hover:border-blue-300 transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-50">
                {getIcon(setting.setting_key)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
                <p className="text-sm text-gray-600">{setting.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {setting.is_encrypted && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <FaShieldAlt className="h-3 w-3" />
                  <span>{t('encrypted')}</span>
                </div>
              )}
              {setting.is_publicly_readable && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <FaEye className="h-3 w-3" />
                  <span>{t('public')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {setting.isEditing ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('value')}
                  </label>
                  {renderInput()}
                  {setting.error && (
                    <p className="text-sm text-red-600 mt-1">{setting.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onSave(setting.setting_key)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    disabled={setting.newValue === setting.originalValue}
                  >
                    <FaCheck className="h-4 w-4" />
                    {t('save')}
                  </Button>
                  <Button
                    onClick={() => onCancel(setting.setting_key)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FaTimes className="h-4 w-4" />
                    {t('cancel')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('currentValue')}
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-800 font-mono">
                      {setting.is_encrypted ? '••••••••' : setting.setting_value}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {t('lastUpdated')}: {new Date(setting.updated_at).toLocaleString()}
                  </div>
                  <Button
                    onClick={() => onEdit(setting.setting_key)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FaEdit className="h-4 w-4" />
                    {t('edit')}
                  </Button>
                </div>
              </>
            )}
          </div>

          {setting.validation_rules && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <FaInfoCircle className="h-4 w-4" />
                <span>{t('validationRules')}: {setting.validation_rules}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const AdminSettingsPage: React.FC = () => {
  const { t } = useTranslation('adminSettingsPage');
  const [settings, setSettings] = useState<EditableSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminGetSystemSettings();
      const editableSettings: EditableSetting[] = response.settings.map((setting: SystemSetting) => ({
        ...setting,
        isEditing: false,
        originalValue: setting.setting_value,
        newValue: setting.setting_value,
      }));
      setSettings(editableSettings);
    } catch (err: any) {
      setError(err.message || t('errorLoadingSettings'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (key: string) => {
    setSettings(prev => prev.map(setting => 
      setting.setting_key === key 
        ? { ...setting, isEditing: true }
        : setting
    ));
  };

  const handleCancel = (key: string) => {
    setSettings(prev => prev.map(setting => 
      setting.setting_key === key 
        ? { 
            ...setting, 
            isEditing: false, 
            newValue: setting.originalValue,
            error: undefined
          }
        : setting
    ));
  };

  const handleValueChange = (key: string, value: string) => {
    setSettings(prev => prev.map(setting => 
      setting.setting_key === key 
        ? { ...setting, newValue: value, error: undefined }
        : setting
    ));
  };

  const validateSetting = (setting: EditableSetting): string | undefined => {
    if (!setting.validation_rules) return undefined;

    const rules = setting.validation_rules.split(',').map(rule => rule.trim());
    
    for (const rule of rules) {
      if (rule.startsWith('min:')) {
        const min = parseFloat(rule.split(':')[1]);
        const value = parseFloat(setting.newValue);
        if (isNaN(value) || value < min) {
          return t('validationMin', { min });
        }
      }
      if (rule.startsWith('max:')) {
        const max = parseFloat(rule.split(':')[1]);
        const value = parseFloat(setting.newValue);
        if (isNaN(value) || value > max) {
          return t('validationMax', { max });
        }
      }
      if (rule === 'required' && !setting.newValue.trim()) {
        return t('validationRequired');
      }
    }
    
    return undefined;
  };

  const handleSave = async (key: string) => {
    const setting = settings.find(s => s.setting_key === key);
    if (!setting) return;

    const error = validateSetting(setting);
    if (error) {
      setSettings(prev => prev.map(s => 
        s.setting_key === key ? { ...s, error } : s
      ));
      return;
    }

    try {
      setSaving(key);
      await adminUpdateSystemSettings({
        setting_key: key,
        setting_value: setting.newValue,
        description: setting.description,
        data_type: setting.data_type,
        is_publicly_readable: setting.is_publicly_readable,
        is_encrypted: setting.is_encrypted,
        validation_rules: setting.validation_rules
      });

      setSettings(prev => prev.map(s => 
        s.setting_key === key 
          ? { 
              ...s, 
              isEditing: false, 
              originalValue: setting.newValue,
              setting_value: setting.newValue,
              updated_at: new Date().toISOString()
            }
          : s
      ));
    } catch (err: any) {
      setSettings(prev => prev.map(s => 
        s.setting_key === key 
          ? { ...s, error: err.message || t('errorSaving') }
          : s
      ));
    } finally {
      setSaving(null);
    }
  };

  const handleResetAll = () => {
    setSettings(prev => prev.map(setting => ({
      ...setting,
      isEditing: false,
      newValue: setting.originalValue,
      error: undefined
    })));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">{t('loadingSettings')}</p>
          </motion.div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8 bg-white rounded-2xl shadow-lg"
          >
            <FaTimes className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 text-lg">{error}</p>
            <Button onClick={loadSettings} className="mt-4">
              {t('retry')}
            </Button>
          </motion.div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-4 md:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {t('title')}
                </h1>
                <p className="text-gray-600">
                  {t('subtitle')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleResetAll}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FaUndo className="h-4 w-4" />
                  {t('resetAll')}
                </Button>
                <Button
                  onClick={loadSettings}
                  className="flex items-center gap-2"
                >
                  <FaSave className="h-4 w-4" />
                  {t('refresh')}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {settings.map((setting, index) => (
              <SettingCard
                key={setting.setting_key}
                setting={setting}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onValueChange={handleValueChange}
              />
            ))}
          </div>

          {settings.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <FaCog className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">{t('noSettings')}</p>
            </motion.div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}; 