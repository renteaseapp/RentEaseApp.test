import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyRentals, getProductReviews } from '../../services/rentalService';
import { Rental, ApiError, PaginatedResponse, RentalStatus, Review } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';

export const MyRentalsPage: React.FC = () => {
  const { user } = useAuth();
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

  const getStatusBadgeClass = (status: RentalStatus): string => {
    switch (status) {
      case RentalStatus.COMPLETED:
        return 'bg-green-100 text-green-700';
      case RentalStatus.ACTIVE:
        return 'bg-blue-100 text-blue-700';
      case RentalStatus.PENDING_PAYMENT:
        return 'bg-yellow-100 text-yellow-700';
      case RentalStatus.RETURN_PENDING:
        return 'bg-purple-100 text-purple-700';
      case RentalStatus.LATE_RETURN:
        return 'bg-red-100 text-red-700';
      case RentalStatus.CANCELLED_BY_RENTER:
      case RentalStatus.CANCELLED_BY_OWNER:
      case RentalStatus.REJECTED_BY_OWNER:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('my_rentals_as_renter')}</h1>

      <div className="mb-6 flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
        <div>
          <label htmlFor="statusFilter" className="mr-2 font-medium">{t('filter_by_status')}</label>
          <select 
            id="statusFilter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded-md shadow-sm"
          >
            {RENTAL_STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder={t('search_rentals')}
            value={pendingSearch}
            onChange={e => setPendingSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="p-2 border rounded-md shadow-sm w-full"
          />
          <Button variant="primary" onClick={handleSearch}>{t('search')}</Button>
        </div>
      </div>

      {rentalsResponse && rentalsResponse.data.length > 0 ? (
        (() => {
          const filteredRentals = search
            ? rentalsResponse.data.filter(r =>
                r.product?.title?.toLowerCase().includes(search.toLowerCase())
              )
            : rentalsResponse.data;
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRentals.map(rental => (
                <Card key={rental.id} className="overflow-hidden flex flex-col md:flex-row gap-0 md:gap-4 border border-gray-100 shadow-md hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-full md:w-40 h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {rental.product?.primary_image?.image_url ? (
                      <img src={rental.product.primary_image.image_url} alt={rental.product.title} className="object-cover w-full h-full rounded-l-xl" />
                    ) : (
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a4 4 0 004 4h10a4 4 0 004-4V7a4 4 0 00-4-4H7a4 4 0 00-4 4z" /></svg>
                    )}
                  </div>
                  {/* Info */}
                  <CardContent className="flex-1 flex flex-col justify-between p-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))} className="text-lg font-bold text-blue-700 hover:underline">
                          {rental.product?.title || 'N/A'}
                        </Link>
                        {rental.product?.category?.name && (
                          <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">{rental.product.category.name}</span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeClass(rental.rental_status)}`}>{getStatusText(rental.rental_status)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">Rental ID: {rental.rental_uid.substring(0,8)}...</div>
                      <div className="flex flex-wrap gap-4 mb-2 text-sm text-gray-700">
                        <span>{t('renterRentalDetailPage.labels.rentalPeriod', 'ช่วงเช่า')}: <b>{new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</b></span>
                        <span>{t('renterRentalDetailPage.labels.owner', 'เจ้าของ')}: <b>{rental.owner?.first_name || 'N/A'} {rental.owner?.last_name || ''}</b></span>
                      </div>
                      {/* Actual Pickup Time: show only if status is confirmed, active, or completed */}
                      {['confirmed', 'active', 'completed'].includes(rental.rental_status) && rental.actual_pickup_time && (
                        <div className="mb-2 text-sm text-green-700">
                          {t('renterRentalDetailPage.labels.actualPickup', 'Actual Pickup')}: <b>{new Date(rental.actual_pickup_time).toLocaleString()}</b>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 mb-2 text-sm text-gray-700">
                        <span>{t('renterRentalDetailPage.labels.totalPaid', 'ยอดชำระ')}: <b className="text-blue-700">฿{(rental.final_amount_paid || rental.total_amount_due).toLocaleString()}</b></span>
                        <span>{t('renterRentalDetailPage.labels.bookedOn', 'จองเมื่อ')}: <b>{new Date(rental.created_at).toLocaleDateString()}</b></span>
                      </div>
                      {/* Return status info */}
                      {rental.rental_status === RentalStatus.RETURN_PENDING && (
                        <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                          <p className="text-sm text-purple-700">
                            <strong>ℹ️ {t('renterRentalDetailPage.status.return_pending_desc')}</strong>
                          </p>
                        </div>
                      )}
                      {rental.rental_status === RentalStatus.LATE_RETURN && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-700">
                            <strong>⚠️ {t('renterRentalDetailPage.status.late_return_desc')}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))}>
                        <Button variant="outline" size="sm">{t('view_details')}</Button>
                      </Link>
                      {rental.rental_status === RentalStatus.COMPLETED && !reviews[rental.id] && ( 
                        <Link to={ROUTE_PATHS.SUBMIT_REVIEW.replace(':rentalId', String(rental.id))}>
                          <Button variant="primary" size="sm">{t('leave_a_review')}</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {/* Pagination controls */}
              {rentalsResponse.meta.last_page > 1 && (
                <div className="mt-8 flex justify-center">
                  {Array.from({length: rentalsResponse.meta.last_page}, (_, i) => i + 1).map(page => (
                    <Button 
                      key={page}
                      onClick={() => fetchMyRentals(page)}
                      variant={page === rentalsResponse.meta.current_page ? 'primary' : 'ghost'}
                      size="sm"
                      className="mx-1"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        })()
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('no_rentals_found')}</h3>
          <p className="text-gray-500 mb-4">{t('start_by_browsing_items_to_rent')}</p>
          <Link to={ROUTE_PATHS.HOME}>
            <Button variant="primary">{t('browsing_items')}</Button>
          </Link>
        </div>
      )}
    </div>
  );
};
