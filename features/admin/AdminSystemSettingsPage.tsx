import React, { useEffect, useState, FormEvent } from 'react';
import { adminGetSystemSettings, adminUpdateSystemSettings } from '../../services/adminService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';

interface Setting {
  setting_key: string;
  setting_value: string;
  description?: string;
  data_type: string;
  is_publicly_readable?: boolean;
  is_encrypted?: boolean;
  validation_rules?: string;
}

export const AdminSystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    adminGetSystemSettings()
      .then(res => setSettings(res.settings))
      .catch((err: any) => setError(err.message || 'Failed to load system settings.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (index: number, field: keyof Setting, value: any) => {
    setSettings(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      for (const setting of settings) {
        await adminUpdateSystemSettings({ ...setting, updated_by_admin_id: 1 }); // TODO: ใช้ admin id จริงจาก context
      }
      setSuccessMessage('System settings updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading system settings..." />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 flex items-center gap-3">
        <svg className="h-8 w-8 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">System Settings</h1>
      </div>
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{successMessage}</div>}
      <Card className="border border-gray-100 shadow-xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {settings.map((setting, idx) => (
              <div key={setting.setting_key} className="border-b pb-4 mb-4">
                <InputField
                  label={`Key: ${setting.setting_key}`}
                  name="setting_value"
                  value={setting.setting_value}
                  onChange={e => handleChange(idx, 'setting_value', e.target.value)}
                />
                <InputField
                  label="Description"
                  name="description"
                  value={setting.description || ''}
                  onChange={e => handleChange(idx, 'description', e.target.value)}
                />
                <InputField
                  label="Data Type"
                  name="data_type"
                  value={setting.data_type}
                  onChange={e => handleChange(idx, 'data_type', e.target.value)}
                />
                {/* Add more fields as needed */}
              </div>
            ))}
            <Button type="submit" isLoading={isSubmitting} variant="primary" size="lg">
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
