import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  adminGetUsers,
  adminBanUser,
  adminUnbanUser
} from '../../services/adminService';
import { User, ApiError, PaginatedResponse, UserIdVerificationStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';

import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, 
  FaSearch, 
  FaTimes, 
  FaEye, 
  FaBan, 
  FaCheck, 
  FaEllipsisV,
  FaUserCheck,
  FaUserTimes,
  FaIdCard,
  FaEnvelope,
  FaUser
} from 'react-icons/fa';

export const AdminManageUsersPage: React.FC = () => {

  const [usersResponse, setUsersResponse] = useState<PaginatedResponse<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionRow, setActionRow] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'verified' | 'unverified'>('all');

  const fetchUsers = (pageNum = 1) => {
    setIsLoading(true);
    adminGetUsers({ page: pageNum, limit: 20 })
      .then(setUsersResponse)
      .catch((err: any) => setError((err as ApiError).message || 'โหลดผู้ใช้ล้มเหลว'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers(page);
    // eslint-disable-next-line
  }, [page]);

  const handleBan = async (user: User) => {
    if (!user.id) return;
    try {
      await adminBanUser(user.id);
      fetchUsers(page);
    } catch (err) {
      setError('แบนผู้ใช้ล้มเหลว');
    }
  };

  const handleUnban = async (user: User) => {
    if (!user.id) return;
    try {
      await adminUnbanUser(user.id);
      fetchUsers(page);
    } catch (err) {
      setError('ปลดแบนผู้ใช้ล้มเหลว');
    }
  };



  let users: User[] = usersResponse?.data || [];
  let hasPagination = !!usersResponse?.meta;

  // Client-side filtering
  if (search) {
    users = users.filter(
      u =>
        (u.first_name && u.first_name.toLowerCase().includes(search.toLowerCase())) ||
        (u.last_name && u.last_name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.username && u.username.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // Helper function to check if user is verified (handles both 'approved' and 'verified' status values)
  const isUserVerified = (user: User) => {
    return user.id_verification_status === UserIdVerificationStatus.APPROVED || String(user.id_verification_status) === 'verified' || String(user.id_verification_status) === 'approved';
  };

  // Helper function to get Thai verification status text
  const getUserVerificationStatusText = (user: User) => {
    if (!user.id_verification_status) {
      return 'ยังไม่ได้ส่งเอกสาร';
    }
    
    // Convert to string for comparison since the backend might send string values
    const status = String(user.id_verification_status);
    
    if (status === UserIdVerificationStatus.APPROVED || status === 'verified') {
      return 'ยืนยันแล้ว';
    } else if (status === 'approved') { // Handle legacy string value
      return 'ยืนยันแล้ว';
    } else if (status === UserIdVerificationStatus.REJECTED || status === 'rejected') {
      return 'ถูกปฏิเสธ';
    } else if (status === UserIdVerificationStatus.PENDING || status === 'pending') {
      return 'รอการตรวจสอบ';
    } else if (status === UserIdVerificationStatus.NOT_SUBMITTED || status === 'not_submitted') {
      return 'ยังไม่ได้ส่งเอกสาร';
    } else {
      return 'ยังไม่ได้ส่งเอกสาร';
    }
  };

  // Apply status filter
  if (selectedFilter !== 'all') {
    users = users.filter(u => {
      switch (selectedFilter) {
        case 'active':
          return u.is_active;
        case 'inactive':
          return !u.is_active;
        case 'verified':
          return isUserVerified(u);
        case 'unverified':
          return !isUserVerified(u);
        default:
          return true;
      }
    });
  }

  // Calculate stats based on filtered data to match what's displayed in the table
  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    verified: users.filter(u => isUserVerified(u)).length,
  };

  if (isLoading && !usersResponse) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <LoadingSpinner message="กำลังโหลดผู้ใช้..." />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <ErrorMessage message={error} />
        </div>
      </AdminLayout>
    );
  }

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
                <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                  <FaUsers className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    จัดการผู้ใช้
                  </h1>
                  <p className="text-gray-600 mt-1">
                    จัดการบัญชีผู้ใช้และการอนุญาต
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">ผู้ใช้ทั้งหมด</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <FaUsers className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">ผู้ใช้ที่ใช้งานอยู่</p>
                    <p className="text-3xl font-bold">{stats.active}</p>
                  </div>
                  <FaUserCheck className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">ผู้ใช้ที่ไม่ใช้งาน</p>
                    <p className="text-3xl font-bold">{stats.inactive}</p>
                  </div>
                  <FaUserTimes className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">ผู้ใช้ที่ยืนยันแล้ว</p>
                    <p className="text-3xl font-bold">{stats.verified}</p>
                  </div>
                  <FaIdCard className="h-8 w-8 text-purple-200" />
        </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
          />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'ผู้ใช้ทั้งหมด', icon: <FaUsers className="h-4 w-4" /> },
                  { key: 'active', label: 'ใช้งานอยู่', icon: <FaUserCheck className="h-4 w-4" /> },
                  { key: 'inactive', label: 'ไม่ใช้งาน', icon: <FaUserTimes className="h-4 w-4" /> },
                  { key: 'verified', label: 'ยืนยันแล้ว', icon: <FaIdCard className="h-4 w-4" /> },
                  { key: 'unverified', label: 'ยังไม่ยืนยัน', icon: <FaIdCard className="h-4 w-4" /> }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedFilter === filter.key
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.icon}
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => setSearch(searchInput)} 
                  variant="primary"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <FaSearch className="h-4 w-4 mr-2" />
                  ค้นหา
                </Button>
                {(search || selectedFilter !== 'all') && (
                  <Button 
                    onClick={() => { 
                      setSearch(''); 
                      setSearchInput(''); 
                      setSelectedFilter('all');
                    }} 
                    variant="outline"
                  >
                    <FaTimes className="h-4 w-4 mr-2" />
                    ล้าง
                  </Button>
                )}
        </div>
      </div>
          </motion.div>

          {/* Users Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ชื่อ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      อีเมล / ชื่อผู้ใช้
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ยืนยันตัวตน
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      การกระทำ
                    </th>
            </tr>
          </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  <AnimatePresence>
            {users && users.length > 0 ? (
                      users.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                  <FaUser className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {user.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FaEnvelope className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div className="text-sm text-gray-900">{user.email}</div>
                                <div className="text-sm text-gray-500">@{user.username}</div>
                              </div>
                            </div>
                  </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              user.is_active 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {user.is_active ? (
                                <>
                                  <FaUserCheck className="h-3 w-3 mr-1" />
                                  ใช้งานอยู่
                                </>
                              ) : (
                                <>
                                  <FaUserTimes className="h-3 w-3 mr-1" />
                                  ไม่ใช้งาน
                                </>
                              )}
                    </span>
                  </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FaIdCard className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-700">
                                {getUserVerificationStatusText(user)}
                              </span>
                            </div>
                  </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                    <div className="relative inline-block text-left">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActionRow(actionRow === user.id ? null : user.id)}
                                className="min-w-[2.5rem] hover:bg-gray-100"
                      >
                                <FaEllipsisV className="h-4 w-4" />
                      </Button>
                              
                              <AnimatePresence>
                      {actionRow === user.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-100"
                                  >
                                    <div className="py-2">
                                      <Link 
                                        to={ROUTE_PATHS.ADMIN_USER_DETAIL.replace(':userId', String(user.id))} 
                                        className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors" 
                                        onClick={() => setActionRow(null)}
                                      >
                                        <FaEye className="h-4 w-4 mr-2" />
                                        ดู/แก้ไข
                                      </Link>
                                      
                            {user.is_active ? (
                                        <button 
                                          onClick={() => { handleBan(user); setActionRow(null); }} 
                                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                          <FaBan className="h-4 w-4 mr-2" />
                                          แบน
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => { handleUnban(user); setActionRow(null); }} 
                                          className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                        >
                                          <FaCheck className="h-4 w-4 mr-2" />
                                          ปลดแบน
                                        </button>
                                      )}
                                      
                                      
                          </div>
                                  </motion.div>
                      )}
                              </AnimatePresence>
                    </div>
                  </td>
                        </motion.tr>
              ))
            ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                        <td colSpan={5} className="text-center text-gray-400 py-12">
                          <div className="flex flex-col items-center">
                            <FaUsers className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">ไม่พบผู้ใช้</p>
                            <p className="text-sm text-gray-500">ไม่มีผู้ใช้ที่ตรงกับตัวกรองของคุณ</p>
                          </div>
                </td>
                      </motion.tr>
            )}
                  </AnimatePresence>
          </tbody>
        </table>
      </div>
          </motion.div>

          {/* Pagination */}
      {hasPagination && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex justify-between items-center mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-4"
            >
              <Button 
                variant="outline" 
                disabled={page <= 1} 
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-2"
              >
                ← ก่อนหน้า
              </Button>
              <span className="text-gray-700 font-medium">
                หน้า {page}
                {usersResponse?.meta?.last_page ? ` / ${usersResponse.meta.last_page}` : ''}
              </span>
              <Button 
                variant="outline" 
                disabled={!!usersResponse && page >= (usersResponse.meta?.last_page || 1)} 
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-2"
              >
                ถัดไป →
              </Button>
            </motion.div>
          )}
        </div>
    </div>
    </AdminLayout>
  );
};
