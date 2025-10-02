import React, { useState, useEffect } from 'react';

import { FaEye, FaFilter, FaDownload, FaCalendarAlt, FaUser, FaCog, FaHistory, FaSearch, FaTimes } from 'react-icons/fa';
import { getAdminLogs, AdminLog, AdminLogsQuery } from '../../services/adminLogService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/Card';

const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminLogsQuery>({
    page: 1,
    limit: 20
  });
  const [showFilters, setShowFilters] = useState(false);

  const actionTypeOptions = [
    { value: 'USER_UPDATE', label: 'อัปเดตผู้ใช้' },
    { value: 'USER_BAN', label: 'แบนผู้ใช้' },
    { value: 'USER_UNBAN', label: 'ปลดแบนผู้ใช้' },
    { value: 'USER_DELETE', label: 'ลบผู้ใช้' },
    { value: 'USER_VERIFICATION_UPDATE', label: 'อัปเดตการยืนยันผู้ใช้' },
    { value: 'PRODUCT_APPROVE', label: 'อนุมัติสินค้า' },
    { value: 'CATEGORY_CREATE', label: 'สร้างหมวดหมู่' },
    { value: 'CATEGORY_UPDATE', label: 'อัปเดตหมวดหมู่' },
    { value: 'CATEGORY_DELETE', label: 'ลบหมวดหมู่' },
    { value: 'SETTING_UPDATE', label: 'อัปเดตการตั้งค่า' },
    { value: 'COMPLAINT_REPLY', label: 'ตอบกลับเรื่องร้องเรียน' }
  ];

  const entityTypeOptions = [
    { value: 'User', label: 'ผู้ใช้' },
    { value: 'Product', label: 'สินค้า' },
    { value: 'Category', label: 'หมวดหมู่' },
    { value: 'Setting', label: 'การตั้งค่า' },
    { value: 'Complaint', label: 'เรื่องร้องเรียน' },
    { value: 'System', label: 'ระบบ' }
  ];

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAdminLogs(filters);
      setLogs(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const handleFilterChange = (key: keyof AdminLogsQuery, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionTypeLabel = (actionType: string) => {
    const option = actionTypeOptions.find(opt => opt.value === actionType);
    return option ? option.label : actionType;
  };

  const getEntityTypeLabel = (entityType: string) => {
    const option = entityTypeOptions.find(opt => opt.value === entityType);
    return option ? option.label : entityType;
  };

  const parseDetails = (details: string | null) => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">กำลังโหลด...</p>
          </motion.div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-4 md:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              ประวัติการกระทำของผู้ดูแลระบบ
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              ติดตามกิจกรรมและการกระทำของผู้ดูแลระบบในแพลตฟอร์ม
            </p>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                      <FaFilter className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">
                      ตัวกรอง
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
                  >
                    {showFilters ? <FaTimes className="w-4 h-4" /> : <FaSearch className="w-4 h-4" />}
                    {showFilters ? 'ซ่อนตัวกรอง' : 'แสดงตัวกรอง'}
                  </button>
                </div>

                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Action Type Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ประเภทการกระทำ
                        </label>
                        <select
                          value={filters.action_type || ''}
                          onChange={(e) => handleFilterChange('action_type', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">ทั้งหมด</option>
                          {actionTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Entity Type Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ประเภทเอนทิตี
                        </label>
                        <select
                          value={filters.target_entity_type || ''}
                          onChange={(e) => handleFilterChange('target_entity_type', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="">ทั้งหมด</option>
                          {entityTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Date Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          วันที่เริ่มต้น
                        </label>
                        <input
                          type="date"
                          value={filters.start_date || ''}
                          onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          วันที่สิ้นสุด
                        </label>
                        <input
                          type="date"
                          value={filters.end_date || ''}
                          onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      >
                        ล้างตัวกรอง
                      </button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <ErrorMessage message={error} />
            </motion.div>
          )}

          {/* Logs Table Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-blue-500 to-purple-500">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          เวลา
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          ผู้ดูแลระบบ
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          การกระทำ
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          เอนทิตี
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          รายละเอียด
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          ที่อยู่ IP
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs && logs.length > 0 ? logs.map((log) => {
                        const details = parseDetails(log.details);
                        return (
                          <motion.tr
                            key={log.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hover:bg-gray-50 transition-colors duration-200"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="w-4 h-4 text-blue-500" />
                                {formatDate(log.created_at)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <FaUser className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">
                                    {log.admin_user.first_name} {log.admin_user.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    @{log.admin_user.username}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                                {getActionTypeLabel(log.action_type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <FaCog className="w-4 h-4 text-gray-400" />
                                <span>{getEntityTypeLabel(log.target_entity_type)}</span>
                                {log.target_entity_id > 0 && (
                                  <span className="text-gray-500">(ID: {log.target_entity_id})</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {details ? (
                                <details className="cursor-pointer">
                                  <summary className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200">
                                    <FaEye className="w-4 h-4" />
                                    ดูรายละเอียด
                                  </summary>
                                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                      {JSON.stringify(details, null, 2)}
                                    </pre>
                                  </div>
                                </details>
                              ) : (
                                <span className="text-gray-400">ไม่มีรายละเอียด</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {log.ip_address ? (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  log.ip_address.includes('https://renteaseapi2.onrender.com') || log.ip_address === '::1' || log.ip_address === '127.0.0.1'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {log.ip_address}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                          </motion.tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center gap-2">
                              <FaHistory className="w-12 h-12 text-gray-300" />
                              <p className="text-lg">{loading ? 'กำลังโหลด...' : 'ไม่พบข้อมูล'}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {meta && (
                  <div className="bg-white px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => handlePageChange(meta.current_page - 1)}
                          disabled={meta.current_page <= 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          ก่อนหน้า
                        </button>
                        <button
                          onClick={() => handlePageChange(meta.current_page + 1)}
                          disabled={meta.current_page >= meta.last_page}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          ถัดไป
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            แสดง <span className="font-medium">{meta.from}</span> ถึง{' '}
                            <span className="font-medium">{meta.to}</span> จาก{' '}
                            <span className="font-medium">{meta.total}</span> รายการ
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                            <button
                              onClick={() => handlePageChange(meta.current_page - 1)}
                              disabled={meta.current_page <= 1}
                              className="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              ก่อนหน้า
                            </button>
                            {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                              const page = i + 1;
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors duration-200 ${
                                    page === meta.current_page
                                      ? 'z-10 bg-gradient-to-r from-blue-500 to-purple-500 border-blue-500 text-white'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => handlePageChange(meta.current_page + 1)}
                              disabled={meta.current_page >= meta.last_page}
                              className="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                              ถัดไป
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Loading overlay */}
          {loading && logs.length > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLogsPage; 