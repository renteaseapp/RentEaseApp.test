import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product, ApiError, User } from '../../types';
import { getProductByID, getProvinces } from '../../services/productService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import OutOfStockNotifier from '../../components/common/OutOfStockNotifier';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { createRentalRequest, getProductReviews } from '../../services/rentalService';
import { getUserAddresses, addToWishlist, removeFromWishlist, checkWishlistStatus, getPublicUserProfile } from '../../services/userService';
import { RentalPickupMethod, UserAddress, UserIdVerificationStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';
import { sendMessage } from '../../services/chatService';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addDays, isAfter, format } from 'date-fns';
import { formatDate, formatDateLocale, getCurrentDate, addDays as addDaysTz } from '../../utils/timezoneUtils';
import { 
  calculateRentalSubtotal, 
  calculateTotalAmount, 
  formatCurrency,
  validateRentalDuration 
} from '../../utils/financialCalculations';
import { Tab, Tabs } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { settingsService, EstimatedFees } from '../../services/settingsService';
import { useRealtimeProduct } from '../../hooks/useRealtimeProduct';
import {
  FaStar,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaHeart,
  FaHeartBroken,
  FaShoppingCart,
  FaComments,
  FaEye,
  FaTag,
  FaShieldAlt,
  FaTruck,
  FaHandshake,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaPhone,
  FaEnvelope,
  FaWhatsapp,
  FaImage,
  FaThumbsUp,
  FaThumbsDown,
  FaShare,
  FaBookmark,
  FaPrint,
  FaDownload,
  FaCalculator,
  FaMoneyBillWave,
  FaCopy,
  FaFacebook,
  FaInstagram
} from 'react-icons/fa';
import { FaLine } from 'react-icons/fa6';

const StarIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className }) => (
  <FaStar className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'} ${className}`} />
);

const LocationMarkerIcon = () => (
  <FaMapMarkerAlt className="h-5 w-5 mr-1 inline-block text-gray-500" />
);

