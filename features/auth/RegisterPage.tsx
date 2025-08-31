
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { register, RegisterCredentials } from '../../services/authService';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GoogleLoginButton } from '../../components/common/GoogleLoginButton';
import googleAuthService from '../../services/googleAuthService';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaEye, 
  FaEyeSlash,
  FaCheckCircle,
  FaShieldAlt,
  FaUsers,
  FaRocket,
  FaArrowRight,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { OpenStreetMapPicker } from '../../components/common/OpenStreetMapPicker';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    username: '', email: '', password: '', password_confirmation: '',
    first_name: '', last_name: '', phone_number: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleGoogleLogin = async (response: any) => {
    setIsGoogleLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);
    
    try {
      // ดึงข้อมูลผู้ใช้จาก Google
      const googleUserInfo = await googleAuthService.getGoogleUserInfo(response.access_token);
      
      // ส่งข้อมูลไปยัง backend เพื่อ login/register
      const authResponse = await googleAuthService.authenticateWithGoogle(googleUserInfo);
      
      // Login เข้าระบบ
      auth.login(authResponse.access_token, authResponse.user, authResponse.is_admin);
      setSuccessMessage(t('registerPage.googleSuccessMessage'));
      navigate(ROUTE_PATHS.HOME);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessageKey = `apiErrors.${apiError.message}`;
      if (t(errorMessageKey) !== errorMessageKey) {
        setError(t(errorMessageKey));
      } else {
        setError(apiError.message || t('registerPage.googleRegistrationFailedError'));
      }
      if (apiError.errors) {
        setFieldErrors(apiError.errors);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error('Google registration error:', error);
    setError(t('registerPage.googleRegistrationFailedError'));
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20">
      {/* Left Side - Feature Showcase */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-center"
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
              {t('registerPage.welcomeMessage')}
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              {t('registerPage.subtitle')}
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
                <FaUsers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('registerPage.features.community')}</h3>
                <p className="text-blue-100">{t('registerPage.features.communityDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaShieldAlt className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('registerPage.features.secure')}</h3>
                <p className="text-blue-100">{t('registerPage.features.secureDesc')}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaRocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{t('registerPage.features.fast')}</h3>
                <p className="text-blue-100">{t('registerPage.features.fastDesc')}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-6 rounded-xl bg-white/10 backdrop-blur-sm"
          >
            <h3 className="font-semibold text-lg mb-2">{t('registerPage.joinCommunity')}</h3>
            <p className="text-blue-100">{t('registerPage.communityDescription')}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Registration Form */}
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
              {t('registerPage.title')}
            </h2>
            <p className="text-gray-600">
              {t('registerPage.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && !successMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />
                    </motion.div>
                  )}
                  
                  {successMessage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
                    >
                      <FaCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800">{t('general.success')}</p>
                        <p className="text-green-700 text-sm">{successMessage}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('registerPage.firstNameLabel')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="first_name"
                          value={credentials.first_name}
                          onChange={handleChange}
                          placeholder={t('registerPage.firstNamePlaceholder')}
                          required
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            fieldErrors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        <FaUser className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      {fieldErrors.first_name && (
                        <p className="text-red-500 text-sm">{fieldErrors.first_name.join(', ')}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('registerPage.lastNameLabel')}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="last_name"
                          value={credentials.last_name}
                          onChange={handleChange}
                          placeholder={t('registerPage.lastNamePlaceholder')}
                          required
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                            fieldErrors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        />
                        <FaUser className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      {fieldErrors.last_name && (
                        <p className="text-red-500 text-sm">{fieldErrors.last_name.join(', ')}</p>
                      )}
                    </div>
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('registerPage.usernameLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="username"
                        value={credentials.username}
                        onChange={handleChange}
                        placeholder={t('registerPage.usernamePlaceholder')}
                        required
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          fieldErrors.username ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <FaUser className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {fieldErrors.username && (
                      <p className="text-red-500 text-sm">{fieldErrors.username.join(', ')}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('registerPage.emailLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        placeholder={t('registerPage.emailPlaceholder')}
                        required
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          fieldErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <FaEnvelope className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-red-500 text-sm">{fieldErrors.email.join(', ')}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('registerPage.passwordLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        placeholder={t('registerPage.passwordPlaceholder')}
                        required
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          fieldErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-red-500 text-sm">{fieldErrors.password.join(', ')}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('registerPage.confirmPasswordLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="password_confirmation"
                        value={credentials.password_confirmation}
                        onChange={handleChange}
                        placeholder={t('registerPage.passwordPlaceholder')}
                        required
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          fieldErrors.password_confirmation ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.password_confirmation && (
                      <p className="text-red-500 text-sm">{fieldErrors.password_confirmation.join(', ')}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('registerPage.phoneLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone_number"
                        value={credentials.phone_number}
                        onChange={handleChange}
                        placeholder={t('registerPage.phonePlaceholder')}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          fieldErrors.phone_number ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <FaPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    {fieldErrors.phone_number && (
                      <p className="text-red-500 text-sm">{fieldErrors.phone_number.join(', ')}</p>
                    )}
                  </div>

                  {/* Google Maps Location Picker */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
                      {t('googleMaps.selectLocation')}
                    </label>
                    <OpenStreetMapPicker
                      onLocationSelect={(location) => {
                        // Optional: You can store the location data if needed
                        console.log('Selected location:', location);
                      }}
                      height="250px"
                    />
                    <p className="text-xs text-gray-500">
                      {t('googleMaps.locationOptional')}
                    </p>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        {t('registerPage.createAccountButton')}
                        <FaArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>

                  {/* Divider */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="relative my-6"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">{t('registerPage.orContinueWith')}</span>
                    </div>
                  </motion.div>

                  {/* Google Login Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <GoogleLoginButton
                      onSuccess={handleGoogleLogin}
                      onError={handleGoogleError}
                      isLoading={isGoogleLoading}
                      variant="outline"
                      size="lg"
                      className="border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800"
                    />
                  </motion.div>
                </form>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-center"
                >
                  <p className="text-gray-600">
                    {t('registerPage.alreadyMember')}{' '}
                    <Link 
                      to={ROUTE_PATHS.LOGIN} 
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      {t('registerPage.signInLink')}
                    </Link>
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
