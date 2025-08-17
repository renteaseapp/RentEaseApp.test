import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRentalDetails, cancelRental, initiateReturn, setActualPickupTime } from '../../services/rentalService';
import { getProductByID } from '../../services/productService';
import { sendMessage } from '../../services/chatService';
import { Rental, ApiError, RentalStatus, RentalReturnConditionStatus, InitiateReturnPayload, Product } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../contexts/AlertContext';
import { InitiateReturnForm } from './InitiateReturnForm';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService } from '../../services/socketService';
import AlertNotification from '../../components/common/AlertNotification';
import { 
  FaArrowLeft, 
  FaCalendarAlt, 
  FaUser, 
  FaMoneyBillWave, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimes, 
  FaCreditCard, 
  FaBox, 
  FaStar, 
  FaEye, 
  FaDownload,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaHistory,
  FaInfoCircle,
  FaCheck,
  FaBan,
  FaTruck,
  FaWifi,
  FaComments
} from 'react-icons/fa';
import { useRealtimeRental } from '../../hooks/useRealtimeRental';

export const RenterRentalDetailPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();
  const [rental, setRental] = useState<Rental | null>(null);
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupTime, setPickupTime] = useState('');
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState<string|null>(null);
  const [returnError, setReturnError] = useState<string|null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [realtimeNotification, setRealtimeNotification] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isVisible: false,
    message: '',
    type: 'info'
  });
  const [contactingOwner, setContactingOwner] = useState(false);

  // Realtime rental updates
  const { rental: realtimeRental, isConnected: isRealtimeConnected } = useRealtimeRental({
    rentalId: rentalId || ''
  });

  // Update local rental state when realtime data comes in
  useEffect(() => {
    if (realtimeRental && rental) {
      setRental(realtimeRental as unknown as Rental);
      
      // Show notification based on status change
      if (rental.rental_status !== realtimeRental.rental_status) {
        const statusMessages: Record<string, string> = {
          [RentalStatus.CONFIRMED]: t('renterRentalDetailPage.alerts.statusConfirmed'),
          [RentalStatus.ACTIVE]: t('renterRentalDetailPage.alerts.statusActive'),
          [RentalStatus.RETURN_PENDING]: t('renterRentalDetailPage.alerts.statusReturnPending'),
          [RentalStatus.COMPLETED]: t('renterRentalDetailPage.alerts.statusCompleted'),
          [RentalStatus.CANCELLED_BY_OWNER]: t('renterRentalDetailPage.alerts.statusCancelled'),
          [RentalStatus.REJECTED_BY_OWNER]: t('renterRentalDetailPage.alerts.statusRejected'),
        };
        
        const message = statusMessages[realtimeRental.rental_status];
        if (message) {
          setRealtimeNotification({
            isVisible: true,
            message,
            type: 'success'
          });
          setTimeout(() => setRealtimeNotification(prev => ({ ...prev, isVisible: false })), 5000);
        }
      }

      // Show payment status change notification
      if (rental.payment_status !== realtimeRental.payment_status) {
        if (realtimeRental.payment_status === 'paid') {
          setRealtimeNotification({
            isVisible: true,
            message: t('renterRentalDetailPage.alerts.paymentConfirmed'),
            type: 'success'
          });
          setTimeout(() => setRealtimeNotification(prev => ({ ...prev, isVisible: false })), 5000);
        } else if (realtimeRental.payment_status === 'pending_verification') {
          setRealtimeNotification({
            isVisible: true,
            message: t('renterRentalDetailPage.alerts.paymentUnderReview'),
            type: 'info'
          });
          setTimeout(() => setRealtimeNotification(prev => ({ ...prev, isVisible: false })), 5000);
        }
      }

      // Show late return notification
      if (rental.rental_status !== realtimeRental.rental_status && realtimeRental.rental_status === 'late_return') {
        setRealtimeNotification({
          isVisible: true,
          message: t('renterRentalDetailPage.alerts.lateReturnDetected'),
          type: 'warning'
        });
        setTimeout(() => setRealtimeNotification(prev => ({ ...prev, isVisible: false })), 8000);
      }
    }
  }, [realtimeRental, rental, t]);

  const fetchRentalDetails = () => {
    if (!user?.id || !rentalId) return;
    setIsLoading(true);
    getRentalDetails(rentalId, user.id, 'renter')
      .then(async (fetchedRental) => {
        setRental(fetchedRental);
        if (fetchedRental.product_id) {
          try {
            const productData = await getProductByID(fetchedRental.product_id);
            setProductDetails(productData.data);
          } catch (productError) {
            console.error("Failed to load full product details", productError);
            // Non-fatal, the page can still render with partial data
          }
        }
      })
      .catch(err => setError((err as ApiError).message || t('renterRentalDetailPage.alerts.fetchError')))
      .finally(() => setIsLoading(false));
  }

  // Socket.IO connection for additional events
  useEffect(() => {
    if (token) {
      // Connect to Socket.IO
      socketService.connect(token);
      setIsSocketConnected(true);

      // Listen for product updates
      socketService.onProductUpdated((updatedProduct) => {
        if (rental && updatedProduct.id === rental.product_id) {
          console.log('Real-time product update received:', updatedProduct);
          setProductDetails(updatedProduct);
          setRealtimeNotification({
            isVisible: true,
            message: t('renterRentalDetailPage.alerts.productUpdated'),
            type: 'info'
          });
          setTimeout(() => setRealtimeNotification(prev => ({ ...prev, isVisible: false })), 5000);
        }
      });



      return () => {
        // Cleanup event listeners
        socketService.off('product_updated');

      };
    }
  }, [token, rentalId, rental, t]);

  useEffect(() => {
    fetchRentalDetails();
    // Removed polling since we have real-time Socket.IO updates
  }, [rentalId, user]);

  const handleCancelRental = async () => {
    if (!rental) return;
    if (!cancelReason.trim()) {
      setCancelError(t('renterRentalDetailPage.alerts.cancelReasonRequired'));
      return;
    }
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelRental(rental.id, cancelReason);
      setShowCancelDialog(false);
      showSuccess(t('renterRentalDetailPage.alerts.cancelSuccess'));
      // Refresh rental details
      setIsLoading(true);
      fetchRentalDetails();
    } catch (err) {
      showError((err as ApiError).message || t('renterRentalDetailPage.alerts.cancelError'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleInitiateReturn = async (payload: InitiateReturnPayload) => {
    if (!rental) return;
    setIsReturning(true);
    try {
      await initiateReturn(rental.id, payload);
      setShowReturnForm(false);
      showSuccess(t('renterRentalDetailPage.initiateReturn.success'));
      fetchRentalDetails(); // Refresh data
    } catch (err) {
      showError((err as ApiError).message || t('renterRentalDetailPage.initiateReturn.error'));
    } finally {
      setIsReturning(false);
    }
  };

  const getReturnConditionText = (condition: RentalReturnConditionStatus): string => {
    switch (condition) {
      case RentalReturnConditionStatus.AS_RENTED:
        return t('renterRentalDetailPage.returnConditions.as_rented');
      case RentalReturnConditionStatus.MINOR_WEAR:
        return t('renterRentalDetailPage.returnConditions.minor_wear');
      case RentalReturnConditionStatus.DAMAGED:
        return t('renterRentalDetailPage.returnConditions.damaged');
      case RentalReturnConditionStatus.LOST:
        return t('renterRentalDetailPage.returnConditions.lost');
      default:
        return t('renterRentalDetailPage.returnConditions.not_specified');
    }
  };

  const getDeliveryStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return t('renterRentalDetailPage.deliveryStatus.pending');
      case 'shipped':
        return t('renterRentalDetailPage.deliveryStatus.shipped');
      case 'delivered':
        return t('renterRentalDetailPage.deliveryStatus.delivered');
      case 'failed':
        return t('renterRentalDetailPage.deliveryStatus.failed');
      case 'returned':
        return t('renterRentalDetailPage.deliveryStatus.returned');
      default:
        return t('renterRentalDetailPage.deliveryStatus.unknown');
    }
  };

  const getDeliveryStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'delivered':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'failed':
        return 'bg-red-100 border-red-400 text-red-800';
      case 'returned':
        return 'bg-gray-100 border-gray-400 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const handleChatWithOwner = async () => {
    if (!user || !rental) return;
    
    const ownerId = rental.owner?.id || rental.owner_id;
    if (!ownerId) {
      console.error('Owner information not available:', rental?.owner);
      showError(t('renterRentalDetailPage.alerts.chatNotAvailable'));
      return;
    }

    setContactingOwner(true);
    try {
      const messageText = t('renterRentalDetailPage.defaultChatMessage', { 
        rentalId: rental.rental_uid,
        product: rental.product?.title || t('renterRentalDetailPage.product')
      });
      
      const msg = await sendMessage({
        receiver_id: ownerId,
        message_content: messageText,
        related_product_id: rental.product_id,
        related_rental_id: rental.id
      });
      
      console.log('sendMessage result:', msg);
      
      if (msg && msg.conversation_id) {
        navigate(ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(msg.conversation_id)));
      } else {
        // Fallback to chat inbox
        navigate('/chat');
      }
    } catch (err: any) {
      console.error('Contact owner error:', err);
      let errorMsg = t('renterRentalDetailPage.alerts.chatNotAvailable');
      if (err?.response?.data?.message) errorMsg = err.response.data.message;
      else if (err?.message) errorMsg = err.message;
      showError(errorMsg);
    } finally {
      setContactingOwner(false);
    }
  };

  const handleSetActualPickupTime = async () => {
    if (!pickupTime || !rental?.id) {
      setPickupError(t('renterRentalDetailPage.modals.setActualPickupTime.error.noTimeSelected'));
      return;
    }

    setPickupLoading(true);
    setPickupError(null);

    try {
      const updatedRental = await setActualPickupTime(rental.id, pickupTime);
      setRental(updatedRental);
      setShowPickupModal(false);
      setPickupTime('');
      showSuccess(t('renterRentalDetailPage.modals.setActualPickupTime.success'));
    } catch (error) {
      console.error('Error setting actual pickup time:', error);
      const errorMessage = (error as any)?.response?.data?.message || t('renterRentalDetailPage.modals.setActualPickupTime.error.general');
      setPickupError(errorMessage);
    } finally {
      setPickupLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner message={t('renterRentalDetailPage.loading')} />;
  if (error) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center">{t('renterRentalDetailPage.notFound')}</div>;

  // Status message logic
  let statusBox = null;
  switch (rental.rental_status) {
    case RentalStatus.PENDING_OWNER_APPROVAL:
      statusBox = (
        <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-4 rounded">
          <strong>{t('renterRentalDetailPage.statusMessages.pending_owner_approval_title')}</strong> {t('renterRentalDetailPage.statusMessages.pending_owner_approval_desc')}
        </div>
      );
      break;
    case RentalStatus.PENDING_PAYMENT:
      statusBox = (
        <div className="bg-blue-100 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded">
          <strong>{t('renterRentalDetailPage.statusMessages.pending_payment_title')}</strong> {t('renterRentalDetailPage.statusMessages.pending_payment_desc')}
        </div>
      );
      break;
    case RentalStatus.PENDING_VERIFICATION:
      statusBox = (
        <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-4 rounded">
          <strong>{t('renterRentalDetailPage.statusMessages.pending_verification_title')}</strong> {t('renterRentalDetailPage.statusMessages.pending_verification_desc')}
        </div>
      );
      break;
    case RentalStatus.CONFIRMED:
    case RentalStatus.ACTIVE:
      statusBox = (
        <div className="bg-green-100 border-l-4 border-green-400 text-green-800 p-4 mb-4 rounded">
          <strong>{t('renterRentalDetailPage.statusMessages.confirmed_title')}</strong> {t('renterRentalDetailPage.statusMessages.confirmed_desc')}
        </div>
      );
      break;
    case RentalStatus.RETURN_PENDING:
      statusBox = (
        <div className="bg-blue-100 border-l-4 border-blue-400 text-blue-800 p-4 mb-4 rounded">
          <strong>{t('renterRentalDetailPage.statusMessages.return_pending_title')}</strong> {t('renterRentalDetailPage.statusMessages.return_pending_desc')}
        </div>
      );
      break;
    case RentalStatus.LATE_RETURN:
      statusBox = (
        <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-4 mb-4 rounded">
          <strong>{t('renterRentalDetailPage.statusMessages.late_return_title')}</strong> {t('renterRentalDetailPage.statusMessages.late_return_desc')}
        </div>
      );
      break;
    case RentalStatus.COMPLETED:
      statusBox = (
        <div className="bg-gray-100 border-l-4 border-gray-400 text-gray-800 p-4 mb-4 rounded">
          <strong>{t('renterRentalDetailPage.statusMessages.completed_title')}</strong> {t('renterRentalDetailPage.statusMessages.completed_desc')}
        </div>
      );
      break;
    case RentalStatus.REJECTED_BY_OWNER:
    case RentalStatus.CANCELLED_BY_OWNER:
    case RentalStatus.CANCELLED_BY_RENTER:
      statusBox = (
        <div className="bg-red-100 border-l-4 border-red-400 text-red-800 p-4 mb-4 rounded">
          <strong>{t('renterRentalDetailPage.statusMessages.cancelled_title')}</strong> {rental.cancellation_reason && (<span>{t('renterRentalDetailPage.statusMessages.cancelled_reason')}: {rental.cancellation_reason}</span>)}
        </div>
      );
      break;
    default:
      statusBox = null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      <AlertNotification
        isVisible={realtimeNotification.isVisible}
        message={realtimeNotification.message}
        type={realtimeNotification.type}
        onClose={() => setRealtimeNotification(prev => ({ ...prev, isVisible: false }))}
      />
      <div className="container mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Link 
            to={ROUTE_PATHS.MY_RENTALS_RENTER} 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <FaArrowLeft className="h-4 w-4" />
            {t('renterRentalDetailPage.backToMyRentals')}
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
              <FaEye className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {rental.product?.title}
              </h1>
              <p className="text-gray-600 text-lg">{t('renterRentalDetailPage.rentalDetailsSubtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <FaWifi className="h-4 w-4" />
                {isSocketConnected ? t('renterRentalDetailPage.connectionStatus.live') : t('renterRentalDetailPage.connectionStatus.offline')}
              </span>
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
        
        {statusBox && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            {statusBox}
          </motion.div>
        )}
      
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 md:gap-8"
        >
          {/* Main Content (Left Column) */}
          <div className="md:col-span-2 space-y-6">
            {/* {t('renterRentalDetailPage.productImage')} */}
            {(productDetails?.primary_image?.image_url || rental.product?.primary_image?.image_url || (rental.product?.images && rental.product.images[0]?.image_url)) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <img
                  src={
                    productDetails?.primary_image?.image_url ||
                    rental.product?.primary_image?.image_url ||
                    (rental.product?.images && rental.product.images[0]?.image_url) ||
                    ''
                  }
                  alt={productDetails?.title || rental.product?.title || t('renterRentalDetailPage.productImage')}
                  className="w-full max-w-md max-h-72 h-auto object-cover rounded-xl shadow-lg mx-auto"
                />
              </motion.div>
            )}

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FaInfoCircle className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{t('renterRentalDetailPage.productDetails')}</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaBox className="h-5 w-5 text-blue-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.productName')}</span>
                      <p className="font-semibold">{productDetails?.title || rental.product?.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaShieldAlt className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.category')}</span>
                      <p className="font-semibold">{productDetails?.category?.name || rental.product?.category?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaMoneyBillWave className="h-5 w-5 text-yellow-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.pricePerDay')}</span>
                      <p className="font-semibold">฿{(productDetails?.rental_price_per_day || rental.product?.rental_price_per_day)?.toLocaleString?.() || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaShieldAlt className="h-5 w-5 text-purple-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.deposit')}</span>
                      <p className="font-semibold">฿{(productDetails?.security_deposit || rental.product?.security_deposit)?.toLocaleString?.() || '-'}</p>
                    </div>
                  </div>
                </div>
                
                {(productDetails?.specifications && Object.keys(productDetails.specifications).length > 0) || (rental.product?.specifications && Object.keys(rental.product.specifications).length > 0) ? (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-3">{t('renterRentalDetailPage.specifications')}:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(productDetails?.specifications || rental.product?.specifications || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                          <FaInfoCircle className="h-4 w-4 text-blue-500" />
                          <span className="text-sm capitalize">{key.replace(/_/g, ' ')}: <strong>{String(value)}</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                
                {productDetails?.condition_notes || rental.product?.condition_notes ? (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <FaExclamationTriangle className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">{t('renterRentalDetailPage.conditionNotes')}</span>
                    </div>
                    <p className="text-yellow-700">{productDetails?.condition_notes || rental.product?.condition_notes}</p>
                  </div>
                ) : null}
              </div>
            </motion.div>

            {/* Delivery Status Section */}
            {rental.pickup_method && rental.pickup_method === 'delivery' && rental.delivery_status && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <FaTruck className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{t('renterRentalDetailPage.deliveryStatus.title')}</h3>
                </div>
                <div className="space-y-4">
                  <div className={`border-l-4 p-4 rounded ${getDeliveryStatusColor(rental.delivery_status)}`}>
                    <div className="flex items-center gap-3">
                      <FaTruck className="h-5 w-5" />
                      <div>
                        <span className="text-sm font-medium">{t('renterRentalDetailPage.deliveryStatus.status')}</span>
                        <p className="font-semibold">{getDeliveryStatusText(rental.delivery_status)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {rental.tracking_number && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FaInfoCircle className="h-5 w-5 text-blue-500" />
                      <div>
                        <span className="text-sm text-gray-500">{t('renterRentalDetailPage.deliveryStatus.trackingNumber')}</span>
                        <p className="font-semibold">{rental.tracking_number}</p>
                      </div>
                    </div>
                  )}
                  
                  {rental.carrier_code && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FaShieldAlt className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="text-sm text-gray-500">{t('renterRentalDetailPage.deliveryStatus.carrier')}</span>
                        <p className="font-semibold">{rental.carrier_code}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            {rental.actual_return_time && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.0 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-xl">
                    <FaCheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-800">{t('renterRentalDetailPage.returnInfo.title')}</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                      <FaCalendarAlt className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="text-sm text-gray-500">{t('renterRentalDetailPage.returnInfo.returnedAt')}</span>
                        <p className="font-semibold">{new Date(rental.actual_return_time).toLocaleString()}</p>
                      </div>
                    </div>
                    {rental.return_condition_status && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                        <FaShieldAlt className="h-5 w-5 text-green-500" />
                        <div>
                          <span className="text-sm text-gray-500">{t('renterRentalDetailPage.returnInfo.condition')}</span>
                          <p className="font-semibold">{getReturnConditionText(rental.return_condition_status)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {rental.notes_from_owner_on_return && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <FaUser className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-800">{t('renterRentalDetailPage.returnInfo.notes')}</span>
                      </div>
                      <p className="text-blue-700">{rental.notes_from_owner_on_return}</p>
                    </div>
                  )}
                  
                  {rental.return_condition_image_urls && rental.return_condition_image_urls.length > 0 ? (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">{t('renterRentalDetailPage.returnInfo.images')}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {rental.return_condition_image_urls.map((imageUrl, index) => (
                          <a key={index} href={imageUrl} target="_blank" rel="noopener noreferrer" className="group">
                            <img 
                              src={imageUrl} 
                              alt={`${t('renterRentalDetailPage.returnEvidence')} ${index + 1}`} 
                              className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors" 
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <FaInfoCircle className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-600">{t('renterRentalDetailPage.returnInfo.noImages')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {Boolean(rental.payment_proof_url) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-xl">
                    <FaCreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">{t('renterRentalDetailPage.paymentSlip')}</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer" className="group">
                      <img 
                        src={rental.payment_proof_url!} 
                        alt={t('renterRentalDetailPage.paymentSlipAlt')} 
                        className="max-w-xs rounded-xl shadow-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors" 
                      />
                    </a>
                  </div>
                  <div className="flex justify-center">
                    <a 
                      href={rental.payment_proof_url!} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <FaDownload className="h-4 w-4" />
                      {t('renterRentalDetailPage.viewDownloadSlip')}
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar (Right Column) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              {/* Main Action Buttons */}
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{t('renterRentalDetailPage.actions')}</h3>
                {rental.rental_status === RentalStatus.PENDING_PAYMENT && (
                  <Link to={ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(rental.id))} className="block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                      <FaCreditCard className="h-5 w-5" />
                      {t('renterRentalDetailPage.buttons.proceedToPayment')}
                    </motion.button>
                  </Link>
                )}
                {[RentalStatus.CONFIRMED, RentalStatus.ACTIVE, RentalStatus.LATE_RETURN].includes(rental.rental_status) && rental.actual_pickup_time && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowReturnForm(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <FaBox className="h-5 w-5" />
                    {t('renterRentalDetailPage.buttons.returnItem')}
                  </motion.button>
                )}
                {/* Actual Pickup Button */}
                {rental.actual_pickup_time == null && rental.payment_status === 'paid' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPickupModal(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <FaCalendarAlt className="h-5 w-5" />
                    {t('renterRentalDetailPage.buttons.setActualPickupTime')}
                  </motion.button>
                )}
                {rental.rental_status === RentalStatus.COMPLETED && !rental.review_by_renter && (
                  <Link to={ROUTE_PATHS.SUBMIT_REVIEW.replace(':rentalId', String(rental.id))} className="block">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                      <FaStar className="h-5 w-5" />
                      {t('renterRentalDetailPage.buttons.leaveReview')}
                    </motion.button>
                  </Link>
                )}
                
                {/* Chat Button - Always Available */}
                {(rental.owner?.id || rental.owner_id) && (
                  <motion.button
                    whileHover={{ scale: contactingOwner ? 1 : 1.02 }}
                    whileTap={{ scale: contactingOwner ? 1 : 0.98 }}
                    onClick={handleChatWithOwner}
                    disabled={contactingOwner}
                    className={`w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${contactingOwner ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {contactingOwner ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <FaComments className="h-5 w-5" />
                    )}
                    {contactingOwner ? t('renterRentalDetailPage.buttons.contactingOwner') : t('renterRentalDetailPage.buttons.chatWithOwner')}
                  </motion.button>
                )}
              </div>

              <hr className="my-6 border-gray-200" />

              {/* Rental Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{t('renterRentalDetailPage.rentalDetailsTitle')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaShieldAlt className="h-5 w-5 text-blue-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.rentalId')}</span>
                      <p className="font-semibold">{rental.rental_uid}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaInfoCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.statusLabel')}</span>
                      <p className="font-semibold">{t(`rentalStatus.${rental.rental_status}`, rental.rental_status ? rental.rental_status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaCreditCard className="h-5 w-5 text-purple-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.paymentStatusLabel')}</span>
                      <p className="font-semibold">{t(`paymentStatus.${rental.payment_status}`, rental.payment_status ? rental.payment_status.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaCalendarAlt className="h-5 w-5 text-blue-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.rentalPeriod')}</span>
                      <p className="font-semibold">{new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaClock className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.actualPickup')}</span>
                      <p className="font-semibold">{rental.actual_pickup_time ? new Date(rental.actual_pickup_time).toLocaleString() : '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaHistory className="h-5 w-5 text-purple-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.actualReturn')}</span>
                      <p className="font-semibold">{rental.actual_return_time ? new Date(rental.actual_return_time).toLocaleString() : '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaCalendarAlt className="h-5 w-5 text-orange-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.days')}</span>
                      <p className="font-semibold">{Math.ceil((new Date(rental.end_date).getTime() - new Date(rental.start_date).getTime()) / (1000*60*60*24))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaMoneyBillWave className="h-5 w-5 text-yellow-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.pricePerDay')}</span>
                      <p className="font-semibold">฿{rental.rental_price_per_day_at_booking.toLocaleString()}</p>
                    </div>
                  </div>
                  {typeof rental.security_deposit_at_booking === 'number' && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FaShieldAlt className="h-5 w-5 text-blue-500" />
                      <div>
                        <span className="text-sm text-gray-500">{t('renterRentalDetailPage.deposit')}</span>
                        <p className="font-semibold">฿{rental.security_deposit_at_booking.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {typeof rental.delivery_fee === 'number' && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FaTruck className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="text-sm text-gray-500">{t('renterRentalDetailPage.deliveryFee')}</span>
                        <p className="font-semibold">฿{rental.delivery_fee.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {typeof rental.platform_fee_renter === 'number' && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <FaCreditCard className="h-5 w-5 text-purple-500" />
                      <div>
                        <span className="text-sm text-gray-500">{t('renterRentalDetailPage.platformFee')}</span>
                        <p className="font-semibold">฿{rental.platform_fee_renter.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {typeof rental.late_fee_calculated === 'number' && rental.late_fee_calculated > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                      <FaExclamationTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <span className="text-sm text-gray-500">{t('renterRentalDetailPage.lateFeeDeducted')}</span>
                        <p className="font-semibold text-red-600">฿{rental.late_fee_calculated.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {typeof rental.security_deposit_refund_amount === 'number' && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                      <FaMoneyBillWave className="h-5 w-5 text-green-500" />
                      <div>
                        <span className="text-sm text-gray-500">{t('renterRentalDetailPage.depositRefund')}</span>
                        <p className="font-semibold text-green-600">฿{rental.security_deposit_refund_amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('renterRentalDetailPage.depositRefundNote')}</p>
                        {rental.rental_status === 'late_return' && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <FaExclamationTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">คืนเลทแล้ว - กรุณาติดต่อเจ้าของผ่านแชทเพื่อรับเงินประกันคืน</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                    <FaMoneyBillWave className="h-5 w-5 text-blue-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.subtotal')}</span>
                      <p className="font-semibold">฿{(rental.calculated_subtotal_rental_fee || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                    <FaCheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.totalPaid')}</span>
                      <p className="font-semibold">฿{((rental.final_amount_paid || rental.total_amount_due) || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="my-6 border-gray-200" />

              {/* People Info */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{t('renterRentalDetailPage.people')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaUser className="h-5 w-5 text-blue-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.owner')}</span>
                      <p className="font-semibold">{rental.owner?.first_name} {rental.owner?.last_name} (@{rental.owner?.username})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <FaUser className="h-5 w-5 text-green-500" />
                    <div>
                      <span className="text-sm text-gray-500">{t('renterRentalDetailPage.renter')}</span>
                      <p className="font-semibold">{rental.renter?.first_name} {rental.renter?.last_name} (@{rental.renter?.username})</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <hr className="my-6 border-gray-200" />

              {/* {t('renterRentalDetailPage.pickupDeliveryInfo')} */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{t('renterRentalDetailPage.pickupMethod')}</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <FaMapMarkerAlt className="h-5 w-5 text-blue-500" />
                  <div>
                    <span className="text-sm text-gray-500">{t('renterRentalDetailPage.method')}</span>
                    <p className="font-semibold">{t(`pickupMethod.${rental.pickup_method}`, rental.pickup_method?.replace('_',' ').toUpperCase() || rental.pickup_method || '-')}</p>
                  </div>
                </div>
                {rental.delivery_address && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <FaMapMarkerAlt className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">{t('renterRentalDetailPage.deliveryAddress')}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FaUser className="h-4 w-4 text-gray-500" />
                        <span><strong>{rental.delivery_address.recipient_name}</strong> ({rental.delivery_address.phone_number})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="h-4 w-4 text-gray-500" />
                        <span>{rental.delivery_address.address_line1}{rental.delivery_address.address_line2 && <> {rental.delivery_address.address_line2}</>}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaMapMarkerAlt className="h-4 w-4 text-gray-500" />
                        <span>
                          {rental.delivery_address.sub_district && rental.delivery_address.sub_district + ', '}
                          {rental.delivery_address.district && rental.delivery_address.district + ', '}
                          {rental.delivery_address.province_name || rental.delivery_address.province_id}, {rental.delivery_address.postal_code}
                        </span>
                      </div>
                      {rental.delivery_address.notes && (
                        <div className="flex items-center gap-2">
                          <FaInfoCircle className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600">{rental.delivery_address.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* {t('renterRentalDetailPage.secondaryActions')} */}
              {[RentalStatus.PENDING_OWNER_APPROVAL, RentalStatus.PENDING_PAYMENT].includes(rental.rental_status) && (
                <>
                  <hr className="my-6 border-gray-200" />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCancelDialog(true)}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    <FaBan className="h-5 w-5" />
                    {t('renterRentalDetailPage.buttons.cancelRental')}
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Actual Pickup Time Modal */}
      <AnimatePresence>
        {showPickupModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPickupModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {t('renterRentalDetailPage.modals.setActualPickupTime.title')}
                </h3>
                <button
                  onClick={() => setShowPickupModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('renterRentalDetailPage.modals.setActualPickupTime.pickupTime')}
                  </label>
                  <input
                    type="datetime-local"
                    id="pickupTime"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {pickupError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{pickupError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowPickupModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSetActualPickupTime}
                    disabled={!pickupTime || pickupLoading}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                      !pickupTime || pickupLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {pickupLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {t('common.loading')}
                      </div>
                    ) : (
                      t('common.save')
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return Form Modal */}
      <AnimatePresence>
        {showReturnForm && (
          <InitiateReturnForm
            rentalId={rental.id}
            onSubmit={handleInitiateReturn}
            onCancel={() => setShowReturnForm(false)}
            isLoading={isReturning}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
