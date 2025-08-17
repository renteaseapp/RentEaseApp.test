import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRentals, getProductReviews } from '../../services/rentalService';
import { Rental, ApiError, PaginatedResponse, RentalStatus, } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { motion, } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaCalendarAlt, 
  FaUser, 
  FaMoneyBillWave, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimes, 
  FaEye, 
  FaStar, 
  FaArrowRight,
  FaBox,
  FaCreditCard,
  FaHistory,
  FaShieldAlt
} from 'react-icons/fa';

export const MyRentalsPage: React.FC = () => {
  const { t } = useTranslation();
  const [rentalsResponse, setRentalsResponse] = useState<PaginatedResponse<Rental> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [reviews, setReviews] = useState<{ [key: number]: boolean }>({});
  const [search, setSearch] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');

  const RENTAL_STATUS_OPTIONS = [
    { value: '', label: t('all_statuses', 'All') },
    { value: 'pending_owner_approval', label: t('rentalStatus.pending_owner_approval', 'รอเจ้าของอนุมัติ') },
    { value: 'pending_payment', label: t('rentalStatus.pending_payment', 'รอชำระเงิน') },
    { value: 'confirmed', label: t('rentalStatus.confirmed', 'ยืนยันแล้ว') },
    { value: 'active', label: t('rentalStatus.active', 'กำลังเช่า') },
    { value: 'return_pending', label: t('rentalStatus.return_pending', 'รอคืนสินค้า') },
    { value: 'completed', label: t('rentalStatus.completed', 'เสร็จสิ้น') },
    { value: 'cancelled_by_renter', label: t('rentalStatus.cancelled_by_renter', 'ยกเลิกโดยผู้เช่า') },
    { value: 'cancelled_by_owner', label: t('rentalStatus.cancelled_by_owner', 'ยกเลิกโดยเจ้าของ') },
    { value: 'rejected_by_owner', label: t('rentalStatus.rejected_by_owner', 'ถูกปฏิเสธโดยเจ้าของ') },
    { value: 'dispute', label: t('rentalStatus.dispute', 'ข้อพิพาท') },
    { value: 'expired', label: t('rentalStatus.expired', 'หมดอายุ') },
    { value: 'late_return', label: t('rentalStatus.late_return', 'คืนล่าช้า') },
  ];

  const fetchMyRentals = (page = 1) => {
    setIsLoading(true);
    const statusParam = statusFilter === '' ? undefined : statusFilter;
    getMyRentals({ status: statusParam, q: search, page })
      .then(response => {
        setRentalsResponse(response);
        // Fetch reviews for completed rentals
        response.data
          .filter(rental => rental.rental_status === RentalStatus.COMPLETED)
          .forEach(rental => {
            if (rental.product?.id) {
              getProductReviews(rental.product.id, { page: 1, limit: 100 })
                .then(reviewsResponse => {
                  const hasReview = reviewsResponse.data.some(review => review.rental_id === rental.id);
                  setReviews(prev => ({ ...prev, [rental.id]: hasReview }));
                })
                .catch(console.error);
            }
          });
      })
      .catch(err => setError((err as ApiError).message || "Failed to load your rentals"))
      .finally(() => setIsLoading(false));
  };

  const getStatusBadgeClass = (status: RentalStatus): { color: string; icon: React.ReactNode } => {
    switch (status) {
      case RentalStatus.COMPLETED:
        return { 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <FaCheckCircle className="h-3 w-3" />
        };
      case RentalStatus.ACTIVE:
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <FaClock className="h-3 w-3" />
        };
      case RentalStatus.PENDING_PAYMENT:
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <FaCreditCard className="h-3 w-3" />
        };
      case RentalStatus.RETURN_PENDING:
        return { 
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <FaBox className="h-3 w-3" />
        };
      case RentalStatus.LATE_RETURN:
        return { 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <FaExclamationTriangle className="h-3 w-3" />
        };
      case RentalStatus.CANCELLED_BY_RENTER:
      case RentalStatus.CANCELLED_BY_OWNER:
      case RentalStatus.REJECTED_BY_OWNER:
        return { 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <FaTimes className="h-3 w-3" />
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <FaShieldAlt className="h-3 w-3" />
        };
    }
  };

  const getStatusText = (status: RentalStatus): string => {
    switch (status) {
      case RentalStatus.RETURN_PENDING:
        return t('renterRentalDetailPage.status.return_pending');
      case RentalStatus.LATE_RETURN:
        return t('renterRentalDetailPage.status.late_return');
      default:
        return status.replace(/_/g, ' ').toUpperCase();
    }
  };

  useEffect(() => {
    fetchMyRentals();
  }, [statusFilter]);

  // Search handler
  const handleSearch = () => {
    setSearch(pendingSearch);
    fetchMyRentals(1);
  };

  // Enter key triggers search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // When search changes, only fetch if search is empty (to reset to all)
  useEffect(() => {
    if (search === '') {
      fetchMyRentals(1);
    }
  }, [search]);

  // ย้าย early return หลัง hook ทั้งหมด
  if (isLoading && !rentalsResponse) return <LoadingSpinner message={t('loading_your_rentals')} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      <div className="container mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
              <FaHistory className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {t('my_rentals_as_renter')}
              </h1>
              <p className="text-gray-600 text-lg">จัดการการเช่าของคุณ</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <FaFilter className="h-5 w-5 text-blue-600" />
              </div>
              <label htmlFor="statusFilter" className="font-semibold text-gray-700">{t('filter_by_status')}</label>
              <select 
                id="statusFilter"
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                {RENTAL_STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('search_rentals')}
                  value={pendingSearch}
                  onChange={e => setPendingSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {t('search')}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {rentalsResponse && rentalsResponse.data.length > 0 ? (
          (() => {
            const filteredRentals = search
              ? rentalsResponse.data.filter(r =>
                  r.product?.title?.toLowerCase().includes(search.toLowerCase())
                )
              : rentalsResponse.data;
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredRentals.map((rental, index) => {
                  const statusInfo = getStatusBadgeClass(rental.rental_status);
                  return (
                    <motion.div
                      key={rental.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-200"
                    >
                      {/* Product Image */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {rental.product?.primary_image?.image_url ? (
                          <img 
                            src={rental.product.primary_image.image_url} 
                            alt={rental.product.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <FaBox className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
                            {statusInfo.icon}
                            {getStatusText(rental.rental_status)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div className="p-6">
                        <div className="mb-4">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Link 
                              to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))} 
                              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {rental.product?.title || 'N/A'}
                            </Link>
                            {rental.product?.category?.name && (
                              <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
                                {rental.product.category.name}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mb-3">Rental ID: {rental.rental_uid.substring(0,8)}...</div>
                          
                          <div className="space-y-2 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <FaCalendarAlt className="h-4 w-4 text-blue-500" />
                              <span><strong>{t('renterRentalDetailPage.labels.rentalPeriod', 'ช่วงเช่า')}:</strong> {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaUser className="h-4 w-4 text-green-500" />
                              <span><strong>{t('renterRentalDetailPage.labels.owner', 'เจ้าของ')}:</strong> {rental.owner?.first_name || 'N/A'} {rental.owner?.last_name || ''}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaMoneyBillWave className="h-4 w-4 text-yellow-500" />
                              <span><strong>{t('renterRentalDetailPage.labels.totalPaid', 'ยอดชำระ')}:</strong> <span className="text-blue-600 font-semibold">฿{(rental.final_amount_paid || rental.total_amount_due).toLocaleString()}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FaClock className="h-4 w-4 text-gray-500" />
                              <span><strong>{t('renterRentalDetailPage.labels.bookedOn', 'จองเมื่อ')}:</strong> {new Date(rental.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Actual Pickup Time */}
                          {['confirmed', 'active', 'completed'].includes(rental.rental_status) && rental.actual_pickup_time && (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                              <div className="flex items-center gap-2 text-sm text-green-700">
                                <FaCheckCircle className="h-4 w-4" />
                                <span><strong>{t('renterRentalDetailPage.labels.actualPickup', 'Actual Pickup')}:</strong> {new Date(rental.actual_pickup_time).toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Return status info */}
                          {rental.rental_status === RentalStatus.RETURN_PENDING && (
                            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                              <div className="flex items-center gap-2 text-sm text-purple-700">
                                <FaBox className="h-4 w-4" />
                                <span><strong>ℹ️ {t('renterRentalDetailPage.status.return_pending_desc')}</strong></span>
                              </div>
                            </div>
                          )}
                          {rental.rental_status === RentalStatus.LATE_RETURN && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                              <div className="flex items-center gap-2 text-sm text-red-700">
                                <FaExclamationTriangle className="h-4 w-4" />
                                <span><strong>⚠️ {t('renterRentalDetailPage.status.late_return_desc')}</strong></span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-3 flex-wrap">
                          <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))}>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              <FaEye className="h-4 w-4" />
                              {t('view_details')}
                            </motion.button>
                          </Link>
                          {rental.rental_status === RentalStatus.COMPLETED && !reviews[rental.id] && ( 
                            <Link to={ROUTE_PATHS.SUBMIT_REVIEW.replace(':rentalId', String(rental.id))}>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                              >
                                <FaStar className="h-4 w-4" />
                                {t('leave_a_review')}
                              </motion.button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Pagination controls */}
                {rentalsResponse.meta.last_page > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="col-span-full mt-8 flex justify-center"
                  >
                    <div className="flex gap-2">
                      {Array.from({length: rentalsResponse.meta.last_page}, (_, i) => i + 1).map(page => (
                        <motion.button
                          key={page}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => fetchMyRentals(page)}
                          className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                            page === rentalsResponse.meta.current_page 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                              : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          {page}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })()
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col items-center justify-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-6">
              <FaHistory className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('no_rentals_found')}</h3>
            <p className="text-gray-600 mb-6 text-center max-w-md">{t('start_by_browsing_items_to_rent')}</p>
            <Link to={ROUTE_PATHS.HOME}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaSearch className="h-5 w-5" />
                {t('browsing_items')}
                <FaArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};
