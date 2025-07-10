
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { register, RegisterCredentials } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);
const MailIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
</svg>
);
const LockClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);
const PhoneIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
</svg>
);


export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '', email: '', password: '', password_confirmation: '',
    first_name: '', last_name: '', phone_number: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user) {
      navigate(ROUTE_PATHS.HOME);
    }
  }, [auth.user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors(prev => ({...prev, [e.target.name]: []}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    try {
      const response = await register(credentials);
      if (response.user && response.access_token) { // Auto-login
        auth.login(response.access_token, response.user, false);
        setSuccessMessage(t('registerPage.successMessageAutoLogin'));
        navigate(ROUTE_PATHS.HOME);
      } else if (response.message) { // Email verification needed
        setSuccessMessage(t('registerPage.successMessage'));
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessageKey = `apiErrors.${apiError.message}`; // Example mapping
      if (t(errorMessageKey) !== errorMessageKey) {
        setError(t(errorMessageKey));
      } else {
        setError(apiError.message || t('registerPage.registrationFailedError'));
      }
      if (apiError.errors) {
        setFieldErrors(apiError.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card className="shadow-2xl">
          <CardContent className="p-8 sm:p-10">
            <div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                {t('registerPage.title')}
              </h2>
            </div>
            <form className="mt-8 space-y-3" onSubmit={handleSubmit}>
              {error && !successMessage && <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />}
              {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-4 rounded-md" role="alert">
                    <p className="font-bold">{t('general.success')}</p>
                    <p>{successMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                <InputField label={t('registerPage.firstNameLabel')} name="first_name" type="text" required value={credentials.first_name} onChange={handleChange} placeholder={t('registerPage.firstNamePlaceholder')} error={fieldErrors.first_name?.join(', ')} />
                <InputField label={t('registerPage.lastNameLabel')} name="last_name" type="text" required value={credentials.last_name} onChange={handleChange} placeholder={t('registerPage.lastNamePlaceholder')} error={fieldErrors.last_name?.join(', ')} />
              </div>
              
              <InputField label={t('registerPage.usernameLabel')} name="username" type="text" required value={credentials.username} onChange={handleChange} placeholder={t('registerPage.usernamePlaceholder')} icon={<UserIcon />} error={fieldErrors.username?.join(', ')} />
              <InputField label={t('registerPage.emailLabel')} name="email" type="email" required value={credentials.email} onChange={handleChange} placeholder={t('registerPage.emailPlaceholder')} icon={<MailIcon />} error={fieldErrors.email?.join(', ')} />
              <InputField label={t('registerPage.passwordLabel')} name="password" type="password" required value={credentials.password} onChange={handleChange} placeholder={t('registerPage.passwordPlaceholder')} icon={<LockClosedIcon />} error={fieldErrors.password?.join(', ')} />
              <InputField label={t('registerPage.confirmPasswordLabel')} name="password_confirmation" type="password" required value={credentials.password_confirmation} onChange={handleChange} placeholder={t('registerPage.passwordPlaceholder')} icon={<LockClosedIcon />} error={fieldErrors.password_confirmation?.join(', ')} />
              <InputField label={t('registerPage.phoneLabel')} name="phone_number" type="tel" value={credentials.phone_number} onChange={handleChange} placeholder={t('registerPage.phonePlaceholder')} icon={<PhoneIcon />} error={fieldErrors.phone_number?.join(', ')} />
              
              <div>
                <Button type="submit" isLoading={isLoading} fullWidth variant="primary" size="lg" className="mt-4">
                  {t('registerPage.createAccountButton')}
                </Button>
              </div>
            </form>
            <div className="mt-6">
                <p className="text-center text-sm text-gray-600">
                  {t('registerPage.alreadyMember')}{' '}
                  <Link to={ROUTE_PATHS.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
                    {t('registerPage.signInLink')}
                  </Link>
                </p>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
