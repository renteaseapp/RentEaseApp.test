import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product, ApiError } from '../../types';
import { getProductByID, getProvinces } from '../../services/productService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { createRentalRequest, getProductReviews } from '../../services/rentalService';
import { getUserAddresses, addToWishlist, removeFromWishlist, checkWishlistStatus } from '../../services/userService';
import { RentalPickupMethod, UserAddress, UserIdVerificationStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';
import { sendMessage } from '../../services/chatService';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addDays, isAfter, format } from 'date-fns';
import { Tab, Tabs } from '@mui/material';

const StarIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'} ${className}`} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const LocationMarkerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 inline-block text-gray-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
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
    <div className="mt-10 bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">รีวิวสินค้า</h2>
      {reviews.length === 0 && <div className="text-gray-500">ยังไม่มีรีวิว</div>}
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-100 pb-4 mb-4">
          <div className="flex items-center mb-1">
            <span className="font-semibold text-blue-700 mr-2">คะแนนสินค้า:</span>
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} filled={i < review.rating_product} />
            ))}
            <span className="ml-4 font-semibold text-green-700 mr-2">คะแนนเจ้าของ:</span>
            {[...Array(5)].map((_, i) => (
              <StarIcon key={i} filled={i < review.rating_owner} />
            ))}
          </div>
          <div className="text-gray-700 mb-1">{review.comment}</div>
          <div className="text-xs text-gray-400">
            {new Date(review.created_at).toLocaleString()}
            {review.rentals && (
              <>
                {' '}| ผู้รีวิว: 
                {review.rentals.renter?.first_name
                  ? review.rentals.renter.first_name
                  : review.rentals.renter_id
                }
              </>
            )}
          </div>
        </div>
      ))}
      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded ${p === meta.current_page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProductDetailPage: React.FC = () => {
  const { t } = useTranslation();
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
  const [addAddressError, setAddAddressError] = useState<string|null>(null);
  const [provinces, setProvinces] = useState<{id: number, name_th: string}[]>([]);
  const [startDateObj, setStartDateObj] = useState<Date | null>(null);
  const [endDateObj, setEndDateObj] = useState<Date | null>(null);
  const [tab, setTab] = useState(0);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState<string|null>(null);
  const [inWishlist, setInWishlist] = useState<boolean|null>(null);

  // Calculate tomorrow's date for min start date
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  useEffect(() => {
    if (!slugOrId) {
      setError(t('productDetailPage.missingProductId'));
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
  const subtotal = product && rentalDays > 0 ? (product.rental_price_per_day || 0) * rentalDays : 0;
  const totalAmount = subtotal + (product?.security_deposit || 0);

  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !product || rentalDays <= 0) {
      setFormError(t('productDetailPage.formInvalid'));
      return;
    }
    if (pickupMethod === RentalPickupMethod.DELIVERY && !selectedAddressId) {
      setFormError(t('productDetailPage.selectDeliveryAddress'));
      return;
    }
    // Validate start date must be in the future (at least tomorrow)
    if (new Date(startDate) < tomorrow) {
      setFormError(t('productDetailPage.startDateMustBeFuture'));
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
        setFormError(t('productDetailPage.selectDeliveryAddress'));
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
      setFormSuccess(t('productDetailPage.rentalRequestSuccess'));
      setShowRentalModal(false);
      navigate(ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(newRental.id)));
    } catch (err) {
      setFormError(
        (err as any)?.response?.data?.message ||
        (err as ApiError).message ||
        t('productDetailPage.rentalRequestFailed')
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
      const messageText = t('productDetailPage.defaultContactMessage', { product: product.title }) + '\n' + productUrl;
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
      let msg = t('productDetailPage.contactOwnerError');
      if (err?.response?.data?.message) msg = err.response.data.message;
      else if (err?.message) msg = err.message;
      alert(msg);
    } finally {
      setContactingOwner(false);
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
    return <LoadingSpinner message={t('productDetailPage.loadingDetails')} />;
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
    return <div className="text-center py-10">{t('productDetailPage.productNotFound')}</div>;
  }
  
  const allImages = product.images || (product.primary_image ? [product.primary_image] : []);


  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen py-6 sm:py-10">
      <div className="container mx-auto px-2 sm:px-4 max-w-6xl">
        <div className="bg-white shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
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
                    <span className="text-gray-400">{t('productDetailPage.noImage')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Product Info Section */}
          <div className="p-4 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight break-words max-w-full">{product.title}</h1>
                {product.category && (
                  <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-full shadow-sm">{product.category.name}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} filled={i < Math.round(product.average_rating || 0)} />
                  ))}
                  <span className="ml-2 text-gray-600 text-xs sm:text-sm">{t('productDetailPage.reviewsCount', { count: product.total_reviews || 0 })}</span>
                </div>
                <span className="text-gray-400">|</span>
                <span className="text-xs sm:text-sm text-gray-600">{t('productDetailPage.viewedCount', { count: product.view_count || 0 })}</span>
                {product.availability_status && (
                  <span className={`ml-2 sm:ml-4 px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold shadow-sm ${product.availability_status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t('productDetailPage.statusLabel')} {product.availability_status.replace('_', ' ').toUpperCase()}</span>
                )}
              </div>
              <div className="mb-4 sm:mb-6 flex flex-wrap gap-2 sm:gap-4 items-center">
                <span className="text-3xl sm:text-5xl font-extrabold text-blue-700">฿{(product.rental_price_per_day ?? 0).toLocaleString()}</span>
                <span className="text-lg sm:text-xl text-gray-500">{t('productCard.pricePerDay')}</span>
                {product.rental_price_per_week && (
                  <span className="text-base sm:text-lg font-semibold text-gray-700 bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full">฿{(product.rental_price_per_week ?? 0).toLocaleString()} {t('productCard.pricePerWeek')}</span>
                )}
                {product.rental_price_per_month && (
                  <span className="text-base sm:text-lg font-semibold text-gray-700 bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full">฿{(product.rental_price_per_month ?? 0).toLocaleString()} {t('productCard.pricePerMonth')}</span>
                )}
                {product.security_deposit && (
                  <span className="text-xs sm:text-sm text-gray-600 bg-yellow-50 px-2.5 sm:px-3 py-1 rounded-full">{t('productDetailPage.securityDeposit')}: <span className="font-bold text-yellow-700">฿{(product.security_deposit ?? 0).toLocaleString()}</span></span>
                )}
              </div>
              <div className="mb-3 sm:mb-4 text-gray-700 text-base sm:text-lg leading-relaxed border-l-4 border-blue-200 pl-3 sm:pl-4 bg-blue-50/50 py-2 rounded">
                {product.description || <span className="italic text-gray-400">No description available.</span>}
              </div>
              <div className="flex flex-col gap-2 mb-4">
                {product.province && (
                  <p className="text-xs sm:text-sm text-gray-600 flex items-center">
                    <LocationMarkerIcon /> {t('productDetailPage.location', { locationName: product.province.name_th })}
                  </p>
                )}
                {product.min_rental_duration_days && product.max_rental_duration_days && (
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600">{t('productDetailPage.rentalDuration')}: </span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">
                      {product.min_rental_duration_days} - {product.max_rental_duration_days} {t('productDetailPage.days')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                {product.owner?.id !== authUser?.id ? (
                  <>
                    {(
                      !authUser ||
                      authUser.id_verification_status === UserIdVerificationStatus.APPROVED ||
                      String(authUser.id_verification_status) === 'verified'
                    ) && (
                    <Button size="lg" variant="primary" className="w-full sm:w-auto px-6 sm:px-10 py-2.5 sm:py-3 text-base sm:text-lg font-bold shadow-lg" onClick={() => setShowRentalModal(true)}>
                      {t('productDetailPage.requestToRentButton')}
                    </Button>
                    )}
                    {inWishlist !== null && (
                      <>
                        <Button size="lg" variant="ghost" className="w-full sm:w-auto px-6 sm:px-10 py-2.5 sm:py-3 text-base sm:text-lg font-bold border border-blue-200 hover:bg-blue-50" onClick={handleWishlistClick} disabled={wishlistLoading} isLoading={wishlistLoading}>
                          {inWishlist ? t('productDetailPage.removeFromWishlistButton', 'ลบออกจากรายการโปรด') : t('productDetailPage.addToWishlistButton', 'เพิ่มในรายการโปรด')}
                        </Button>
                        {wishlistError && <div className="text-red-500 text-xs mt-1">{wishlistError}</div>}
                      </>
                    )}
                  </>
                ) : (
                  <div className="mb-4 sm:mb-6 text-center text-gray-400 text-base font-medium">{t('productDetailPage.thisIsYourOwnProduct', 'นี่คือสินค้าของคุณเอง')}</div>
                )}
              </div>
              {/* Owner Info */}
              {product.owner && (
                <div className="flex items-center gap-3 sm:gap-4 bg-gray-50 rounded-xl px-4 sm:px-5 py-3 sm:py-4 shadow border border-gray-100 w-full sm:w-auto">
                  {product.owner.profile_picture_url ? (
                    <img 
                      src={product.owner.profile_picture_url} 
                      alt={product.owner.first_name || 'Owner'} 
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-blue-100">
                      <span className="text-gray-500 text-lg sm:text-xl">
                        {(product.owner.first_name || 'O')[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-base sm:text-lg font-bold text-gray-900">{product.owner.first_name}</p>
                    {product.owner.average_owner_rating !== undefined && product.owner.average_owner_rating !== null && (
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} filled={i < Math.round(product.owner?.average_owner_rating || 0)} className="h-4 w-4"/>
                        ))}
                        <span className="ml-1 text-xs text-gray-500">({product.owner.average_owner_rating.toFixed(1)})</span>
                      </div>
                    )}
                    {product.owner.created_at && <p className="text-xs text-gray-500">{t('productDetailPage.memberSince', { date: new Date(product.owner.created_at).toLocaleDateString() })}</p>}
                    {product.owner.id !== authUser?.id ? (
                      <Button variant="secondary" size="sm" className="mt-2" onClick={handleContactOwner} disabled={contactingOwner} isLoading={contactingOwner}>
                        {t('productDetailPage.contactOwnerButton')}
                      </Button>
                    ) : (
                      <div className="mt-2 text-sm text-gray-400">{t('productDetailPage.cannotChatWithOwnProduct', 'คุณไม่สามารถแชทกับสินค้าของตัวเองได้')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Tabs Section */}
        <div className="mt-8 sm:mt-12 bg-white rounded-xl shadow p-4 sm:p-8">
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label={t('productDetailPage.detailsTab', 'รายละเอียดสินค้า')} />
            <Tab label={t('productDetailPage.specsTab', 'สเปค/คุณสมบัติ')} />
            <Tab label={t('productDetailPage.reviewsTab', 'รีวิวสินค้า')} />
          </Tabs>
          <div className="mt-6">
            {tab === 0 && (
              <div>
                <h2 className="text-xl font-bold mb-2">{t('productDetailPage.detailsTab', 'รายละเอียดสินค้า')}</h2>
                <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{product.description || <span className="italic text-gray-400">No description available.</span>}</div>
                {product.condition_notes && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('productDetailPage.conditionNotes')}</h3>
                    <p className="text-sm text-gray-600">{product.condition_notes}</p>
                  </div>
                )}
                {product.address_details && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">{t('productDetailPage.pickupLocation')}</h3>
                    <p className="text-sm text-gray-600">{product.address_details}</p>
                  </div>
                )}
              </div>
            )}
            {tab === 1 && (
              <div>
                <h2 className="text-xl font-bold mb-2">{t('productDetailPage.specsTab', 'สเปค/คุณสมบัติ')}</h2>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <li key={key}><strong>{key}:</strong> {String(value)}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="italic text-gray-400">{t('productDetailPage.noSpecs', 'ไม่มีข้อมูลสเปค/คุณสมบัติ')}</div>
                )}
              </div>
            )}
            {tab === 2 && (
              <div>
                <ProductReviews productId={product.id} />
              </div>
            )}
          </div>
        </div>
        {/* Rental Request Modal */}
        {showRentalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-none sm:rounded-lg shadow-lg max-w-full sm:max-w-lg w-full p-2 sm:p-6 relative">
              <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setShowRentalModal(false)} aria-label="ปิด">&times;</button>
              <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                <span role="img" aria-label="เช่า">📝</span> {t('productDetailPage.rentalRequestTitle')}
              </h2>
              <p className="text-gray-500 mb-4 text-xs sm:text-sm">กรุณากรอกข้อมูลให้ครบถ้วนเพื่อส่งคำขอเช่าสินค้านี้</p>
              {formError && <ErrorMessage message={formError} onDismiss={() => setFormError(null)} />}
              {formSuccess && <div className="text-green-600 mb-2">{formSuccess}</div>}
              <form onSubmit={handleRentalSubmit} className="space-y-4 sm:space-y-5">
                {/* Step 1: เลือกวันที่ */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <span>1. เลือกช่วงวันที่ต้องการเช่า <span className="text-red-500">*</span></span>
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" /></svg>
                  </label>
                  <div className="text-xs text-gray-500 mb-2">เลือกวันเริ่มต้นและวันสิ้นสุดที่ต้องการเช่า เช่น <b>07/01/2024 ถึง 07/05/2024</b></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <span className="block text-xs text-gray-600 mb-1">วันเริ่มต้น (Start Date)</span>
                      <DatePicker
                        selected={startDateObj}
                        onChange={date => setStartDateObj(date)}
                        minDate={addDays(new Date(), 1)}
                        placeholderText="mm/dd/yyyy"
                        dateFormat="MM/dd/yyyy"
                        className="block w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
                        showPopperArrow
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        isClearable
                        todayButton="วันนี้"
                        calendarStartDay={1}
                      />
                    </div>
                    <div>
                      <span className="block text-xs text-gray-600 mb-1">วันสิ้นสุด (End Date)</span>
                      <DatePicker
                        selected={endDateObj}
                        onChange={date => setEndDateObj(date)}
                        minDate={startDateObj ? addDays(startDateObj, 1) : addDays(new Date(), 2)}
                        disabled={!startDateObj}
                        placeholderText="mm/dd/yyyy"
                        dateFormat="MM/dd/yyyy"
                        className="block w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-400"
                        showPopperArrow
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        isClearable
                        todayButton="วันนี้"
                        calendarStartDay={1}
                      />
                    </div>
                  </div>
                  {startDateObj && endDateObj && !isAfter(endDateObj, startDateObj) && (
                    <div className="text-red-500 text-xs mt-1">วันสิ้นสุดต้องหลังวันเริ่มต้นอย่างน้อย 1 วัน</div>
                  )}
                  <div className="text-xs text-blue-500 mt-1">* เลือกได้เฉพาะวันถัดไปจากวันนี้ขึ้นไป วันสีเทาคือเลือกไม่ได้</div>
                </div>
                {/* Step 2: วิธีรับสินค้า */}
                <div>
                  <label htmlFor="pickup_method" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">2. วิธีรับสินค้า <span className="text-red-500">*</span></label>
                  <select name="pickup_method" id="pickup_method" value={pickupMethod} onChange={e => setPickupMethod(e.target.value as RentalPickupMethod)} className="block w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-400">
                    <option value={RentalPickupMethod.SELF_PICKUP}>{t('productDetailPage.selfPickupOption')}</option>
                    <option value={RentalPickupMethod.DELIVERY}>{t('productDetailPage.deliveryOption')}</option>
                  </select>
                </div>
                {/* Step 3: ที่อยู่สำหรับจัดส่ง (ถ้าเลือก delivery) */}
                {pickupMethod === RentalPickupMethod.DELIVERY && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">3. ที่อยู่สำหรับจัดส่ง <span className="text-red-500">*</span></label>
                    {isLoadingAddresses ? (
                      <div className="text-blue-500">{t('productDetailPage.loadingAddresses')}</div>
                    ) : addresses.length > 0 ? (
                      <>
                        <select value={selectedAddressId || ''} onChange={e => setSelectedAddressId(Number(e.target.value))} className="block w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-400">
                          <option value="">{t('productDetailPage.selectAddressOption')}</option>
                          {addresses.map(addr => (
                            <option key={addr.id} value={addr.id}>{addr.recipient_name} - {addr.address_line1}, {addr.district}, {addr.province_name || addr.province_id}</option>
                          ))}
                        </select>
                        <button type="button" className="mt-2 text-blue-600 underline text-xs sm:text-sm" onClick={() => setShowAddAddress(true)}>+ เพิ่มที่อยู่ใหม่</button>
                      </>
                    ) : (
                      <>
                        <div className="text-red-500">{t('productDetailPage.noAddressesFound')}</div>
                        <button type="button" className="mt-2 text-blue-600 underline text-xs sm:text-sm" onClick={() => setShowAddAddress(true)}>+ เพิ่มที่อยู่ใหม่</button>
                      </>
                    )}
                    {showAddAddress && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-none sm:rounded-lg shadow-lg max-w-full sm:max-w-md w-full p-2 sm:p-6 relative">
                          <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl" onClick={() => setShowAddAddress(false)} aria-label="ปิด">&times;</button>
                          <h3 className="text-lg sm:text-xl font-bold mb-4">เพิ่มที่อยู่ใหม่</h3>
                          {addAddressError && <div className="text-red-600 mb-2">{addAddressError}</div>}
                          <form onSubmit={handleAddAddress} className="space-y-2">
                            <input className="block w-full border rounded p-2" placeholder="ชื่อผู้รับ" required value={newAddress.recipient_name} onChange={e => setNewAddress({...newAddress, recipient_name: e.target.value})} />
                            <input className="block w-full border rounded p-2" placeholder="เบอร์โทรศัพท์" required value={newAddress.phone_number} onChange={e => setNewAddress({...newAddress, phone_number: e.target.value})} />
                            <input className="block w-full border rounded p-2" placeholder="ที่อยู่ (บรรทัดที่ 1)" required value={newAddress.address_line1} onChange={e => setNewAddress({...newAddress, address_line1: e.target.value})} />
                            <input className="block w-full border rounded p-2" placeholder="ที่อยู่ (บรรทัดที่ 2)" value={newAddress.address_line2} onChange={e => setNewAddress({...newAddress, address_line2: e.target.value})} />
                            <input className="block w-full border rounded p-2" placeholder="แขวง/ตำบล (ถ้ามี)" value={newAddress.sub_district} onChange={e => setNewAddress({...newAddress, sub_district: e.target.value})} />
                            <input className="block w-full border rounded p-2" placeholder="เขต/อำเภอ" required value={newAddress.district} onChange={e => setNewAddress({...newAddress, district: e.target.value})} />
                            <select className="block w-full border rounded p-2" required value={newAddress.province_id} onChange={e => setNewAddress({...newAddress, province_id: Number(e.target.value)})}>
                              <option value="">เลือกจังหวัด</option>
                              {provinces.map(prov => (
                                <option key={prov.id} value={prov.id}>{prov.name_th}</option>
                              ))}
                            </select>
                            <input className="block w-full border rounded p-2" placeholder="รหัสไปรษณีย์" required value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} />
                            <input className="block w-full border rounded p-2" placeholder="หมายเหตุ (ถ้ามี)" value={newAddress.notes} onChange={e => setNewAddress({...newAddress, notes: e.target.value})} />
                            <button type="submit" className="w-full bg-blue-600 text-white rounded p-2 mt-2" disabled={addingAddress}>{addingAddress ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}</button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Step 4: หมายเหตุ */}
                <div>
                  <label htmlFor="notes" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">4. หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                  <textarea name="notes" id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="block w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-400" placeholder={t('productDetailPage.notesPlaceholder')}></textarea>
                </div>
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mt-2 border">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>จำนวนวันที่เช่า</span>
                      <span className="font-semibold">{rentalDays > 0 ? rentalDays : '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>ราคารวมค่าเช่า</span>
                      <span className="font-semibold text-blue-700">฿{subtotal.toLocaleString()}</span>
                    </div>
                    {product?.security_deposit && <div className="flex justify-between text-xs sm:text-sm"><span>ค่ามัดจำ</span><span className="font-semibold text-blue-700">฿{product.security_deposit.toLocaleString()}</span></div>}
                    <div className="flex justify-between text-sm sm:text-base font-bold mt-2">
                      <span>ยอดที่ต้องชำระ</span>
                      <span className="text-lg sm:text-xl text-green-600">฿{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <Button type="submit" isLoading={isSubmitting} fullWidth variant="primary" size="lg" className="mt-2">
                  <span role="img" aria-label="ส่ง">🚀</span> {t('productDetailPage.submitRentalRequestButton')}
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
