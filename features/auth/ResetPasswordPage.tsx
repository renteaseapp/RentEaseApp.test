
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { resetPassword, ResetPasswordPayload } from '../../services/authService';
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


export const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Omit<ResetPasswordPayload, 'token'>>({
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError(t('resetPasswordPage.invalidTokenError'));
    }
  }, [token, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError(t('resetPasswordPage.invalidTokenError'));
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: ResetPasswordPayload = { ...formData, token };
      const response = await resetPassword(payload);
      setSuccessMessage(t('resetPasswordPage.successMessage'));
      setTimeout(() => {
        navigate(ROUTE_PATHS.LOGIN);
      }, 3000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to reset password. Please try again.');
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
                {t('resetPasswordPage.title')}
              </h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {error && <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />}
              {successMessage && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-4 rounded-md shadow" role="alert">
                    <p className="font-bold">{t('general.success')}</p>
                    <p>{successMessage}</p>
                </div>
              )}

              {!successMessage && (
                <>
                  <InputField
                    label={t('resetPasswordPage.emailLabel')}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('resetPasswordPage.emailPlaceholder')}
                    icon={<MailIcon />}
                  />
                  <InputField
                    label={t('resetPasswordPage.newPasswordLabel')}
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={t('resetPasswordPage.newPasswordPlaceholder')}
                    icon={<LockClosedIcon />}
                  />
                  <InputField
                    label={t('resetPasswordPage.confirmNewPasswordLabel')}
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    required
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder={t('resetPasswordPage.newPasswordPlaceholder')}
                    icon={<LockClosedIcon />}
                  />
                  <div>
                    <Button type="submit" isLoading={isLoading} fullWidth variant="primary" size="lg" disabled={!token}>
                      {t('resetPasswordPage.resetPasswordButton')}
                    </Button>
                  </div>
                </>
              )}
            </form>
            {successMessage && (
                 <div className="mt-6">
                    <p className="text-center text-sm text-gray-600">
                        <Link to={ROUTE_PATHS.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
                        {t('resetPasswordPage.proceedToLoginLink')}
                        </Link>
                    </p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
