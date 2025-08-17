import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ResetPasswordPayload } from '../../services/authService';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaCheckCircle,
  FaShieldAlt,
  FaKey,
  FaArrowLeft,
  FaArrowRight,
  FaLockOpen,
  FaClock,
  FaCheckDouble
} from 'react-icons/fa';

export const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ResetPasswordPayload>({
    email: '',
    otp: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-white to-blue-50 pt-20">
      {/* Left Side - Feature Showcase */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-blue-700 p-12 flex-col justify-center"
      >
        <div className="max-w-md mx-auto text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                <FaShieldAlt className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">RentEase</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              {t('resetPasswordPage.welcomeMessage')}
            </h2>
            <p className="text-green-100 text-lg mb-8">
              {t('resetPasswordPage.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaKey className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('resetPasswordPage.features.secure')}</h3>
                <p className="text-green-100">{t('resetPasswordPage.features.secureDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaClock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('resetPasswordPage.features.temporary')}</h3>
                <p className="text-green-100">{t('resetPasswordPage.features.temporaryDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaCheckDouble className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('resetPasswordPage.features.verified')}</h3>
                <p className="text-green-100">{t('resetPasswordPage.features.verifiedDesc')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-6 rounded-xl bg-white/10 backdrop-blur-sm"
          >
            <h3 className="font-semibold text-lg mb-2">{t('resetPasswordPage.securityNote')}</h3>
            <p className="text-green-100">{t('resetPasswordPage.securityDescription')}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Password Reset Form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('resetPasswordPage.title')}
            </h2>
            <p className="text-gray-600">
              {t('resetPasswordPage.instruction')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />
                    </motion.div>
                  )}
                  
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mb-6"
                    >
                      <FaCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800">{t('general.success')}</p>
                        <p className="text-green-700 text-sm">{successMessage}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {!successMessage ? (
                    <motion.form
                      key="reset-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleSubmit}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('resetPasswordPage.emailLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder={t('resetPasswordPage.emailPlaceholder')}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          />
                          <FaEnvelope className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('resetPasswordPage.otpLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="otp"
                            value={formData.otp}
                            onChange={handleChange}
                            placeholder={t('resetPasswordPage.otpPlaceholder')}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          />
                          <FaLock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('resetPasswordPage.newPasswordLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            placeholder={t('resetPasswordPage.newPasswordPlaceholder')}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showNewPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('resetPasswordPage.confirmNewPasswordLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="new_password_confirmation"
                            value={formData.new_password_confirmation}
                            onChange={handleChange}
                            placeholder={t('resetPasswordPage.newPasswordPlaceholder')}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <motion.button
                        type="submit"
                        disabled={isLoading || !token}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            {t('resetPasswordPage.resetPasswordButton')}
                            <FaLockOpen className="h-4 w-4" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success-message"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="text-center space-y-6"
                    >
                      <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-green-100">
                          <FaCheckCircle className="h-12 w-12 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {t('resetPasswordPage.successTitle')}
                        </h3>
                        <p className="text-gray-600 mb-6">
                          {t('resetPasswordPage.successDescription')}
                        </p>
                        <Link 
                          to={ROUTE_PATHS.LOGIN} 
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          <FaArrowRight className="h-4 w-4" />
                          {t('resetPasswordPage.proceedToLoginLink')}
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8 text-center"
                  >
                    <p className="text-gray-600">
                      {t('resetPasswordPage.needHelp')}{' '}
                      <Link 
                        to={ROUTE_PATHS.LOGIN} 
                        className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center justify-center gap-1 mt-2"
                      >
                        <FaArrowLeft className="h-3 w-3" />
                        {t('resetPasswordPage.backToLogin')}
                      </Link>
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
