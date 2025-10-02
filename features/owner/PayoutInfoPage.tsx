import React, { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { getOwnerPayoutMethods, addPayoutMethod, deletePayoutMethod, setPayoutMethodAsPrimary } from '../../services/ownerService';
import { PayoutMethod, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';

import { THAI_BANKS, ROUTE_PATHS } from '../../constants';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCreditCard, 
  FaPlus, 
  FaTimes, 
  FaTrash, 
  FaStar,
  FaArrowLeft,
  FaBuilding,
  FaUser,
  FaIdCard,
  FaShieldAlt,
  FaWallet,
  FaQrcode,
  FaUniversity
} from 'react-icons/fa';

type NewPayoutMethodData = Omit<PayoutMethod, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

export const PayoutInfoPage: React.FC = () => {

  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isSettingPrimary, setIsSettingPrimary] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMethodData, setNewMethodData] = useState<NewPayoutMethodData>({
      method_type: 'bank_account',
      account_name: '',
      account_number: '',
      bank_name: '',
      is_primary: false,
  });

  const fetchPayoutMethods = async () => {
      if (!user?.id) return;
      
      try {
          setIsLoading(true);
          setError(null);
          const methods = await getOwnerPayoutMethods(user.id);
          setPayoutMethods(methods);
      } catch (err) {
          const apiError = err as ApiError;
          setError(apiError.message || 'ไม่สามารถโหลดวิธีการรับเงินได้');
          showError(apiError.message || 'ไม่สามารถโหลดวิธีการรับเงินได้');
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchPayoutMethods();
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setNewMethodData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value,
      }));
  };

  const handleAddMethod = async (e: FormEvent) => {
      e.preventDefault();
      if (!user?.id) return;
      
      setIsAdding(true);
      setError(null);
      
      try {
          await addPayoutMethod(user.id, newMethodData);
          await fetchPayoutMethods(); // Refresh list
          setShowForm(false); // Hide form
          setNewMethodData({ 
              method_type: 'bank_account', 
              account_name: '', 
              account_number: '', 
              bank_name: '', 
              is_primary: false
          }); // Reset form
          showSuccess('เพิ่มวิธีการรับเงินสำเร็จ!');
      } catch (err) {
          const apiError = err as ApiError;
          setError(apiError.message || 'ไม่สามารถเพิ่มวิธีการรับเงินได้');
          showError(apiError.message || 'ไม่สามารถเพิ่มวิธีการรับเงินได้');
      } finally {
          setIsAdding(false);
      }
  };

  const handleDeleteMethod = async (methodId: number, methodName: string) => {
      if (!user?.id) return;
      
      const confirmed = window.confirm(
          `คุณแน่ใจหรือไม่ว่าต้องการลบวิธีการรับเงินสำหรับ ${methodName}? การกระทำนี้ไม่สามารถย้อนกลับได้`
      );
      
      if (!confirmed) return;

      try {
          setIsDeleting(methodId);
          await deletePayoutMethod(methodId);
          await fetchPayoutMethods(); // Refresh list
          showSuccess('ลบวิธีการรับเงินสำเร็จ!');
      } catch (err) {
          const apiError = err as ApiError;
          showError(apiError.message || 'ไม่สามารถลบวิธีการรับเงินได้');
      } finally {
          setIsDeleting(null);
      }
  };

  const handleSetPrimary = async (methodId: number) => {
      if (!user?.id) return;

      try {
          setIsSettingPrimary(methodId);
          await setPayoutMethodAsPrimary(methodId);
          await fetchPayoutMethods(); // Refresh list
          showSuccess('ตั้งวิธีการรับเงินเป็นหลักสำเร็จ!');
      } catch (err) {
          const apiError = err as ApiError;
          showError(apiError.message || 'ไม่สามารถตั้งวิธีการรับเงินเป็นหลักได้');
      } finally {
          setIsSettingPrimary(null);
      }
  };

  const getMethodTypeDisplay = (methodType: string) => {
      switch (methodType) {
          case 'bank_account':
              return 'บัญชีธนาคาร';
          case 'promptpay':
              return 'PromptPay';
          default:
              return methodType.replace('_', ' ').toUpperCase();
      }
  };

  const getBankDisplayName = (bankName: string | null) => {
      if (!bankName) return '';
      
      const bank = THAI_BANKS.find(b => b.code === bankName || b.name === bankName || b.nameEn === bankName);
      if (bank) {
          return bank.name;
      }
      return bankName;
  };

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case 'bank_account':
        return <FaUniversity className="h-5 w-5" />;
      case 'promptpay':
        return <FaQrcode className="h-5 w-5" />;
      default:
        return <FaCreditCard className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <LoadingSpinner message="กำลังโหลดข้อมูลการรับเงิน..." />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <FaWallet className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">วิธีการรับเงิน</h1>
              <p className="text-blue-100 text-lg">
                จัดการวิธีการรับเงินจากการเช่าสินค้า
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={ROUTE_PATHS.OWNER_DASHBOARD}>
                <Button variant="primary" className="bg-white text-black hover:bg-blue-50 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg">
                  <FaArrowLeft className="h-5 w-5 mr-2" />
                  กลับไปที่แดชบอร์ด
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </motion.div>
        )}

        {/* Add New Method Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(prev => !prev)}
            className={`inline-flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
              showForm 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600'
            }`}
          >
            {showForm ? (
              <>
                <FaTimes className="h-5 w-5" />
                ยกเลิก
              </>
            ) : (
              <>
                <FaPlus className="h-5 w-5" />
                เพิ่มใหม่
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Add New Method Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <Card className="shadow-xl border border-gray-100 rounded-2xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FaPlus className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">เพิ่มวิธีการรับเงินใหม่</h2>
                  </div>
                  
                  <form onSubmit={handleAddMethod} className="space-y-6">
                    {/* Method Type Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          ประเภทวิธีการ
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setNewMethodData(prev => ({ ...prev, method_type: 'bank_account' }))}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              newMethodData.method_type === 'bank_account'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <FaUniversity className="h-5 w-5" />
                              <span className="font-medium">บัญชีธนาคาร</span>
                            </div>
                          </motion.button>
                          
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setNewMethodData(prev => ({ ...prev, method_type: 'promptpay' }))}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                              newMethodData.method_type === 'promptpay'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <FaQrcode className="h-5 w-5" />
                              <span className="font-medium">PromptPay</span>
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Account Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          <FaUser className="inline-block h-4 w-4 mr-2 text-blue-500" />
                          ชื่อเจ้าของบัญชี
                        </label>
                        <input
                          type="text"
                          name="account_name"
                          value={newMethodData.account_name}
                          onChange={handleInputChange}
                          required
                          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="กรอกชื่อเจ้าของบัญชี"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          <FaIdCard className="inline-block h-4 w-4 mr-2 text-blue-500" />
                          เลขที่บัญชี
                        </label>
                        <input
                          type="text"
                          name="account_number"
                          value={newMethodData.account_number}
                          onChange={handleInputChange}
                          required
                          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="กรอกเลขที่บัญชี"
                        />
                      </div>
                    </div>

                    {/* Bank Selection (for bank accounts) */}
                    {newMethodData.method_type === 'bank_account' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          <FaBuilding className="inline-block h-4 w-4 mr-2 text-blue-500" />
                          ชื่อธนาคาร
                        </label>
                        <select
                          name="bank_name"
                          value={newMethodData.bank_name || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">เลือกธนาคาร</option>
                          {THAI_BANKS.map(bank => (
                            <option key={bank.code} value={bank.code}>
                              {bank.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Set as Primary */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <input
                        type="checkbox"
                        id="is_primary"
                        name="is_primary"
                        checked={newMethodData.is_primary}
                        onChange={handleInputChange}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="is_primary" className="flex items-center gap-2 text-sm font-medium text-blue-800">
                        <FaStar className="h-4 w-4" />
                        ตั้งเป็นวิธีการหลัก
                      </label>
                    </div>

                    {/* Submit Button */}
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isAdding}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isAdding ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          กำลังเพิ่ม...
                        </>
                      ) : (
                        <>
                          <FaPlus className="h-5 w-5" />
                          เพิ่มวิธีการ
                        </>
                      )}
                    </motion.button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <FaShieldAlt className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">วิธีการรับเงินของคุณ</h2>
          </div>

          {payoutMethods.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {payoutMethods.map((method, index) => (
                  <motion.div
                    key={method.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="group"
                  >
                    <Card className={`shadow-xl border-2 rounded-2xl overflow-hidden transition-all duration-300 ${
                      method.is_primary 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50' 
                        : 'border-gray-100 hover:border-blue-300'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-3 rounded-xl ${
                                method.is_primary ? 'bg-blue-100' : 'bg-gray-100'
                              }`}>
                                {getMethodIcon(method.method_type)}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                  {method.account_name}
                                  {method.is_primary && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                      <FaStar className="h-3 w-3" />
                                      หลัก
                                    </span>
                                  )}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {getMethodTypeDisplay(method.method_type)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <FaIdCard className="h-4 w-4 text-gray-400" />
                                <span>...{method.account_number.slice(-4)}</span>
                              </div>
                              {method.bank_name && (
                                <div className="flex items-center gap-2">
                                  <FaBuilding className="h-4 w-4 text-gray-400" />
                                  <span>{getBankDisplayName(method.bank_name)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            {!method.is_primary && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSetPrimary(method.id)}
                                disabled={isSettingPrimary === method.id}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                              >
                                {isSettingPrimary === method.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                ) : (
                                  <FaStar className="h-4 w-4" />
                                )}
                                ตั้งเป็นหลัก
                              </motion.button>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteMethod(method.id, method.account_name)}
                              disabled={isDeleting === method.id}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                            >
                              {isDeleting === method.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <FaTrash className="h-4 w-4" />
                              )}
                              ลบ
                            </motion.button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center py-16"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-6">
                  <FaWallet className="h-12 w-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  ไม่มีวิธีการรับเงิน
                </h3>
                <p className="text-gray-500 leading-relaxed mb-8">
                  คุณยังไม่ได้เพิ่มวิธีการรับเงินใดๆ เพิ่มวิธีการรับเงินแรกของคุณเพื่อรับเงินจากการเช่า
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowForm(true)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center gap-3 mx-auto"
                >
                  <FaPlus className="h-5 w-5" />
                  เพิ่มใหม่
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
