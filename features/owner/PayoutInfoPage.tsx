import React, { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { getOwnerPayoutMethods, addPayoutMethod, deletePayoutMethod, setPayoutMethodAsPrimary } from '../../services/ownerService';
import { PayoutMethod, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { InputField } from '../../components/ui/InputField';
import { useTranslation } from 'react-i18next';
import { THAI_BANKS, ROUTE_PATHS } from '../../constants';
import { Link } from 'react-router-dom';

type NewPayoutMethodData = Omit<PayoutMethod, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

export const PayoutInfoPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isSettingPrimary, setIsSettingPrimary] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMethodData, setNewMethodData] = useState<NewPayoutMethodData>({
      method_type: 'bank_account',
      account_name: '',
      account_number: '',
      bank_name: '',
      is_primary: false,
  });

  const fetchPayoutMethods = async () => {
      if (!user?.id) return;
      
      try {
          setIsLoading(true);
          setError(null);
          const methods = await getOwnerPayoutMethods(user.id);
          setPayoutMethods(methods);
      } catch (err) {
          const apiError = err as ApiError;
          setError(apiError.message || t('payoutInfoPage.error.loadFailed'));
          showError(apiError.message || t('payoutInfoPage.error.loadFailed'));
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchPayoutMethods();
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setNewMethodData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value,
      }));
  };

  const handleAddMethod = async (e: FormEvent) => {
      e.preventDefault();
      if (!user?.id) return;
      
      setIsAdding(true);
      setError(null);
      
      try {
          await addPayoutMethod(user.id, newMethodData);
          await fetchPayoutMethods(); // Refresh list
          setShowForm(false); // Hide form
          setNewMethodData({ 
              method_type: 'bank_account', 
              account_name: '', 
              account_number: '', 
              bank_name: '', 
              is_primary: false
          }); // Reset form
          showSuccess(t('payoutInfoPage.success.added'));
      } catch (err) {
          const apiError = err as ApiError;
          setError(apiError.message || t('payoutInfoPage.error.addFailed'));
          showError(apiError.message || t('payoutInfoPage.error.addFailed'));
      } finally {
          setIsAdding(false);
      }
  };

  const handleDeleteMethod = async (methodId: number, methodName: string) => {
      if (!user?.id) return;
      
      const confirmed = window.confirm(
          t('payoutInfoPage.deleteConfirmation', { name: methodName })
      );
      
      if (!confirmed) return;

      try {
          setIsDeleting(methodId);
          await deletePayoutMethod(methodId);
          await fetchPayoutMethods(); // Refresh list
          showSuccess(t('payoutInfoPage.success.deleted'));
      } catch (err) {
          const apiError = err as ApiError;
          showError(apiError.message || t('payoutInfoPage.error.deleteFailed'));
      } finally {
          setIsDeleting(null);
      }
  };

  const handleSetPrimary = async (methodId: number) => {
      if (!user?.id) return;

      try {
          setIsSettingPrimary(methodId);
          await setPayoutMethodAsPrimary(methodId);
          await fetchPayoutMethods(); // Refresh list
          showSuccess(t('payoutInfoPage.success.setPrimary'));
      } catch (err) {
          const apiError = err as ApiError;
          showError(apiError.message || t('payoutInfoPage.error.setPrimaryFailed'));
      } finally {
          setIsSettingPrimary(null);
      }
  };

  const getMethodTypeDisplay = (methodType: string) => {
      switch (methodType) {
          case 'bank_account':
              return t('payoutInfoPage.methodTypes.bankAccount');
          case 'promptpay':
              return t('payoutInfoPage.methodTypes.promptpay');
          default:
              return methodType.replace('_', ' ').toUpperCase();
      }
  };

  const getBankDisplayName = (bankName: string | null) => {
      if (!bankName) return '';
      
      const bank = THAI_BANKS.find(b => b.code === bankName || b.name === bankName || b.nameEn === bankName);
      if (bank) {
          return i18n.language === 'th' ? bank.name : bank.nameEn;
      }
      return bankName;
  };

  if (isLoading) return <LoadingSpinner message={t('payoutInfoPage.loading')} />;
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('payoutInfoPage.title')}</h1>
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="mb-6">
          <Button 
              onClick={() => setShowForm(prev => !prev)} 
              variant={showForm ? "secondary" : "primary"}
          >
              {showForm ? t('payoutInfoPage.actions.cancelAdd') : t('payoutInfoPage.actions.addNew')}
          </Button>
      </div>

      {showForm && (
          <Card className="mb-8">
              <CardContent>
                  <h2 className="text-xl font-semibold mb-4">{t('payoutInfoPage.addNewMethod')}</h2>
                  <form onSubmit={handleAddMethod} className="space-y-4">
                      <div>
                          <label htmlFor="method_type" className="block text-sm font-medium text-gray-700 mb-1">
                              {t('payoutInfoPage.form.methodType')}
                          </label>
                          <select 
                              name="method_type" 
                              id="method_type" 
                              value={newMethodData.method_type} 
                              onChange={handleInputChange} 
                              className="block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                              <option value="bank_account">{t('payoutInfoPage.methodTypes.bankAccount')}</option>
                              <option value="promptpay">{t('payoutInfoPage.methodTypes.promptpay')}</option>
                          </select>
                      </div>
                      
                      <InputField 
                          label={t('payoutInfoPage.form.accountName')} 
                          name="account_name" 
                          value={newMethodData.account_name} 
                          onChange={handleInputChange} 
                          required 
                      />
                      
                      <InputField 
                          label={t('payoutInfoPage.form.accountNumber')} 
                          name="account_number" 
                          value={newMethodData.account_number} 
                          onChange={handleInputChange} 
                          required 
                      />
                      
                      {newMethodData.method_type === 'bank_account' && (
                        <div>
                          <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-1">
                              {t('payoutInfoPage.form.bankName')}
                          </label>
                          <select 
                              name="bank_name" 
                              id="bank_name" 
                              value={newMethodData.bank_name || ''} 
                              onChange={handleInputChange} 
                              className="block w-full p-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              required
                          >
                              <option value="">{t('payoutInfoPage.form.selectBank')}</option>
                              {THAI_BANKS.map(bank => (
                                  <option key={bank.code} value={bank.code}>
                                      {i18n.language === 'th' ? bank.name : bank.nameEn}
                                  </option>
                              ))}
                          </select>
                        </div>
                      )}
                      
                       <div className="flex items-center">
                          <input 
                              type="checkbox" 
                              id="is_primary" 
                              name="is_primary" 
                              checked={newMethodData.is_primary} 
                              onChange={handleInputChange} 
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-900">
                              {t('payoutInfoPage.form.setAsPrimary')}
                          </label>
                        </div>
                      
                      <Button type="submit" isLoading={isAdding}>
                          {t('payoutInfoPage.actions.addMethod')}
                      </Button>
                  </form>
              </CardContent>
          </Card>
      )}

      <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t('payoutInfoPage.yourMethods')}</h2>
      {payoutMethods.length > 0 ? (
        <div className="space-y-4">
          {payoutMethods.map(method => (
            <Card key={method.id} className={`border-2 ${method.is_primary ? 'border-blue-500' : 'border-transparent'}`}>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div className="flex-grow">
                    <h3 className="text-lg font-medium text-gray-800">
                      {method.account_name} 
                      {method.is_primary && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-2">
                          {t('payoutInfoPage.primary')}
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('payoutInfoPage.type')}: {getMethodTypeDisplay(method.method_type)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t('payoutInfoPage.account')}: ...{method.account_number.slice(-4)}
                    </p>
                    {method.bank_name && (
                      <p className="text-sm text-gray-600">
                        {t('payoutInfoPage.bank')}: {getBankDisplayName(method.bank_name)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {!method.is_primary && (
                      <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSetPrimary(method.id)}
                          isLoading={isSettingPrimary === method.id}
                      >
                          {t('payoutInfoPage.actions.setPrimary')}
                      </Button>
                    )}
                    <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => handleDeleteMethod(method.id, method.account_name)}
                        isLoading={isDeleting === method.id}
                    >
                        {t('payoutInfoPage.actions.delete')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('payoutInfoPage.noMethods.title')}
          </h3>
          <p className="text-gray-500 mb-4">
            {t('payoutInfoPage.noMethods.description')}
          </p>
          <Button onClick={() => setShowForm(true)} variant="primary">
            {t('payoutInfoPage.actions.addNew')}
          </Button>
        </div>
      )}

      <div className="mt-8">
        <Link to={ROUTE_PATHS.OWNER_DASHBOARD} className="text-blue-500">
          {t('payoutInfoPage.actions.backToDashboard')}
        </Link>
      </div>
    </div>
  );
};