// ProductReviews Component
const ProductReviews: React.FC<{ productId: number }> = ({ productId }) => {
  console.log('ProductReviews for productId:', productId);
  const [reviews, setReviews] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const limit = 5;

  useEffect(() => {
    setLoading(true);
    setError(null);
    // ถ้า page === 1 และ limit === 5 (default) ให้ไม่ส่ง params
    const params = page === 1 && limit === 5 ? {} : { page, limit };
    getProductReviews(productId, params)
      .then((res) => {
        setReviews(res.data);
        setMeta(res.meta);
      })
      .catch(() => {
        setError('เกิดข้อผิดพลาดในการโหลดรีวิวสินค้าสินค้า');
      })
      .finally(() => setLoading(false));
  }, [productId, page]);

  if (loading) return <div className="py-8 text-center">Loading reviews...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <motion.div
      className="mt-10 bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <FaThumbsUp className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">รีวิวสินค้า</h2>
      </div>

      {reviews.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FaThumbsUp className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">ยังไม่มีรีวิว</p>
        </motion.div>
      )}

      <div className="space-y-6">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
          >
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-700 flex items-center gap-1">
                  <FaStar className="w-4 h-4" />
                  คะแนนสินค้า:
                </span>
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} filled={i < review.rating_product} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-700 flex items-center gap-1">
                  <FaUser className="w-4 h-4" />
                  คะแนนเจ้าของ:
                </span>
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} filled={i < review.rating_owner} />
                ))}
              </div>
            </div>
            <div className="text-gray-700 mb-3 leading-relaxed bg-white p-4 rounded-lg border-l-4 border-blue-200">
              {review.comment}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="w-4 h-4" />
                <span>{new Date(review.created_at).toLocaleString()}</span>
              </div>
              {review.rentals && (
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4" />
                  <span>
                    ผู้รีวิว: {review.rentals.renter?.first_name
                      ? review.rentals.renter.first_name
                      : review.rentals.renter_id
                    }
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {meta && meta.last_page > 1 && (
        <motion.div
          className="flex justify-center gap-2 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${p === meta.current_page
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {p}
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export const ProductDetailPage: React.FC = () => {
  const { t } = useTranslation('productDetailPage');
  
  // Helper function to get localized status display text
  const getStatusDisplayText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'available': t('availability.available'),
      'rented_out': t('availability.rented_out'),
      'unavailable': t('availability.unavailable'),
      'pending_approval': t('availability.pending_approval'),
      'rejected': t('availability.rejected'),
      'hidden': t('availability.hidden'),
      'draft': t('availability.draft')
    };
    return statusMap[status] || status.replace('_', ' ').toUpperCase();
  };
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pickupMethod, setPickupMethod] = useState<RentalPickupMethod>(RentalPickupMethod.SELF_PICKUP);
  const [notes, setNotes] = useState('');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | undefined>(undefined);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [contactingOwner, setContactingOwner] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);
  const [ownerDetailedProfile, setOwnerDetailedProfile] = useState<User | null>(null);
  const [loadingOwnerProfile, setLoadingOwnerProfile] = useState(false);
  const [ownerProfileError, setOwnerProfileError] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState({
    recipient_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    sub_district: '',
    district: '',
    province_id: 1,
    postal_code: '',
    address_type: 'shipping',
    is_default: true,
    notes: ''
  });
  const [addingAddress, setAddingAddress] = useState(false);
  const [addAddressError, setAddAddressError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<{ id: number, name_th: string }[]>([]);
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [tab, setTab] = useState(0);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [inWishlist, setInWishlist] = useState<boolean | null>(null);
  
  // Fee estimation states
  const [estimatedFees, setEstimatedFees] = useState<EstimatedFees | null>(null);
  const [isLoadingFees, setIsLoadingFees] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Realtime product updates
  const productId = product?.id?.toString();
  const { product: realtimeProduct, quantityData, isConnected: isRealtimeConnected } = useRealtimeProduct({
    productId: productId || ''
  });

  // Update local product state when realtime data comes in
  useEffect(() => {
    if (realtimeProduct && product) {
      // Merge realtime data with existing product data to preserve required fields
      setProduct({
        ...product,
        ...realtimeProduct,
        // Preserve slug from original product if realtime data doesn't have it
        slug: realtimeProduct.slug || product.slug
      } as unknown as Product);
    }
  }, [realtimeProduct, product]);

  // Calculate tomorrow's date for min start date
  const today = getCurrentDate().toDate();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  useEffect(() => {
    if (!slugOrId) {
      setError(t('missingProductId'));
      setIsLoading(false);
      return;
    }

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getProductByID(slugOrId);
        setProduct(response.data);
        if (response.data.images && response.data.images.length > 0) {
          const primary = response.data.images.find(img => img.is_primary);
          setSelectedImage(primary ? primary.image_url : response.data.images[0].image_url);
        } else if (response.data.primary_image) {
          setSelectedImage(response.data.primary_image.image_url);
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load product details.'); // Translate
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slugOrId, t]);

  useEffect(() => {
    if (showRentalModal && pickupMethod === RentalPickupMethod.DELIVERY && authUser) {
      setIsLoadingAddresses(true);
      getUserAddresses()
        .then(addresses => {
          const shipping = addresses.filter(addr => addr.address_type === 'shipping');
          setAddresses(shipping.length > 0 ? shipping : addresses);
        })
        .catch(() => setAddresses([]))
        .finally(() => setIsLoadingAddresses(false));
    }
  }, [showRentalModal, pickupMethod, authUser]);

  useEffect(() => {
    if (showAddAddress) {
      getProvinces().then(res => setProvinces(res.data)).catch(() => setProvinces([]));
    }
  }, [showAddAddress]);

  useEffect(() => {
    if (startDateObj) setStartDate(format(startDateObj, 'yyyy-MM-dd'));
    else setStartDate('');
    if (endDateObj) setEndDate(format(endDateObj, 'yyyy-MM-dd'));
    else setEndDate('');
  }, [startDateObj, endDateObj]);

  useEffect(() => {
    if (authUser && product?.id) {
      setWishlistLoading(true);
      setWishlistError(null);
      checkWishlistStatus(product.id)
        .then(res => {
          // รองรับทั้ง { isInWishlist } และ { data: { isInWishlist } }
          const r: any = res;
          if (r && typeof r.isInWishlist === 'boolean') {
            setInWishlist(r.isInWishlist);
          } else if (r && typeof r.data?.isInWishlist === 'boolean') {
            setInWishlist(r.data.isInWishlist);
          } else {
            setInWishlist(false);
          }
        })
        .catch(() => setInWishlist(false))
        .finally(() => setWishlistLoading(false));
    } else {
      setInWishlist(null);
    }
  }, [authUser, product?.id]);

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
  const subtotal = calculateRentalSubtotal(product?.rental_price_per_day || 0, rentalDays);
  const totalAmount = calculateTotalAmount(subtotal, product?.security_deposit || 0, estimatedFees);

  // Calculate estimated fees when rental parameters change
  useEffect(() => {
    if (subtotal > 0 && product?.id) {
      setIsLoadingFees(true);
      setFeeError(null);
      
      console.log('🔍 Calling calculateEstimatedFees:', {
        subtotalRentalFee: subtotal,
        pickupMethod,
        productId: product.id
      });
      
      settingsService.calculateEstimatedFees(subtotal, pickupMethod)
        .then(fees => {
          console.log('✅ API Response - calculateEstimatedFees:', fees);
          
          // Validate API response
          if (!fees || typeof fees.total_amount_estimate !== 'number') {
            console.error('❌ Invalid API response format:', fees);
            setFeeError('Invalid fee calculation response from server');
            setEstimatedFees(null);
            return;
          }
          
          setEstimatedFees(fees);
          console.log('✅ Estimated fees set successfully:', fees);
        })
        .catch(err => {
          console.error('❌ Error calculating fees:', err);
          setFeeError(err.message || 'Failed to calculate fees');
          setEstimatedFees(null);
        })
        .finally(() => {
          setIsLoadingFees(false);
        });
    } else {
      console.log('🔍 Skipping fee calculation:', { subtotal, productId: product?.id });
      setEstimatedFees(null);
      setFeeError(null);
    }
  }, [subtotal, pickupMethod, product?.id]);

  // Calculate the correct total amount including fees
  const getCorrectTotalAmount = () => {
    console.log('🔍 Debug getCorrectTotalAmount:', {
      subtotal,
      securityDeposit: product?.security_deposit || 0,
      estimatedFees,
      pickupMethod
    });
    
    if (estimatedFees) {
      // ถ้ามี estimated fees ให้ใช้ค่าจาก API
      // ใช้ total_estimated_fees (ค่าธรรมเนียม) + subtotal (ค่าเช่า) + securityDeposit (ค่ามัดจำ)
      const total = subtotal + (product?.security_deposit || 0) + estimatedFees.total_estimated_fees;
      console.log('✅ Total with estimated fees:', {
        subtotal,
        securityDeposit: product?.security_deposit || 0,
        totalEstimatedFees: estimatedFees.total_estimated_fees,
        total
      });
      return total;
    } else {
      // ถ้าไม่มี estimated fees ให้ใช้ค่าปกติ
      const total = subtotal + (product?.security_deposit || 0);
      console.log('✅ Total without estimated fees:', {
        subtotal,
        securityDeposit: product?.security_deposit || 0,
        total
      });
      return total;
    }
  };

  const correctTotalAmount = getCorrectTotalAmount();
  
  // Debug logging
  console.log('🔍 Debug ProductDetailPage calculations:', {
    rentalDays,
    productRentalPrice: product?.rental_price_per_day,
    subtotal,
    securityDeposit: product?.security_deposit,
    estimatedFees,
    correctTotalAmount,
    pickupMethod
  });

  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !product || rentalDays <= 0) {
      setFormError(t('formInvalid'));
      return;
    }
    if (pickupMethod === RentalPickupMethod.DELIVERY && !selectedAddressId) {
      setFormError(t('selectDeliveryAddress'));
      return;
    }
    
    // Validate rental duration using utility function
    const durationValidation = validateRentalDuration(
      startDate, 
      endDate, 
      product.min_rental_duration_days || 1, 
      product.max_rental_duration_days || undefined
    );
    
    if (!durationValidation.isValid) {
      setFormError(durationValidation.error || "Invalid rental duration.");
      return;
    }
    
    // Validate start date must be in the future (at least tomorrow)
    if (new Date(startDate) < tomorrow) {
      setFormError(t('startDateMustBeFuture'));
      return;
    }
    
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    const payload: any = {
      product_id: product.id,
      start_date: startDate,
      end_date: endDate,
      pickup_method: pickupMethod,
    };
    if (pickupMethod === RentalPickupMethod.DELIVERY) {
      if (!selectedAddressId) {
        setFormError(t('selectDeliveryAddress'));
        return;
      }
      payload.delivery_address_id = selectedAddressId;
    }
    if (notes) {
      payload.notes_from_renter = notes;
    }
    // Ensure no delivery_address_id for self_pickup
    if (pickupMethod === RentalPickupMethod.SELF_PICKUP && payload.delivery_address_id) {
      delete payload.delivery_address_id;
    }
    console.log('Rental payload:', payload);
    try {
      const newRental = await createRentalRequest(payload);
      console.log('newRental:', newRental);
      if (!newRental.id) {
        setFormError('Rental ID is missing from API response.');
        return;
      }
      setFormSuccess(t('rentalRequestSuccess'));
      setShowRentalModal(false);
      
      // แสดงข้อความ success สั้นๆ แล้วไปหน้า PaymentPage
      setTimeout(() => {
        navigate(ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(newRental.id)));
      }, 1500);
    } catch (err) {
      setFormError(
        (err as any)?.response?.data?.message ||
        (err as ApiError).message ||
        t('rentalRequestFailed')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactOwner = async () => {
    if (!authUser || !product?.owner?.id) return;
    setContactingOwner(true);
    try {
      const productUrl = window.location.href;
      const messageText = t('defaultContactMessage', { product: product.title }) + '\n' + productUrl;
      const msg = await sendMessage({
        receiver_id: product.owner.id,
        message_content: messageText,
        related_product_id: product.id
      });
      console.log('sendMessage result:', msg);
      if (msg && msg.conversation_id) {
        navigate(ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(msg.conversation_id)));
      } else {
        alert('No conversation_id returned from API. msg=' + JSON.stringify(msg));
      }
    } catch (err: any) {
      console.error('Contact owner error:', err);
      let msg = t('errors.contactOwner');
      if (err?.response?.data?.message) msg = err.response.data.message;
      else if (err?.message) msg = err.message;
      alert(msg);
    } finally {
      setContactingOwner(false);
    }
  };

  const handleViewOwnerProfile = async () => {
    if (!product?.owner?.id) return;
    
    setShowOwnerProfile(true);
    setLoadingOwnerProfile(true);
    setOwnerProfileError(null);
    
    try {
      const detailedProfile = await getPublicUserProfile(product.owner.id);
      setOwnerDetailedProfile(detailedProfile);
    } catch (err: any) {
      setOwnerProfileError(err?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลเจ้าของสินค้า');
      console.error('Error fetching owner profile:', err);
    } finally {
      setLoadingOwnerProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAddress(true);
    setAddAddressError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.post('https://renteaseapi-test.onrender.com/api/users/me/addresses', newAddress, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      // refresh addresses list
      getUserAddresses()
        .then(addresses => {
          const shipping = addresses.filter(addr => addr.address_type === 'shipping');
          const finalList = shipping.length > 0 ? shipping : addresses;
          setAddresses(finalList);
          // เลือก address ที่เพิ่งเพิ่ม (id ล่าสุด)
          if (res.data?.data?.id) {
            setSelectedAddressId(res.data.data.id);
          }
          setShowAddAddress(false);
          setNewAddress({
            recipient_name: '',
            phone_number: '',
            address_line1: '',
            address_line2: '',
            sub_district: '',
            district: '',
            province_id: 1,
            postal_code: '',
            address_type: 'shipping',
            is_default: true,
            notes: ''
          });
        });
    } catch (err: any) {
      setAddAddressError(err?.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มที่อยู่');
    } finally {
      setAddingAddress(false);
    }
  };

  const handleWishlistClick = async () => {
    if (!authUser || !product?.id) return;
    setWishlistLoading(true);
    setWishlistError(null);
    try {
      if (inWishlist) {
        await removeFromWishlist(product.id);
        setInWishlist(false);
      } else {
        await addToWishlist(product.id);
        setInWishlist(true);
      }
    } catch (err: any) {
      setWishlistError(err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setWishlistLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={t('loadingDetails')} />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} title={t('general.error')} />
        <div className="mt-4 text-center">
          <Button
            variant="primary"
            onClick={() => window.history.back()}
          >
            {t('general.goBack')}
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-10">{t('productNotFound')}</div>;
  }

  const allImages = product.images || (product.primary_image ? [product.primary_image] : []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="bg-white shadow-2xl rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Gallery Section */}
            <div className="flex flex-row items-start p-4 sm:p-8">
              {/* Thumbnails vertical */}
              {allImages.length > 1 && (
                <div className="flex flex-col space-y-2 mr-4">
                  {allImages.map((img, index) => (
                    <button
                      key={img.id || index}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 focus:outline-none transition-all duration-200
                      ${selectedImage === img.image_url ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent hover:border-gray-300'}`}
                    >
                      <img src={img.image_url} alt={`${product.title} thumbnail ${index + 1}`} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
              {/* Main Image */}
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full aspect-w-16 aspect-h-12 rounded-xl overflow-hidden shadow-lg border border-gray-100 max-w-md mx-auto">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={product.title}
                      className="object-contain w-full h-full max-h-[400px] sm:max-h-[500px] transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">{t('noImage')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Product Info Section */}
            <div className="p-8 flex flex-col justify-between">
              <div>
                {/* Header with title and category */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight break-words">
                      {product.title}
                    </h1>
                    {product.category && (
                      <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                        <FaTag className="w-4 h-4" />
                        {product.category.name}
                      </span>
                    )}
                  </div>

                  {/* Rating and stats */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} filled={i < Math.round(product.average_rating || 0)} />
                      ))}
                      <span className="text-gray-600 text-sm font-medium">
                        {t('reviewsCount', { count: product.total_reviews || 0 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <FaEye className="w-4 h-4" />
                      <span className="text-sm">{t('viewedCount', { count: product.view_count || 0 })}</span>
                    </div>
                    {/* Availability Status and Quantity */}
                    <div className="flex flex-wrap items-center gap-3">
                      {product.availability_status && (
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${product.availability_status === 'available'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : product.availability_status === 'rented_out'
                            ? 'bg-orange-100 text-orange-700 border border-orange-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                          {product.availability_status === 'available' ? (
                            <FaCheckCircle className="w-4 h-4" />
                          ) : product.availability_status === 'rented_out' ? (
                            <FaClock className="w-4 h-4" />
                          ) : (
                            <FaExclamationTriangle className="w-4 h-4" />
                          )}
                          {t('statusLabel')} {getStatusDisplayText(product.availability_status)}
                        </span>
                      )}

                      {/* Quantity Available Display */}
                      {product.quantity_available !== undefined && (
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${product.quantity_available > 0
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                          <FaTag className="w-4 h-4" />
                          {t('quantityAvailable', { count: product.quantity_available })}
                        </span>
                      )}

                      {/* Realtime Connection Status */}
                      {isRealtimeConnected && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          {t('realtimeActive')}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Price Section */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex flex-wrap items-baseline gap-4 mb-3">
                      <span className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ฿{(product.rental_price_per_day ?? 0).toLocaleString()}
                      </span>
                      <span className="text-xl text-gray-600 font-medium">{t('pricePerDay')}</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {product.rental_price_per_week && (
                        <span className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 shadow-sm border">
                          <FaCalendarAlt className="w-4 h-4 text-blue-500" />
                          ฿{(product.rental_price_per_week ?? 0).toLocaleString()} {t('pricePerWeek')}
                        </span>
                      )}
                      {product.rental_price_per_month && (
                        <span className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 shadow-sm border">
                          <FaCalendarAlt className="w-4 h-4 text-purple-500" />
                          ฿{(product.rental_price_per_month ?? 0).toLocaleString()} {t('pricePerMonth')}
                        </span>
                      )}
                      {product.security_deposit && (
                        <span className="inline-flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl text-sm font-semibold text-yellow-700 border border-yellow-200">
                          <FaShieldAlt className="w-4 h-4" />
                          {t('securityDeposit', { amount: (product.security_deposit ?? 0).toLocaleString() })}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Description */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaInfoCircle className="w-5 h-5 text-blue-500" />
                      {t('productDescription')}
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {product.description || <span className="italic text-gray-400">No description available.</span>}
                    </p>
                  </div>
                </motion.div>

                {/* Location and Duration */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="space-y-3">
                    {product.province && (
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                        <FaMapMarkerAlt className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="text-sm text-gray-600">{t('locationLabel')}</p>
                          <p className="font-semibold text-gray-800">{t('location', { locationName: product.province.name_th })}</p>
                        </div>
                      </div>
                    )}
                    {product.min_rental_duration_days && product.max_rental_duration_days && (
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                        <FaClock className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">{t('rentalDurationLabel')}</p>
                          <p className="font-semibold text-gray-800">
                            {product.min_rental_duration_days} - {product.max_rental_duration_days} {t('days')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {product.owner?.id !== authUser?.id ? (
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        size="lg"
                        variant="primary"
                        className={`w-full sm:w-auto px-8 py-4 text-lg font-bold shadow-lg ${product.availability_status === 'available' && (product.quantity_available || 0) > 0
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                          : 'bg-gray-400 cursor-not-allowed'
                          }`}
                        onClick={() => {
                          // ถ้าไม่ได้ login ให้ redirect ไปหน้า login
                          if (!authUser) {
                            navigate(ROUTE_PATHS.LOGIN);
                            return;
                          }
                          
                          // ถ้า login แล้วแต่ยังไม่ได้ verify ID
                          if (authUser.id_verification_status !== UserIdVerificationStatus.APPROVED && 
                              String(authUser.id_verification_status) !== 'verified') {
                            alert(t('pleaseVerifyIdentity'));
                            navigate(ROUTE_PATHS.PROFILE);
                            return;
                          }
                          
                          // ถ้าสินค้าพร้อมให้เช่า
                          if (product.availability_status === 'available' && (product.quantity_available || 0) > 0) {
                            setShowRentalModal(true);
                          }
                        }}
                        disabled={product.availability_status !== 'available' || (product.quantity_available || 0) <= 0}
                      >
                        <FaShoppingCart className="w-5 h-5 mr-2" />
                        {!authUser 
                          ? t('loginToRentButton')
                          : product.availability_status === 'available' && (product.quantity_available || 0) > 0
                            ? t('requestToRentButton')
                            : product.availability_status === 'rented_out'
                              ? t('productFullyRented')
                              : t('notAvailableForRent')
                        }
                      </Button>
                      <Button
                        size="lg"
                        variant="ghost"
                        className="w-full sm:w-auto px-8 py-4 text-lg font-bold border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => {
                          // ถ้าไม่ได้ login ให้ redirect ไปหน้า login
                          if (!authUser) {
                            navigate(ROUTE_PATHS.LOGIN);
                            return;
                          }
                          
                          // ถ้า login แล้วให้ทำงานปกติ
                          handleWishlistClick();
                        }}
                        disabled={wishlistLoading}
                        isLoading={wishlistLoading}
                      >
                        {!authUser ? (
                          <>
                            <FaHeart className="w-5 h-5 mr-2 text-red-500" />
                            {t('addToFavoritesButton')}
                          </>
                        ) : inWishlist ? (
                          <>
                            <FaHeartBroken className="w-5 h-5 mr-2 text-red-500" />
                            {t('removeFromWishlistButton')}
                          </>
                        ) : (
                          <>
                            <FaHeart className="w-5 h-5 mr-2 text-red-500" />
                            {t('addToWishlistButton')}
                          </>
                        )}
                      </Button>
                      {wishlistError && <div className="text-red-500 text-sm mt-2">{wishlistError}</div>}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
                      <FaUser className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">{t('thisIsYourOwnProduct')}</p>
                    </div>
                  )}

                  {/* Out of Stock Notifier */}
                  {product.availability_status === 'rented_out' || (product.quantity_available || 0) === 0 ? (
                    <OutOfStockNotifier
                      productId={product.id}
                      productTitle={product.title}
                      isOutOfStock={true}
                      className="mt-4"
                    />
                  ) : null}
                </motion.div>

                {/* Owner Info */}
                {product.owner && (
                  <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleViewOwnerProfile}
                          className="flex items-center gap-4 hover:scale-105 transition-transform duration-200 cursor-pointer"
                        >
                          {product.owner.profile_picture_url ? (
                            <img
                              src={product.owner.profile_picture_url}
                              alt={product.owner.first_name || 'Owner'}
                              className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg">
                              <span className="text-white text-xl font-bold">
                                {(product.owner.first_name || 'O')[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <h3 className="text-xl font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                              {product.owner.first_name}
                            </h3>
                            {product.owner.average_owner_rating !== undefined && product.owner.average_owner_rating !== null && (
                              <div className="flex items-center gap-2 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon key={i} filled={i < Math.round(product.owner?.average_owner_rating || 0)} className="h-4 w-4" />
                                ))}
                                <span className="text-sm text-gray-600">({product.owner.average_owner_rating.toFixed(1)})</span>
                              </div>
                            )}
                            {product.owner.created_at && (
                              <p className="text-sm text-gray-500 flex items-center gap-2">
                                <FaCalendarAlt className="w-4 h-4" />
                                {t('memberSince', { date: new Date(product.owner.created_at).toLocaleDateString() })}
                              </p>
                            )}
                            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                              <FaEye className="w-3 h-3" />
                              คลิกเพื่อดูโปรไฟล์
                            </p>
                          </div>
                        </button>
                        {product.owner.id !== authUser?.id ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            onClick={() => {
                              // ถ้าไม่ได้ login ให้ redirect ไปหน้า login
                              if (!authUser) {
                                navigate(ROUTE_PATHS.LOGIN);
                                return;
                              }
                              
                              // ถ้า login แล้วให้ทำงานปกติ
                              handleContactOwner();
                            }}
                            disabled={contactingOwner}
                            isLoading={contactingOwner}
                          >
                            <FaComments className="w-4 h-4 mr-2" />
                            {!authUser ? t('loginToContactButton') : t('contactOwnerButton')}
                          </Button>
                        ) : (
                          <div className="text-sm text-gray-400 text-center">
                            <FaUser className="w-5 h-5 mx-auto mb-1" />
                            {t('cannotChatWithOwnProduct')}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="p-6">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
              <Tab label={t('detailsTab')} />
              <Tab label={t('specsTab')} />
              <Tab label={t('tabs.reviews')} />
            </Tabs>
          </div>

          <div className="px-6 pb-6">
            {tab === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('productDetailPage.detailsTab', 'รายละเอียดสินค้า')}</h2>
                <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line bg-gray-50 p-6 rounded-xl">
                  {product.description || <span className="italic text-gray-400">No description available.</span>}
                </div>
                {product.condition_notes && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('productDetailPage.conditionNotes')}</h3>
                    <p className="text-gray-600 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">{product.condition_notes}</p>
                  </div>
                )}
                {product.address_details && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaMapMarkerAlt className="w-5 h-5 text-red-500" />
                      {t('productDetailPage.pickupLocation')}
                    </h3>
                    <p className="text-gray-600 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">{product.address_details}</p>
                  </div>
                )}
              </motion.div>
            )}
            {tab === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <FaInfoCircle className="w-6 h-6 text-white" />
                  </div>
                  {t('productDetailPage.specsTab', 'สเปค/คุณสมบัติ')}
                </h2>

                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(product.specifications).map(([key, value], index) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-300"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {index + 1}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">
                              {key}
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                              <p className="text-gray-700 leading-relaxed break-words">
                                {String(value)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    className="text-center py-16 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-200"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-6">
                      <FaInfoCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">
                      {t('productDetailPage.noSpecsTitle', 'ไม่มีข้อมูลสเปค')}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {t('productDetailPage.noSpecs', 'ไม่มีข้อมูลสเปค/คุณสมบัติ')}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
            {tab === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ProductReviews productId={product.id} />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Rental Request Modal */}
      {showRentalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            className="bg-white rounded-3xl shadow-2xl max-w-full sm:max-w-2xl w-full max-h-[95vh] overflow-hidden relative"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <button 
                className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl transition-colors duration-200 z-10" 
                onClick={() => setShowRentalModal(false)} 
                aria-label="ปิด"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaShoppingCart className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {t('productDetailPage.rentalRequestTitle')}
                  </h2>
                </div>
                <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                  {t('productDetailPage.rentalFormDescription', 'กรุณากรอกข้อมูลให้ครบถ้วนเพื่อส่งคำขอเช่าสินค้านี้')}
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
              {formError && (
                <motion.div 
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">เกิดข้อผิดพลาด</p>
                    <p className="text-red-600 text-sm">{formError}</p>
                  </div>
                  <button 
                    onClick={() => setFormError(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              )}
              
              {formSuccess && (
                <motion.div 
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FaCheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-green-800 font-medium">สำเร็จ!</p>
                    <p className="text-green-600 text-sm">{formSuccess}</p>
                    <p className="text-green-500 text-xs mt-1">กำลังไปหน้า PaymentPage...</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleRentalSubmit} className="space-y-8">
                {/* Step 1: Date Selection */}
                <motion.div 
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FaCalendarAlt className="w-5 h-5 text-blue-600" />
                        {t('productDetailPage.step1Title', 'เลือกช่วงวันที่ต้องการเช่า')}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('productDetailPage.step1Description', 'เลือกวันเริ่มต้นและวันสิ้นสุดที่ต้องการเช่า')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        {t('productDetailPage.startDateLabel', 'วันเริ่มต้น')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <DatePicker
                          selected={startDateObj}
                          onChange={date => setStartDateObj(date)}
                          minDate={addDaysTz(getCurrentDate(), 1).toDate()}
                          placeholderText="เลือกวันที่"
                          dateFormat="dd/MM/yyyy"
                          className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          showPopperArrow
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          isClearable
                          todayButton="วันนี้"
                          calendarStartDay={1}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaCalendarAlt className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        {t('productDetailPage.endDateLabel', 'วันสิ้นสุด')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <DatePicker
                          selected={endDateObj}
                          onChange={date => setEndDateObj(date)}
                          minDate={startDateObj ? addDaysTz(startDateObj, 1).toDate() : addDaysTz(getCurrentDate(), 2).toDate()}
                          disabled={!startDateObj}
                          placeholderText="เลือกวันที่"
                          dateFormat="dd/MM/yyyy"
                          className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                          showPopperArrow
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          isClearable
                          todayButton="วันนี้"
                          calendarStartDay={1}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaCalendarAlt className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {startDateObj && endDateObj && !isAfter(endDateObj, startDateObj) && (
                    <motion.div 
                      className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <FaExclamationTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-red-700 text-sm">
                        {t('productDetailPage.dateValidationError', 'วันสิ้นสุดต้องหลังวันเริ่มต้นอย่างน้อย 1 วัน')}
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Rental Duration Validation Message */}
                  {startDateObj && endDateObj && isAfter(endDateObj, startDateObj) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border ${
                        rentalDays >= (product?.min_rental_duration_days || 1) && 
                        (!product?.max_rental_duration_days || rentalDays <= product.max_rental_duration_days)
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {rentalDays >= (product?.min_rental_duration_days || 1) && 
                         (!product?.max_rental_duration_days || rentalDays <= product.max_rental_duration_days) ? (
                          <>
                            <FaCheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">
                              ระยะเวลาการเช่าถูกต้อง: {rentalDays} วัน
                            </span>
                          </>
                        ) : (
                          <>
                            <FaExclamationTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-700">
                              {rentalDays < (product?.min_rental_duration_days || 1) 
                                ? `ระยะเวลาการเช่าต้องอย่างน้อย ${product?.min_rental_duration_days || 1} วัน`
                                : `ระยะเวลาการเช่าไม่เกิน ${product?.max_rental_duration_days} วัน`
                              }
                            </span>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-blue-700 text-sm flex items-center gap-2">
                      <FaInfoCircle className="w-4 h-4 flex-shrink-0" />
                      {t('productDetailPage.datePickerNote', 'เลือกได้เฉพาะวันถัดไปจากวันนี้ขึ้นไป')}
                    </p>
                  </div>
                </motion.div>

                {/* Step 2: Pickup Method */}
                <motion.div 
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FaTruck className="w-5 h-5 text-green-600" />
                        {t('productDetailPage.step2Title', 'วิธีรับสินค้า')}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        เลือกวิธีการรับสินค้าที่สะดวกสำหรับคุณ
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPickupMethod(RentalPickupMethod.SELF_PICKUP)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        pickupMethod === RentalPickupMethod.SELF_PICKUP
                          ? 'border-green-500 bg-green-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-25'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          pickupMethod === RentalPickupMethod.SELF_PICKUP
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <FaHandshake className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{t('productDetailPage.selfPickupOption')}</p>
                          <p className="text-sm text-gray-600">รับสินค้าเองที่ร้าน</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPickupMethod(RentalPickupMethod.DELIVERY)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        pickupMethod === RentalPickupMethod.DELIVERY
                          ? 'border-green-500 bg-green-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-25'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          pickupMethod === RentalPickupMethod.DELIVERY
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <FaTruck className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{t('productDetailPage.deliveryOption')}</p>
                          <p className="text-sm text-gray-600">จัดส่งถึงที่อยู่</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>

                {/* Step 3: Delivery Address */}
                {pickupMethod === RentalPickupMethod.DELIVERY && (
                  <motion.div 
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">
                        3
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <FaMapMarkerAlt className="w-5 h-5 text-purple-600" />
                          {t('productDetailPage.step3Title', 'ที่อยู่สำหรับจัดส่ง')}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          เลือกที่อยู่ที่ต้องการให้จัดส่งสินค้า
                        </p>
                      </div>
                    </div>
                    
                    {isLoadingAddresses ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-3 text-purple-600">{t('productDetailPage.loadingAddresses')}</span>
                      </div>
                    ) : addresses.length > 0 ? (
                      <div className="space-y-4">
                        <select 
                          value={selectedAddressId || ''} 
                          onChange={e => setSelectedAddressId(Number(e.target.value))} 
                          className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                        >
                          <option value="">{t('productDetailPage.selectAddressOption')}</option>
                          {addresses.map(addr => (
                            <option key={addr.id} value={addr.id}>
                              {addr.recipient_name} - {addr.address_line1}, {addr.district}, {addr.province_name || addr.province_id}
                            </option>
                          ))}
                        </select>
                        
                        <button 
                          type="button" 
                          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200" 
                          onClick={() => setShowAddAddress(true)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          {t('productDetailPage.addNewAddress', 'เพิ่มที่อยู่ใหม่')}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaMapMarkerAlt className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-gray-600 mb-4">{t('productDetailPage.noAddressesFound')}</p>
                        <button 
                          type="button" 
                          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors duration-200" 
                          onClick={() => setShowAddAddress(true)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          {t('productDetailPage.addNewAddress', 'เพิ่มที่อยู่ใหม่')}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 4: Notes */}
                <motion.div 
                  className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FaComments className="w-5 h-5 text-orange-600" />
                        {t('productDetailPage.step4Title', 'หมายเหตุเพิ่มเติม')}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        ระบุรายละเอียดเพิ่มเติมที่ต้องการแจ้งเจ้าของสินค้า
                      </p>
                    </div>
                  </div>
                  
                  <textarea 
                    name="notes" 
                    id="notes" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    rows={3} 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white resize-none" 
                    placeholder={t('productDetailPage.notesPlaceholder')}
                  />
                </motion.div>

                {/* Summary */}
                <motion.div 
                  className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FaTag className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t('productDetailPage.rentalSummaryTitle', 'สรุปการเช่า')}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Rental Duration Information */}
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <FaClock className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">ข้อมูลระยะเวลาการเช่า</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">ระยะเวลาขั้นต่ำ:</span>
                          <span className="font-semibold text-green-700">
                            {product?.min_rental_duration_days || 1} วัน
                          </span>
                        </div>
                        {product?.max_rental_duration_days && (
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="h-4 w-4 text-orange-600" />
                            <span className="text-gray-700">ระยะเวลาสูงสุด:</span>
                            <span className="font-semibold text-orange-700">
                              {product.max_rental_duration_days} วัน
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">{t('productDetailPage.rentalDays', 'จำนวนวันที่เช่า')}</span>
                      <span className="font-semibold text-gray-900">{rentalDays > 0 ? `${rentalDays} วัน` : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">{t('productDetailPage.rentalPrice', 'ราคารวมค่าเช่า')}</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(subtotal || 0)}</span>
                    </div>
                    {product?.security_deposit && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-200">
                        <span className="text-gray-600 flex items-center gap-2">
                          <FaShieldAlt className="h-4 w-4 text-gray-500" />
                          {t('productDetailPage.securityDeposit', 'ค่ามัดจำ')}
                        </span>
                        <span className="font-semibold text-blue-600">{formatCurrency(product.security_deposit || 0)}</span>
                      </div>
                    )}

                    {/* Estimated Fees Section */}
                    {isLoadingFees && (
                      <div className="flex items-center justify-center py-3 text-sm text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                        {t('productDetailPage.loadingFeesMessage', 'กำลังคำนวณค่าธรรมเนียม...')}
                      </div>
                    )}

                    {feeError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-red-700">
                          <FaExclamationTriangle className="h-4 w-4" />
                          <span className="text-sm">{feeError}</span>
                        </div>
                      </div>
                    )}

                    {estimatedFees && !isLoadingFees && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <FaCalculator className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-blue-800">{t('productDetailPage.estimatedFeesLabel', 'ค่าธรรมเนียมโดยประมาณ')}</span>
                        </div>
                        
                        {estimatedFees.delivery_fee > 0 && (
                          <div className="flex justify-between items-center py-1 text-sm">
                            <span className="text-blue-700">{t('productDetailPage.estimatedDeliveryFeeLabel', 'ค่าส่งโดยประมาณ')}:</span>
                            <span className="font-semibold text-blue-800">{formatCurrency(estimatedFees.delivery_fee)}</span>
                          </div>
                        )}
                        
                        {estimatedFees.platform_fee_renter > 0 && (
                          <div className="flex justify-between items-center py-1 text-sm">
                            <span className="text-blue-700">{t('productDetailPage.estimatedPlatformFeeLabel', 'ค่าธรรมเนียมแพลตฟอร์มโดยประมาณ')}:</span>
                            <span className="font-semibold text-blue-800">{formatCurrency(estimatedFees.platform_fee_renter)}</span>
                          </div>
                        )}
                        
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-800 font-semibold">{t('productDetailPage.estimatedTotalLabel', 'ยอดรวมค่าธรรมเนียมโดยประมาณ')}:</span>
                            <span className="font-bold text-blue-800">{formatCurrency(estimatedFees.total_amount_estimate)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cost Summary */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FaCalculator className="h-4 w-4 text-gray-600" />
                        สรุปค่าใช้จ่าย
                      </h4>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">ค่าเช่า ({rentalDays} วัน × ฿{(product?.rental_price_per_day || 0).toLocaleString()}/วัน):</span>
                          <span className="font-semibold text-blue-600">{formatCurrency(subtotal)}</span>
                        </div>
                        
                        {product?.security_deposit && product.security_deposit > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">ค่ามัดจำ:</span>
                            <span className="font-semibold text-yellow-600">{formatCurrency(product.security_deposit)}</span>
                          </div>
                        )}
                        
                        {estimatedFees && !isLoadingFees && (
                          <>
                            {estimatedFees.delivery_fee > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">ค่าส่งโดยประมาณ:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(estimatedFees.delivery_fee)}</span>
                              </div>
                            )}
                            
                            {estimatedFees.platform_fee_renter > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">ค่าธรรมเนียมแพลตฟอร์มโดยประมาณ:</span>
                                <span className="font-semibold text-purple-600">{formatCurrency(estimatedFees.platform_fee_renter)}</span>
                              </div>
                            )}
                            
                            {estimatedFees.total_estimated_fees > 0 ? (
                              <>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                  <span>รวมค่าธรรมเนียม:</span>
                                  <span>{formatCurrency(estimatedFees.total_estimated_fees)}</span>
                                </div>
                                
                                {/* Explanation of total_amount_estimate */}
                                <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                                  <div className="font-semibold mb-1">หมายเหตุ:</div>
                                  <div>• total_amount_estimate (฿{estimatedFees.total_amount_estimate.toLocaleString()}): ค่าเช่า + ค่าธรรมเนียม</div>
                                  <div>• total_estimated_fees (฿{estimatedFees.total_estimated_fees.toLocaleString()}): ค่าธรรมเนียมเท่านั้น</div>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                                <div className="font-semibold mb-1">🎉 ไม่มีค่าธรรมเนียม!</div>
                                <div>• ไม่มีค่าธรรมเนียมแพลตฟอร์ม</div>
                                <div>• ไม่มีค่าส่ง (self-pickup)</div>
                                <div>• คุณจ่ายเฉพาะค่าเช่าและค่ามัดจำเท่านั้น</div>
                              </div>
                            )}
                          </>
                        )}
                        
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-800 font-semibold">ยอดรวมโดยประมาณ:</span>
                            <span className="font-bold text-gray-800">{formatCurrency(correctTotalAmount)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Detailed Calculation */}
                      <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <h5 className="font-semibold text-gray-800 mb-2 text-sm">การคำนวณ:</h5>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>ค่าเช่า: {rentalDays} วัน × ฿{(product?.rental_price_per_day || 0).toLocaleString()} = ฿{subtotal.toLocaleString()}</div>
                          {product?.security_deposit && product.security_deposit > 0 && (
                            <div>ค่ามัดจำ: ฿{(product.security_deposit).toLocaleString()}</div>
                          )}
                          {estimatedFees && !isLoadingFees && (
                            estimatedFees.total_estimated_fees > 0 ? (
                              <div>ค่าธรรมเนียมโดยประมาณ: ฿{(estimatedFees.total_estimated_fees).toLocaleString()}</div>
                            ) : (
                              <div className="text-green-600 font-semibold">🎉 ไม่มีค่าธรรมเนียม!</div>
                            )
                          )}
                          <div className="border-t border-gray-200 pt-1 font-semibold">
                            ยอดรวม: ฿{subtotal.toLocaleString()} + ฿{(product?.security_deposit || 0).toLocaleString()} + ฿{(estimatedFees?.total_estimated_fees || 0).toLocaleString()} = ฿{correctTotalAmount.toLocaleString()}
                          </div>
                        </div>
                        
                        {/* API Response Info */}
                        {estimatedFees && !isLoadingFees && (
                          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="font-semibold text-blue-800 mb-1">ข้อมูลจาก API:</div>
                            <div className="text-blue-700 space-y-1">
                              <div>• subtotal_rental_fee: ฿{estimatedFees.subtotal_rental_fee.toLocaleString()}</div>
                              <div>• platform_fee_renter: ฿{(estimatedFees.platform_fee_renter || 0).toLocaleString()}</div>
                              <div>• platform_fee_owner: ฿{(estimatedFees.platform_fee_owner || 0).toLocaleString()}</div>
                              <div>• delivery_fee: ฿{(estimatedFees.delivery_fee || 0).toLocaleString()}</div>
                              <div>• total_estimated_fees: ฿{(estimatedFees.total_estimated_fees || 0).toLocaleString()}</div>
                              <div>• total_amount_estimate: ฿{(estimatedFees.total_amount_estimate || 0).toLocaleString()}</div>
                              <div className="text-blue-600 font-semibold">
                                total_amount_estimate = subtotal_rental_fee + total_estimated_fees
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Calculation Note */}
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700 text-center">
                          <strong>หมายเหตุ:</strong> ยอดรวม = ค่าเช่า + ค่ามัดจำ + ค่าธรรมเนียมโดยประมาณ
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl px-4">
                      <span className="text-lg font-bold text-gray-900">{t('productDetailPage.totalAmount', 'ยอดที่ต้องชำระ')}</span>
                      <span className="text-2xl font-bold text-green-600">{formatCurrency(correctTotalAmount)}</span>
                    </div>

                    {/* Important Note */}
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FaInfoCircle className="h-4 w-4 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">{t('productDetailPage.importantNoteTitle', 'หมายเหตุสำคัญ')}</span>
                      </div>
                      <div className="space-y-2 text-sm text-yellow-700">
                        <p>
                          <strong>ค่าธรรมเนียม:</strong> ค่าธรรมเนียมจะถูกคำนวณและยืนยันเมื่อได้รับการอนุมัติการเช่า
                        </p>
                        <p>
                          <strong>ความแตกต่าง:</strong> ราคาที่แสดงในหน้านี้เป็นราคาโดยประมาณ ส่วนราคาจริงจะแสดงในหน้า PaymentPage หลังจากได้รับการอนุมัติ
                        </p>
                        <p>
                          <strong>การคำนวณ:</strong> 
                          <br />• <strong>ProductDetailPage:</strong> ค่าเช่า + ค่ามัดจำ + ค่าธรรมเนียมโดยประมาณ
                          <br />• <strong>PaymentPage:</strong> ค่าจริงที่คำนวณจาก backend หลังจากได้รับการอนุมัติ
                        </p>
                        <p>
                          <strong>สาเหตุของความแตกต่าง:</strong> ราคาจริงอาจแตกต่างจากราคาโดยประมาณเนื่องจากค่าธรรมเนียมที่แท้จริง ค่าจัดส่ง และค่าอื่นๆ ที่จะถูกคำนวณเมื่อได้รับการอนุมัติ
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button 
                    type="submit" 
                    isLoading={isSubmitting} 
                    fullWidth 
                    variant="primary" 
                    size="lg" 
                    disabled={
                      rentalDays <= 0 || 
                      isSubmitting || 
                      rentalDays < (product?.min_rental_duration_days || 1) ||
                      (product?.max_rental_duration_days ? rentalDays > product.max_rental_duration_days : false)
                    }
                    className={`font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 ${
                      rentalDays <= 0 || 
                      isSubmitting || 
                      rentalDays < (product?.min_rental_duration_days || 1) ||
                      (product?.max_rental_duration_days ? rentalDays > product.max_rental_duration_days : false)
                        ? 'bg-gray-400 cursor-not-allowed hover:scale-100'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FaShoppingCart className="w-6 h-6" />
                      <span className="text-lg">
                        {rentalDays <= 0 
                          ? 'เลือกวันที่เช่า'
                          : rentalDays < (product?.min_rental_duration_days || 1)
                          ? `ระยะเวลาต้องอย่างน้อย ${product?.min_rental_duration_days || 1} วัน`
                          : (product?.max_rental_duration_days ? rentalDays > product.max_rental_duration_days : false)
                          ? `ระยะเวลาไม่เกิน ${product?.max_rental_duration_days} วัน`
                          : t('productDetailPage.submitRentalRequestButton')
                        }
                      </span>
                    </div>
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Address Modal */}
      {showAddAddress && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            className="bg-white rounded-3xl shadow-2xl max-w-full sm:max-w-lg w-full max-h-[90vh] overflow-hidden relative"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
              
              <button 
                className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl transition-colors duration-200 z-10" 
                onClick={() => setShowAddAddress(false)} 
                aria-label="ปิด"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaMapMarkerAlt className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold">
                    {t('productDetailPage.addNewAddressTitle', 'เพิ่มที่อยู่ใหม่')}
                  </h3>
                </div>
                <p className="text-purple-100 text-sm leading-relaxed">
                  กรอกข้อมูลที่อยู่สำหรับการจัดส่งสินค้า
                </p>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {addAddressError && (
                <motion.div 
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">เกิดข้อผิดพลาด</p>
                    <p className="text-red-600 text-sm">{addAddressError}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleAddAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('productDetailPage.recipientNamePlaceholder', 'ชื่อผู้รับ')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={t('productDetailPage.recipientNamePlaceholder', 'ชื่อผู้รับ')} 
                      required 
                      value={newAddress.recipient_name} 
                      onChange={e => setNewAddress({ ...newAddress, recipient_name: e.target.value })} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('productDetailPage.phoneNumberPlaceholder', 'เบอร์โทรศัพท์')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={t('productDetailPage.phoneNumberPlaceholder', 'เบอร์โทรศัพท์')} 
                      required 
                      value={newAddress.phone_number} 
                      onChange={e => setNewAddress({ ...newAddress, phone_number: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {t('productDetailPage.addressLine1Placeholder', 'ที่อยู่ (บรรทัดที่ 1)')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                    placeholder={t('productDetailPage.addressLine1Placeholder', 'ที่อยู่ (บรรทัดที่ 1)')} 
                    required 
                    value={newAddress.address_line1} 
                    onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {t('productDetailPage.addressLine2Placeholder', 'ที่อยู่ (บรรทัดที่ 2)')}
                  </label>
                  <input 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                    placeholder={t('productDetailPage.addressLine2Placeholder', 'ที่อยู่ (บรรทัดที่ 2)')} 
                    value={newAddress.address_line2} 
                    onChange={e => setNewAddress({ ...newAddress, address_line2: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('productDetailPage.subDistrictPlaceholder', 'แขวง/ตำบล')}
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={t('productDetailPage.subDistrictPlaceholder', 'แขวง/ตำบล (ถ้ามี)')} 
                      value={newAddress.sub_district} 
                      onChange={e => setNewAddress({ ...newAddress, sub_district: e.target.value })} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('productDetailPage.districtPlaceholder', 'เขต/อำเภอ')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={t('productDetailPage.districtPlaceholder', 'เขต/อำเภอ')} 
                      required 
                      value={newAddress.district} 
                      onChange={e => setNewAddress({ ...newAddress, district: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('productDetailPage.selectProvinceOption', 'จังหวัด')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      required 
                      value={newAddress.province_id} 
                      onChange={e => setNewAddress({ ...newAddress, province_id: Number(e.target.value) })}
                    >
                      <option value="">{t('productDetailPage.selectProvinceOption', 'เลือกจังหวัด')}</option>
                      {provinces.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.name_th}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t('productDetailPage.postalCodePlaceholder', 'รหัสไปรษณีย์')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={t('productDetailPage.postalCodePlaceholder', 'รหัสไปรษณีย์')} 
                      required 
                      value={newAddress.postal_code} 
                      onChange={e => setNewAddress({ ...newAddress, postal_code: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {t('productDetailPage.notesPlaceholder', 'หมายเหตุ')}
                  </label>
                  <textarea 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white resize-none" 
                    placeholder={t('productDetailPage.notesPlaceholder', 'หมายเหตุ (ถ้ามี)')} 
                    rows={3}
                    value={newAddress.notes} 
                    onChange={e => setNewAddress({ ...newAddress, notes: e.target.value })} 
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowAddAddress(false)}
                    className="flex-1 py-4 px-6 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors duration-200 font-semibold shadow-lg" 
                    disabled={addingAddress}
                  >
                    {addingAddress ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {t('productDetailPage.savingAddress', 'กำลังบันทึก...')}
                      </div>
                    ) : (
                      t('productDetailPage.saveAddress', 'บันทึกที่อยู่')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Owner Profile Modal */}
      {showOwnerProfile && product?.owner && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            className="bg-white rounded-3xl shadow-2xl max-w-full sm:max-w-2xl w-full max-h-[90vh] overflow-hidden relative"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <button 
                className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl transition-colors duration-200 z-10" 
                onClick={() => setShowOwnerProfile(false)} 
                aria-label="ปิด"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FaUser className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    โปรไฟล์เจ้าของสินค้า
                  </h2>
                </div>
                <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                  ข้อมูลและประวัติของเจ้าของสินค้า
                </p>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Profile Header */}
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {product.owner.profile_picture_url ? (
                    <img
                      src={product.owner.profile_picture_url}
                      alt={product.owner.first_name || 'Owner'}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl mx-auto mb-4"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-xl mx-auto mb-4">
                      <span className="text-white text-3xl font-bold">
                        {(product.owner.first_name || 'O')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {product.owner.first_name} {product.owner.last_name}
                  </h3>
                  
                  {product.owner.average_owner_rating !== undefined && product.owner.average_owner_rating !== null && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} filled={i < Math.round(product.owner?.average_owner_rating || 0)} className="h-5 w-5" />
                      ))}
                      <span className="text-lg font-semibold text-gray-700">
                        ({product.owner.average_owner_rating.toFixed(1)})
                      </span>
                    </div>
                  )}
                  
                  {product.owner.created_at && (
                    <p className="text-gray-600 flex items-center justify-center gap-2">
                      <FaCalendarAlt className="w-4 h-4" />
                      สมาชิกตั้งแต่ {new Date(product.owner.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </motion.div>

                {/* Contact Information */}
                <motion.div 
                  className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaEnvelope className="w-5 h-5 text-blue-600" />
                    ข้อมูลติดต่อ
                  </h4>
                  
                  {loadingOwnerProfile ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">กำลังโหลดข้อมูล...</p>
                    </div>
                  ) : ownerProfileError ? (
                    <div className="text-center py-8">
                      <div className="text-red-500 mb-2">
                        <FaExclamationTriangle className="w-8 h-8 mx-auto" />
                      </div>
                      <p className="text-red-600">{ownerProfileError}</p>
                    </div>
                  ) : ownerDetailedProfile ? (
                    <div className="space-y-3">
                      {/* Basic Info */}
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                        <FaUser className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">ชื่อเจ้าของสินค้า</p>
                          <p className="font-semibold text-gray-900">
                            {ownerDetailedProfile.first_name} {ownerDetailedProfile.last_name || ''}
                          </p>
                        </div>
                      </div>

                      {/* Username */}
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                        <FaUser className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">ชื่อผู้ใช้</p>
                          <p className="font-semibold text-gray-900">@{ownerDetailedProfile.username}</p>
                        </div>
                      </div>

                      {/* Email */}
                      {ownerDetailedProfile.email && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <FaEnvelope className="w-5 h-5 text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">อีเมล</p>
                            <p className="font-semibold text-gray-900 break-all">{ownerDetailedProfile.email}</p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ownerDetailedProfile.email);
                              alert('คัดลอกอีเมลแล้ว');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="คัดลอกอีเมล"
                          >
                            <FaCopy className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Phone Number */}
                      {ownerDetailedProfile.phone_number && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <FaPhone className="w-5 h-5 text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                            <p className="font-semibold text-gray-900">{ownerDetailedProfile.phone_number}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (ownerDetailedProfile.phone_number) {
                                  navigator.clipboard.writeText(ownerDetailedProfile.phone_number);
                                  alert('คัดลอกเบอร์โทรศัพท์แล้ว');
                                }
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="คัดลอกเบอร์โทรศัพท์"
                            >
                              <FaCopy className="w-4 h-4" />
                            </button>
                            <a
                              href={`tel:${ownerDetailedProfile.phone_number || ''}`}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              title="โทรหา"
                            >
                              <FaPhone className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Address if available */}
                      {(ownerDetailedProfile.address_line1 || ownerDetailedProfile.city) && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <FaMapMarkerAlt className="w-5 h-5 text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">ที่อยู่</p>
                            <p className="font-semibold text-gray-900">
                              {ownerDetailedProfile.address_line1}
                              {ownerDetailedProfile.address_line2 && `, ${ownerDetailedProfile.address_line2}`}
                              {ownerDetailedProfile.city && `, ${ownerDetailedProfile.city}`}
                              {ownerDetailedProfile.postal_code && ` ${ownerDetailedProfile.postal_code}`}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const address = [
                                ownerDetailedProfile.address_line1,
                                ownerDetailedProfile.address_line2,
                                ownerDetailedProfile.city,
                                ownerDetailedProfile.postal_code
                              ].filter(Boolean).join(', ');
                              navigator.clipboard.writeText(address);
                              alert('คัดลอกที่อยู่แล้ว');
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="คัดลอกที่อยู่"
                          >
                            <FaCopy className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Contact via Platform */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                          <FaComments className="w-4 h-4" />
                          ติดต่อผ่านแพลตฟอร์ม
                        </h5>
                        <p className="text-sm text-blue-700 mb-3">
                          ใช้ระบบส่งข้อความภายในแพลตฟอร์มเพื่อติดต่อเจ้าของสินค้า
                        </p>
                        {product.owner.id !== authUser?.id && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleContactOwner}
                            disabled={contactingOwner}
                            isLoading={contactingOwner}
                          >
                            <FaComments className="w-4 h-4 mr-2" />
                            ส่งข้อความ
                          </Button>
                        )}
                      </div>

                      {/* Note about privacy */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h5 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                          <FaInfoCircle className="w-4 h-4" />
                          หมายเหตุ
                        </h5>
                        <p className="text-sm text-yellow-700">
                          ข้อมูลการติดต่อที่แสดงขึ้นอยู่กับการตั้งค่าความเป็นส่วนตัวของเจ้าของสินค้า
                          หากต้องการข้อมูลเพิ่มเติม กรุณาติดต่อผ่านระบบส่งข้อความภายในแพลตฟอร์ม
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">ไม่สามารถโหลดข้อมูลได้</p>
                    </div>
                  )}
                </motion.div>

                {/* Verification Status */}
                <motion.div 
                  className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FaShieldAlt className="w-5 h-5 text-green-600" />
                    สถานะการยืนยันตัวตน
                  </h4>
                  
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-green-200">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaCheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">ยืนยันตัวตนแล้ว</p>
                      <p className="text-sm text-green-600">ผู้ใช้ได้ยืนยันตัวตนกับระบบแล้ว</p>
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {product.owner.id !== authUser?.id && (
                    <Button
                      variant="primary"
                      size="lg"
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                      onClick={handleContactOwner}
                      disabled={contactingOwner}
                      isLoading={contactingOwner}
                    >
                      <FaComments className="w-5 h-5 mr-2" />
                      ส่งข้อความ
                    </Button>
                  )}
                  
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowOwnerProfile(false)}
                  >
                    ปิด
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
