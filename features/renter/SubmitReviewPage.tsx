import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRentalDetails, createReview } from '../../services/rentalService';
import { Rental, ReviewPayload, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';

const StarIcon: React.FC<{ filled: boolean; onClick?: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void; className?: string }> = 
    ({ filled, onClick, onMouseEnter, onMouseLeave, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={`h-8 w-8 cursor-pointer ${filled ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'} ${className}`} 
    viewBox="0 0 20 20" 
    fill="currentColor"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const SubmitReviewPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [ratingProduct, setRatingProduct] = useState(0);
  const [hoverRatingProduct, setHoverRatingProduct] = useState(0);
  const [ratingOwner, setRatingOwner] = useState(0);
  const [hoverRatingOwner, setHoverRatingOwner] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (rentalId && authUser?.id) {
      setIsLoading(true);
      getRentalDetails(rentalId, authUser.id, 'renter')
        .then(setRental)
        .catch(err => setError((err as ApiError).message || "Failed to load rental details for review."))
        .finally(() => setIsLoading(false));
    }
  }, [rentalId, authUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rental || !authUser?.id || ratingProduct === 0 || ratingOwner === 0) {
        setError("Please provide ratings for both product and owner.");
        return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const payload: ReviewPayload = {
        rental_id: rental.id,
        rating_product: ratingProduct,
        rating_owner: ratingOwner,
        comment: comment,
    };

    try {
        await createReview({
          rental_id: payload.rental_id,
          rating_product: payload.rating_product,
          rating_owner: payload.rating_owner,
          comment: payload.comment || ''
        });
        setSuccessMessage("Review submitted successfully! Thank you.");
        setTimeout(() => navigate(ROUTE_PATHS.MY_RENTALS_RENTER), 2000);
    } catch (err) {
        setError((err as ApiError).message || "Failed to submit review.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading rental for review..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center">Rental not found or not accessible for review.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Leave a Review</h1>
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-1">You are reviewing your rental of:</h2>
          <p className="text-lg text-blue-600 mb-4">{rental.product?.title}</p>
          <p className="text-sm text-gray-500 mb-4">Owner: {rental.owner?.first_name}</p>

          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded my-3">{successMessage}</div>}

          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate the Product</label>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                            <StarIcon 
                                key={star} 
                                filled={star <= (hoverRatingProduct || ratingProduct)}
                                onClick={() => setRatingProduct(star)}
                                onMouseEnter={() => setHoverRatingProduct(star)}
                                onMouseLeave={() => setHoverRatingProduct(0)}
                            />
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rate the Owner</label>
                     <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                            <StarIcon 
                                key={star} 
                                filled={star <= (hoverRatingOwner || ratingOwner)}
                                onClick={() => setRatingOwner(star)}
                                onMouseEnter={() => setHoverRatingOwner(star)}
                                onMouseLeave={() => setHoverRatingOwner(0)}
                            />
                        ))}
                    </div>
                </div>
                <div>
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Comments (Optional)</label>
                    <textarea 
                        id="comment" 
                        name="comment" 
                        rows={4}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Share your experience with the product and owner..."
                    ></textarea>
                </div>
                <Button type="submit" isLoading={isSubmitting} variant="primary" size="lg" disabled={ratingProduct === 0 || ratingOwner === 0}>
                    Submit Review
                </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
