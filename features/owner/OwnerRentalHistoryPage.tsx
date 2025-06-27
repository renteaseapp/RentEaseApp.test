import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getOwnerRentals } from '../../services/rentalService';
import { Rental, ApiError, PaginatedResponse, } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '../../constants';

// Status badge component with proper styling
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useTranslation();
  
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

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      {t(`ownerRentalHistoryPage.status.${status}`)}
    </span>
  );
};

// Pagination component
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();
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
    <div className="flex items-center justify-center space-x-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {t('ownerRentalHistoryPage.pagination.previous')}
      </Button>
      
      {pages.map(page => (
        <Button
          key={page}
          variant={page === currentPage ? "primary" : "outline"}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {t('ownerRentalHistoryPage.pagination.next')}
      </Button>
    </div>
  );
};

export const OwnerRentalHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rentalsResponse, setRentalsResponse] = useState<PaginatedResponse<Rental> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

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
      setError(apiError.message || t('ownerRentalHistoryPage.error.loadFailed'));
      console.error('Error fetching rental history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, statusFilter, searchTerm, dateFrom, dateTo, limit, t]);

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

  // Mock notifications (ควรดึงจาก backend จริง)
  const notifications = [];
  if (rentalsResponse?.data) {
    if (rentalsResponse.data.some(r => r.rental_status === 'return_pending')) {
      notifications.push('มีรายการรอคืนสินค้า');
    }
    if (rentalsResponse.data.some(r => r.rental_status === 'late_return')) {
      notifications.push('มีรายการคืนล่าช้า');
    }
    // เพิ่ม notification อื่น ๆ ตามต้องการ
  }

  if (isLoading && !rentalsResponse) return <LoadingSpinner message={t('ownerRentalHistoryPage.loadingHistory')} />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Breadcrumb */}
      <nav className="text-sm mb-4" aria-label="Breadcrumb">
        <ol className="list-reset flex text-gray-500">
          <li><Link to={ROUTE_PATHS.OWNER_DASHBOARD} className="hover:underline text-blue-600">Dashboard</Link></li>
          <li><span className="mx-2">/</span></li>
          <li className="text-gray-700 font-semibold">การเช่าทั้งหมด</li>
        </ol>
      </nav>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="mb-4">
          {notifications.map((msg, idx) => (
            <div key={idx} className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 mb-2 rounded">
              {msg}
            </div>
          ))}
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('ownerRentalHistoryPage.title')}</h1>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('ownerRentalHistoryPage.filters.searchProducts')}
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('ownerRentalHistoryPage.filters.searchPlaceholder')}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('ownerRentalHistoryPage.filters.status')}
                </label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('ownerRentalHistoryPage.filters.allStatus')}</option>
                  <option value="pending_owner_approval">{t('ownerRentalHistoryPage.status.pending_owner_approval')}</option>
                  <option value="pending_payment">{t('ownerRentalHistoryPage.status.pending_payment')}</option>
                  <option value="confirmed">{t('ownerRentalHistoryPage.status.confirmed')}</option>
                  <option value="active">{t('ownerRentalHistoryPage.status.active')}</option>
                  <option value="return_pending">{t('ownerRentalHistoryPage.status.return_pending')}</option>
                  <option value="completed">{t('ownerRentalHistoryPage.status.completed')}</option>
                  <option value="cancelled_by_renter">{t('ownerRentalHistoryPage.status.cancelled_by_renter')}</option>
                  <option value="cancelled_by_owner">{t('ownerRentalHistoryPage.status.cancelled_by_owner')}</option>
                  <option value="rejected_by_owner">{t('ownerRentalHistoryPage.status.rejected_by_owner')}</option>
                  <option value="dispute">{t('ownerRentalHistoryPage.status.dispute')}</option>
                  <option value="expired">{t('ownerRentalHistoryPage.status.expired')}</option>
                  <option value="late_return">{t('ownerRentalHistoryPage.status.late_return')}</option>
                </select>
              </div>

              {/* Date From */}
              <div>
                <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('ownerRentalHistoryPage.filters.fromDate')}
                </label>
                <input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('ownerRentalHistoryPage.filters.toDate')}
                </label>
                <input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="px-4 py-2"
              >
                {t('ownerRentalHistoryPage.filters.clearFilters')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="px-4 py-2"
              >
                {t('ownerRentalHistoryPage.filters.applyFilters')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4 gap-2">
        <Button
          type="button"
          variant={viewMode === 'grid' ? 'primary' : 'outline'}
          className="flex items-center gap-1"
          onClick={() => setViewMode('grid')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h4v4H4V6zm6 0h4v4h-4V6zm6 0h4v4h-4V6zM4 14h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" /></svg>
          {t('ownerRentalHistoryPage.view.grid')}
        </Button>
        <Button
          type="button"
          variant={viewMode === 'list' ? 'primary' : 'outline'}
          className="flex items-center gap-1"
          onClick={() => setViewMode('list')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          {t('ownerRentalHistoryPage.view.list')}
        </Button>
      </div>

      {/* Results Summary */}
      {rentalsResponse && (
        <div className="mb-4 text-sm text-gray-600">
          {t('ownerRentalHistoryPage.results.showing', {
            from: rentalsResponse.meta.from,
            to: rentalsResponse.meta.to,
            total: rentalsResponse.meta.total
          })}
        </div>
      )}

      {/* Rentals List */}
      {rentalsResponse?.data && rentalsResponse.data.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rentalsResponse.data.map((rental: Rental) => (
              <Card key={rental.id} className="hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-300 bg-white rounded-xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col h-full">
                    {/* Product Image */}
                    <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                      {rental.product?.primary_image?.image_url ? (
                        <img src={rental.product.primary_image.image_url} alt={rental.product.title} className="object-cover w-full h-full" />
                      ) : (
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4z" /></svg>
                      )}
                    </div>
                    {/* Card Content */}
                    <div className="flex-1 flex flex-col justify-between p-5">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate max-w-[70%]">{rental.product?.title || 'N/A'}</h3>
                          <StatusBadge status={rental.rental_status} />
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" /></svg>
                            <span className="font-medium">{t('ownerRentalHistoryPage.rentalCard.rentalId', { id: rental.rental_uid?.substring(0, 8) || rental.id.toString().substring(0, 8) })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            <span className="font-medium">{t('ownerRentalHistoryPage.rentalCard.renter')}</span> {rental.renter?.first_name || 'N/A'} {rental.renter?.last_name || ''}
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" /></svg>
                            <span className="font-medium">{t('ownerRentalHistoryPage.rentalCard.dates')}</span> {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V6m0 6v2m0 4h.01" /></svg>
                            <span className="font-medium">{t('ownerRentalHistoryPage.rentalCard.totalAmount')}</span> ฿{rental.total_amount_due?.toLocaleString() || '0'}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          {t('ownerRentalHistoryPage.rentalCard.bookedOn')} {new Date(rental.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Link to={`/owner/rentals/${rental.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            {t('ownerRentalHistoryPage.actions.viewDetails', 'ดูรายละเอียด')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {rentalsResponse.data.map((rental: Rental) => (
              <Card key={rental.id} className="hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-300 bg-white rounded-xl overflow-hidden">
                <CardContent className="flex flex-col md:flex-row items-center p-0">
                  {/* Product Image */}
                  <div className="w-full md:w-48 h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {rental.product?.primary_image?.image_url ? (
                      <img src={rental.product.primary_image.image_url} alt={rental.product.title} className="object-cover w-full h-full" />
                    ) : (
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4z" /></svg>
                    )}
                  </div>
                  {/* Card Content */}
                  <div className="flex-1 flex flex-col justify-between p-5 w-full">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate max-w-[70%]">{rental.product?.title || 'N/A'}</h3>
                        <StatusBadge status={rental.rental_status} />
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6" /></svg>
                          <span className="font-medium">{t('ownerRentalHistoryPage.rentalCard.rentalId', { id: rental.rental_uid?.substring(0, 8) || rental.id.toString().substring(0, 8) })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span className="font-medium">{t('ownerRentalHistoryPage.rentalCard.renter')}</span> {rental.renter?.first_name || 'N/A'} {rental.renter?.last_name || ''}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" /></svg>
                          <span className="font-medium">{t('ownerRentalHistoryPage.rentalCard.dates')}</span> {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V6m0 6v2m0 4h.01" /></svg>
                          <span className="font-medium">{t('ownerRentalHistoryPage.rentalCard.totalAmount')}</span> ฿{rental.total_amount_due?.toLocaleString() || '0'}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {t('ownerRentalHistoryPage.rentalCard.bookedOn')} {new Date(rental.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link to={`/owner/rentals/${rental.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          {t('ownerRentalHistoryPage.actions.viewDetails', 'ดูรายละเอียด')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-500 text-lg mb-2">
              {t('ownerRentalHistoryPage.results.noResults')}
            </div>
            <div className="text-gray-400">
              {t('ownerRentalHistoryPage.results.noResultsDescription')}
            </div>
          </CardContent>
        </Card>
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
  );
};
