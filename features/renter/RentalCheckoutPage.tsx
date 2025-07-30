import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getProductByID } from '../../services/productService';
import { createRentalRequest } from '../../services/rentalService';
import { Product, CreateRentalPayload, ApiError, RentalPickupMethod, UserAddress } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaShoppingCart, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaCreditCard, 
  FaBox, 
  FaUser, 
  FaStar, 
  FaClock, 
  FaShieldAlt,
  FaMoneyBillWave,
  FaArrowRight,
  FaCheckCircle,
  FaInfoCircle,
  FaTruck,
  FaHandshake
} from 'react-icons/fa';


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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg">
              <FaShoppingCart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Rental Checkout
              </h1>
              <p className="text-gray-600 text-lg">ยืนยันการเช่าสินค้า</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FaCheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Confirm Your Rental</h2>
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <ErrorMessage message={error} onDismiss={() => setError(null)} />
                </motion.div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <FaBox className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-800">{product.title}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <FaMoneyBillWave className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Price per day:</span>
                      <span className="font-semibold text-green-600">฿{product.rental_price_per_day.toLocaleString()}</span>
                    </div>
                    {product.security_deposit && (
                      <div className="flex items-center gap-2">
                        <FaShieldAlt className="h-4 w-4 text-purple-500" />
                        <span className="text-sm text-gray-600">Security deposit:</span>
                        <span className="font-semibold text-purple-600">฿{product.security_deposit.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                >
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FaCalendarAlt className="h-4 w-4 text-blue-500" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FaCalendarAlt className="h-4 w-4 text-green-500" />
                      End Date
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                      required
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  className="space-y-2"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaTruck className="h-4 w-4 text-orange-500" />
                    Pickup Method
                  </label>
                  <select
                    name="pickup_method"
                    id="pickup_method"
                    value={pickupMethod}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPickupMethod(e.target.value as RentalPickupMethod)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value={RentalPickupMethod.SELF_PICKUP}>Self Pickup</option>
                    <option value={RentalPickupMethod.DELIVERY} disabled>Delivery (Coming Soon)</option>
                  </select>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  className="space-y-2"
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaHandshake className="h-4 w-4 text-purple-500" />
                    Notes for Owner (Optional)
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    value={notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    placeholder="Any special requests or questions..."
                  />
                </motion.div>
                
                <motion.button
                  type="submit"
                  disabled={rentalDays <= 0 || isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
                    rentalDays <= 0 || isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FaArrowRight className="h-5 w-5" />
                      Proceed to Confirmation
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="md:col-span-1"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FaCreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Order Summary</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <FaBox className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold text-gray-800">{product.title}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per day:</span>
                      <span className="font-semibold">฿{product.rental_price_per_day.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rental Days:</span>
                      <span className="font-semibold">{rentalDays > 0 ? rentalDays : '-'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-lg">฿{subtotal.toLocaleString()}</span>
                  </div>
                  
                  {product.security_deposit && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FaShieldAlt className="h-4 w-4 text-purple-500" />
                        <span className="text-gray-600">Security Deposit:</span>
                      </div>
                      <span className="font-semibold">฿{product.security_deposit.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4">
                    <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                    <span className="text-xl font-bold text-blue-600">฿{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <FaInfoCircle className="h-4 w-4 text-yellow-600" />
                    <span className="font-semibold text-yellow-800">Important Note</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Please ensure your selected dates are correct. Changes may not be possible after confirmation.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
