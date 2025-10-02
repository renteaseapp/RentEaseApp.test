import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Product, ApiError, User } from '../../types';
import { getProductByID, getProvinces, checkProductAvailabilityWithBuffer } from '../../services/productService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';

import { Button } from '../../components/ui/Button';

import { useAuth } from '../../contexts/AuthContext';
import { createRentalRequest, getProductReviews } from '../../services/rentalService';
import { getUserAddresses, addToWishlist, removeFromWishlist, checkWishlistStatus, getPublicUserProfile } from '../../services/userService';
import { settingsService, EstimatedFees } from '../../services/settingsService';
import { RentalPickupMethod, UserAddress, UserIdVerificationStatus } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';
import { sendMessage } from '../../services/chatService';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { isAfter, format } from 'date-fns';
import { getCurrentDate, addDays as addDaysTz } from '../../utils/timezoneUtils';
import { 
  calculateRentalSubtotal,
  calculateRentalSubtotalFromQuantity,
  calculateRentalCosts,
  validateRentalDuration,
  RentalType,
  getRentalTypeInfo,
  determineOptimalRentalType,
} from '../../utils/financialCalculations';

// Define OptimalRentalInfo type based on determineOptimalRentalType return type
type OptimalRentalInfo = {
  type: RentalType;
  rate: number;
  savings: number;
};
import { Tab, Tabs } from '@mui/material';
import { motion } from 'framer-motion';

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
  FaThumbsUp,
  FaCopy,
  FaCalculator,
  FaMoneyBillWave,
} from 'react-icons/fa';

import ProductRentalCalendar from './ProductRentalCalendar';
import OpenStreetMapPicker from '../../components/common/OpenStreetMapPicker';

const StarIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className }) => (
  <FaStar className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'} ${className}`} />
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
        setError("ไม่สามารถโหลดรีวิวได้");
      })
      .finally(() => setLoading(false));
  }, [productId, page]);

  if (loading) return <div className="py-8 text-center">{"กำลังโหลดรีวิว..."}</div>;
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
        <h2 className="text-2xl font-bold text-gray-800">{"รีวิวจากผู้เช่า"}</h2>
      </div>

      {reviews.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FaThumbsUp className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">{"ยังไม่มีรีวิวสำหรับสินค้านี้"}</p>
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
                  {"คะแนนสินค้า"}
                </span>
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} filled={i < review.rating_product} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-700 flex items-center gap-1">
                  <FaUser className="w-4 h-4" />
                  {"คะแนนเจ้าของ"}
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
                <span>{new Date(review.created_at).toLocaleString('th-TH')}</span>
              </div>
              {review.rentals && (
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4" />
                  <span>
                    {"รีวิวโดย"} {review.rentals.renter?.first_name
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
  
  // Helper function to get localized status display text
  const getStatusDisplayText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'available': "พร้อมให้เช่า",
      'rented_out': "ถูกเช่าออกไป",
      'unavailable': "ไม่พร้อมใช้งาน",
      'pending_approval': "รออนุมัติ",
      'rejected': "ถูกปฏิเสธ",
      'hidden': "ซ่อนอยู่",
      'draft': "ฉบับร่าง"
    };
    return statusMap[status] || status.replace('_', ' ').toUpperCase();
  };
  const { slugOrId } = useParams<{ slugOrId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { user: authUser, tokenExpired } = useAuth();
  const navigate = useNavigate();
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  // Quantity is always 1 for single item rental

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
  // States for multiple weeks/months rental
  const [numberOfWeeks, setNumberOfWeeks] = useState(1);
  const [numberOfMonths, setNumberOfMonths] = useState(1);
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
    notes: '',
    latitude: null as number | null,
    longitude: null as number | null
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
  const [selectedRentalType, setSelectedRentalType] = useState<RentalType>(RentalType.DAILY);
  const [optimalRentalInfo, setOptimalRentalInfo] = useState<OptimalRentalInfo | null>(null);
  const [estimatedFees, setEstimatedFees] = useState<EstimatedFees | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);

  // Date availability states
  const [dateAvailability, setDateAvailability] = useState<Record<string, boolean>>({});
  const [loadingDateAvailability, setLoadingDateAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Realtime product updates - only join when we have a valid productId
  const productId = product?.id?.toString();
  const { product: realtimeProduct, isConnected: isRealtimeConnected } = useRealtimeProduct({
    productId: productId || ''
  });

  // Update local product state when realtime data comes in
  useEffect(() => {
    if (realtimeProduct && product) {
      // Only update specific fields that are expected to change in real-time
      // Preserve all existing product data and only update the fields that 
      // are likely to change in real-time updates
      setProduct({
        ...product,
        quantity_available: realtimeProduct.quantity_available !== undefined ? realtimeProduct.quantity_available : product.quantity_available,
        availability_status: realtimeProduct.availability_status || product.availability_status,
        // Preserve slug from original product if realtime data doesn't have it
        slug: realtimeProduct.slug || product.slug
      } as unknown as Product);
    }
  }, [realtimeProduct, product]);
  
  // Debug logging for realtime connection (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Realtime Debug:', {
      productId,
      hasProduct: !!product,
      isRealtimeConnected,
      realtimeProduct: realtimeProduct ? 'present' : 'null'
    });
    
    // Log when realtimeProduct changes
    useEffect(() => {
      if (realtimeProduct) {
        console.log('📦 Realtime product update:', {
          keys: Object.keys(realtimeProduct),
          id: realtimeProduct.id,
          hasKeyFields: !!(realtimeProduct as any).title && !!(realtimeProduct as any).description
        });
      }
    }, [realtimeProduct]);
  }

  // Calculate tomorrow's date for min start date
  const today = getCurrentDate().toDate();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  // Calculate rental days (inclusive - includes both start and end dates)
  const rentalDays = startDateObj && endDateObj ? Math.max(0, Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;

  useEffect(() => {
    if (!slugOrId) {
      setError("ไม่พบรหัสสินค้า");
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
        setError(apiError.message || 'ไม่สามารถโหลดรายละเอียดสินค้าได้');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slugOrId]);

  useEffect(() => {
    if (showRentalModal && pickupMethod === RentalPickupMethod.DELIVERY && authUser) {
      setIsLoadingAddresses(true);
      // Load provinces and addresses simultaneously
      Promise.all([
        getUserAddresses(),
        getProvinces()
      ])
        .then(([addresses, provincesRes]) => {
          const shipping = addresses.filter(addr => addr.address_type === 'shipping');
          setAddresses(shipping.length > 0 ? shipping : addresses);
          setProvinces(provincesRes.data);
        })
        .catch(() => {
          setAddresses([]);
          setProvinces([]);
        })
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

  // Function to fetch date availability for a date range
  const fetchDateAvailability = async (startDate: Date, endDate: Date) => {
    if (!product?.id) return;
    
    setLoadingDateAvailability(true);
    setAvailabilityError(null);
    
    try {
      const dateAvailabilityMap: Record<string, boolean> = {};
      
      // Generate all dates in the range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        try {
          // Check availability for each date
          const availabilityCheck = await checkProductAvailabilityWithBuffer(
            product.id,
            dateStr,
            dateStr
          );
          dateAvailabilityMap[dateStr] = availabilityCheck.available;
        } catch (error) {
          console.error(`Error checking availability for ${dateStr}:`, error);
          dateAvailabilityMap[dateStr] = false;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setDateAvailability(dateAvailabilityMap);
    } catch (error) {
      console.error('Error fetching date availability:', error);
      setAvailabilityError('ไม่สามารถตรวจสอบความพร้อมใช้งานของวันที่ได้');
    } finally {
      setLoadingDateAvailability(false);
    }
  };

  // Fetch date availability when product or date range changes
  useEffect(() => {
    if (product?.id && startDateObj && endDateObj) {
      // Extend the date range to show more context (30 days before and after)
      const extendedStart = new Date(startDateObj);
      extendedStart.setDate(extendedStart.getDate() - 30);
      
      const extendedEnd = new Date(endDateObj);
      extendedEnd.setDate(extendedEnd.getDate() + 30);
      
      fetchDateAvailability(extendedStart, extendedEnd);
    }
  }, [product?.id, startDateObj, endDateObj]);

  // Real-time availability check when user selects dates
  useEffect(() => {
    if (product?.id && startDateObj && endDateObj && isAfter(endDateObj, startDateObj)) {
      const checkRealTimeAvailability = async () => {
        try {
          setLoadingDateAvailability(true);
          const result = await checkProductAvailabilityWithBuffer(
            product.id,
            startDateObj.toISOString().split('T')[0],
            endDateObj.toISOString().split('T')[0]
          );
          
          // Update the specific date range in our availability map
          const currentDate = new Date(startDateObj);
          while (currentDate <= endDateObj) {
            const dateKey = currentDate.toISOString().split('T')[0];
            setDateAvailability(prev => ({
              ...prev,
              [dateKey]: result.available
            }));
            currentDate.setDate(currentDate.getDate() + 1);
          }
        } catch (error) {
          console.error('Error checking real-time availability:', error);
          setAvailabilityError('ไม่สามารถตรวจสอบความพร้อมใช้งานได้');
        } finally {
          setLoadingDateAvailability(false);
        }
      };

      // Debounce the real-time check to avoid too many API calls
      const timeoutId = setTimeout(checkRealTimeAvailability, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [product?.id, startDateObj, endDateObj]);

  useEffect(() => {
    if (authUser && product?.id && !tokenExpired) {
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
  }, [authUser, product?.id, tokenExpired]);

  // Auto-calculate end date based on selected quantity for weekly/monthly rentals
  useEffect(() => {
    if (startDateObj && selectedRentalType !== RentalType.DAILY) {
      const newEndDate = new Date(startDateObj);
      
      if (selectedRentalType === RentalType.WEEKLY && numberOfWeeks > 0) {
        // Add (numberOfWeeks * 7) days, then subtract 1 to get the end date
        newEndDate.setDate(newEndDate.getDate() + (numberOfWeeks * 7) - 1);
      } else if (selectedRentalType === RentalType.MONTHLY && numberOfMonths > 0) {
        // Add numberOfMonths months, then subtract 1 day to get the end date
        newEndDate.setMonth(newEndDate.getMonth() + numberOfMonths);
        newEndDate.setDate(newEndDate.getDate() - 1);
      }
      
      setEndDateObj(newEndDate);
    }
  }, [startDateObj, selectedRentalType, numberOfWeeks, numberOfMonths]);

  useEffect(() => {
    if (product) {
      const calculatedOptimalRentalInfo = determineOptimalRentalType(
        rentalDays,
        product.rental_price_per_day || 0,
        product.rental_price_per_week,
        product.rental_price_per_month
      );
      setOptimalRentalInfo(calculatedOptimalRentalInfo);
      // Don't auto-set selected rental type, let user choose
      // Only set if no type is currently selected (first load)
      if (!selectedRentalType || selectedRentalType === RentalType.DAILY) {
        // Keep daily as default or use optimal for first time
        // setSelectedRentalType(calculatedOptimalRentalInfo.type);
      }
    }
  }, [product, rentalDays]);

  const rentalCostsResult = calculateRentalCosts({
    rentalPricePerDay: product?.rental_price_per_day || 0,
    rentalPricePerWeek: product?.rental_price_per_week,
    rentalPricePerMonth: product?.rental_price_per_month,
    rentalDays: rentalDays,
    rentalType: selectedRentalType,
    pickupMethod: pickupMethod
  });

  // Calculate subtotal based on rental type - use quantity selectors for weekly/monthly
  const subtotal = (() => {
    if (selectedRentalType === RentalType.WEEKLY) {
      // Use numberOfWeeks from quantity selector instead of Math.ceil calculation
      return calculateRentalSubtotalFromQuantity(
        RentalType.WEEKLY,
        numberOfWeeks,
        product?.rental_price_per_day || 0,
        product?.rental_price_per_week,
        product?.rental_price_per_month
      );
    } else if (selectedRentalType === RentalType.MONTHLY) {
      // Use numberOfMonths from quantity selector instead of Math.ceil calculation
      return calculateRentalSubtotalFromQuantity(
        RentalType.MONTHLY,
        numberOfMonths,
        product?.rental_price_per_day || 0,
        product?.rental_price_per_week,
        product?.rental_price_per_month
      );
    } else {
      // For daily rentals, use the traditional calculation based on days
      return calculateRentalSubtotal(
        product?.rental_price_per_day || 0,
        rentalCostsResult.rentalDays,
        selectedRentalType,
        product?.rental_price_per_week || 0,
        product?.rental_price_per_month || 0
      );
    }
  })();

  // Calculate estimated fees when subtotal or pickup method changes
  useEffect(() => {
    if (subtotal > 0) {
      setLoadingFees(true);
      settingsService.calculateEstimatedFees(subtotal, pickupMethod)
        .then(fees => {
          setEstimatedFees(fees);
          console.log('🔍 Estimated fees calculated:', fees);
        })
        .catch(error => {
          console.error('❌ Error calculating estimated fees:', error);
          setEstimatedFees(null);
        })
        .finally(() => setLoadingFees(false));
    } else {
      setEstimatedFees(null);
    }
  }, [subtotal, pickupMethod, selectedRentalType, rentalDays, numberOfWeeks, numberOfMonths]);


  // Debug logging
  console.log('🔍 Debug ProductDetailPage calculations:', {
    rentalDays: rentalCostsResult.rentalDays,
    selectedRentalType,
    numberOfWeeks,
    numberOfMonths,
    productRentalPrice: product?.rental_price_per_day,
    productWeeklyPrice: product?.rental_price_per_week,
    productMonthlyPrice: product?.rental_price_per_month,
    subtotal,
    pickupMethod
  });

  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !product || rentalDays <= 0) {
      setFormError("ข้อมูลแบบฟอร์มไม่ถูกต้อง");
      return;
    }
    if (pickupMethod === RentalPickupMethod.DELIVERY && !selectedAddressId) {
      setFormError("กรุณาเลือกที่อยู่สำหรับจัดส่ง");
      return;
    }
    
    // Validate that dates are selected
    if (!startDate || !endDate) {
      setFormError("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดการเช่า");
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
      setFormError(durationValidation.error || "ระยะเวลาเช่าไม่ถูกต้อง");
      return;
    }

    // Validate start date must be in the future (at least tomorrow)
    if (new Date(startDate) < tomorrow) {
      setFormError("วันเริ่มต้นการเช่าต้องเป็นวันพรุ่งนี้หรือหลังจากนั้น");
      return;
    }

    // Check product availability with buffer time
    try {
      const availabilityCheck = await checkProductAvailabilityWithBuffer(
        product.id,
        startDate,
        endDate
      );

      if (!availabilityCheck.available) {
        setFormError("สินค้าไม่พร้อมให้เช่าในช่วงวันที่เลือก กรุณาเลือกวันที่อื่น");
        return;
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setFormError("เกิดข้อผิดพลาดในการตรวจสอบความพร้อมของสินค้า");
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
      rental_type: selectedRentalType,
    };
    if (pickupMethod === RentalPickupMethod.DELIVERY) {
      if (!selectedAddressId) {
        setFormError("กรุณาเลือกที่อยู่สำหรับจัดส่ง");
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
        setFormError('ไม่พบรหัสการเช่าจาก API');
        return;
      }
      // Navigate to payment page instead of just showing success message
      navigate(ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(newRental.id)));
    } catch (err) {
      setFormError(
        (err as any)?.response?.data?.message ||
        (err as ApiError).message ||
        "ส่งคำขอเช่าไม่สำเร็จ"
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
      const messageText = `สวัสดีครับ/ค่ะ ฉันสนใจเช่าสินค้า ${product.title} ของคุณ\n` + productUrl;
      const msg = await sendMessage({
        receiver_id: product.owner.id,
        message_content: messageText,
        related_product_id: product.id
      });
      console.log('sendMessage result:', msg);
      if (msg && msg.conversation_id) {
        navigate(ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(msg.conversation_id)));
      } else {
        alert('ไม่พบรหัสห้องสนทนาจาก API. msg=' + JSON.stringify(msg));
      }
    } catch (err: any) {
      console.error('Contact owner error:', err);
      let msg = "เกิดข้อผิดพลาดในการติดต่อเจ้าของสินค้า";
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
      setOwnerProfileError(err?.message || "ไม่สามารถโหลดโปรไฟล์เจ้าของสินค้าได้");
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
      const res = await axios.post('https://renteaseapi2.onrender.com/api/users/me/addresses', newAddress, {
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
            notes: '',
            latitude: null,
            longitude: null
          });
        });
    } catch (err: any) {
      setAddAddressError(err?.response?.data?.message || "ไม่สามารถเพิ่มที่อยู่ได้");
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
      setWishlistError(err?.response?.data?.message || err?.message || "เกิดข้อผิดพลาดในการจัดการรายการโปรด");
    } finally {
      setWishlistLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={"กำลังโหลดรายละเอียดสินค้า..."} />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage message={error} title={"เกิดข้อผิดพลาด"} />
        <div className="mt-4 text-center">
          <Button
            variant="primary"
            onClick={() => window.history.back()}
          >
            {"ย้อนกลับ"}
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="text-center py-10">{"ไม่พบสินค้านี้"}</div>;
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
                      <span className="text-gray-400">{"ไม่มีรูปภาพ"}</span>
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
                        {product.total_reviews || 0} {"รีวิว"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <FaEye className="w-4 h-4" />
                      <span className="text-sm">{"เข้าชม"} {product.view_count || 0}</span>
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
                          {"สถานะ"} {getStatusDisplayText(product.availability_status)}
                        </span>
                      )}

                      {/* Quantity Available Display */}
                      {product.quantity_available !== undefined && (
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${product.quantity_available > 0
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                          <FaTag className="w-4 h-4" />
                          {"มีให้เช่า"} {product.quantity_available} {"ชิ้น"}
                        </span>
                      )}

                      {/* Realtime Connection Status */}
                      {isRealtimeConnected && !tokenExpired && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          {"เรียลไทม์"}
                        </span>
                      )}
                      {tokenExpired && (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700 border border-yellow-200">
                          <FaExclamationTriangle className="w-4 h-4" />
                          {"เซสชันหมดอายุ"}
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
                    {/* Basic Price Display */}
                    <div className="flex flex-wrap items-baseline gap-4 mb-3">
                      <span className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ฿{(product.rental_price_per_day ?? 0).toLocaleString()}
                      </span>
                      <span className="text-xl text-gray-600 font-medium">
                        {"/วัน"}
                      </span>
                    </div>

                    {/* Additional Price Options */}
                    {(product.rental_price_per_week || product.rental_price_per_month) && (
                      <div className="flex flex-wrap gap-3 mb-3">
                        {product.rental_price_per_week && (
                          <span className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl text-sm font-semibold text-blue-700 border border-blue-200">
                            ฿{product.rental_price_per_week.toLocaleString()} / {"สัปดาห์"}
                          </span>
                        )}
                        {product.rental_price_per_month && (
                          <span className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl text-sm font-semibold text-purple-700 border border-purple-200">
                            ฿{product.rental_price_per_month.toLocaleString()} / {"เดือน"}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Security Deposit */}
                    <div className="flex flex-wrap gap-3">
                      {product.security_deposit && product.security_deposit > 0 ? (
                        <span className="inline-flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl text-sm font-semibold text-yellow-700 border border-yellow-200">
                          <FaShieldAlt className="w-4 h-4" />
                          {"เงินประกัน"} ฿{product.security_deposit.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200">
                          <FaShieldAlt className="w-4 h-4" />
                          {"ไม่มีเงินประกัน"}
                        </span>
                      )}
                    </div>
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
                          <p className="text-sm text-gray-600">{"สถานที่ตั้งสินค้า"}</p>
                          <p className="font-semibold text-gray-800">{product.province.name_th}</p>
                        </div>
                      </div>
                    )}
                    {product.min_rental_duration_days && product.max_rental_duration_days && (
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                        <FaClock className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">{"ช่วงเวลาเช่า"}</p>
                          <p className="font-semibold text-gray-800">
                            {product.min_rental_duration_days} - {product.max_rental_duration_days} {"วัน"}
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
                              String(authUser.id_verification_status) !== 'verified' &&
                              String(authUser.id_verification_status) !== 'approved') {
                            alert("กรุณายืนยันตัวตนก่อนส่งคำขอเช่า");
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
                          ? "เข้าสู่ระบบเพื่อเช่า"
                          : product.availability_status === 'available' && (product.quantity_available || 0) > 0
                            ? "ส่งคำขอเช่า"
                            : product.availability_status === 'rented_out'
                              ? "ถูกเช่าไปแล้วทั้งหมด"
                              : "ไม่พร้อมให้เช่า"
                        }
                      </Button>
                      <Button
                        size="lg"
                        variant="ghost"
                        className="w-full sm:w-auto px-8 py-4 text-lg font-bold border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => {
                          if (!authUser || tokenExpired) {
                            alert("กรุณาเข้าสู่ระบบเพื่อเพิ่มรายการโปรด");
                            navigate(ROUTE_PATHS.LOGIN);
                            return;
                          }
                          handleWishlistClick();
                        }}
                        disabled={wishlistLoading}
                        isLoading={wishlistLoading}
                      >
                        {(!authUser || tokenExpired) ? (
                          <>
                            <FaHeart className="w-5 h-5 mr-2 text-gray-400" />
                            {"เข้าสู่ระบบเพื่อเพิ่มรายการโปรด"}
                          </>
                        ) : inWishlist ? (
                          <>
                            <FaHeartBroken className="w-5 h-5 mr-2 text-red-500" />
                            {"ลบออกจากรายการโปรด"}
                          </>
                        ) : (
                          <>
                            <FaHeart className="w-5 h-5 mr-2 text-red-500" />
                            {"เพิ่มในรายการโปรด"}
                          </>
                        )}
                      </Button>
                      {wishlistError && <div className="text-red-500 text-sm mt-2">{wishlistError}</div>}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
                      <FaUser className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">{"นี่คือสินค้าของคุณเอง"}</p>
                    </div>
                  )}


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
                      <div className="flex flex-col gap-4">
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
                                {"เป็นสมาชิกตั้งแต่"} {new Date(product.owner.created_at).toLocaleDateString('th-TH')}
                              </p>
                            )}
                            <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                              <FaEye className="w-3 h-3" />
                              {"คลิกเพื่อดูโปรไฟล์"}
                            </p>
                          </div>
                        </button>
                        <div className="flex justify-center">
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
                              {!authUser ? "เข้าสู่ระบบเพื่อติดต่อ" : "ติดต่อเจ้าของ"}
                            </Button>
                          ) : (
                            <div className="text-sm text-gray-400 text-center">
                              <FaUser className="w-5 h-5 mx-auto mb-1" />
                              {"ไม่สามารถแชทกับสินค้าของตัวเองได้"}
                            </div>
                          )}
                        </div>
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
              <Tab label={"รายละเอียด"} />
              <Tab label={"ข้อมูลจำเพาะ"} />
              <Tab label={"รีวิว"} />
              <Tab label={"ปฏิทินการเช่า"} />
            </Tabs>
          </div>

          <div className="px-6 pb-6">
            {tab === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold mb-4 text-gray-800">{"รายละเอียด"}</h2>
                <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line bg-gray-50 p-6 rounded-xl">
                  {product.description || <span className="italic text-gray-400">{"ไม่มีคำอธิบาย"}</span>}
                </div>
                {product.condition_notes && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{"หมายเหตุ/สภาพสินค้า"}</h3>
                    <p className="text-gray-600 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">{product.condition_notes}</p>
                  </div>
                )}
                {product.address_details && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FaMapMarkerAlt className="w-5 h-5 text-red-500" />
                      {"สถานที่รับสินค้า"}
                    </h3>
                    <p className="text-gray-600 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">{product.address_details}</p>
                    {product.latitude && product.longitude && (
                      <div className="mt-4">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <OpenStreetMapPicker
                            latitude={product.latitude}
                            longitude={product.longitude}
                            onLocationSelect={() => {}} // Read-only mode
                            height="300px"
                            zoom={15}
                            readOnly={true}
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => {
                              const googleMapsUrl = `https://www.google.com/maps?q=${product.latitude},${product.longitude}`;
                              window.open(googleMapsUrl, '_blank');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <FaMapMarkerAlt className="w-4 h-4" />
                            {"เปิดใน Google Maps"}
                          </button>
                        </div>
                      </div>
                    )}
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
                  {"ข้อมูลจำเพาะ"}
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
                      {"ไม่มีข้อมูลสเปค"}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {"เจ้าของสินค้านี้ยังไม่ได้เพิ่มข้อมูลจำเพาะ/คุณสมบัติใดๆ"}
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
            {tab === 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ProductRentalCalendar 
                  productId={product.id} 
                  productTitle={product.title}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Rental Request Modal */}
      {showRentalModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
                aria-label={"ปิด"}
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
                    {"ส่งคำขอเช่าสินค้า"}
                  </h2>
                </div>
                <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                  {"กรุณากรอกข้อมูลให้ครบถ้วนเพื่อส่งคำขอเช่าสินค้านี้"}
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
                    <p className="text-red-800 font-medium">{"เกิดข้อผิดพลาด"}</p>
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
                    <p className="text-green-800 font-medium">{"ส่งคำขอสำเร็จ"}</p>
                    <p className="text-green-600 text-sm">{formSuccess}</p>
                    <p className="text-green-500 text-xs mt-1">{"กำลังนำทางไปหน้าชำระเงิน..."}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleRentalSubmit} className="space-y-8">
                {/* Step 1: Rental Type Selection */}
                <motion.div 
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FaTag className="w-5 h-5 text-purple-600" />
                        {"เลือกประเภทการเช่า"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {"เลือกว่าจะเช่าแบบรายวัน รายสัปดาห์ หรือรายเดือน"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Rental Type Selector */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaTag className="w-4 h-4 text-purple-600" />
                      {"เลือกประเภท"}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Daily Option */}
                      <button
                        type="button"
                        onClick={() => setSelectedRentalType(RentalType.DAILY)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          selectedRentalType === RentalType.DAILY
                            ? 'border-purple-500 bg-purple-50 shadow-lg'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            selectedRentalType === RentalType.DAILY
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <FaCalendarAlt className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{"รายวัน"}</p>
                            <p className="text-xs text-gray-600">{"คิดราคาต่อวัน"}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-lg font-bold text-purple-600">
                            ฿{(product?.rental_price_per_day || 0).toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-600 ml-1">/วัน</span>
                        </div>
                      </button>

                      {/* Weekly Option */}
                      {product?.rental_price_per_week && (
                        <button
                          type="button"
                          onClick={() => setSelectedRentalType(RentalType.WEEKLY)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            selectedRentalType === RentalType.WEEKLY
                              ? 'border-purple-500 bg-purple-50 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${
                              selectedRentalType === RentalType.WEEKLY
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <FaCalendarAlt className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{"รายสัปดาห์"}</p>
                              <p className="text-xs text-gray-600">{"เช่าระยะยาว 7 วันขึ้นไป"}</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <span className="text-lg font-bold text-purple-600">
                              ฿{product.rental_price_per_week.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">/สัปดาห์</span>
                            {rentalDays >= 7 && (
                              <div className="text-xs text-green-600 mt-1">
                                  {"ประหยัด"} ฿{Math.max(0, (product.rental_price_per_day * 7) - product.rental_price_per_week).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </button>
                      )}

                      {/* Monthly Option */}
                      {product?.rental_price_per_month && (
                        <button
                          type="button"
                          onClick={() => setSelectedRentalType(RentalType.MONTHLY)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            selectedRentalType === RentalType.MONTHLY
                              ? 'border-purple-500 bg-purple-50 shadow-lg'
                              : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${
                              selectedRentalType === RentalType.MONTHLY
                                ? 'bg-purple-500 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <FaCalendarAlt className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{"รายเดือน"}</p>
                              <p className="text-xs text-gray-600">{"เช่าระยะยาว 30 วันขึ้นไป"}</p>
                            </div>
                          </div>
                          <div className="text-center">
                            <span className="text-lg font-bold text-purple-600">
                              ฿{product.rental_price_per_month.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">/เดือน</span>
                            {rentalDays >= 30 && (
                              <div className="text-xs text-green-600 mt-1">
                                  {"ประหยัด"} ฿{Math.max(0, (product.rental_price_per_day * 30) - product.rental_price_per_month).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Optimal Recommendation */}
                    {optimalRentalInfo && optimalRentalInfo.savings > 0 && optimalRentalInfo.type !== selectedRentalType && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center gap-2">
                          <FaTag className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {"แนะนำ! เลือก"} {getRentalTypeInfo(optimalRentalInfo.type).label} {"ประหยัดกว่า"} ฿{optimalRentalInfo.savings.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedRentalType(optimalRentalInfo.type)}
                            className="text-xs bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 transition-colors"
                          >
                            เลือก
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Selected Type Info */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <FaInfoCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {"ประเภทที่เลือก"}: {getRentalTypeInfo(selectedRentalType).label}
                          {rentalDays > 0 && (
                            <span className="ml-2">({rentalDays} {"วัน"} = ฿{subtotal.toLocaleString()})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>


                  {/* Multiple Weeks/Months Selector */}
                  {(selectedRentalType === RentalType.WEEKLY || selectedRentalType === RentalType.MONTHLY) && (
                    <div className="mb-4">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                        <div className="flex items-center gap-2 mb-3">
                          <FaInfoCircle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-800">
                            {selectedRentalType === RentalType.WEEKLY ? "เลือกจำนวนสัปดาห์" : "เลือกจำนวนเดือน"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                              {selectedRentalType === RentalType.WEEKLY ? "จำนวนสัปดาห์" : "จำนวนเดือน"}
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedRentalType === RentalType.WEEKLY) {
                                    setNumberOfWeeks(Math.max(1, numberOfWeeks - 1));
                                  } else {
                                    setNumberOfMonths(Math.max(1, numberOfMonths - 1));
                                  }
                                }}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={selectedRentalType === RentalType.WEEKLY ? "52" : "12"}
                                value={selectedRentalType === RentalType.WEEKLY ? numberOfWeeks : numberOfMonths}
                                onChange={(e) => {
                                  const value = Math.max(1, parseInt(e.target.value) || 1);
                                  if (selectedRentalType === RentalType.WEEKLY) {
                                    setNumberOfWeeks(value);
                                  } else {
                                    setNumberOfMonths(value);
                                  }
                                }}
                                className="flex-1 p-3 border-2 border-gray-200 rounded-xl text-center font-semibold focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedRentalType === RentalType.WEEKLY) {
                                    setNumberOfWeeks(numberOfWeeks + 1);
                                  } else {
                                    setNumberOfMonths(numberOfMonths + 1);
                                  }
                                }}
                                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          
                          {startDateObj && (
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">
                                วันสิ้นสุด (คำนวณอัตโนมัติ)
                              </label>
                              <div className="p-3 bg-white rounded-xl border-2 border-green-200">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-700">
                                    {(() => {
                                      if (selectedRentalType === RentalType.WEEKLY && numberOfWeeks > 0) {
                                        const endDate = new Date(startDateObj);
                                        endDate.setDate(endDate.getDate() + (numberOfWeeks * 7) - 1);
                                        return endDate.toLocaleDateString('th-TH');
                                      } else if (selectedRentalType === RentalType.MONTHLY && numberOfMonths > 0) {
                                        const endDate = new Date(startDateObj);
                                        endDate.setMonth(endDate.getMonth() + numberOfMonths);
                                        endDate.setDate(endDate.getDate() - 1);
                                        return endDate.toLocaleDateString('th-TH');
                                      }
                                      return "กรุณาเลือกวันเริ่มต้นก่อน";
                                    })()
                                    }
                                  </div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {selectedRentalType === RentalType.WEEKLY 
                                      ? `${numberOfWeeks} สัปดาห์ = ${numberOfWeeks * 7} วัน`
                                      : `${numberOfMonths} เดือน ≈ ${numberOfMonths * 30} วัน`
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-white p-3 rounded-lg border border-yellow-200">
                          <div className="text-sm">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600">{"ประเภท"}:</span>
                              <span className="font-semibold text-blue-600">
                                {selectedRentalType === RentalType.WEEKLY ? `${"รายสัปดาห์"} (${numberOfWeeks} ${"สัปดาห์"})` : `${"รายเดือน"} (${numberOfMonths} ${"เดือน"})`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-600">{"ราคาต่อหน่วย"}:</span>
                              <span className="font-semibold">
                                ฿{selectedRentalType === RentalType.WEEKLY
                                  ? (product?.rental_price_per_week || 0).toLocaleString()
                                  : (product?.rental_price_per_month || 0).toLocaleString()
                                } / {selectedRentalType === RentalType.WEEKLY ? "สัปดาห์" : "เดือน"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-yellow-200">
                              <span className="text-gray-600">{"ค่าเช่ารวม"}:</span>
                              <span className="font-bold text-green-600">
                                ฿{selectedRentalType === RentalType.WEEKLY
                                  ? ((product?.rental_price_per_week || 0) * numberOfWeeks).toLocaleString()
                                  : ((product?.rental_price_per_month || 0) * numberOfMonths).toLocaleString()
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-yellow-600">
                          <strong>{"หมายเหตุ"}:</strong> {"ระบบจะคำนวณวันสิ้นสุดโดยอัตโนมัติ"}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Current Price Display */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                    <div className="flex flex-wrap items-baseline gap-4 mb-3">
                      <span className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        ฿{(() => {
                          if (optimalRentalInfo) {
                            return optimalRentalInfo.rate.toLocaleString();
                          }
                          return (product?.rental_price_per_day || 0).toLocaleString();
                        })()}
                      </span>
                      <span className="text-xl text-gray-600 font-medium">
                        {"บาท"}/{optimalRentalInfo ? getRentalTypeInfo(optimalRentalInfo.type).unit : "วัน"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {product?.security_deposit && product.security_deposit > 0 ? (
                        <span className="inline-flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl text-sm font-semibold text-yellow-700 border border-yellow-200">
                          <FaShieldAlt className="w-4 h-4" />
                          {"เงินประกัน"} ฿{product.security_deposit.toLocaleString()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200">
                          <FaShieldAlt className="w-4 h-4" />
                          {"ไม่มีเงินประกัน"}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Step 2: Date Selection */}
                <motion.div 
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FaCalendarAlt className="w-5 h-5 text-blue-600" />
                        {"เลือกช่วงวันที่ต้องการเช่า"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {"เลือกวันเริ่มต้นและวันสิ้นสุดที่ต้องการเช่า"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        {"วันเริ่มต้น"}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <DatePicker
                          selected={startDateObj}
                          onChange={date => {
                            setStartDateObj(date);
                            // Auto-calculate end date based on rental type for non-daily rentals
                            if (date && selectedRentalType !== RentalType.DAILY) {
                              // Will be handled by useEffect that watches for rentalDays changes
                            }
                          }}
                          minDate={addDaysTz(getCurrentDate(), 1).toDate()}
                          placeholderText={
                            selectedRentalType === RentalType.WEEKLY 
                              ? 'เลือกวันเริ่มต้นสัปดาห์' 
                              : selectedRentalType === RentalType.MONTHLY 
                              ? 'เลือกวันเริ่มต้นเดือน' 
                              : "เลือกวันที่"
                          }
                          dateFormat="dd/MM/yyyy"
                          className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                          showPopperArrow
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          isClearable
                          todayButton={"วันนี้"}
                          calendarStartDay={selectedRentalType === RentalType.WEEKLY ? 1 : undefined}
                          showWeekNumbers={selectedRentalType === RentalType.WEEKLY}
                          dayClassName={(date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isAvailable = dateAvailability[dateStr];
                            
                            if (isAvailable === undefined) {
                              return 'text-gray-400'; // Loading or unknown
                            }
                            
                            return isAvailable 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200 line-through';
                          }}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaCalendarAlt className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        {"วันสิ้นสุด"}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <DatePicker
                          selected={endDateObj}
                          onChange={date => setEndDateObj(date)}
                          minDate={startDateObj ? addDaysTz(startDateObj, 1).toDate() : addDaysTz(getCurrentDate(), 2).toDate()}
                          disabled={!startDateObj || selectedRentalType !== RentalType.DAILY}
                          placeholderText={
                            selectedRentalType === RentalType.DAILY 
                              ? "เลือกวันที่" 
                              : `คำนวณอัตโนมัติ (${selectedRentalType === RentalType.WEEKLY ? `${numberOfWeeks} สัปดาห์` : `${numberOfMonths} เดือน`})`
                          }
                          dateFormat="dd/MM/yyyy"
                          className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
                          showPopperArrow
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          isClearable={selectedRentalType === RentalType.DAILY}
                          todayButton={selectedRentalType === RentalType.DAILY ? "วันนี้" : undefined}
                          readOnly={selectedRentalType !== RentalType.DAILY}
                          dayClassName={(date) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isAvailable = dateAvailability[dateStr];
                            
                            if (isAvailable === undefined) {
                              return 'text-gray-400'; // Loading or unknown
                            }
                            
                            return isAvailable 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200 line-through';
                          }}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <FaCalendarAlt className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date Availability Legend */}
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <FaInfoCircle className="w-4 h-4" />
                      {"คำอธิบายสีในปฏิทิน"}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                        <span className="text-green-700 font-medium">{"เช่าได้"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                        <span className="text-red-700 font-medium">{"เช่าไม่ได้"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                        <span className="text-gray-600 font-medium">{"กำลังตรวจสอบ"}</span>
                      </div>
                    </div>
                    {loadingDateAvailability && (
                      <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                        <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>
                        {"กำลังตรวจสอบความพร้อมใช้งาน..."}
                      </div>
                    )}
                    {availabilityError && (
                      <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                        <FaExclamationTriangle className="w-3 h-3" />
                        {availabilityError}
                      </div>
                    )}
                  </div>
                  
                  {/* Quantity is fixed at 1 for single item rental */}
                  <div className="space-y-2">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <FaInfoCircle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-700">
                          {"สินค้านี้อนุญาตให้เช่าได้ทีละ 1 ชิ้นเท่านั้น"}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        {"จำนวนสินค้าที่พร้อมใช้งาน"}: {product?.quantity || 0} {"ชิ้น"}
                      </p>
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
                        {"วันสิ้นสุดต้องอยู่หลังวันเริ่มต้น"}
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Rental Duration Validation Message */}
                  {startDateObj && endDateObj && isAfter(endDateObj, startDateObj) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border ${
                        rentalCostsResult.rentalDays >= (product?.min_rental_duration_days || 1) && 
                        (!product?.max_rental_duration_days || rentalCostsResult.rentalDays <= product.max_rental_duration_days)
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {rentalDays >= (product?.min_rental_duration_days || 1) && 
                         (!product?.max_rental_duration_days || rentalCostsResult.rentalDays <= product.max_rental_duration_days) ? (
                          <>
                            <FaCheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">
                              {"ระยะเวลาเช่าถูกต้อง"} ({rentalCostsResult.rentalDays} {"วัน"})
                            </span>
                          </>
                        ) : (
                          <>
                            <FaExclamationTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-700">
                              {rentalCostsResult.rentalDays < (product?.min_rental_duration_days || 1) 
                                ? `ระยะเวลาเช่าสั้นเกินไป ต้องเช่าอย่างน้อย ${product?.min_rental_duration_days || 1} วัน`
                                : `ระยะเวลาเช่ายาวเกินไป ต้องเช่าไม่เกิน ${product?.max_rental_duration_days} วัน`
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
                      {"วันเริ่มต้นคือวันแรกของการเช่า วันสิ้นสุดคือวันสุดท้ายของการเช่า"}
                    </p>
                  </div>
                  
                  {/* Rental Period Summary */}
                  {startDateObj && endDateObj && rentalDays > 0 && (
                    <motion.div 
                      className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <FaClock className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-sm font-semibold text-indigo-800">{"สรุปช่วงเวลาเช่า"}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-indigo-100">
                          <div className="text-xs text-gray-600 mb-1">{"ช่วงเวลา"}</div>
                          <div className="font-semibold text-gray-900">
                            {startDateObj.toLocaleDateString('th-TH')} - {endDateObj.toLocaleDateString('th-TH')}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {"รวม"} {rentalDays} {"วัน"}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-indigo-100">
                          <div className="text-xs text-gray-600 mb-1">{"ประเภทการเช่า"}</div>
                          <div className="font-semibold text-indigo-800">
                            {getRentalTypeInfo(selectedRentalType).label}
                          </div>
                          {selectedRentalType === RentalType.WEEKLY && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.ceil(rentalDays / 7)} {"สัปดาห์"} ({Math.ceil(rentalDays / 7) * 7} {"วัน"})
                          </div>
                          )}
                          {selectedRentalType === RentalType.MONTHLY && (
                            <div className="text-xs text-gray-500 mt-1">
                              {Math.ceil(rentalDays / 30)} {"เดือน"} (~{Math.ceil(rentalDays / 30) * 30} {"วัน"})
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Show pricing breakdown */}
                      <div className="mt-3 pt-3 border-t border-indigo-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{"ค่าเช่ารวม"}:</span>
                          <span className="font-bold text-indigo-800">฿{subtotal.toLocaleString()}</span>
                        </div>
                        {optimalRentalInfo && optimalRentalInfo.savings > 0 && optimalRentalInfo.type === selectedRentalType && (
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-green-600">{"ประหยัด"}:</span>
                            <span className="font-semibold text-green-600">฿{optimalRentalInfo.savings.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                </motion.div>

                {/* Step 3: Pickup Method */}
                <motion.div 
                  className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FaTruck className="w-5 h-5 text-green-600" />
                        {"วิธีรับสินค้า"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {"เลือกว่าคุณจะไปรับเอง หรือให้จัดส่ง"}
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
                          <p className="font-semibold text-gray-900">{"รับสินค้าด้วยตนเอง"}</p>
                          <p className="text-sm text-gray-600">{"ไปรับสินค้าจากเจ้าของโดยตรง"}</p>
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
                          <p className="font-semibold text-gray-900">{"จัดส่งสินค้า"}</p>
                          <p className="text-sm text-gray-600">{"จัดส่งถึงที่อยู่ของคุณ (มีค่าธรรมเนียม)"}</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>

                {/* Step 4: Delivery Address */}
                {pickupMethod === RentalPickupMethod.DELIVERY && (
                  <motion.div 
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full font-bold text-sm">
                        4
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <FaMapMarkerAlt className="w-5 h-5 text-purple-600" />
                          {"ที่อยู่สำหรับจัดส่ง"}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {"เลือกที่อยู่ที่ต้องการให้จัดส่งสินค้า"}
                        </p>
                      </div>
                    </div>
                    
                    {isLoadingAddresses ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="ml-3 text-purple-600">{"กำลังโหลดที่อยู่..."}</span>
                      </div>
                    ) : addresses.length > 0 ? (
                      <div className="space-y-4">
                        <select 
                          value={selectedAddressId || ''} 
                          onChange={e => setSelectedAddressId(Number(e.target.value))} 
                          className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white"
                        >
                          <option value="">{"เลือกที่อยู่"}</option>
                          {addresses.map(addr => (
                            <option key={addr.id} value={addr.id}>
                              {addr.recipient_name} - {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}{addr.sub_district ? `, ${addr.sub_district}` : ''}, {addr.district}, {provinces.find(p => p.id === addr.province_id)?.name_th || `จังหวัด ID: ${addr.province_id}`}{addr.postal_code ? ` ${addr.postal_code}` : ''}
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
                          {"เพิ่มที่อยู่ใหม่"}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FaMapMarkerAlt className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-gray-600 mb-4">{"ไม่พบที่อยู่สำหรับจัดส่ง"}</p>
                        <button 
                          type="button" 
                          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors duration-200" 
                          onClick={() => setShowAddAddress(true)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          {"เพิ่มที่อยู่ใหม่"}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 5: Notes */}
                <motion.div 
                  className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-100"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full font-bold text-sm">
                      5
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FaComments className="w-5 h-5 text-orange-600" />
                        {"หมายเหตุเพิ่มเติม"}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {"ระบุรายละเอียดเพิ่มเติมถึงเจ้าของสินค้า (ถ้ามี)"}
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
                    placeholder={"เช่น เวลานัดรับสินค้าที่สะดวก, จุดสังเกตของสถานที่จัดส่ง"}
                  />
                </motion.div>

                {/* Step 6: Cost Summary */}
                {rentalDays > 0 && (
                  <motion.div 
                    className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-full font-bold text-sm">
                        6
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <FaMoneyBillWave className="w-5 h-5 text-indigo-600" />
                          {"สรุปค่าใช้จ่าย"}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {"สรุปยอดเงินที่คุณต้องชำระ (ยอดเงินสุดท้ายจะยืนยันในหน้าชำระเงิน)"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Rental Duration */}
                      <div className="bg-white rounded-xl p-4 border border-indigo-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FaClock className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-medium text-gray-700">{"ระยะเวลาเช่า"}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            {rentalDays} {"วัน"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {"ตั้งแต่วันที่"} {startDateObj?.toLocaleDateString('th-TH')} {"ถึง"} {endDateObj?.toLocaleDateString('th-TH')}
                        </div>
                      </div>

                      {/* Rental Cost Breakdown */}
                      <div className="bg-white rounded-xl p-4 border border-indigo-100">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <FaTag className="w-4 h-4 text-indigo-600" />
                          {"รายการค่าเช่า"}
                        </h4>
                        
                        <div className="space-y-2">
                          {/* Base rental cost */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-700">
                                {"ค่าเช่า"} ({getRentalTypeInfo(selectedRentalType).label})
                              </span>
                              {optimalRentalInfo && optimalRentalInfo.savings > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  {"ประหยัด"} ฿{optimalRentalInfo.savings.toLocaleString()}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              ฿{subtotal.toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Rate breakdown */}
                          <div className="text-xs text-gray-500 pl-4">
                            {selectedRentalType === RentalType.DAILY ? (
                              `฿${(product?.rental_price_per_day || 0).toLocaleString()} × ${rentalDays} วัน`
                            ) : selectedRentalType === RentalType.WEEKLY ? (
                              `฿${(product?.rental_price_per_week || 0).toLocaleString()} × ${Math.ceil(rentalDays / 7)} สัปดาห์`
                            ) : (
                              `฿${(product?.rental_price_per_month || 0).toLocaleString()} × ${Math.ceil(rentalDays / 30)} เดือน`
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Security Deposit */}
                      {product?.security_deposit && product.security_deposit > 0 && (
                        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FaShieldAlt className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-gray-700">{"เงินประกัน"}</span>
                              <span className="text-xs text-yellow-600">({"จะได้รับคืนเมื่อสิ้นสุดการเช่า"})</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              ฿{product.security_deposit.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Platform Fees and Delivery Fees */}
                      {loadingFees ? (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                            <span className="text-sm text-gray-600">{"กำลังคำนวณค่าธรรมเนียม..."}</span>
                          </div>
                        </div>
                      ) : estimatedFees ? (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <FaCalculator className="w-4 h-4 text-blue-600" />
                            {"ค่าธรรมเนียมโดยประมาณ"}
                          </h4>
                          
                          <div className="space-y-2">
                            {/* Platform fee for renter */}
                            {estimatedFees.platform_fee_renter > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{"ค่าธรรมเนียมแพลตฟอร์ม"}</span>
                                <span className="text-sm font-bold text-gray-900">
                                  ฿{estimatedFees.platform_fee_renter.toLocaleString()}
                                </span>
                              </div>
                            )}
                            
                            {/* Delivery fee */}
                            {pickupMethod === RentalPickupMethod.DELIVERY && estimatedFees.delivery_fee > 0 && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">{"ค่าจัดส่ง"}</span>
                                <span className="text-sm font-bold text-gray-900">
                                  ฿{estimatedFees.delivery_fee.toLocaleString()}
                                </span>
                              </div>
                            )}
                            
                            {/* Total estimated fees */}
                            {estimatedFees.total_estimated_fees > 0 && (
                              <div className="pt-2 border-t border-blue-200">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-blue-700">{"รวมค่าธรรมเนียม"}</span>
                                  <span className="text-sm font-bold text-blue-900">
                                    ฿{estimatedFees.total_estimated_fees.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {estimatedFees.total_estimated_fees === 0 && (
                              <div className="text-center py-2">
                                <span className="text-sm text-green-600 font-medium">{"ไม่มีค่าธรรมเนียมเพิ่มเติม"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center gap-2">
                            <FaTruck className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">{"ค่าธรรมเนียม"}</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            {"ค่าธรรมเนียมจะถูกคำนวณอีกครั้งในหน้าชำระเงิน"}
                          </p>
                        </div>
                      )}

                      {/* Total Summary */}
                      <div className="bg-gradient-to-r from-indigo-100 to-blue-100 rounded-xl p-4 border-2 border-indigo-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FaCalculator className="w-5 h-5 text-indigo-700" />
                            <span className="text-lg font-bold text-indigo-900">{"ยอดรวมเบื้องต้น"}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-900">
                              ฿{(
                                subtotal + 
                                (product?.security_deposit || 0) + 
                                (estimatedFees?.total_estimated_fees || 0)
                              ).toLocaleString()}
                            </div>
                            <div className="text-xs text-indigo-600">
                              {estimatedFees?.total_estimated_fees
                                ? "รวมเงินประกันและค่าธรรมเนียมโดยประมาณ"
                                : product?.security_deposit
                                ? "รวมเงินประกัน"
                                : "ยังไม่รวมค่าธรรมเนียม"
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Breakdown tooltip */}
                        {estimatedFees && (
                          <div className="mt-3 pt-3 border-t border-indigo-200">
                            <div className="text-xs text-indigo-700 space-y-1">
                              <div className="flex justify-between">
                                <span>{"ค่าเช่า"}:</span>
                                <span>฿{subtotal.toLocaleString()}</span>
                              </div>
                              {product?.security_deposit && product.security_deposit > 0 && (
                              <div className="flex justify-between">
                                <span>{"เงินประกัน"}:</span>
                                <span>฿{product.security_deposit.toLocaleString()}</span>
                              </div>
                              )}
                              {estimatedFees.total_estimated_fees > 0 && (
                                <div className="flex justify-between">
                                  <span>{"รวมค่าธรรมเนียม"}:</span>
                                  <span>฿{estimatedFees.total_estimated_fees.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Important Notes */}
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <FaInfoCircle className="w-4 h-4 text-gray-600" />
                          {"ข้อควรทราบ"}
                        </h5>
                        <ul className="text-xs text-gray-600 space-y-1">
                          <li>• {"ค่าธรรมเนียมอ้างอิงจากการตั้งค่าระบบในปัจจุบัน"}</li>
                          <li>• {"ค่าธรรมเนียมแพลตฟอร์มสำหรับผู้เช่าในปัจจุบัน"} {estimatedFees ? `${((estimatedFees.platform_fee_renter / subtotal) * 100).toFixed(1)}%` : '0%'}</li>
                          {pickupMethod === RentalPickupMethod.DELIVERY && (
                            <li>• {"ค่าจัดส่งเริ่มต้น"} {estimatedFees ? `฿${estimatedFees.delivery_fee.toLocaleString()}` : "กำลังโหลด"}</li>
                          )}
                          {product?.security_deposit && (
                            <li>• {"เงินประกันจะถูกคืนเมื่อสิ้นสุดการเช่าหากไม่มีความเสียหาย"}</li>
                          )}
                          <li>• {"ยอดเงินสุดท้ายจะยืนยันในหน้าชำระเงิน"}</li>
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}


                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
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
                          ? "กรุณาเลือกวันที่"
                          : rentalDays < (product?.min_rental_duration_days || 1)
                          ? `ระยะเวลาเช่าสั้นเกินไป (ขั้นต่ำ ${product?.min_rental_duration_days || 1} วัน)`
                          : (product?.max_rental_duration_days ? rentalDays > product.max_rental_duration_days : false)
                          ? `ระยะเวลาเช่ายาวเกินไป (สูงสุด ${product?.max_rental_duration_days} วัน)`
                          : "ส่งคำขอเช่า"
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
                aria-label={"ปิด"}
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
                    {"เพิ่มที่อยู่ใหม่"}
                  </h3>
                </div>
                <p className="text-purple-100 text-sm leading-relaxed">
                  {"กรุณากรอกข้อมูลที่อยู่สำหรับจัดส่งให้ครบถ้วน"}
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
                    <p className="text-red-800 font-medium">{"เกิดข้อผิดพลาด"}</p>
                    <p className="text-red-600 text-sm">{addAddressError}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleAddAddress} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {"ชื่อผู้รับ"}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={"ชื่อผู้รับ"} 
                      required 
                      value={newAddress.recipient_name} 
                      onChange={e => setNewAddress({ ...newAddress, recipient_name: e.target.value })} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {"เบอร์โทรศัพท์"}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={"เบอร์โทรศัพท์"} 
                      required 
                      value={newAddress.phone_number} 
                      onChange={e => setNewAddress({ ...newAddress, phone_number: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {"ที่อยู่บรรทัดที่ 1"}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                    placeholder={"บ้านเลขที่, ถนน, หมู่บ้าน"} 
                    required 
                    value={newAddress.address_line1} 
                    onChange={e => setNewAddress({ ...newAddress, address_line1: e.target.value })} 
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {"ที่อยู่บรรทัดที่ 2 (ถ้ามี)"}
                  </label>
                  <input 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                    placeholder={"รายละเอียดเพิ่มเติม"} 
                    value={newAddress.address_line2} 
                    onChange={e => setNewAddress({ ...newAddress, address_line2: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {"ตำบล/แขวง"}
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={"ตำบล/แขวง"} 
                      value={newAddress.sub_district} 
                      onChange={e => setNewAddress({ ...newAddress, sub_district: e.target.value })} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {"อำเภอ/เขต"}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={"อำเภอ/เขต"} 
                      required 
                      value={newAddress.district} 
                      onChange={e => setNewAddress({ ...newAddress, district: e.target.value })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {"จังหวัด"}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      required 
                      value={newAddress.province_id} 
                      onChange={e => setNewAddress({ ...newAddress, province_id: Number(e.target.value) })}
                    >
                      <option value="">{"เลือกจังหวัด"}</option>
                      {provinces.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.name_th}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      {"รหัสไปรษณีย์"}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input 
                      className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white" 
                      placeholder={"รหัสไปรษณีย์"} 
                      required 
                      value={newAddress.postal_code} 
                      onChange={e => setNewAddress({ ...newAddress, postal_code: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Google Maps Location Picker */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {"เลือกตำแหน่งบนแผนที่ (ทางเลือก)"}
                  </label>
                  <OpenStreetMapPicker
                    onLocationSelect={(location) => {
                      setNewAddress({
                        ...newAddress,
                        latitude: location.lat,
                        longitude: location.lng,
                        address_line1: location.formattedAddress || newAddress.address_line1
                      });
                    }}
                    placeholder={"ค้นหาที่อยู่หรือคลิกบนแผนที่"}
                    height="300px"
                    className="border-2 border-gray-200 rounded-xl overflow-hidden"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    {"หมายเหตุ (ถ้ามี)"}
                  </label>
                  <textarea 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white resize-none" 
                    placeholder={"เช่น จุดสังเกต หรือรายละเอียดการส่ง"} 
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
                    {"ยกเลิก"}
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors duration-200 font-semibold shadow-lg" 
                    disabled={addingAddress}
                  >
                    {addingAddress ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {"กำลังบันทึก..."}
                      </div>
                    ) : (
                      "บันทึกที่อยู่"
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
                aria-label={"ปิด"}
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
                    {"โปรไฟล์เจ้าของสินค้า"}
                  </h2>
                </div>
                <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                  {"ข้อมูลสาธารณะของเจ้าของสินค้าชิ้นนี้"}
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
                      {"เป็นสมาชิกตั้งแต่"} {new Date(product.owner.created_at).toLocaleDateString('th-TH')}
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
                    {"ข้อมูลติดต่อ"}
                  </h4>
                  
                  {loadingOwnerProfile ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">{"กำลังโหลดโปรไฟล์..."}</p>
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
                          <p className="text-sm text-gray-600">{"ชื่อ"}</p>
                          <p className="font-semibold text-gray-900">
                            {ownerDetailedProfile.first_name} {ownerDetailedProfile.last_name || ''}
                          </p>
                        </div>
                      </div>

                      {/* Username */}
                      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                        <FaUser className="w-5 h-5 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">{"ชื่อผู้ใช้"}</p>
                          <p className="font-semibold text-gray-900">@{ownerDetailedProfile.username}</p>
                        </div>
                      </div>

                      {/* Email */}
                      {ownerDetailedProfile.email && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                          <FaEnvelope className="w-5 h-5 text-gray-500" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">{"อีเมล"}</p>
                            <p className="font-semibold text-gray-900 break-all">{ownerDetailedProfile.email}</p>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(ownerDetailedProfile.email);
                              alert("คัดลอกอีเมลแล้ว");
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title={"คัดลอกอีเมล"}
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
                            <p className="text-sm text-gray-600">{"เบอร์โทรศัพท์"}</p>
                            <p className="font-semibold text-gray-900">{ownerDetailedProfile.phone_number}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (ownerDetailedProfile.phone_number) {
                                  navigator.clipboard.writeText(ownerDetailedProfile.phone_number);
                                  alert("คัดลอกเบอร์โทรศัพท์แล้ว");
                                }
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title={"คัดลอกเบอร์โทรศัพท์"}
                            >
                              <FaCopy className="w-4 h-4" />
                            </button>
                            <a
                              href={`tel:${ownerDetailedProfile.phone_number || ''}`}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              title={"โทร"}
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
                            <p className="text-sm text-gray-600">{"ที่อยู่"}</p>
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
                              alert("คัดลอกที่อยู่แล้ว");
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title={"คัดลอกที่อยู่"}
                          >
                            <FaCopy className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Contact via Platform */}
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                          <FaComments className="w-4 h-4" />
                          {"ติดต่อผ่านแพลตฟอร์ม"}
                        </h5>
                        <p className="text-sm text-blue-700 mb-3">
                          {"คุณสามารถส่งข้อความถึงเจ้าของสินค้าได้โดยตรงผ่านระบบแชทของเรา"}
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
                            {"ส่งข้อความ"}
                          </Button>
                        )}
                      </div>

                      {/* Note about privacy */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <h5 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                          <FaInfoCircle className="w-4 h-4" />
                          {"หมายเหตุความเป็นส่วนตัว"}
                        </h5>
                        <p className="text-sm text-yellow-700">
                          {"ข้อมูลติดต่อส่วนบุคคลบางส่วนจะถูกเปิดเผยต่อเมื่อมีการยืนยันการเช่าเท่านั้น"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">{"ไม่สามารถโหลดโปรไฟล์เจ้าของสินค้าได้"}</p>
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
                    {"สถานะการยืนยันตัวตน"}
                  </h4>
                  
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-green-200">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FaCheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">{"ยืนยันตัวตนแล้ว"}</p>
                      <p className="text-sm text-green-600">{"ผู้ใช้รายนี้ได้ผ่านการตรวจสอบการยืนยันตัวตนกับเรา"}</p>
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
                      {"ส่งข้อความ"}
                    </Button>
                  )}
                  
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowOwnerProfile(false)}
                  >
                    {"ปิด"}
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