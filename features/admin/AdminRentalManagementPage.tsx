import React, { useEffect, useState } from 'react';
import {
  adminGetAllRentals
} from '../../services/adminService';
import { PaginatedResponse, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaTimes, 
  FaShoppingCart,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaUser,
  FaBox
} from 'react-icons/fa';

// Rental interface
interface Rental {
  id: number;
  rental_uid: string;
  rental_status: string;
  payment_status: string;
  start_date: string;
  end_date: string;
  total_amount_due: number;
  final_amount_paid: number;
  security_deposit_at_booking: number;
  created_at: string;
  updated_at: string;
  product: {
    id: number;
    title: string;
    slug: string;
    primary_image: {
      image_url: string | null;
    } | null;
  };
  renter: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  owner: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Rental status mapping
const RENTAL_STATUS_MAP = {
  'pending_owner_approval': { label: 'รอการอนุมัติ', color: 'bg-yellow-100 text-yellow-800', icon: FaClock },
  'pending_payment': { label: 'รอการชำระเงิน', color: 'bg-orange-100 text-orange-800', icon: FaMoneyBillWave },
  'confirmed': { label: 'ยืนยันแล้ว', color: 'bg-blue-100 text-blue-800', icon: FaCheckCircle },
  'active': { label: 'กำลังเช่า', color: 'bg-green-100 text-green-800', icon: FaBox },
  'return_pending': { label: 'รอการคืน', color: 'bg-purple-100 text-purple-800', icon: FaClock },
  'completed': { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800', icon: FaCheckCircle },
  'cancelled_by_renter': { label: 'ยกเลิกโดยผู้เช่า', color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
  'cancelled_by_owner': { label: 'ยกเลิกโดยเจ้าของ', color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
  'rejected_by_owner': { label: 'ปฏิเสธโดยเจ้าของ', color: 'bg-red-100 text-red-800', icon: FaTimesCircle },
  'dispute': { label: 'ข้อพิพาท', color: 'bg-red-100 text-red-800', icon: FaExclamationTriangle },
  'expired': { label: 'หมดอายุ', color: 'bg-gray-100 text-gray-800', icon: FaTimesCircle },
  'late_return': { label: 'คืนช้า', color: 'bg-red-100 text-red-800', icon: FaExclamationTriangle }
};

const PAYMENT_STATUS_MAP = {
  'pending': { label: 'รอชำระ', color: 'bg-yellow-100 text-yellow-800' },
  'paid': { label: 'ชำระแล้ว', color: 'bg-green-100 text-green-800' },
  'failed': { label: 'ชำระไม่สำเร็จ', color: 'bg-red-100 text-red-800' },
  'refunded': { label: 'คืนเงินแล้ว', color: 'bg-blue-100 text-blue-800' },
  'processing': { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800' },
  'cancelled': { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-800' },
  'expired': { label: 'หมดอายุ', color: 'bg-gray-100 text-gray-800' }
};

export const AdminRentalManagementPage: React.FC = () => {
  const [rentalsResponse, setRentalsResponse] = useState<PaginatedResponse<Rental> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');


  const fetchRentals = (pageNum = 1) => {
    setIsLoading(true);
    const params: any = { 
      page: pageNum, 
      limit: 20,
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    
    if (search) params.search = search;
    if (selectedStatus !== 'all') params.status = selectedStatus;

    adminGetAllRentals(params)
      .then(setRentalsResponse)
      .catch((err: any) => setError((err as ApiError).message || 'โหลดข้อมูลการเช่าล้มเหลว'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRentals(page);
    // eslint-disable-next-line
  }, [page, search, selectedStatus]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  let rentals: Rental[] = rentalsResponse?.data || [];
  let hasPagination = !!rentalsResponse?.meta;

  // Calculate stats
  const stats = {
    total: rentals.length,
    active: rentals.filter(r => r.rental_status === 'active').length,
    pending: rentals.filter(r => r.rental_status === 'pending_owner_approval' || r.rental_status === 'pending_payment').length,
    completed: rentals.filter(r => r.rental_status === 'completed').length,
    disputes: rentals.filter(r => r.rental_status === 'dispute').length
  };

  if (isLoading && !rentalsResponse) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <LoadingSpinner message="กำลังโหลดข้อมูลการเช่า..." />
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
                  <FaShoppingCart className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    ดูการเช่า
                  </h1>
                  <p className="text-gray-600 mt-1">
                    ดูรายการการเช่าทั้งหมดในระบบ
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
            className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">ทั้งหมด</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <FaShoppingCart className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">กำลังเช่า</p>
                    <p className="text-3xl font-bold">{stats.active}</p>
                  </div>
                  <FaBox className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">รอดำเนินการ</p>
                    <p className="text-3xl font-bold">{stats.pending}</p>
                  </div>
                  <FaClock className="h-8 w-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">เสร็จสิ้น</p>
                    <p className="text-3xl font-bold">{stats.completed}</p>
                  </div>
                  <FaCheckCircle className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">ข้อพิพาท</p>
                    <p className="text-3xl font-bold">{stats.disputes}</p>
                  </div>
                  <FaExclamationTriangle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="ค้นหาด้วยชื่อสินค้า, ผู้เช่า, หรือเจ้าของ..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      {search && (
                        <button
                          onClick={handleClearSearch}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="md:w-64">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">สถานะทั้งหมด</option>
                      <option value="pending_owner_approval">รอการอนุมัติ</option>
                      <option value="pending_payment">รอการชำระเงิน</option>
                      <option value="confirmed">ยืนยันแล้ว</option>
                      <option value="active">กำลังเช่า</option>
                      <option value="return_pending">รอการคืน</option>
                      <option value="completed">เสร็จสิ้น</option>
                      <option value="dispute">ข้อพิพาท</option>
                      <option value="cancelled_by_renter">ยกเลิกโดยผู้เช่า</option>
                      <option value="cancelled_by_owner">ยกเลิกโดยเจ้าของ</option>
                      <option value="rejected_by_owner">ปฏิเสธโดยเจ้าของ</option>
                      <option value="expired">หมดอายุ</option>
                      <option value="late_return">คืนช้า</option>
                    </select>
                  </div>

                  {/* Search Button */}
                  <Button
                    onClick={handleSearch}
                    className="md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <FaSearch className="mr-2" />
                    ค้นหา
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Mobile Rentals List (สำหรับหน้าจอเล็ก) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="block md:hidden"
          >
            <Card>
              <CardContent className="p-4">
                {rentals.length > 0 ? (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {rentals.map((rental) => {
                        const statusInfo = RENTAL_STATUS_MAP[rental.rental_status as keyof typeof RENTAL_STATUS_MAP] || 
                          { label: rental.rental_status, color: 'bg-gray-100 text-gray-800', icon: FaClock };
                        const paymentInfo = PAYMENT_STATUS_MAP[rental.payment_status as keyof typeof PAYMENT_STATUS_MAP] ||
                          { label: 'ไม่ทราบสถานะ', color: 'bg-gray-100 text-gray-800' };
                        const StatusIcon = statusInfo.icon;

                        return (
                          <motion.div
                            key={rental.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0 h-14 w-14">
                                {rental.product.primary_image?.image_url ? (
                                  <img
                                    className="h-14 w-14 rounded-lg object-cover"
                                    src={rental.product.primary_image.image_url}
                                    alt={rental.product.title}
                                  />
                                ) : (
                                  <div className="h-14 w-14 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <FaBox className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-semibold text-gray-900">
                                    #{rental.rental_uid}
                                  </div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {statusInfo.label}
                                  </span>
                                </div>
                                <div className="mt-1 text-sm text-gray-700">
                                  {rental.product.title}
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  <div className="text-xs text-gray-600 flex items-center">
                                    <FaUser className="h-3 w-3 mr-1 text-gray-400" /> ผู้เช่า: {rental.renter.first_name} {rental.renter.last_name}
                                  </div>
                                  <div className="text-xs text-gray-600 flex items-center">
                                    <FaUser className="h-3 w-3 mr-1 text-gray-400" /> เจ้าของ: {rental.owner.first_name} {rental.owner.last_name}
                                  </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentInfo.color}`}>
                                    {paymentInfo.label}
                                  </span>
                                  <div className="text-sm text-gray-900">
                                    {formatCurrency(rental.total_amount_due)}
                                  </div>
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  สร้างเมื่อ: {formatDate(rental.created_at)}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  !isLoading && (
                    <div className="text-center py-8">
                      <FaShoppingCart className="mx-auto h-10 w-10 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูลการเช่า</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {search || selectedStatus !== 'all'
                          ? 'ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง'
                          : 'ยังไม่มีรายการการเช่าในระบบ'}
                      </p>
                    </div>
                  )
                )}

                {hasPagination && rentalsResponse?.meta && (
                  <div className="mt-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-700">
                        แสดง {rentalsResponse.meta.from} ถึง {rentalsResponse.meta.to} จาก {rentalsResponse.meta.total} รายการ
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => setPage(page - 1)}
                          disabled={page <= 1}
                          variant="outline"
                          size="sm"
                        >
                          ก่อนหน้า
                        </Button>
                        <span className="text-sm text-gray-700">
                          หน้า {page} จาก {rentalsResponse.meta.last_page}
                        </span>
                        <Button
                          onClick={() => setPage(page + 1)}
                          disabled={page >= rentalsResponse.meta.last_page}
                          variant="outline"
                          size="sm"
                        >
                          ถัดไป
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Rentals Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="hidden md:block"
          >
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          รหัสการเช่า
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สินค้า
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ผู้เช่า
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          เจ้าของ
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สถานะการเช่า
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สถานะการชำระ
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          จำนวนเงิน
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          วันที่สร้าง
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <AnimatePresence>
                        {rentals.map((rental) => {
                          const statusInfo = RENTAL_STATUS_MAP[rental.rental_status as keyof typeof RENTAL_STATUS_MAP] || 
                            { label: rental.rental_status, color: 'bg-gray-100 text-gray-800', icon: FaClock };
                          const paymentInfo = PAYMENT_STATUS_MAP[rental.payment_status as keyof typeof PAYMENT_STATUS_MAP] ||
                            { label: 'ไม่ทราบสถานะ', color: 'bg-gray-100 text-gray-800' };
                          const StatusIcon = statusInfo.icon;

                          return (
                            <motion.tr
                              key={rental.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  #{rental.rental_uid}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {rental.id}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    {rental.product.primary_image?.image_url ? (
                                      <img
                                        className="h-10 w-10 rounded-lg object-cover"
                                        src={rental.product.primary_image.image_url}
                                        alt={rental.product.title}
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <FaBox className="h-5 w-5 text-gray-400" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {rental.product.title}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      ID: {rental.product.id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <FaUser className="h-4 w-4 text-gray-400 mr-2" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {rental.renter.first_name} {rental.renter.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {rental.renter.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <FaUser className="h-4 w-4 text-gray-400 mr-2" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {rental.owner.first_name} {rental.owner.last_name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {rental.owner.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                  <StatusIcon className="mr-1 h-3 w-3" />
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentInfo.color}`}>
                                  {paymentInfo.label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatCurrency(rental.total_amount_due)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ชำระแล้ว: {formatCurrency(rental.final_amount_paid)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {formatDate(rental.created_at)}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {hasPagination && rentalsResponse?.meta && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        แสดง {rentalsResponse.meta.from} ถึง {rentalsResponse.meta.to} จาก {rentalsResponse.meta.total} รายการ
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => setPage(page - 1)}
                          disabled={page <= 1}
                          variant="outline"
                          size="sm"
                        >
                          ก่อนหน้า
                        </Button>
                        <span className="text-sm text-gray-700">
                          หน้า {page} จาก {rentalsResponse.meta.last_page}
                        </span>
                        <Button
                          onClick={() => setPage(page + 1)}
                          disabled={page >= rentalsResponse.meta.last_page}
                          variant="outline"
                          size="sm"
                        >
                          ถัดไป
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {rentals.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <FaShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่พบข้อมูลการเช่า</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {search || selectedStatus !== 'all' 
                        ? 'ลองเปลี่ยนเงื่อนไขการค้นหาหรือตัวกรอง' 
                        : 'ยังไม่มีรายการการเช่าในระบบ'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
};
