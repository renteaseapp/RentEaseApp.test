import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../../services/authService';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaEnvelope,
  FaEye, 
  FaEyeSlash,
  FaCheckCircle,
  FaShieldAlt,
  FaKey,
  FaArrowLeft,
  FaArrowRight,
  FaLockOpen,
  FaUserShield,
  FaInfoCircle
} from 'react-icons/fa';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      setError(apiError.message || 'ไม่สามารถส่ง OTP รีเซ็ตรหัสผ่านได้ โปรดลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
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
      setError(apiError.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้ โปรดลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
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
              ลืมรหัสผ่าน?
            </h2>
            <p className="text-blue-100 text-lg mb-8">
              รีเซ็ตรหัสผ่านของคุณได้อย่างง่ายดาย
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
                <h3 className="font-semibold text-lg mb-1">ปลอดภัย</h3>
                <p className="text-blue-100">ระบบการรักษาความปลอดภัยระดับสูง</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaUserShield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">ได้รับการปกป้อง</h3>
                <p className="text-blue-100">ข้อมูลของคุณได้รับการปกป้องอย่างเต็มที่</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaLockOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">รวดเร็ว</h3>
                <p className="text-blue-100">กระบวนการรีเซ็ตรหัสผ่านที่รวดเร็วและง่ายดาย</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 p-6 rounded-xl bg-white/10 backdrop-blur-sm"
          >
            <h3 className="font-semibold text-lg mb-2">หมายเหตุด้านความปลอดภัย</h3>
            <p className="text-blue-100">โปรดตรวจสอบให้แน่ใจว่าคุณใช้อุปกรณ์ที่ปลอดภัยเมื่อรีเซ็ตรหัสผ่าน</p>
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
              ลืมรหัสผ่าน
            </h2>
            <p className="text-gray-600">
              ป้อนอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
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
                      <ErrorMessage message={error} onDismiss={() => setError(null)} title="ข้อผิดพลาด" />
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
                        <p className="font-medium text-green-800">สำเร็จ</p>
                        <p className="text-green-700 text-sm">{successMessage}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {!showResetForm ? (
                    <motion.form
                      key="request-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleRequestReset}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          อีเมล
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ป้อนอีเมลของคุณ"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          />
                          <FaEnvelope className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

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
                            ส่งลิงก์รีเซ็ตรหัสผ่าน
                            <FaArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="reset-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleResetPassword}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          รหัส OTP
                        </label>
                        <input
                          type="text"
                          name="otp"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="ป้อนรหัส OTP ที่ได้รับทางอีเมล"
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          รหัสผ่านใหม่
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="new_password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="ป้อนรหัสผ่านใหม่ของคุณ"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showNewPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                          </button>
                        </div>
                        {/* Password Requirements */}
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FaInfoCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-700">
                              <p className="font-medium mb-1">ข้อกำหนดรหัสผ่าน</p>
                              <ul className="space-y-1 text-xs">
                                <li>• ความยาวอย่างน้อย 8 ตัวอักษร</li>
                                <li>• ต้องมีตัวอักษรพิมพ์ใหญ่</li>
                                <li>• ต้องมีตัวอักษรพิมพ์เล็ก</li>
                                <li>• ต้องมีตัวเลข</li>
                                <li>• ต้องมีอักขระพิเศษ</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          ยืนยันรหัสผ่านใหม่
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="new_password_confirmation"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="ป้อนรหัสผ่านใหม่ของคุณอีกครั้ง"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
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
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <>
                            รีเซ็ตรหัสผ่าน
                            <FaLockOpen className="h-4 w-4" />
                          </>
                        )}
                      </motion.button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-center"
                >
                  <p className="text-gray-600">
                    จำรหัสผ่านได้แล้ว?{' '}
                    <Link 
                      to={ROUTE_PATHS.LOGIN} 
                      className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center justify-center gap-1 mt-2"
                    >
                      <FaArrowLeft className="h-3 w-3" />
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
