
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

import { motion } from 'framer-motion';
import { GoogleLoginButton } from '../../components/common/GoogleLoginButton';
import googleAuthService from '../../services/googleAuthService';
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaShieldAlt,
  FaArrowRight,
  FaCheckCircle,
  FaRocket
} from 'react-icons/fa';

const LockClosedIcon = () => <FaLock className="h-5 w-5 text-gray-400" />;
const MailIcon = () => <FaEnvelope className="h-5 w-5 text-gray-400" />;

export const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({ email_or_username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
      setError(apiError.message || 'เข้าสู่ระบบล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (response: any) => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      console.log('🔍 Google login response:', response);
      
      // ดึงข้อมูลผู้ใช้จาก Google
      const googleUserInfo = await googleAuthService.getGoogleUserInfo(response.access_token);
      console.log('🔍 Google user info:', googleUserInfo);
      
      // ส่งข้อมูลไปยัง backend เพื่อ login/register
      const authResponse = await googleAuthService.authenticateWithGoogle(googleUserInfo);
      console.log('🔍 Auth response from backend:', authResponse);
      
      // Login เข้าระบบ
      console.log('🔍 Calling auth.login with:', {
        token: authResponse.access_token,
        user: authResponse.user,
        isAdmin: authResponse.is_admin
      });
      
      console.log('🔍 User verification status:', authResponse.user.id_verification_status);
      
      auth.login(authResponse.access_token, authResponse.user, authResponse.is_admin);
      
      console.log('🔍 Auth login completed, navigating to home');
      navigate(ROUTE_PATHS.HOME);
    } catch (err) {
      console.error('❌ Google login error:', err);
      const apiError = err as ApiError;
      setError(apiError.message || 'เข้าสู่ระบบด้วย Google ล้มเหลว');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error('Google login error:', error);
    setError('เข้าสู่ระบบด้วย Google ล้มเหลว');
  };

  const features = [
    { icon: <FaShieldAlt className="h-6 w-6 text-green-500" />, text: 'ปลอดภัย' },
    { icon: <FaRocket className="h-6 w-6 text-blue-500" />, text: 'รวดเร็ว' },
    { icon: <FaCheckCircle className="h-6 w-6 text-purple-500" />, text: 'เชื่อถือได้' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 pt-20">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Features */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:block"
          >
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                  RentEase
                </h1>
                <p className="text-xl text-gray-600 max-w-md mx-auto lg:mx-0">
                  แพลตฟอร์มเช่าสินค้าที่สะดวกและปลอดภัย
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6"
              >
                <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                  เหตุใดต้องเลือก RentEase?
                </h3>
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="flex items-center space-x-4 p-4 bg-white/50 rounded-xl backdrop-blur-sm"
                  >
                    <div className="flex-shrink-0">
                      {feature.icon}
                    </div>
                    <p className="text-gray-700 font-medium">{feature.text}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mt-12 p-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl text-white"
              >
                <h4 className="text-lg font-semibold mb-2">เข้าร่วมชุมชนของเรา</h4>
                <p className="text-blue-100">เชื่อมต่อกับผู้เช่าและเจ้าของสินค้าทั่วประเทศ</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="w-full max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  เข้าสู่ระบบ
                </h2>
                <p className="text-gray-600">
                  เข้าสู่ระบบบัญชีของคุณเพื่อดำเนินการต่อ
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ErrorMessage message={error} onDismiss={() => setError(null)} title="ข้อผิดพลาด" />
                        </motion.div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                      >
                        <InputField
                          label="อีเมลหรือชื่อผู้ใช้"
                          id="email_or_username"
                          name="email_or_username"
                          type="text"
                          autoComplete="username"
                          required
                          value={credentials.email_or_username}
                          onChange={handleChange}
                          placeholder="ป้อนอีเมลหรือชื่อผู้ใช้ของคุณ"
                          icon={<MailIcon />}
                          className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                      >
                        <div className="relative">
                          <InputField
                            label="รหัสผ่าน"
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={credentials.password}
                            onChange={handleChange}
                            placeholder="ป้อนรหัสผ่านของคุณ"
                            icon={<LockClosedIcon />}
                            className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                          </button>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center">
                          <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                          />
                          <label htmlFor="remember-me" className="ml-2 block text-gray-700 font-medium">
                            จดจำฉัน
                          </label>
                        </div>
                        <Link
                          to={ROUTE_PATHS.FORGOT_PASSWORD}
                          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                        >
                          ลืมรหัสผ่าน?
                        </Link>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.9 }}
                      >
                        <Button
                          type="submit"
                          isLoading={isLoading}
                          fullWidth
                          variant="primary"
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                        >
                          {!isLoading && <FaArrowRight className="mr-2 h-4 w-4" />}
                          เข้าสู่ระบบ
                        </Button>
                      </motion.div>

                      {/* Divider */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.0 }}
                        className="relative my-6"
                      >
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500">หรือดำเนินการต่อด้วย</span>
                        </div>
                      </motion.div>

                      {/* Google Login Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.1 }}
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
                      transition={{ duration: 0.5, delay: 1.0 }}
                      className="mt-8 pt-6 border-t border-gray-200"
                    >
                      <p className="text-center text-sm text-gray-600">
                        ยังไม่เป็นสมาชิก?{' '}
                        <Link
                          to={ROUTE_PATHS.REGISTER}
                          className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                        >
                          สร้างบัญชีใหม่
                        </Link>
                      </p>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
