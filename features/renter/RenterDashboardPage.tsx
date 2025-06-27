import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { getRenterDashboardData } from '../../services/renterService';
import { RenterDashboardData, ApiError, } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';

export const RenterDashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showError } = useAlert();
  const [dashboardData, setDashboardData] = useState<RenterDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

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
        return { text: t('renterDashboard.status.active'), color: 'text-green-600 bg-green-100' };
      case 'pending_payment':
        return { text: t('renterDashboard.status.pendingPayment'), color: 'text-yellow-600 bg-yellow-100' };
      case 'pending_owner_approval':
        return { text: t('renterDashboard.status.pendingApproval'), color: 'text-blue-600 bg-blue-100' };
      case 'completed':
        return { text: t('renterDashboard.status.completed'), color: 'text-gray-600 bg-gray-100' };
      default:
        return { text: status.replace('_', ' ').toUpperCase(), color: 'text-gray-600 bg-gray-100' };
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
    <div className="container mx-auto p-0 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="bg-white md:rounded-xl md:shadow sticky top-6 h-fit md:h-[calc(100vh-48px)] flex md:flex-col flex-row md:items-stretch items-center md:py-8 py-2 md:px-4 px-2 z-10 border md:border-none">
          <nav aria-label="Renter dashboard sidebar" className="flex md:flex-col flex-row gap-2 md:gap-4 w-full">
            <NavLink to={ROUTE_PATHS.RENTER_DASHBOARD} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}` } aria-label={t('renterDashboard.title')} end>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1118 0 9 9 0 01-18 0zm9-4v4l3 3" /></svg>
              <span className="hidden md:inline">{t('renterDashboard.sidebar.dashboard')}</span>
            </NavLink>
            <NavLink to={ROUTE_PATHS.MY_RENTALS_RENTER} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}` } aria-label={t('renterDashboard.rentalHistory')} end>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span className="hidden md:inline">{t('renterDashboard.sidebar.myRentals')}</span>
            </NavLink>
            <NavLink to={ROUTE_PATHS.WISHLIST} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}` } aria-label={t('renterDashboard.wishlist')} end>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0l.318.318.318-.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
              <span className="hidden md:inline">{t('renterDashboard.sidebar.wishlist')}</span>
            </NavLink>
            <NavLink to={ROUTE_PATHS.CHAT_INBOX} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}` } aria-label={t('renterDashboard.messages')} end>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /><circle cx="8" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="16" cy="12" r="1" /></svg>
              <span className="hidden md:inline">{t('renterDashboard.sidebar.messages')}</span>
            </NavLink>
            <NavLink to={ROUTE_PATHS.PROFILE} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}` } aria-label={t('navbar.profile')} end>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="hidden md:inline">{t('renterDashboard.sidebar.profile')}</span>
            </NavLink>
            <NavLink to={ROUTE_PATHS.FAQ} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}` } aria-label="FAQ" end>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h.01M12 4h.01M4 12h.01M20 12h.01M8.464 8.464l.01.01M15.536 8.464l.01.01M8.464 15.536l.01.01M15.536 15.536l.01.01" /></svg>
              <span className="hidden md:inline">{t('renterDashboard.sidebar.faq')}</span>
            </NavLink>
            <NavLink to={ROUTE_PATHS.CONTACT_US} className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}` } aria-label="Contact Us" end>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span className="hidden md:inline">{t('renterDashboard.sidebar.contactUs')}</span>
            </NavLink>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1118 0 9 9 0 01-18 0zm9-4v4l3 3" /></svg>
              {t('renterDashboard.title')}
            </h1>
            <p className="text-gray-600">{t('renterDashboard.welcome', { name: user?.first_name || t('renterDashboard.user') })}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ACTIVE RENTALS */}
            <Card className="bg-green-50 border-green-200">
              <CardContent>
                <div className="flex items-center mb-4 gap-2">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <h2 className="text-xl font-semibold text-green-700 flex-1">{t('renterDashboard.activeRentals')}</h2>
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold">{current_active_rentals?.total || 0}</span>
                </div>
                {current_active_rentals?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {current_active_rentals.data.map(rental => {
                      const status = getStatusDisplay(rental.rental_status || '');
                      return (
                        <div key={rental.rental_uid} className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:bg-green-50 transition-colors">
                          <div className="flex-shrink-0">
                            <img 
                              src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                              alt={rental.product?.title}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          </div>
                          <div className="flex-grow">
                            <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">{rental.product?.title}</h3>
                              <p className="text-sm text-gray-500">{t('renterDashboard.owner')}: {rental.owner?.first_name}</p>
                              <p className="text-sm text-gray-500">{t('renterDashboard.returnBy')}: {formatDate(rental.end_date!)}</p>
                            </Link>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                            <p className="text-sm font-bold text-green-700 mt-1">฿{rental.total_amount_due?.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-green-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-gray-500 mb-2">{t('renterDashboard.noActiveRentals')}</p>
                    <Link to={ROUTE_PATHS.HOME}>
                      <Button variant="outline" size="lg" className="mt-2">{t('renterDashboard.browseItems')}</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CONFIRMED RENTALS */}
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent>
                <div className="flex items-center mb-4 gap-2">
                  <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                  <h2 className="text-xl font-semibold text-indigo-700 flex-1">{t('renterDashboard.confirmedRentals', 'ชำระเงินแล้ว รอเริ่มเช่า/รอเจ้าของยืนยัน')}</h2>
                  <span className="inline-block bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">{confirmed_rentals?.total || 0}</span>
                </div>
                {confirmed_rentals?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {confirmed_rentals.data.map(rental => {
                      const status = getStatusDisplay(rental.rental_status || '');
                      return (
                        <div key={rental.rental_uid} className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:bg-indigo-50 transition-colors">
                          <div className="flex-shrink-0">
                            <img 
                              src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                              alt={rental.product?.title}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          </div>
                          <div className="flex-grow">
                            <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">{rental.product?.title}</h3>
                              <p className="text-sm text-gray-500">{t('renterDashboard.owner')}: {rental.owner?.first_name}</p>
                            </Link>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                            <p className="text-sm font-bold text-indigo-700 mt-1">฿{rental.total_amount_due?.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-indigo-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                    <p className="text-gray-500 mb-2">{t('renterDashboard.noConfirmedRentals', 'ยังไม่มีรายการที่ชำระเงินแล้ว รอเริ่มเช่า')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PENDING PAYMENT */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent>
                <div className="flex items-center mb-4 gap-2">
                  <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                  <h2 className="text-xl font-semibold text-yellow-700 flex-1">{t('renterDashboard.pendingActions')}</h2>
                  <span className="inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold">{pending_action_rentals?.total || 0}</span>
                </div>
                {pending_action_rentals?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {pending_action_rentals.data.map(rental => {
                      const status = getStatusDisplay(rental.rental_status || '');
                      return (
                        <div key={rental.rental_uid} className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:bg-yellow-50 transition-colors">
                          <div className="flex-shrink-0">
                            <img 
                              src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                              alt={rental.product?.title}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          </div>
                          <div className="flex-grow">
                            <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">{rental.product?.title}</h3>
                              <p className="text-sm text-gray-500">{t('renterDashboard.owner')}: {rental.owner?.first_name}</p>
                            </Link>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                            {rental.rental_status === 'pending_payment' && (
                              <Link to={ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(rental.id))}>
                                <Button size="lg" variant="primary" className="mt-2 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2z" /></svg>
                                  {t('renterDashboard.proceedToPayment')}
                                </Button>
                              </Link>
                            )}
                            <p className="text-sm font-bold text-yellow-700 mt-1">฿{rental.total_amount_due?.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-yellow-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                    <p className="text-gray-500 mb-2">{t('renterDashboard.noPendingActions', 'No pending payments')}</p>
                    <Link to={ROUTE_PATHS.HOME}>
                      <Button variant="outline" size="lg" className="mt-2">{t('renterDashboard.browseItems')}</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* PENDING APPROVAL */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent>
                <div className="flex items-center mb-4 gap-2">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                  <h2 className="text-xl font-semibold text-blue-700 flex-1">{t('renterDashboard.pendingApproval')}</h2>
                  <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">{pending_approval_rentals?.total || 0}</span>
                </div>
                {pending_approval_rentals?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {pending_approval_rentals.data.map(rental => {
                      const status = getStatusDisplay(rental.rental_status || '');
                      return (
                        <div key={rental.rental_uid} className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:bg-blue-50 transition-colors">
                          <div className="flex-shrink-0">
                            <img 
                              src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                              alt={rental.product?.title}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          </div>
                          <div className="flex-grow">
                            <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">{rental.product?.title}</h3>
                              <p className="text-sm text-gray-500">{t('renterDashboard.owner')}: {rental.owner?.first_name}</p>
                            </Link>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                            <p className="text-sm font-bold text-blue-700 mt-1">฿{rental.total_amount_due?.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-blue-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01" /></svg>
                    <p className="text-gray-500 mb-2">{t('renterDashboard.noPendingApproval', 'No pending approvals')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* COMPLETED RENTALS */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent>
                <div className="flex items-center mb-4 gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  <h2 className="text-xl font-semibold text-green-700 flex-1">{t('renterDashboard.completedRentals')}</h2>
                  <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-bold">{completed_rentals?.total || 0}</span>
                </div>
                {completed_rentals?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {completed_rentals.data.map(rental => {
                      const status = getStatusDisplay(rental.rental_status || '');
                      return (
                        <div key={rental.rental_uid} className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex-shrink-0">
                            <img 
                              src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                              alt={rental.product?.title}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          </div>
                          <div className="flex-grow">
                            <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">{rental.product?.title}</h3>
                              <p className="text-sm text-gray-500">{t('renterDashboard.owner')}: {rental.owner?.first_name}</p>
                            </Link>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                            <p className="text-sm font-bold text-gray-700 mt-1">฿{rental.total_amount_due?.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <p className="text-gray-500 mb-2">{t('renterDashboard.noCompletedRentals', 'No completed rentals')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CANCELLED RENTALS */}
            <Card className="bg-red-50 border-red-200">
              <CardContent>
                <div className="flex items-center mb-4 gap-2">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  <h2 className="text-xl font-semibold text-red-700 flex-1">{t('renterDashboard.cancelledRentals')}</h2>
                  <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full font-bold">{cancelled_rentals?.total || 0}</span>
                </div>
                {cancelled_rentals?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {cancelled_rentals.data.map(rental => {
                      const status = getStatusDisplay(rental.rental_status || '');
                      return (
                        <div key={rental.rental_uid} className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:bg-red-50 transition-colors">
                          <div className="flex-shrink-0">
                            <img 
                              src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                              alt={rental.product?.title}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          </div>
                          <div className="flex-grow">
                            <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">{rental.product?.title}</h3>
                              <p className="text-sm text-gray-500">{t('renterDashboard.owner')}: {rental.owner?.first_name}</p>
                            </Link>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                            <p className="text-sm font-bold text-red-700 mt-1">฿{rental.total_amount_due?.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-red-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    <p className="text-gray-500 mb-2">{t('renterDashboard.noCancelledRentals', 'No cancelled rentals')}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* LATE RETURN RENTALS */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent>
                <div className="flex items-center mb-4 gap-2">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                  <h2 className="text-xl font-semibold text-orange-700 flex-1">{t('renterDashboard.lateReturnRentals')}</h2>
                  <span className="inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">{late_return_rentals?.total || 0}</span>
                </div>
                {late_return_rentals?.data?.length > 0 ? (
                  <div className="space-y-4">
                    {late_return_rentals.data.map(rental => {
                      const status = getStatusDisplay(rental.rental_status || '');
                      return (
                        <div key={rental.rental_uid} className="flex items-center space-x-4 p-4 border rounded-lg bg-white hover:bg-orange-50 transition-colors">
                          <div className="flex-shrink-0">
                            <img 
                              src={rental.product?.primary_image?.image_url || 'https://picsum.photos/seed/default/60'} 
                              alt={rental.product?.title}
                              className="w-16 h-16 object-cover rounded-lg border"
                            />
                          </div>
                          <div className="flex-grow">
                            <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id || rental.rental_uid))} className="block">
                              <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600">{rental.product?.title}</h3>
                              <p className="text-sm text-gray-500">{t('renterDashboard.owner')}: {rental.owner?.first_name}</p>
                            </Link>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>{status.text}</span>
                            <p className="text-sm font-bold text-orange-700 mt-1">฿{rental.total_amount_due?.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-orange-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                    <p className="text-gray-500 mb-2">{t('renterDashboard.noLateReturnRentals', 'No late return rentals')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Links Card */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('renterDashboard.quickLinks')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to={ROUTE_PATHS.HOME} className="flex items-center p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div>
                    <span className="text-blue-600 font-medium">{t('renterDashboard.browseItems')}</span>
                    <p className="text-sm text-gray-500">ค้นหาสินค้าใหม่</p>
                  </div>
                </Link>
                <Link to={ROUTE_PATHS.MY_RENTALS_RENTER} className="flex items-center p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <span className="text-blue-600 font-medium">{t('renterDashboard.rentalHistory')}</span>
                    <p className="text-sm text-gray-500">ดูประวัติการเช่าทั้งหมด</p>
                  </div>
                </Link>
                <Link to={ROUTE_PATHS.CHAT_INBOX} className="flex items-center p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div>
                    <span className="text-blue-600 font-medium">{t('renterDashboard.messages')}</span>
                    <p className="text-sm text-gray-500">ข้อความและการสนทนา</p>
                  </div>
                </Link>
                <Link to={ROUTE_PATHS.PROFILE} className="flex items-center p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <span className="text-blue-600 font-medium">{t('navbar.profile')}</span>
                    <p className="text-sm text-gray-500">จัดการโปรไฟล์</p>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};
