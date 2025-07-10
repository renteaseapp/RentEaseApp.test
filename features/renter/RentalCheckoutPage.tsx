import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProductByID } from '../../services/productService';
import { createRentalRequest } from '../../services/rentalService';
import { Product, CreateRentalPayload, ApiError, RentalPickupMethod, UserAddress } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { InputField } from '../../components/ui/InputField';
import { ROUTE_PATHS } from '../../constants';


export const RentalCheckoutPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { user: authUser, token } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupMethod, setPickupMethod] = useState<RentalPickupMethod>(RentalPickupMethod.SELF_PICKUP);
  const [notes, setNotes] = useState('');
  // TODO: Add state for delivery address selection or new address form

  useEffect(() => {
    if (productId) {
      setIsLoadingProduct(true);
      getProductByID(Number(productId))
        .then(response => setProduct(response.data))
        .catch(err => setError((err as ApiError).message || "Failed to load product details."))
        .finally(() => setIsLoadingProduct(false));
    }
  }, [productId]);

  const calculateRentalDays = () => {
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end > start) {
            return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        }
    }
    return 0;
  };

  const rentalDays = calculateRentalDays();
  const subtotal = product && rentalDays > 0 ? product.rental_price_per_day * rentalDays : 0;
  const totalAmount = subtotal + (product?.security_deposit || 0); // Add other fees like delivery later


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !product || !productId || rentalDays <= 0) {
        setError("Please select valid dates and ensure product is loaded.");
        return;
    }
    setIsSubmitting(true);
    setError(null);

    const payload: CreateRentalPayload = {
        product_id: product.id,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        pickup_method: pickupMethod,
        notes_from_renter: notes,
        // delivery_address_id: ... if selected
        // new_delivery_address: ... if new
    };

    try {
        const newRental = await createRentalRequest(payload);
        // Redirect to payment page or rental detail page
        navigate(ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(newRental.id)));
    } catch (err) {
        setError((err as ApiError).message || "Failed to create rental request.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoadingProduct) return <LoadingSpinner message="Loading product for checkout..." />;
  if (error && !product) return <ErrorMessage message={error} />;
  if (!product) return <div className="p-4 text-center">Product not found.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Rental Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardContent>
              <h2 className="text-2xl font-semibold mb-4">Confirm Your Rental</h2>
              {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">{product.title}</h3>
                  <p className="text-sm text-gray-500">Price per day: ฿{product.rental_price_per_day.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="Start Date" type="date" name="start_date" value={startDate} onChange={e => setStartDate(e.target.value)} required 
                        min={new Date().toISOString().split('T')[0]} />
                    <InputField label="End Date" type="date" name="end_date" value={endDate} onChange={e => setEndDate(e.target.value)} required 
                        min={startDate || new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                    <label htmlFor="pickup_method" className="block text-sm font-medium text-gray-700 mb-1">Pickup Method</label>
                    <select name="pickup_method" id="pickup_method" value={pickupMethod} onChange={e => setPickupMethod(e.target.value as RentalPickupMethod)} className="block w-full p-2 border rounded-md shadow-sm">
                        <option value={RentalPickupMethod.SELF_PICKUP}>Self Pickup</option>
                        <option value={RentalPickupMethod.DELIVERY} disabled>Delivery (Coming Soon)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes for Owner (Optional)</label>
                    <textarea name="notes" id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="block w-full p-2 border rounded-md shadow-sm" placeholder="Any special requests or questions..."></textarea>
                </div>
                {/* TODO: Delivery Address Section */}
                <Button type="submit" isLoading={isSubmitting} fullWidth variant="primary" size="lg" disabled={rentalDays <= 0}>
                    Proceed to Confirmation
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1">
            <Card>
                <CardContent>
                    <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Product:</span><span className="font-medium">{product.title}</span></div>
                        <div className="flex justify-between"><span>Price per day:</span><span>฿{product.rental_price_per_day.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Rental Days:</span><span>{rentalDays > 0 ? rentalDays : '-'}</span></div>
                        <hr/>
                        <div className="flex justify-between"><span>Subtotal:</span><span>฿{subtotal.toLocaleString()}</span></div>
                        {product.security_deposit && <div className="flex justify-between"><span>Security Deposit:</span><span>฿{product.security_deposit.toLocaleString()}</span></div>}
                        {/* <div className="flex justify-between"><span>Platform Fee:</span><span>฿{platformFee.toLocaleString()}</span></div> */}
                        <hr/>
                        <div className="flex justify-between text-lg font-bold mt-2"><span>Total Amount:</span><span>฿{totalAmount.toLocaleString()}</span></div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};
