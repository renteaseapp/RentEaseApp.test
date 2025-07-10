
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { adminGetRentalById, adminUpdateRentalStatus } from '../../services/adminService'; // Assuming these exist
import { Rental, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { getRentalDetails } from '../../services/rentalService'; // Can use this for viewing

export const AdminRentalDetailPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rentalId) {
      setIsLoading(true);
      getRentalDetails(Number(rentalId), 0, 'admin') // Using public getter, 0 for userId as admin bypasses user check
        .then(setRental)
        .catch(err => setError((err as ApiError).message || "Failed to load rental details."))
        .finally(() => setIsLoading(false));
    }
  }, [rentalId]);

  if (isLoading) return <LoadingSpinner message="Loading rental details..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center">Rental not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.ADMIN_MANAGE_RENTALS} className="text-blue-600 hover:underline mb-6 block">&larr; Back to All Rentals</Link>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin View: Rental {rental.rental_uid.substring(0,8)}...</h1>
      
      <Card className="mb-6">
        <CardContent>
            <h2 className="text-xl font-semibold mb-3">Rental Information</h2>
            <p><strong>Product:</strong> {rental.product?.title || rental.product_id}</p>
            <p><strong>Renter:</strong> {rental.renter?.first_name || rental.renter_id}</p>
            <p><strong>Owner:</strong> {rental.owner?.first_name || rental.owner_id}</p>
            <p><strong>Dates:</strong> {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> ฿{rental.total_amount_due.toLocaleString()}</p>
            <p><strong>Rental Status:</strong> {rental.rental_status.toUpperCase().replace(/_/g,' ')}</p>
            <p><strong>Payment Status:</strong> {rental.payment_status.toUpperCase().replace(/_/g,' ')}</p>
        </CardContent>
      </Card>
      
       <Card>
          <CardContent>
              <h2 className="text-xl font-semibold mb-3">Admin Actions</h2>
              <p className="italic text-gray-500">Rental status update forms and payment verification tools will appear here. (Coming Soon)</p>
               {/* Example:
                <select defaultValue={rental.rental_status}>...</select>
                <Button>Update Status</Button>
               */}
          </CardContent>
      </Card>
    </div>
  );
};
