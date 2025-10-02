import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getOwnerRentals } from '../../services/rentalService';
import { Rental, ApiError, PaginatedResponse, } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';

import { ROUTE_PATHS } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaTh, 
  FaList, 
  FaCalendarAlt, 
  FaUser, 
  FaMoneyBillWave, 
  FaIdCard,
  FaArrowLeft,
  FaArrowRight,
  FaEye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaBox,
  FaHistory,
  FaChartLine,
} from 'react-icons/fa';

// ฟังก์ชันสำหรับรับข้อความภาษาไทยตามสถานะ
const getStatusThaiText = (status: string): string => {
  switch (status) {
    case 'completed': return 'เสร็จสมบูรณ์';
    case 'active': return 'กำลังใช้งาน';
    case 'pending_owner_approval': return 'รอการอนุมัติจากเจ้าของ';
    case 'pending_payment': return 'รอกาารชำระเงิน';
    case 'confirmed': return 'ยืนยันแล้ว';
    case 'return_pending': return 'รอคืนสินค้า';
    case 'cancelled_by_renter': return 'ยกเลิกโดยผู้เช่า';
    case 'cancelled_by_owner': return 'ยกเลิกโดยเจ้าของ';
    case 'rejected_by_owner': return 'ถูกปฏิเสธโดยเจ้าของ';
    case 'dispute': return 'ข้อพิพาท';
    case 'expired': return 'หมดอายุ';
    case 'late_return': return 'คืนล่าช้า';
    default: return 'ไม่ระบุสถานะ';
  }
};

// Status badge component with enhanced styling
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_owner_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'return_pending':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'cancelled_by_renter':
      case 'cancelled_by_owner':
      case 'rejected_by_owner':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'dispute':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'late_return':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <FaCheckCircle className="h-3 w-3" />;
      case 'active': return <FaClock className="h-3 w-3" />;
      case 'pending_owner_approval': return <FaClock className="h-3 w-3" />;
      case 'pending_payment': return <FaMoneyBillWave className="h-3 w-3" />;
      case 'confirmed': return <FaCheckCircle className="h-3 w-3" />;
      case 'return_pending': return <FaBox className="h-3 w-3" />;
      case 'cancelled_by_renter':
      case 'cancelled_by_owner':
      case 'rejected_by_owner':
      case 'expired':
      case 'late_return': return <FaTimesCircle className="h-3 w-3" />;
      case 'dispute': return <FaExclamationTriangle className="h-3 w-3" />;
      default: return <FaClock className="h-3 w-3" />;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      {getStatusIcon()}
      {getStatusThaiText(status)}
    </span>
  );
};

// Enhanced Pagination component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center space-x-2 mt-8"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
      >
        <FaArrowLeft className="h-4 w-4" />
        {"ก่อนหน้า"}
      </motion.button>
      
      {pages.map(page => (
        <motion.button
          key={page}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
            page === currentPage 
              ? 'bg-blue-500 text-white shadow-lg' 
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {page}
        </motion.button>
      ))}
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
      >
        {"ถัดไป"}
        <FaArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
};

