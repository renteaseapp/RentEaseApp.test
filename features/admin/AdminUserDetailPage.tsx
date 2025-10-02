import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, ApiError, UserIdVerificationStatus, UserIdDocumentType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
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
  FaEyeSlash,
  FaExclamationTriangle,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaAddressCard,
  FaInfoCircle,
  FaEdit,
  FaCheckCircle,
  FaGlobe
} from 'react-icons/fa';
import {
  adminGetUserById,
  adminBanUser,
  adminUnbanUser,
  adminUpdateUserIdVerification
} from '../../services/adminService';


export const AdminUserDetailPage: React.FC = () => {

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
        .catch((err: any) => setError((err as ApiError).message || 'โหลดข้อมูลผู้ใช้ล้มเหลว'))
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
      setProcessError((err as ApiError).message || 'แบนผู้ใช้ล้มเหลว');
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
      setProcessError((err as ApiError).message || 'ปลดแบนผู้ใช้ล้มเหลว');
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
      setProcessError((err as ApiError).message || 'อัปเดตสถานะการยืนยันตัวตนล้มเหลว');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to get status color and icon
  const getStatusInfo = (status: UserIdVerificationStatus | undefined | null) => {
    switch (status) {
      case UserIdVerificationStatus.APPROVED:
        return { color: 'green', icon: <FaUserCheck className="h-4 w-4" /> };
      case UserIdVerificationStatus.REJECTED:
        return { color: 'red', icon: <FaUserTimes className="h-4 w-4" /> };
      case UserIdVerificationStatus.PENDING:
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
            <p className="text-lg font-medium text-gray-700">กำลังโหลดรายละเอียดผู้ใช้...</p>
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
            <p className="text-lg font-medium text-gray-700">ไม่พบผู้ใช้</p>
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
                  กลับไปยังผู้ใช้
                </Button>
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600">
                  <FaUser className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    รายละเอียดผู้ใช้: {userData.first_name} {userData.last_name} (@{userData.username})
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
                  {userData.is_active ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
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
                  <h2 className="text-xl font-bold text-gray-800">ข้อมูลบัญชี</h2>
                </div>
                
                <div className="flex flex-col lg:flex-row items-start gap-8">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    {userData.profile_picture_url ? (
                      <img 
                        src={userData.profile_picture_url} 
                        alt="รูปโปรไฟล์ผู้ใช้" 
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
                        <FaUser className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">ชื่อผู้ใช้</p>
                          <p className="font-semibold text-gray-900">{userData.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaEnvelope className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">อีเมล</p>
                          <p className="font-semibold text-gray-900">{userData.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaPhone className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">เบอร์โทรศัพท์</p>
                          <p className="font-semibold text-gray-900">{userData.phone_number || 'ไม่มีข้อมูล'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaAddressCard className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">ชื่อ-นามสกุล</p>
                          <p className="font-semibold text-gray-900">
                            {userData.first_name || userData.last_name 
                              ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
                              : 'ไม่มีข้อมูล'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaCalendarAlt className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">เข้าร่วมเมื่อ</p>
                          <p className="font-semibold text-gray-900">
                            {new Date(userData.created_at || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaClock className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">เข้าสู่ระบบล่าสุด</p>
                          <p className="font-semibold text-gray-900">
                            {userData.last_login_at ? new Date(userData.last_login_at).toLocaleString() : 'ไม่มีข้อมูล'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaEdit className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">อัปเดตล่าสุด</p>
                          <p className="font-semibold text-gray-900">
                            {userData.updated_at ? new Date(userData.updated_at).toLocaleDateString() : 'ไม่มีข้อมูล'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaIdCard className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">ประเภทเอกสาร</p>
                          <p className="font-semibold text-gray-900">
                            {userData.id_document_type === UserIdDocumentType.NATIONAL_ID ? 'บัตรประชาชน' : 
                             userData.id_document_type === UserIdDocumentType.PASSPORT ? 'หนังสือเดินทาง' : 
                             userData.id_document_type || 'ไม่มีข้อมูล'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FaGlobe className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">IP ที่ลงทะเบียน</p>
                          <p className="font-semibold text-gray-900">
                            {userData.registration_ip || 'ไม่มีข้อมูล'}
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
                  <h2 className="text-xl font-bold text-gray-800">การยืนยันตัวตน</h2>
                </div>

                {/* Verification Status */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                        statusInfo.color === 'green' ? 'bg-green-100 text-green-800 border border-green-200' :
                        statusInfo.color === 'red' ? 'bg-red-100 text-red-800 border border-red-200' :
                        statusInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {statusInfo.icon}
                        {userData.id_verification_status === UserIdVerificationStatus.APPROVED ? 'ยืนยันแล้ว' : 
                         userData.id_verification_status === UserIdVerificationStatus.REJECTED ? 'ถูกปฏิเสธ' : 
                         userData.id_verification_status === UserIdVerificationStatus.PENDING ? 'รอการตรวจสอบ' : 'ยังไม่ได้ส่งเอกสาร'}
                      </span>
                    </div>

                    {userData.id_document_number && (
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <FaIdCard className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">เลขที่เอกสาร</p>
                          <p className="text-sm font-medium text-gray-900">{userData.id_document_number}</p>
                        </div>
                      </div>
                    )}

                    {userData.id_verified_at && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <FaCheckCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">ยืนยันเมื่อ</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(userData.id_verified_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {userData.id_verification_notes && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <FaInfoCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">หมายเหตุการยืนยัน</p>
                          <p className="text-sm text-yellow-700">{userData.id_verification_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ID Documents */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {userData.id_document_url && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaIdCard className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">ด้านหน้าบัตร</span>
                      </div>
                      <img 
                        src={userData.id_document_url} 
                        alt="ด้านหน้าบัตรประชาชน" 
                        className="w-full h-32 object-cover border rounded-lg shadow-sm" 
                      />
              </div>
            )}
                  
            {userData.id_document_back_url && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaIdCard className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">ด้านหลังบัตร</span>
                      </div>
                      <img 
                        src={userData.id_document_back_url} 
                        alt="ด้านหลังบัตรประชาชน" 
                        className="w-full h-32 object-cover border rounded-lg shadow-sm" 
                      />
              </div>
            )}
                  
            {userData.id_selfie_url && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FaCamera className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">ภาพถ่ายตนเองคู่กับบัตร</span>
                      </div>
                      <img 
                        src={userData.id_selfie_url} 
                        alt="ภาพถ่ายตนเองคู่กับบัตรประชาชน" 
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
                      onClick={() => handleIdVerification(UserIdVerificationStatus.APPROVED)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center gap-2"
                    >
                      <FaCheck className="h-4 w-4" />
                {isProcessing ? 'กำลังประมวลผล...' : 'ยืนยันตัวตน'}
              </Button>
                    <Button 
                      variant="danger" 
                      disabled={isProcessing} 
                      onClick={() => handleIdVerification(UserIdVerificationStatus.REJECTED)}
                      className="flex items-center gap-2"
                    >
                      <FaTimes className="h-4 w-4" />
                {isProcessing ? 'กำลังประมวลผล...' : 'ปฏิเสธตัวตน'}
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
                  <h2 className="text-xl font-bold text-gray-800">การดำเนินการของผู้ดูแล</h2>
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
                {isProcessing ? 'กำลังประมวลผล...' : 'แบนผู้ใช้'}
              </Button>
            ) : (
                    <Button 
                      variant="primary" 
                      disabled={isProcessing} 
                      onClick={handleUnban}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center gap-2"
                    >
                      <FaUnlock className="h-4 w-4" />
                {isProcessing ? 'กำลังประมวลผล...' : 'ปลดแบนผู้ใช้'}
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
