import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';

const MailIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
</svg>
);

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await forgotPassword(email);
      setSuccessMessage(response.data.message);
      setShowResetForm(true);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to send reset OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await resetPassword({
        email,
        otp,
        new_password: newPassword,
        new_password_confirmation: confirmPassword
      });
      setSuccessMessage(response.data.message);
      setTimeout(() => {
        window.location.href = ROUTE_PATHS.LOGIN;
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
                {t('forgotPasswordPage.title')}
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                {t('forgotPasswordPage.instruction')}
              </p>
            </div>
            {error && <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />}
            {successMessage && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-4 rounded-md shadow" role="alert">
                <p className="font-bold">{t('general.success')}</p>
                <p>{successMessage}</p>
              </div>
            )}
            
            {!showResetForm ? (
              <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
                <InputField
                  label={t('forgotPasswordPage.emailLabel')}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('forgotPasswordPage.emailPlaceholder')}
                  icon={<MailIcon />}
                />
                <div>
                  <Button type="submit" isLoading={isLoading} fullWidth variant="primary" size="lg">
                    {t('forgotPasswordPage.sendResetLinkButton')}
                  </Button>
                </div>
              </form>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                <InputField
                  label={t('forgotPasswordPage.otpLabel')}
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={t('forgotPasswordPage.otpPlaceholder')}
                />
                <InputField
                  label={t('forgotPasswordPage.newPasswordLabel')}
                  id="new_password"
                  name="new_password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('forgotPasswordPage.newPasswordPlaceholder')}
                />
                <InputField
                  label={t('forgotPasswordPage.confirmPasswordLabel')}
                  id="new_password_confirmation"
                  name="new_password_confirmation"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('forgotPasswordPage.confirmPasswordPlaceholder')}
                />
                <div>
                  <Button type="submit" isLoading={isLoading} fullWidth variant="primary" size="lg">
                    {t('forgotPasswordPage.resetPasswordButton')}
                  </Button>
                </div>
              </form>
            )}
            <div className="mt-6">
              <p className="text-center text-sm text-gray-600">
                {t('forgotPasswordPage.rememberPassword')}{' '}
                <Link to={ROUTE_PATHS.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
                  {t('forgotPasswordPage.signInLink')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
