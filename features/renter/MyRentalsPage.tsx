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
  }, [statusFilter, search]);

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
              <option value="">All</option>
              {Object.values(RentalStatus).map(s => <option key={s} value={s}>{getStatusText(s)}</option>)}
          </select>
        </div>
        <div>
          <input
            type="text"
            placeholder={t('search_rentals')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="p-2 border rounded-md shadow-sm"
          />
        </div>
      </div>

      {rentalsResponse && rentalsResponse.data.length > 0 ? (
        <div className="space-y-6">
          {rentalsResponse.data.map(rental => (
            <Card key={rental.id} className="overflow-hidden">
              <CardContent>
                 <div className="flex flex-col md:flex-row justify-between md:items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-800 hover:text-blue-600">
                        <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))}>
                           Rental ID: {rental.rental_uid.substring(0,8)}... for {rental.product?.title || 'N/A'}
                        </Link>
                    </h2>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeClass(rental.rental_status)}`}>
                        {getStatusText(rental.rental_status)}
                    </span>
                </div>
                <p className="text-sm text-gray-600">Owner: {rental.owner?.first_name || 'N/A'} {rental.owner?.last_name || ''}</p>
                <p className="text-sm text-gray-600">Dates: {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</p>
                <p className="text-sm text-gray-600">Total Paid: ฿{(rental.final_amount_paid || rental.total_amount_due).toLocaleString()}</p>
                <p className="text-sm text-gray-500">Booked on: {new Date(rental.created_at).toLocaleDateString()}</p>
                
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
      ) : (
         <div className="text-center py-10 bg-white rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('no_rentals_found')}</h3>
            <p className="text-gray-500">{t('start_by_browsing_items_to_rent', { link: `<Link to=${ROUTE_PATHS.HOME} className='text-blue-600 hover:underline'>${t('browsing_items')}</Link>` })}</p>
        </div>
      )}
    </div>
  );
};
