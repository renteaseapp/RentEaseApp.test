import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ResetPasswordPayload } from '../../services/authService';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { ApiError } from '../../types';
import { ErrorMessage } from '../../components/common/ErrorMessage';

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
  FaCheckDouble,
  FaInfoCircle
} from 'react-icons/fa';

export const ResetPasswordPage: React.FC = () => {
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
      setError('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ');
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      setSuccessMessage('รีเซ็ตรหัสผ่านสำเร็จ! กำลังเปลี่ยนเส้นทางไปยังหน้าเข้าสู่ระบบ...');
      setTimeout(() => {
        navigate(ROUTE_PATHS.LOGIN);
      }, 3000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้ โปรดลองอีกครั้ง');
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
              รีเซ็ตรหัสผ่านของคุณ
            </h2>
            <p className="text-green-100 text-lg mb-8">
              รีเซ็ตรหัสผ่านของคุณได้อย่างปลอดภัย
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
                <p className="text-green-100">ระบบการรักษาความปลอดภัยระดับสูง</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaClock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">ชั่วคราว</h3>
                <p className="text-green-100">ลิงก์รีเซ็ตรหัสผ่านมีอายุการใช้งานจำกัด</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-white/20">
                <FaCheckDouble className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">ได้รับการยืนยัน</h3>
                <p className="text-green-100">กระบวนการยืนยันตัวตนที่เข้มงวด</p>
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
            <p className="text-green-100">โปรดตรวจสอบให้แน่ใจว่าคุณใช้อุปกรณ์ที่ปลอดภัยเมื่อรีเซ็ตรหัสผ่าน</p>
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
              รีเซ็ตรหัสผ่าน
            </h2>
            <p className="text-gray-600">
              ป้อนข้อมูลของคุณเพื่อรีเซ็ตรหัสผ่านใหม่
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
                          อีเมล
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="ป้อนอีเมลของคุณ"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          />
                          <FaEnvelope className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          รหัส OTP
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            name="otp"
                            value={formData.otp}
                            onChange={handleChange}
                            placeholder="ป้อนรหัส OTP ที่ได้รับทางอีเมล"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                          />
                          <FaLock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          รหัสผ่านใหม่
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            placeholder="ป้อนรหัสผ่านใหม่ของคุณ"
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
                        {/* Password Requirements */}
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FaInfoCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-green-700">
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
                            value={formData.new_password_confirmation}
                            onChange={handleChange}
                            placeholder="ป้อนรหัสผ่านใหม่ของคุณอีกครั้ง"
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
                            รีเซ็ตรหัสผ่าน
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
                          รีเซ็ตรหัสผ่านสำเร็จ!
                        </h3>
                        <p className="text-gray-600 mb-6">
                          รหัสผ่านของคุณได้รับการรีเซ็ตเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย
                        </p>
                        <Link 
                          to={ROUTE_PATHS.LOGIN} 
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          <FaArrowRight className="h-4 w-4" />
                          ไปยังหน้าเข้าสู่ระบบ
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
                      ต้องการความช่วยเหลือ?{' '}
                      <Link 
                        to={ROUTE_PATHS.LOGIN} 
                        className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center justify-center gap-1 mt-2"
                      >
                        <FaArrowLeft className="h-3 w-3" />
                        กลับไปยังหน้าเข้าสู่ระบบ
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