export const OwnerRentalHistoryPage: React.FC = () => {

  const { user } = useAuth();
  const location = useLocation();
  const [rentalsResponse, setRentalsResponse] = useState<PaginatedResponse<Rental> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Check for returnOnly query param
  const params = new URLSearchParams(location.search);
  const returnOnly = params.get('returnOnly') === '1';

  const fetchRentalHistory = useCallback(async (page = 1) => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit,
      };
      
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.q = searchTerm;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await getOwnerRentals(params);
      setRentalsResponse(response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "ไม่สามารถโหลดประวัติการเช่าได้");
      console.error('Error fetching rental history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, statusFilter, searchTerm, dateFrom, dateTo, limit]);

  useEffect(() => {
    fetchRentalHistory(currentPage);
  }, [fetchRentalHistory, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRentalHistory(1);
  };

  // Enhanced notifications
  const notifications = [];
  if (rentalsResponse?.data) {
    if (rentalsResponse.data.some(r => r.rental_status === 'return_pending')) {
      notifications.push({
        type: 'warning',
        message: "มีรายการรอคืนสินค้า! โปรดตรวจสอบการรับคืน",
        icon: <FaBox className="h-4 w-4" />
      });
    }
    if (rentalsResponse.data.some(r => r.rental_status === 'late_return')) {
      notifications.push({
        type: 'error',
        message: "แจ้งเตือน: มีรายการคืนล่าช้า!",
        icon: <FaExclamationTriangle className="h-4 w-4" />
      });
    }
    if (rentalsResponse.data.some(r => r.rental_status === 'pending_owner_approval')) {
      notifications.push({
        type: 'info',
        message: "มีคำขอเช่าใหม่รอการอนุมัติจากคุณ",
        icon: <FaClock className="h-4 w-4" />
      });
    }
  }

  // Rentals to display (filtered if returnOnly)
  const rentalsToDisplay = returnOnly && rentalsResponse?.data
    ? rentalsResponse.data.filter(r => r.rental_status === 'return_pending' || r.rental_status === 'late_return')
    : rentalsResponse?.data || [];

  if (isLoading && !rentalsResponse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <LoadingSpinner message="กำลังโหลดประวัติการเช่า..." />
      </div>
    );
  }
  if (error) return <ErrorMessage message={error} />;

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
                <FaHistory className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{"ประวัติการเช่าของฉัน"}</h1>
              <p className="text-blue-100 text-lg">
                {"จัดการและตรวจสอบรายการเช่าทั้งหมดของคุณในฐานะเจ้าของ"}
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={ROUTE_PATHS.OWNER_DASHBOARD}>
                <Button variant="primary" className="bg-white text-black hover:bg-blue-50 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg">
                  <FaArrowLeft className="h-5 w-5 mr-2" />
                  {"กลับสู่หน้าแดชบอร์ด"}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications */}
        <AnimatePresence>
          {notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 space-y-3"
            >
              {notifications.map((notification, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-l-4 shadow-lg ${
                    notification.type === 'error' ? 'bg-red-50 border-red-500 text-red-800' :
                    notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
                    'bg-blue-50 border-blue-500 text-blue-800'
                  }`}
                >
                  {notification.icon}
                  <span className="font-medium">{notification.message}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8"
        >
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
                <input
                  type="text"
                placeholder={"ค้นหาด้วยชื่อสินค้า, รหัสเช่า หรือชื่อผู้เช่า..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                />
              </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
              >
                <FaFilter className="h-4 w-4" />
                {"ตัวกรองขั้นสูง"}
                <FaArrowRight className={`h-4 w-4 transition-transform duration-200 ${showFilters ? 'rotate-90' : ''}`} />
              </motion.button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">{"โหมดการแสดงผล"}:</span>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('grid')}
                    className={`p-3 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
                  >
                    <FaTh className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('list')}
                    className={`p-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
                  >
                    <FaList className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200"
                >
              {/* Status Filter */}
              <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {"สถานะ"}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                      className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">{"สถานะทั้งหมด"}</option>
                  <option value="pending_owner_approval">{"รอการอนุมัติจากเจ้าของ"}</option>
                  <option value="pending_payment">{"รอกาารชำระเงิน"}</option>
                  <option value="confirmed">{"ยืนยันแล้ว"}</option>
                  <option value="active">{"กำลังใช้งาน"}</option>
                  <option value="return_pending">{"รอคืนสินค้า"}</option>
                  <option value="completed">{"เสร็จสมบูรณ์"}</option>
                  <option value="cancelled_by_renter">{"ยกเลิกโดยผู้เช่า"}</option>
                  <option value="cancelled_by_owner">{"ยกเลิกโดยเจ้าของ"}</option>
                  <option value="rejected_by_owner">{"ถูกปฏิเสธโดยเจ้าของ"}</option>
                  <option value="dispute">{"ข้อพิพาท"}</option>
                  <option value="expired">{"หมดอายุ"}</option>
                  <option value="late_return">{"คืนล่าช้า"}</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {"จากวันที่"}
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                      className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Date To */}
              <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {"ถึงวันที่"}
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                      className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter Actions */}
            {(searchTerm || statusFilter || dateFrom || dateTo) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-3 items-center justify-between pt-4 border-t border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    <FaTimes className="h-4 w-4" />
                {"ล้างตัวกรอง"}
                  </motion.button>
                  
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {`ตัวกรองที่ใช้งานอยู่: ${[searchTerm, statusFilter, dateFrom, dateTo].filter(Boolean).length} รายการ`}
                  </span>
            </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearch}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
                >
                  <FaSearch className="h-4 w-4" />
                  {"ใช้ตัวกรอง"}
                </motion.button>
              </motion.div>
            )}
      </div>
        </motion.div>

      {/* Results Summary */}
      {rentalsResponse && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-6 p-4 bg-white rounded-xl shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {`กำลังแสดงผลลัพธ์ ${rentalsResponse.meta.from} - ${rentalsResponse.meta.to} จากทั้งหมด ${rentalsResponse.meta.total} รายการ`}
          </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <FaChartLine className="h-4 w-4" />
                <span>{`การเช่าทั้งหมด: ${rentalsResponse.meta.total} รายการ`}</span>
              </div>
            </div>
          </motion.div>
      )}

      {/* Rentals List */}
      {rentalsToDisplay.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {rentalsToDisplay.map((rental: Rental, index) => (
                    <motion.div
                      key={rental.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 group overflow-hidden"
                    >
                    {/* Product Image */}
                      <div className="relative overflow-hidden">
                        <img 
                          src={rental.product?.primary_image?.image_url || rental.product?.images?.[0]?.image_url || 'https://picsum.photos/400/225?grayscale'} 
                          alt={rental.product?.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3">
                          <StatusBadge status={rental.rental_status} />
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {rental.product?.title || "ไม่ระบุ"}
                        </h3>
                        
                        {/* Quick Info */}
                        <div className="space-y-3 text-sm text-gray-600 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FaIdCard className="h-3 w-3 text-blue-500" />
                              {"รหัสการเช่า"}:
                            </span>
                            <span className="font-bold text-blue-600">{rental.rental_uid?.substring(0, 8) || rental.id.toString().substring(0, 8)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FaUser className="h-3 w-3 text-green-500" />
                              {"ผู้เช่า"}:
                            </span>
                            <span className="truncate">
                              {rental.renter?.first_name || "ไม่ระบุ"} {rental.renter?.last_name || ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FaCalendarAlt className="h-3 w-3 text-purple-500" />
                              {"วันที่เช่า"}:
                            </span>
                            <span className="text-xs">
                              {new Date(rental.start_date).toLocaleDateString('th-TH')} - {new Date(rental.end_date).toLocaleDateString('th-TH')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FaMoneyBillWave className="h-3 w-3 text-green-500" />
                              {"ยอดรวม"}:
                            </span>
                            <span className="font-bold text-green-600">
                              {`฿${rental.total_amount_due?.toLocaleString() || '0'}`}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Link to={`/owner/rentals/${rental.id}`}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              <FaEye className="h-4 w-4" />
                              {"ดูรายละเอียด"}
                            </motion.button>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
          </div>
        ) : (
              /* List View */
          <div className="space-y-4">
                <AnimatePresence>
                  {rentalsToDisplay.map((rental: Rental, index) => (
                    <motion.div
                      key={rental.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ x: 4, scale: 1.01 }}
                      className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                    >
                      <div className="flex flex-col lg:flex-row">
                  {/* Product Image */}
                        <div className="w-full lg:w-64 h-48 lg:h-auto flex-shrink-0 relative">
                          <img 
                            src={rental.product?.primary_image?.image_url || rental.product?.images?.[0]?.image_url || 'https://picsum.photos/400/225?grayscale'} 
                            alt={rental.product?.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3">
                        <StatusBadge status={rental.rental_status} />
                      </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-grow p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between h-full">
                            <div className="flex-grow">
                              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                                {rental.product?.title || "ไม่ระบุ"}
                              </h3>

                              {/* Product Info Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaIdCard className="h-3 w-3 text-blue-500" />
                                    {"รหัสการเช่า"}:
                                  </span>
                                  <span className="font-bold text-blue-600">{rental.rental_uid?.substring(0, 8) || rental.id.toString().substring(0, 8)}</span>
                        </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaUser className="h-3 w-3 text-green-500" />
                                    {"ผู้เช่า"}:
                                  </span>
                                  <span>{rental.renter?.first_name || "ไม่ระบุ"} {rental.renter?.last_name || ''}</span>
                        </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaCalendarAlt className="h-3 w-3 text-purple-500" />
                                    {"วันที่เช่า"}:
                                  </span>
                                  <span>{new Date(rental.start_date).toLocaleDateString('th-TH')} - {new Date(rental.end_date).toLocaleDateString('th-TH')}</span>
                        </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaMoneyBillWave className="h-3 w-3 text-green-500" />
                                    {"ยอดรวม"}:
                                  </span>
                                  <span className="font-bold text-green-600">
                                    {`฿${rental.total_amount_due?.toLocaleString() || '0'}`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaClock className="h-3 w-3 text-gray-500" />
                                    {"จองเมื่อ"}:
                                  </span>
                                  <span>
                                    {rental.created_at && rental.created_at !== null 
                                      ? new Date(rental.created_at).toLocaleDateString('th-TH') 
                                      : "ไม่ระบุ"}
                                  </span>
                      </div>
                    </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col gap-3 min-w-[200px]">
                      <Link to={`/owner/rentals/${rental.id}`}>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                  <FaEye className="h-4 w-4" />
                                  {"ดูรายละเอียด"}
                                </motion.button>
                      </Link>
                    </div>
                  </div>
                        </div>
                      </div>
                    </motion.div>
            ))}
                </AnimatePresence>
          </div>
            )}
          </motion.div>
        ) : (
          /* No Results */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-6">
                <FaHistory className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
              {"ไม่พบประวัติการเช่า"}
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
              {"เราไม่พบรายการเช่าที่ตรงกับเกณฑ์การค้นหาและตัวกรองของคุณ โปรดลองปรับตัวกรอง"}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearFilters}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
              >
                {"ล้างตัวกรองและลองอีกครั้ง"}
              </motion.button>
            </div>
          </motion.div>
      )}

      {/* Pagination */}
      {rentalsResponse && rentalsResponse.meta.last_page > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={rentalsResponse.meta.last_page}
          onPageChange={handlePageChange}
        />
      )}
      </div>
    </div>
  );
};