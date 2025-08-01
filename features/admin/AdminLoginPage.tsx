import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminLogin } from '../../services/adminService';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  FaShieldAlt, 
  FaUser, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaArrowRight,
  FaCog,
  FaChartBar,
  FaUsers,
  FaBox
} from 'react-icons/fa';

export const AdminLoginPage: React.FC = () => {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState({ email_or_username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminLogin(credentials);
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('isAdmin', 'true');
      auth.login(response.access_token, response.user, true);
      navigate(ROUTE_PATHS.ADMIN_DASHBOARD);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('adminLoginPage.loginFailedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const adminFeatures = [
    { icon: <FaUsers className="h-6 w-6" />, title: 'User Management', description: 'Manage user accounts and permissions' },
    { icon: <FaBox className="h-6 w-6" />, title: 'Product Oversight', description: 'Monitor and approve product listings' },
    { icon: <FaChartBar className="h-6 w-6" />, title: 'Analytics', description: 'View detailed reports and insights' },
    { icon: <FaCog className="h-6 w-6" />, title: 'System Control', description: 'Configure platform settings' },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardContent className="p-8">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                  <FaShieldAlt className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  {t('adminLoginPage.title')}
                </h1>
                <p className="text-blue-200 text-sm">
                  {t('adminLoginPage.subtitle')}
                </p>
              </motion.div>

              {/* Login Form */}
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <ErrorMessage 
                      message={error} 
                      onDismiss={() => setError(null)} 
                      title={t('adminLoginPage.errorTitle')} 
                    />
                  </motion.div>
                )}

                {/* Username/Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-200">
                    {t('adminLoginPage.emailOrUsernameLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      type="text"
                      name="email_or_username"
                      value={credentials.email_or_username}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('adminLoginPage.emailOrUsernamePlaceholder')}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-blue-200">
                    {t('adminLoginPage.passwordLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-blue-300" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={credentials.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder={t('adminLoginPage.passwordPlaceholder')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white transition-colors"
                    >
                      {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="pt-4"
                >
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    fullWidth
                    variant="primary"
                    size="lg"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-200"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <FaArrowRight className="h-5 w-5" />
                      )}
                      {t('adminLoginPage.signInButton')}
                    </span>
                  </Button>
                </motion.div>
              </motion.form>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Side - Features Preview */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-lg"
        >
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              Admin Dashboard
            </h2>
            <p className="text-blue-200 text-lg">
              Powerful tools to manage your platform
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {adminFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:bg-white/20 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-blue-200 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Decorative Elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="absolute bottom-1/4 right-1/3 w-24 h-24 bg-gradient-to-r from-purple-500/20 to-pink-600/20 rounded-full blur-2xl"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLoginPage;