import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, ApiError, UserIdVerificationStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion } from 'framer-motion';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaClock,
  FaCheck,
  FaTimes,
  FaBan,
  FaUnlock,
  FaIdCard,
  FaCamera,
  FaShieldAlt,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
  FaUserCheck,
  FaUserTimes,
  FaUserClock
} from 'react-icons/fa';
import {
  adminGetUserById,
  adminUpdateUser,
  adminBanUser,
  adminUnbanUser,
  adminDeleteUser,
  adminUpdateUserIdVerification
} from '../../services/adminService';
import { useTranslation } from 'react-i18next';

export const AdminUserDetailPage: React.FC = () => {
  const { t } = useTranslation('adminUserDetailPage');
  const tRoot = useTranslation().t;
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const fetchUser = () => {
    if (userId) {
      setIsLoading(true);
      adminGetUserById(Number(userId))
        .then(setUserData)
        .catch((err: any) => setError((err as ApiError).message || t('error.loadFailed')))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const handleBan = async () => {
    if (!userId) return;
    setIsProcessing(true);
    setProcessError(null);
    try {
      await adminBanUser(Number(userId));
      fetchUser();
    } catch (err: any) {
      setProcessError((err as ApiError).message || t('error.banFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnban = async () => {
    if (!userId) return;
    setIsProcessing(true);
    setProcessError(null);
    try {
      await adminUnbanUser(Number(userId));
      fetchUser();
    } catch (err: any) {
      setProcessError((err as ApiError).message || t('error.unbanFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIdVerification = async (status: UserIdVerificationStatus) => {
    if (!userId) return;
    setIsProcessing(true);
    setProcessError(null);
    try {
      await adminUpdateUserIdVerification(Number(userId), {
        id_verification_status: status,
        id_verified_at: new Date().toISOString(),
        id_verified_by_admin_id: 1 // TODO: ใช้ admin id จริงจาก context
      });
      fetchUser();
    } catch (err: any) {
      setProcessError((err as ApiError).message || t('error.updateVerificationFailed'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to normalize status key for translation
  const normalizeStatusKey = (status: string | undefined | null) => {
    if (!status) return 'notSubmitted';
    // Convert to camelCase to match translation keys
    return status.replace(/_/g, '').replace(/(^|\s)([a-z])/g, (m, p1, p2) => p2.toUpperCase()).replace(/^./, s => s.toLowerCase());
  };

  // Helper to get status color and icon
  const getStatusInfo = (status: string | undefined | null) => {
    switch (status) {
      case 'verified':
        return { color: 'green', icon: <FaUserCheck className="h-4 w-4" /> };
      case 'rejected':
        return { color: 'red', icon: <FaUserTimes className="h-4 w-4" /> };
      case 'pending':
        return { color: 'yellow', icon: <FaUserClock className="h-4 w-4" /> };
      default:
        return { color: 'gray', icon: <FaEyeSlash className="h-4 w-4" /> };
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <FaUser className="h-16 w-16 text-blue-400 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium text-gray-700">{t('loadingUserDetail')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <FaExclamationTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-red-700">{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!userData) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <FaUser className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">{t('userNotFound')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statusInfo = getStatusInfo(userData.id_verification_status);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
    <div className="container mx-auto p-4 md:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin/users')}
                  className="flex items-center gap-2"
                >
                  <FaArrowLeft className="h-4 w-4" />
                  Back to Users
                </Button>
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
                  <FaUser className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    {t('title', { name: `${userData.first_name} ${userData.last_name}`, username: userData.username })}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    User ID: {userData.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  userData.is_active 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {userData.is_active ? <FaCheck className="h-4 w-4" /> : <FaBan className="h-4 w-4" />}
                  {userData.is_active ? t('active') : t('inactive')}
                </span>
      </div>
            </div>
          </motion.div>

          {/* Account Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-white shadow-xl border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                    <FaUser className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{t('accountInfo')}</h2>
                </div>
                
                <div className="flex flex-col lg:flex-row items-start gap-8">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {userData.profile_picture_url ? (
                      <img 
                        src={userData.profile_picture_url} 
                        alt={t('profilePictureAlt')} 
                        className="w-32 h-32 rounded-full border-4 border-blue-100 object-cover shadow-lg" 
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full border-4 border-blue-100 bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                        <FaUser className="h-16 w-16 text-white" />
                      </div>
                    )}
                  </div>

                  {/* User Details */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaEnvelope className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">{t('email')}</p>
                          <p className="font-semibold text-gray-900">{userData.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaPhone className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">{t('phone')}</p>
                          <p className="font-semibold text-gray-900">{userData.phone_number || t('notAvailable')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaCalendarAlt className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">{t('joined')}</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(userData.created_at || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaClock className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">{t('lastLogin')}</p>
                          <p className="font-semibold text-gray-900">
                            {userData.last_login_at ? new Date(userData.last_login_at).toLocaleString() : t('notAvailable')}
                          </p>
                        </div>
                      </div>
                    </div>
            </div>
          </div>
        </CardContent>
      </Card>
          </motion.div>

          {/* ID Verification Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <Card className="bg-white shadow-xl border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-600">
                    <FaIdCard className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{t('idVerification')}</h2>
                </div>

                {/* Verification Status */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                      statusInfo.color === 'green' ? 'bg-green-100 text-green-800 border border-green-200' :
                      statusInfo.color === 'red' ? 'bg-red-100 text-red-800 border border-red-200' :
                      statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {statusInfo.icon}
                      {tRoot(`idVerification.${userData.id_verification_status}`)}
                    </span>
                  </div>
                </div>

                {/* ID Documents */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {userData.id_document_url && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaIdCard className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">{t('idDocumentFront')}</span>
                      </div>
                      <img 
                        src={userData.id_document_url} 
                        alt={t('idDocumentFrontAlt')} 
                        className="w-full h-32 object-cover border rounded-lg shadow-sm" 
                      />
              </div>
            )}
                  
            {userData.id_document_back_url && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaIdCard className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">{t('idDocumentBack')}</span>
                      </div>
                      <img 
                        src={userData.id_document_back_url} 
                        alt={t('idDocumentBackAlt')} 
                        className="w-full h-32 object-cover border rounded-lg shadow-sm" 
                      />
              </div>
            )}
                  
            {userData.id_selfie_url && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaCamera className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">{t('selfieWithId')}</span>
                      </div>
                      <img 
                        src={userData.id_selfie_url} 
                        alt={t('selfieWithIdAlt')} 
                        className="w-full h-32 object-cover border rounded-lg shadow-sm" 
                      />
              </div>
            )}
          </div>

                {/* Verification Actions */}
                {processError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="h-4 w-4 text-red-500" />
                      <p className="text-red-700">{processError}</p>
                    </div>
                  </div>
                )}

          {userData.id_verification_status === UserIdVerificationStatus.PENDING && (
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="primary" 
                      disabled={isProcessing} 
                      onClick={() => handleIdVerification('verified' as UserIdVerificationStatus)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center gap-2"
                    >
                      <FaCheck className="h-4 w-4" />
                {isProcessing ? t('processing') : t('verifyId')}
              </Button>
                    <Button 
                      variant="danger" 
                      disabled={isProcessing} 
                      onClick={() => handleIdVerification(UserIdVerificationStatus.REJECTED)}
                      className="flex items-center gap-2"
                    >
                      <FaTimes className="h-4 w-4" />
                {isProcessing ? t('processing') : t('rejectId')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
          </motion.div>

          {/* Admin Actions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <Card className="bg-white shadow-xl border border-gray-100">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600">
                    <FaShieldAlt className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">{t('adminActions')}</h2>
                </div>

                {processError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="h-4 w-4 text-red-500" />
                      <p className="text-red-700">{processError}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
            {userData.is_active ? (
                    <Button 
                      variant="danger" 
                      disabled={isProcessing} 
                      onClick={handleBan}
                      className="flex items-center gap-2"
                    >
                      <FaBan className="h-4 w-4" />
                {isProcessing ? t('processing') : t('banUser')}
              </Button>
            ) : (
                    <Button 
                      variant="primary" 
                      disabled={isProcessing} 
                      onClick={handleUnban}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center gap-2"
                    >
                      <FaUnlock className="h-4 w-4" />
                {isProcessing ? t('processing') : t('unbanUser')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
          </motion.div>
        </div>
    </div>
    </AdminLayout>
  );
};
