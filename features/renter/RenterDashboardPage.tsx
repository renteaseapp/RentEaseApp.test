import React, { useEffect, useState } from 'react';
import { Link, NavLink, } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { getRenterDashboardData } from '../../services/renterService';
import { RenterDashboardData, ApiError, } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  FaTachometerAlt, 
  FaShoppingBag, 
  FaHeart, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle, 
  FaTimes, 
  FaCheck, 
  FaUser, 
  FaCalendarAlt, 
  FaMoneyBillWave, 
  FaSearch, 
  FaHistory, 
  FaComments, 
  FaUserCircle,
  FaArrowRight,
  FaCreditCard,
  FaShieldAlt,
  
} from 'react-icons/fa';

export const RenterDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showError } = useAlert();
  const [dashboardData, setDashboardData] = useState<RenterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        const errorMessage = t('renterDashboard.error.userNotFound');
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const data = await getRenterDashboardData();
        setDashboardData(data);
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || t('renterDashboard.error.loadFailed');
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, t, showError]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return { 
          text: t('renterDashboard.status.active'), 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <FaCheckCircle className="h-4 w-4" />
        };
      case 'pending_payment':
        return { 
          text: t('renterDashboard.status.pendingPayment'), 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <FaCreditCard className="h-4 w-4" />
        };
      case 'pending_owner_approval':
        return { 
          text: t('renterDashboard.status.pendingApproval'), 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <FaClock className="h-4 w-4" />
        };
      case 'completed':
        return { 
          text: t('renterDashboard.status.completed'), 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <FaCheck className="h-4 w-4" />
        };
      default:
        return { 
          text: status.replace('_', ' ').toUpperCase(), 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <FaExclamationTriangle className="h-4 w-4" />
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(t('common.locale'), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) return <LoadingSpinner message={t('renterDashboard.loading')} />;
  if (error) return <ErrorMessage message={error} />;
  if (!dashboardData) return <div className="p-4">{t('renterDashboard.noData')}</div>;
  
  const {
    current_active_rentals,
    confirmed_rentals,
    pending_action_rentals,
    pending_approval_rentals,
    completed_rentals,
    cancelled_rentals,
    late_return_rentals
  } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-64 bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 flex-shrink-0"
          >
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl mb-3">
                <FaUser className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Renter Dashboard</h3>
              <p className="text-sm text-gray-600">Manage your rentals</p>
            </div>
            
            <nav className="space-y-2">
              <NavLink 
                to={ROUTE_PATHS.RENTER_DASHBOARD} 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                  }`
                } 
                end
              >
                <FaTachometerAlt className="h-5 w-5" />
                <span>{t('renterDashboard.sidebar.dashboard')}</span>
              </NavLink>
              <NavLink 
                to={ROUTE_PATHS.MY_RENTALS_RENTER} 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                  }`
                }
              >
                <FaShoppingBag className="h-5 w-5" />
                <span>{t('renterDashboard.sidebar.myRentals')}</span>
              </NavLink>
              <NavLink 
                to={ROUTE_PATHS.WISHLIST} 
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-md'
                  }`
                }
              >
                <FaHeart className="h-5 w-5" />
                <span>{t('renterDashboard.sidebar.wishlist')}</span>
              </NavLink>
            </nav>
          </motion.aside>

          {/* Main Content */}
          <main className="flex-1">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
                  <FaTachometerAlt className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {t('renterDashboard.title')}
                  </h1>
                  <p className="text-gray-600 text-lg">
                    {t('renterDashboard.welcome', { name: user?.first_name || t('renterDashboard.user') })}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* ACTIVE RENTALS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <FaCheckCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{t('renterDashboard.activeRentals')}</h2>
                        <p className="text-green-100 text-sm">Currently active rentals</p>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <span className="text-white font-bold text-lg">{current_active_rentals?.total || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {current_active_rentals?.data?.length > 0 ? (
                    <div className="space-y-4">
                      {current_active_rentals.data.map((rental, index) => {
                        const status = getStatusDisplay(rental.rental_status || '');
                        return (
                          <motion.div
                            key={rental.rental_uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <img 
                                  src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                                  alt={rental.product?.title}
                                  className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100"
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                                  <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                                    {rental.product?.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1">
                                      <FaUser className="h-3 w-3" />
                                      {rental.owner?.first_name}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <FaCalendarAlt className="h-3 w-3" />
                                      {formatDate(rental.end_date!)}
                                    </div>
                                  </div>
                                </Link>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                                  {status.icon}
                                  {status.text}
                                </span>
                                <p className="text-sm font-bold text-green-600 mt-2 flex items-center gap-1">
                                  <FaMoneyBillWave className="h-3 w-3" />
                                  ฿{rental.total_amount_due?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                        <FaCheckCircle className="h-10 w-10 text-green-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('renterDashboard.noActiveRentals')}</h3>
                      <p className="text-gray-500 mb-4">No active rentals at the moment</p>
                      <Link to={ROUTE_PATHS.HOME}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <FaSearch className="h-4 w-4" />
                          {t('renterDashboard.browseItems')}
                          <FaArrowRight className="h-4 w-4" />
                        </motion.button>
                      </Link>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* CONFIRMED RENTALS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <FaClock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{t('renterDashboard.confirmedRentals', 'ชำระเงินแล้ว รอเริ่มเช่า/รอเจ้าของยืนยัน')}</h2>
                        <p className="text-indigo-100 text-sm">Payment confirmed, waiting to start</p>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <span className="text-white font-bold text-lg">{confirmed_rentals?.total || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {confirmed_rentals?.data?.length > 0 ? (
                    <div className="space-y-4">
                      {confirmed_rentals.data.map((rental, index) => {
                        const status = getStatusDisplay(rental.rental_status || '');
                        return (
                          <motion.div
                            key={rental.rental_uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <img 
                                  src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                                  alt={rental.product?.title}
                                  className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100"
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                                  <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors truncate">
                                    {rental.product?.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1">
                                      <FaUser className="h-3 w-3" />
                                      {rental.owner?.first_name}
                                    </div>
                                  </div>
                                </Link>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                                  {status.icon}
                                  {status.text}
                                </span>
                                <p className="text-sm font-bold text-indigo-600 mt-2 flex items-center gap-1">
                                  <FaMoneyBillWave className="h-3 w-3" />
                                  ฿{rental.total_amount_due?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.8 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
                        <FaClock className="h-10 w-10 text-indigo-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('renterDashboard.noConfirmedRentals', 'ยังไม่มีรายการที่ชำระเงินแล้ว รอเริ่มเช่า')}</h3>
                      <p className="text-gray-500 mb-4">No confirmed rentals waiting to start</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* PENDING PAYMENT */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <FaCreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{t('renterDashboard.pendingActions')}</h2>
                        <p className="text-yellow-100 text-sm">Action required from you</p>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <span className="text-white font-bold text-lg">{pending_action_rentals?.total || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {pending_action_rentals?.data?.length > 0 ? (
                    <div className="space-y-4">
                      {pending_action_rentals.data.map((rental, index) => {
                        const status = getStatusDisplay(rental.rental_status || '');
                        return (
                          <motion.div
                            key={rental.rental_uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <img 
                                  src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                                  alt={rental.product?.title}
                                  className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100"
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                                  <h3 className="text-lg font-semibold text-gray-900 hover:text-yellow-600 transition-colors truncate">
                                    {rental.product?.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1">
                                      <FaUser className="h-3 w-3" />
                                      {rental.owner?.first_name}
                                    </div>
                                  </div>
                                </Link>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                                  {status.icon}
                                  {status.text}
                                </span>
                                {rental.rental_status === 'pending_payment' && (
                                  <Link to={ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(rental.id))}>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                      <FaCreditCard className="h-4 w-4" />
                                      {t('renterDashboard.proceedToPayment')}
                                    </motion.button>
                                  </Link>
                                )}
                                <p className="text-sm font-bold text-yellow-600 mt-2 flex items-center gap-1">
                                  <FaMoneyBillWave className="h-3 w-3" />
                                  ฿{rental.total_amount_due?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.9 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
                        <FaCreditCard className="h-10 w-10 text-yellow-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('renterDashboard.noPendingActions', 'No pending payments')}</h3>
                      <p className="text-gray-500 mb-4">No pending actions required</p>
                      <Link to={ROUTE_PATHS.HOME}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <FaSearch className="h-4 w-4" />
                          {t('renterDashboard.browseItems')}
                          <FaArrowRight className="h-4 w-4" />
                        </motion.button>
                      </Link>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* PENDING APPROVAL */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <FaClock className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{t('renterDashboard.pendingApproval')}</h2>
                        <p className="text-blue-100 text-sm">Waiting for owner approval</p>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <span className="text-white font-bold text-lg">{pending_approval_rentals?.total || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {pending_approval_rentals?.data?.length > 0 ? (
                    <div className="space-y-4">
                      {pending_approval_rentals.data.map((rental, index) => {
                        const status = getStatusDisplay(rental.rental_status || '');
                        return (
                          <motion.div
                            key={rental.rental_uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <img 
                                  src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                                  alt={rental.product?.title}
                                  className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100"
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                                  <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate">
                                    {rental.product?.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1">
                                      <FaUser className="h-3 w-3" />
                                      {rental.owner?.first_name}
                                    </div>
                                  </div>
                                </Link>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                                  {status.icon}
                                  {status.text}
                                </span>
                                <p className="text-sm font-bold text-blue-600 mt-2 flex items-center gap-1">
                                  <FaMoneyBillWave className="h-3 w-3" />
                                  ฿{rental.total_amount_due?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 1.0 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                        <FaClock className="h-10 w-10 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('renterDashboard.noPendingApproval', 'No pending approvals')}</h3>
                      <p className="text-gray-500 mb-4">No rentals waiting for approval</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* COMPLETED RENTALS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <FaCheck className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{t('renterDashboard.completedRentals')}</h2>
                        <p className="text-gray-100 text-sm">Successfully completed rentals</p>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <span className="text-white font-bold text-lg">{completed_rentals?.total || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {completed_rentals?.data?.length > 0 ? (
                    <div className="space-y-4">
                      {completed_rentals.data.map((rental, index) => {
                        const status = getStatusDisplay(rental.rental_status || '');
                        return (
                          <motion.div
                            key={rental.rental_uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <img 
                                  src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                                  alt={rental.product?.title}
                                  className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100"
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                                  <h3 className="text-lg font-semibold text-gray-900 hover:text-gray-600 transition-colors truncate">
                                    {rental.product?.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1">
                                      <FaUser className="h-3 w-3" />
                                      {rental.owner?.first_name}
                                    </div>
                                  </div>
                                </Link>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                                  {status.icon}
                                  {status.text}
                                </span>
                                <p className="text-sm font-bold text-gray-600 mt-2 flex items-center gap-1">
                                  <FaMoneyBillWave className="h-3 w-3" />
                                  ฿{rental.total_amount_due?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 1.1 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <FaCheck className="h-10 w-10 text-gray-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('renterDashboard.noCompletedRentals', 'No completed rentals')}</h3>
                      <p className="text-gray-500 mb-4">No completed rentals yet</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* CANCELLED RENTALS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <FaTimes className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{t('renterDashboard.cancelledRentals')}</h2>
                        <p className="text-red-100 text-sm">Cancelled rental requests</p>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <span className="text-white font-bold text-lg">{cancelled_rentals?.total || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {cancelled_rentals?.data?.length > 0 ? (
                    <div className="space-y-4">
                      {cancelled_rentals.data.map((rental, index) => {
                        const status = getStatusDisplay(rental.rental_status || '');
                        return (
                          <motion.div
                            key={rental.rental_uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <img 
                                  src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                                  alt={rental.product?.title}
                                  className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100"
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                                  <h3 className="text-lg font-semibold text-gray-900 hover:text-red-600 transition-colors truncate">
                                    {rental.product?.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1">
                                      <FaUser className="h-3 w-3" />
                                      {rental.owner?.first_name}
                                    </div>
                                  </div>
                                </Link>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                                  {status.icon}
                                  {status.text}
                                </span>
                                <p className="text-sm font-bold text-red-600 mt-2 flex items-center gap-1">
                                  <FaMoneyBillWave className="h-3 w-3" />
                                  ฿{rental.total_amount_due?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 1.2 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
                        <FaTimes className="h-10 w-10 text-red-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('renterDashboard.noCancelledRentals', 'No cancelled rentals')}</h3>
                      <p className="text-gray-500 mb-4">No cancelled rentals</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* LATE RETURN RENTALS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <FaExclamationTriangle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{t('renterDashboard.lateReturnRentals')}</h2>
                        <p className="text-orange-100 text-sm">Overdue return rentals</p>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
                      <span className="text-white font-bold text-lg">{late_return_rentals?.total || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {late_return_rentals?.data?.length > 0 ? (
                    <div className="space-y-4">
                      {late_return_rentals.data.map((rental, index) => {
                        const status = getStatusDisplay(rental.rental_status || '');
                        return (
                          <motion.div
                            key={rental.rental_uid}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 1.2 + index * 0.1 }}
                            whileHover={{ y: -2, scale: 1.02 }}
                            className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-all duration-200"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <img 
                                  src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                                  alt={rental.product?.title}
                                  className="w-16 h-16 object-cover rounded-xl border-2 border-gray-100"
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                                  <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors truncate">
                                    {rental.product?.title}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                                    <div className="flex items-center gap-1">
                                      <FaUser className="h-3 w-3" />
                                      {rental.owner?.first_name}
                                    </div>
                                  </div>
                                </Link>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.color}`}>
                                  {status.icon}
                                  {status.text}
                                </span>
                                <p className="text-sm font-bold text-orange-600 mt-2 flex items-center gap-1">
                                  <FaMoneyBillWave className="h-3 w-3" />
                                  ฿{rental.total_amount_due?.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 1.3 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
                        <FaExclamationTriangle className="h-10 w-10 text-orange-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('renterDashboard.noLateReturnRentals', 'No late return rentals')}</h3>
                      <p className="text-gray-500 mb-4">No overdue rentals</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Quick Links Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mt-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                  <FaShieldAlt className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{t('renterDashboard.quickLinks')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group"
                >
                  <Link to={ROUTE_PATHS.HOME} className="flex items-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 border border-blue-200 hover:border-blue-300">
                    <div className="p-3 bg-blue-500 rounded-xl mr-4 group-hover:bg-blue-600 transition-colors">
                      <FaSearch className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="text-blue-600 font-semibold text-lg">{t('renterDashboard.browseItems')}</span>
                      <p className="text-sm text-gray-600 mt-1">ค้นหาสินค้าใหม่</p>
                    </div>
                    <FaArrowRight className="h-4 w-4 text-blue-400 ml-auto group-hover:text-blue-600 transition-colors" />
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group"
                >
                  <Link to={ROUTE_PATHS.MY_RENTALS_RENTER} className="flex items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 border border-green-200 hover:border-green-300">
                    <div className="p-3 bg-green-500 rounded-xl mr-4 group-hover:bg-green-600 transition-colors">
                      <FaHistory className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="text-green-600 font-semibold text-lg">{t('renterDashboard.rentalHistory')}</span>
                      <p className="text-sm text-gray-600 mt-1">ดูประวัติการเช่าทั้งหมด</p>
                    </div>
                    <FaArrowRight className="h-4 w-4 text-green-400 ml-auto group-hover:text-green-600 transition-colors" />
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group"
                >
                  <Link to={ROUTE_PATHS.CHAT_INBOX} className="flex items-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200 border border-purple-200 hover:border-purple-300">
                    <div className="p-3 bg-purple-500 rounded-xl mr-4 group-hover:bg-purple-600 transition-colors">
                      <FaComments className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="text-purple-600 font-semibold text-lg">{t('renterDashboard.messages')}</span>
                      <p className="text-sm text-gray-600 mt-1">ข้อความและการสนทนา</p>
                    </div>
                    <FaArrowRight className="h-4 w-4 text-purple-400 ml-auto group-hover:text-purple-600 transition-colors" />
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group"
                >
                  <Link to={ROUTE_PATHS.PROFILE} className="flex items-center p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:from-orange-100 hover:to-red-100 transition-all duration-200 border border-orange-200 hover:border-orange-300">
                    <div className="p-3 bg-orange-500 rounded-xl mr-4 group-hover:bg-orange-600 transition-colors">
                      <FaUserCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="text-orange-600 font-semibold text-lg">{t('navbar.profile')}</span>
                      <p className="text-sm text-gray-600 mt-1">จัดการโปรไฟล์</p>
                    </div>
                    <FaArrowRight className="h-4 w-4 text-orange-400 ml-auto group-hover:text-orange-600 transition-colors" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};
