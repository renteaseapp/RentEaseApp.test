
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { login, LoginCredentials } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';

const LockClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
  </svg>
);

const MailIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
</svg>
);


export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState<LoginCredentials>({ email_or_username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user) {
      navigate(ROUTE_PATHS.HOME);
    }
  }, [auth.user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await login(credentials);
      auth.login(response.access_token, response.user, response.is_admin);
      navigate(ROUTE_PATHS.HOME);
    } catch (err) {
      const apiError = err as ApiError;
      // Check if the error message is a known key, otherwise use the message or a fallback
      const errorMessageKey = `apiErrors.${apiError.message}`; // Example mapping
      if (t(errorMessageKey) !== errorMessageKey) {
        setError(t(errorMessageKey));
      } else {
        setError(apiError.message || t('loginPage.loginFailedError'));
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
                {t('loginPage.title')}
              </h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />}
              <InputField
                label={t('loginPage.emailOrUsernameLabel')}
                id="email_or_username"
                name="email_or_username"
                type="text"
                autoComplete="username"
                required
                value={credentials.email_or_username}
                onChange={handleChange}
                placeholder={t('loginPage.emailOrUsernamePlaceholder')}
                icon={<MailIcon />}
              />
              <InputField
                label={t('loginPage.passwordLabel')}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={handleChange}
                placeholder={t('loginPage.passwordPlaceholder')}
                icon={<LockClosedIcon />}
              />

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <label htmlFor="remember-me" className="ml-2 block text-gray-900"> {t('loginPage.rememberMe')} </label>
                </div>
                <Link to={ROUTE_PATHS.FORGOT_PASSWORD} className="font-medium text-blue-600 hover:text-blue-500"> {t('loginPage.forgotPassword')} </Link>
              </div>

              <div>
                <Button type="submit" isLoading={isLoading} fullWidth variant="primary" size="lg">
                  {t('loginPage.signInButton')}
                </Button>
              </div>
            </form>
             <div className="mt-6">
                <p className="text-center text-sm text-gray-600">
                  {t('loginPage.notMember')}{' '}
                  <Link to={ROUTE_PATHS.REGISTER} className="font-medium text-blue-600 hover:text-blue-500">
                    {t('loginPage.createAccountLink')}
                  </Link>
                </p>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
