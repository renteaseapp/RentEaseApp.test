
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { register, RegisterCredentials } from '../../services/authService';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';

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
  FaArrowRight
} from 'react-icons/fa';

export const RegisterPage: React.FC = () => {
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
  const [passwordStrength, setPasswordStrength] = useState<number>(0); // 0-4 scale

  const auth = useAuth();
  const navigate = useNavigate();

  // Format phone number as user types
  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digit characters
    const phoneNumber = value.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    } else if (phoneNumber.length <= 10) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    } else {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength++;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength++;
    
    // Contains number
    if (/\d/.test(password)) strength++;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Cap at 4
    return Math.min(strength, 4);
  };

  // Get password strength label
  const getPasswordStrengthLabel = (strength: number): string => {
    switch (strength) {
      case 0: return 'Very Weak';
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  // Get password strength color
  const getPasswordStrengthColor = (strength: number): string => {
    switch (strength) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-red-400';
      case 2: return 'bg-yellow-500';
      case 3: return 'bg-green-400';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-200';
    }
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate username format
  const isValidUsername = (username: string): boolean => {
    // Username should be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  useEffect(() => {
    if (auth.user) {
      navigate(ROUTE_PATHS.HOME);
    }
  }, [auth.user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format phone number
    if (name === 'phone_number') {
      formattedValue = formatPhoneNumber(value);
    }

    // Update password strength if password field changes
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    setCredentials({ ...credentials, [name]: formattedValue });
    
    // Clear field errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({...prev, [name]: []}));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const errors: string[] = [];

    // Validate email on blur
    if (name === 'email' && value && !isValidEmail(value)) {
      errors.push('กรุณากรอกอีเมลให้ถูกต้อง');
    }

    // Validate username on blur
    if (name === 'username' && value && !isValidUsername(value)) {
      errors.push('ชื่อผู้ใช้ต้องมีความยาว 3-20 ตัวอักษร และประกอบด้วยตัวอักษร ตัวเลข หรือขีดล่างเท่านั้น');
    }

    // Validate password confirmation
    if (name === 'password_confirmation' && value && value !== credentials.password) {
      errors.push('รหัสผ่านไม่ตรงกัน');
    }

    if (errors.length > 0) {
      setFieldErrors(prev => ({...prev, [name]: errors}));
    } else if (fieldErrors[name]) {
      setFieldErrors(prev => ({...prev, [name]: []}));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    // Final validation before submission
    const errors: Record<string, string[]> = {};

    // Validate required fields
    if (!credentials.username) {
      errors.username = ['กรุณากรอกชื่อผู้ใช้'];
    } else if (!isValidUsername(credentials.username)) {
      errors.username = ['ชื่อผู้ใช้ต้องมีความยาว 3-20 ตัวอักษร และประกอบด้วยตัวอักษร ตัวเลข หรือขีดล่างเท่านั้น'];
    }

    if (!credentials.email) {
      errors.email = ['กรุณากรอกอีเมล'];
    } else if (!isValidEmail(credentials.email)) {
      errors.email = ['กรุณากรอกอีเมลให้ถูกต้อง'];
    }

    if (!credentials.password) {
      errors.password = ['กรุณากรอกรหัสผ่าน'];
    } else if (passwordStrength < 3) {
      errors.password = ['รหัสผ่านต้องมีความแข็งแรงระดับดีขึ้นไป'];
    }

    if (!credentials.password_confirmation) {
      errors.password_confirmation = ['กรุณายืนยันรหัสผ่าน'];
    } else if (credentials.password !== credentials.password_confirmation) {
      errors.password_confirmation = ['รหัสผ่านไม่ตรงกัน'];
    }

    if (!credentials.first_name) {
      errors.first_name = ['กรุณากรอกชื่อ'];
    }

    if (!credentials.last_name) {
      errors.last_name = ['กรุณากรอกนามสกุล'];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await register(credentials);
      if (response.user && response.access_token) { // Auto-login
        auth.login(response.access_token, response.user, false);
        setSuccessMessage('ลงทะเบียนสำเร็จ! กำลังเข้าสู่ระบบ...');
        navigate(ROUTE_PATHS.HOME);
      } else if (response.message) { // Email verification needed
        setSuccessMessage('ลงทะเบียนสำเร็จ! โปรดตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี');
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'ลงทะเบียนล้มเหลว');
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
      setSuccessMessage('ลงทะเบียนด้วย Google สำเร็จ!');
      navigate(ROUTE_PATHS.HOME);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'ลงทะเบียนด้วย Google ล้มเหลว');
      if (apiError.errors) {
        setFieldErrors(apiError.errors);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: any) => {
    console.error('Google registration error:', error);
    setError('ลงทะเบียนด้วย Google ล้มเหลว');
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
              ยินดีต้อนรับสู่ RentEase
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              แพลตฟอร์มเช่าสินค้าที่สะดวกและปลอดภัย
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
                <h3 className="font-semibold text-lg mb-1">ชุมชนที่เป็นมิตร</h3>
                <p className="text-blue-100">เชื่อมต่อกับผู้เช่าและเจ้าของสินค้าทั่วประเทศ</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaShieldAlt className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">ปลอดภัย</h3>
                <p className="text-blue-100">ระบบการชำระเงินและการยืนยันตัวตนที่ปลอดภัย</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaRocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">รวดเร็ว</h3>
                <p className="text-blue-100">กระบวนการเช่าที่ง่ายและรวดเร็ว</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-6 rounded-xl bg-white/10 backdrop-blur-sm"
          >
            <h3 className="font-semibold text-lg mb-2">เข้าร่วมชุมชนของเรา</h3>
            <p className="text-blue-100">เชื่อมต่อกับผู้เช่าและเจ้าของสินค้าทั่วประเทศ</p>
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
              สร้างบัญชีใหม่
            </h2>
            <p className="text-gray-600">
              สร้างบัญชีใหม่เพื่อเริ่มใช้งานแพลตฟอร์ม
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
                      <ErrorMessage message={error} onDismiss={() => setError(null)} title="ข้อผิดพลาด" />
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
                        <p className="font-medium text-green-800">สำเร็จ</p>
                        <p className="text-green-700 text-sm">{successMessage}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        ชื่อ
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="first_name"
                          value={credentials.first_name}
                          onChange={handleChange}
                          placeholder="ป้อนชื่อของคุณ"
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
                        นามสกุล
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="last_name"
                          value={credentials.last_name}
                          onChange={handleChange}
                          placeholder="ป้อนนามสกุลของคุณ"
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
                      ชื่อผู้ใช้
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="username"
                        value={credentials.username}
                        onChange={handleChange}
                        placeholder="ป้อนชื่อผู้ใช้ของคุณ"
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
                      อีเมล
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                        placeholder="ป้อนอีเมลของคุณ"
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
                      รหัสผ่าน
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="ป้อนรหัสผ่านของคุณ"
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
                    {/* Password Strength Indicator */}
                    {credentials.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">ความแข็งแรงของรหัสผ่าน</span>
                          <span className="text-xs font-medium text-gray-700">
                            {getPasswordStrengthLabel(passwordStrength)}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          {[0, 1, 2, 3].map((index) => (
                            <div
                              key={index}
                              className={`h-2 flex-1 rounded-full ${
                                index < passwordStrength
                                  ? getPasswordStrengthColor(passwordStrength)
                                  : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          ต้องมีอักษรอย่างน้อย 8 ตัวอักษร รวมทั้งตัวพิมพ์เล็ก ตัวพิมพ์ใหญ่ ตัวเลข และอักขระพิเศษ
                        </p>
                      </div>
                    )}
                    {fieldErrors.password && (
                      <p className="text-red-500 text-sm">{fieldErrors.password.join(', ')}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      ยืนยันรหัสผ่าน
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="password_confirmation"
                        value={credentials.password_confirmation}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="ป้อนรหัสผ่านของคุณอีกครั้ง"
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
                      หมายเลขโทรศัพท์
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone_number"
                        value={credentials.phone_number}
                        onChange={handleChange}
                        placeholder="ป้อนหมายเลขโทรศัพท์ของคุณ"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          fieldErrors.phone_number ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      <FaPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500">
                      รูปแบบ: XXX-XXX-XXXX
                    </p>
                    {fieldErrors.phone_number && (
                      <p className="text-red-500 text-sm">{fieldErrors.phone_number.join(', ')}</p>
                    )}
                  </div>

                  {/* Google Maps Location Picker */}
                  {/* Removed as per requirement - ไม่ต้องให้กรอกที่อยู่ */}
                  {/* 
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
                      เลือกตำแหน่งของคุณ
                    </label>
                    <OpenStreetMapPicker
                      onLocationSelect={(location) => {
                        // Optional: You can store the location data if needed
                        console.log('Selected location:', location);
                      }}
                      height="250px"
                    />
                    <p className="text-xs text-gray-500">
                      ตำแหน่งเป็นข้อมูลทางเลือก (สามารถเลือกภายหลังได้)
                    </p>
                  </div>
                  */}

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
                        สร้างบัญชี
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
                      <span className="px-2 bg-white text-gray-500">หรือดำเนินการต่อด้วย</span>
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
                    เป็นสมาชิกอยู่แล้ว?{' '}
                    <Link 
                      to={ROUTE_PATHS.LOGIN} 
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      เข้าสู่ระบบ
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
