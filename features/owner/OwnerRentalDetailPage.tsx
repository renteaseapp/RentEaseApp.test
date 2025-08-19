import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRentalDetails, approveRentalRequest, rejectRentalRequest, markPaymentSlipInvalid, processReturn, verifySlipByImage, verifyRentalPayment, completeRentalDirectly } from '../../services/rentalService';
import { Rental, ApiError, RentalReturnConditionStatus, PayoutMethod } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../contexts/AlertContext';
import { getPayoutMethodsByOwnerId, updateRentalDeliveryStatus } from '../../services/ownerService';
import { getProvinces } from '../../services/productService';
import { sendMessage, getConversations } from '../../services/chatService';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService } from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';
import AlertNotification from '../../components/common/AlertNotification';
import ActionGuidePopup from '../../components/common/ActionGuidePopup';
import { useRealtimeRental } from '../../hooks/useRealtimeRental';


// Import icons for a richer UI
import {
  FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle,
  FaUser, FaCalendarAlt, FaTruck, FaMapMarkerAlt, FaTag, FaBox, FaCreditCard,
  FaArrowLeft, FaComments, FaClipboardCheck, FaInfoCircle, FaHourglassHalf, FaPaperPlane,
  FaCoins, FaShippingFast, FaIdCard, FaBuilding, FaMoneyBillWave, FaReceipt, FaFileInvoiceDollar,
  FaWifi, FaShieldAlt
} from 'react-icons/fa';

// --- Status badge component ---
const StatusBadge: React.FC<{ status: string; type: 'rental' | 'payment' | 'delivery_status' | 'return_condition' }> = ({ status, type }) => {
  const { t } = useTranslation();

  const getStatusColor = () => {
    if (type === 'rental') {
      switch (status) {
        case 'completed': return 'bg-green-100 text-green-800 border-green-200';
        case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'pending_owner_approval': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'pending_payment': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'confirmed': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'return_pending': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'cancelled_by_renter':
        case 'cancelled_by_owner':
        case 'rejected_by_owner': return 'bg-red-100 text-red-800 border-red-200';
        case 'dispute': return 'bg-pink-100 text-pink-800 border-pink-200';
        case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'late_return': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else if (type === 'payment') {
      switch (status) {
        case 'paid': return 'bg-green-100 text-green-800 border-green-200';
        case 'pending_verification': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'unpaid': return 'bg-red-100 text-red-800 border-red-200';
        case 'failed': return 'bg-red-100 text-red-800 border-red-200';
        case 'refunded': return 'bg-blue-100 text-blue-800 border-blue-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else if (type === 'delivery_status') {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'shipped': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
        case 'failed': return 'bg-red-100 text-red-800 border-red-200';
        case 'returned': return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else if (type === 'return_condition') {
      switch (status) {
        case 'as_rented': return 'bg-green-100 text-green-800 border-green-200';
        case 'minor_wear': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'damaged': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'lost': return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = () => {
    if (type === 'rental') return t(`ownerRentalDetailPage.status.rental.${status}`);
    if (type === 'payment') return t(`ownerRentalDetailPage.status.payment.${status}`);
    if (type === 'delivery_status') return t(`ownerRentalDetailPage.status.delivery.${status}`);
    if (type === 'return_condition') return t(`ownerRentalDetailPage.status.returnCondition.${status}`);
    return status;
  };

  const getStatusIcon = () => {
    if (type === 'rental') {
      switch (status) {
        case 'completed': return <FaCheckCircle className="h-3 w-3" />;
        case 'active': return <FaHourglassHalf className="h-3 w-3" />;
        case 'pending_owner_approval': return <FaClock className="h-3 w-3" />;
        case 'pending_payment': return <FaCreditCard className="h-3 w-3" />;
        case 'confirmed': return <FaCheckCircle className="h-3 w-3" />;
        case 'return_pending': return <FaClipboardCheck className="h-3 w-3" />;
        case 'cancelled_by_renter':
        case 'cancelled_by_owner':
        case 'rejected_by_owner':
        case 'expired':
        case 'late_return': return <FaTimesCircle className="h-3 w-3" />;
        case 'dispute': return <FaExclamationTriangle className="h-3 w-3" />;
        default: return <FaInfoCircle className="h-3 w-3" />;
      }
    } else if (type === 'payment') {
      switch (status) {
        case 'paid': return <FaCheckCircle className="h-3 w-3" />;
        case 'pending_verification': return <FaHourglassHalf className="h-3 w-3" />;
        case 'pending': return <FaClock className="h-3 w-3" />;
        case 'unpaid': return <FaTimesCircle className="h-3 w-3" />;
        case 'failed': return <FaTimesCircle className="h-3 w-3" />;
        case 'refunded': return <FaCreditCard className="h-3 w-3" />;
        default: return <FaInfoCircle className="h-3 w-3" />;
      }
    } else if (type === 'delivery_status') {
      switch (status) {
        case 'pending': return <FaClock className="h-3 w-3" />;
        case 'shipped': return <FaShippingFast className="h-3 w-3" />;
        case 'delivered': return <FaCheckCircle className="h-3 w-3" />;
        case 'failed': return <FaTimesCircle className="h-3 w-3" />;
        case 'returned': return <FaBox className="h-3 w-3" />;
        default: return <FaInfoCircle className="h-3 w-3" />;
      }
    } else if (type === 'return_condition') {
      switch (status) {
        case 'as_rented': return <FaCheckCircle className="h-3 w-3" />;
        case 'minor_wear': return <FaExclamationTriangle className="h-3 w-3" />;
        case 'damaged': return <FaTimesCircle className="h-3 w-3" />;
        case 'lost': return <FaTimesCircle className="h-3 w-3" />;
        default: return <FaInfoCircle className="h-3 w-3" />;
      }
    }
    return <FaInfoCircle className="h-3 w-3" />;
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      {getStatusIcon()}
      {getStatusText()}
    </span>
  );
};

// --- Helper Components ---
const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; color?: string }> = ({ icon, label, value, color = 'text-gray-500' }) => (
  <div className="flex items-start">
    <div className={`flex-shrink-0 w-6 h-6 ${color}`}>{icon}</div>
    <div className="ml-3 flex-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="text-sm text-gray-800 font-semibold mt-0.5 break-words">{value}</div>
    </div>
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
    <div className="flex-shrink-0 w-7 h-7 text-blue-600">{icon}</div>
    <h2 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h2>
  </div>
);

// --- Tab Button Component ---
type TabId = 'overview' | 'delivery_return' | 'payment_verification';
const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 p-3 sm:p-4 text-sm sm:text-base font-semibold rounded-t-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 ${
        isActive
          ? 'bg-white text-blue-600 shadow-md border-b-2 border-blue-600'
          : 'text-gray-500 hover:text-blue-600 hover:bg-white/60'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
};


// --- Main Page Component ---
export const OwnerRentalDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { rentalId } = useParams<{ rentalId: string }>();
  const { token, user } = useAuth();
  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const { showSuccess, showError } = useAlert();
  const [invalidSlipDialogOpen, setInvalidSlipDialogOpen] = useState(false);
  const [invalidSlipReason, setInvalidSlipReason] = useState('');
  const [invalidSlipLoading, setInvalidSlipLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [actionGuidePopup, setActionGuidePopup] = useState({
    isOpen: false,
    title: '',
    message: '',
    nextSteps: [] as string[],
    type: 'success' as 'success' | 'info' | 'warning' | 'error'
  });
  const navigate = useNavigate();
  const [verifySlipLoading, setVerifySlipLoading] = useState(false);
  const [verifySlipResult, setVerifySlipResult] = useState<any>(null);
  const [verifySlipError, setVerifySlipError] = useState<string | null>(null);
  const [ownerPayout, setOwnerPayout] = useState<PayoutMethod | null>(null);
  const [provinces, setProvinces] = useState<{ id: number, name_th: string }[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [carrierCode, setCarrierCode] = useState<string>('');
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [contactingRenter, setContactingRenter] = useState(false);
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
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const { rental: realtimeRental } = useRealtimeRental({ rentalId: rentalId || '' });

  useEffect(() => {
    if (realtimeRental && rental) {
      setRental(realtimeRental as unknown as Rental);
      // Real-time notification logic here...
    }
  }, [realtimeRental, rental, t]);

  const fetchRental = useCallback(async () => {
    if (!rentalId) {
      setError("Rental ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      if (!user?.id) {
        setError(t('ownerRentalDetailPage.error.accessDenied'));
        setIsLoading(false);
        return;
      }
      
      const data = await getRentalDetails(rentalId, user.id, 'owner');
      setRental(data);
      setDeliveryStatus(data.delivery_status || 'pending');
      setTrackingNumber(data.tracking_number || '');
      setCarrierCode(data.carrier_code || '');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('ownerRentalDetailPage.error.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [rentalId, t, user?.id]);

  useEffect(() => {
    if (token) {
      socketService.connect(token);
      setIsSocketConnected(true);
      return () => { socketService.off('rentalUpdated'); };
    }
  }, [token]);
  
  useEffect(() => {
    fetchRental();
  }, [fetchRental]);
  
  useEffect(() => {
    if (rental?.owner_id) {
      getPayoutMethodsByOwnerId(rental.owner_id).then(methods => {
        const primary = methods.find(m => m.is_primary) || methods[0];
        setOwnerPayout(primary);
      }).catch(() => setOwnerPayout(null));
    }
    getProvinces().then(res => setProvinces(res.data)).catch(() => setProvinces([]));
  }, [rental?.owner_id]);

  // --- All handler functions remain unchanged ---
  const handleApprove = async () => {
    if (!rental) return;
    setActionLoading(true);
    try {
      await approveRentalRequest(rental.id);
      showSuccess(t('ownerRentalDetailPage.approveSuccess'));
      setActionGuidePopup({
        isOpen: true,
        title: t('actionGuidePopup:rentalApproved.title'),
        message: t('actionGuidePopup:rentalApproved.message'),
        nextSteps: t('actionGuidePopup:rentalApproved.steps', { returnObjects: true }) as string[],
        type: 'success'
      });
      await fetchRental();
    } catch (err) {
      const apiError = err as ApiError;
      showError(apiError.message || t('ownerRentalDetailPage.error.approveFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rental || !rejectReason.trim()) {
      showError(t('ownerRentalDetailPage.error.rejectReasonRequired'));
      return;
    }
    setActionLoading(true);
    try {
      await rejectRentalRequest(rental.id, rejectReason.trim());
      showSuccess(t('ownerRentalDetailPage.rejectSuccess'));
      setActionGuidePopup({
        isOpen: true,
        title: t('actionGuidePopup:rentalRejected.title'),
        message: t('actionGuidePopup:rentalRejected.message'),
        nextSteps: t('actionGuidePopup:rentalRejected.steps', { returnObjects: true }) as string[],
        type: 'info'
      });
      await fetchRental();
      setShowRejectForm(false);
      setRejectReason("");
    } catch (err) {
      const apiError = err as ApiError;
      showError(apiError.message || t('ownerRentalDetailPage.error.rejectFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifySlipByImage = async () => {
    if (!rental?.payment_proof_url) {
      setVerifySlipError('ไม่พบไฟล์สลิป');
      return;
    }
    setVerifySlipLoading(true);
    setVerifySlipError(null);
    setVerifySlipResult(null);
    try {
      const res = await fetch(rental.payment_proof_url);
      const blob = await res.blob();
      const file = new File([blob], 'slip.jpg', { type: blob.type });
      const token = 'e4360c24-5b50-4d89-a673-6fed9d8a109e';
      const result = await verifySlipByImage({ file, token });
      setVerifySlipResult(result);
    } catch (err: any) {
      setVerifySlipError(err?.response?.data?.message || err.message || t('ownerRentalDetailPage.error.slipVerificationFailed'));
    } finally {
      setVerifySlipLoading(false);
    }
  };

  const handleMarkSlipInvalid = async () => {
    if (!rental || !invalidSlipReason.trim()) {
      showError(t('ownerRentalDetailPage.invalidSlip.reasonRequired'));
      return;
    }
    setInvalidSlipLoading(true);
    try {
      await markPaymentSlipInvalid(rental.id);
      showSuccess(t('ownerRentalDetailPage.invalidSlip.success'));
      setInvalidSlipDialogOpen(false);
      setInvalidSlipReason('');
      await fetchRental();
    } catch (err) {
      showError(t('ownerRentalDetailPage.invalidSlip.error'));
    } finally {
      setInvalidSlipLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!rental) return;
    setActionLoading(true);
    try {
      await verifyRentalPayment(rental.id);
      await fetchRental();
      showSuccess(t('ownerRentalDetailPage.paymentConfirmSuccess'));
      setActionGuidePopup({
        isOpen: true,
        title: t('actionGuidePopup:paymentConfirmed.title'),
        message: t('actionGuidePopup:paymentConfirmed.message'),
        nextSteps: t('actionGuidePopup:paymentConfirmed.steps', { returnObjects: true }) as string[],
        type: 'success'
      });
    } catch (err) {
      showError(t('ownerRentalDetailPage.error.paymentConfirmFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!rental) return;
    setActionLoading(true);
    try {
      await completeRentalDirectly(rental.id);
      showSuccess(t('ownerRentalDetailPage.disputeResolveSuccess'));
      await fetchRental();
    } catch (err) {
      const apiError = err as ApiError;
      showError(apiError.message || t('ownerRentalDetailPage.error.disputeResolveFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliveryStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental) return;
    setDeliveryLoading(true);
    setDeliveryError(null);
    try {
      await updateRentalDeliveryStatus(rental.id, {
        delivery_status: deliveryStatus as any,
        tracking_number: trackingNumber,
        carrier_code: carrierCode
      });
      await fetchRental();
      showSuccess(t('ownerRentalDetailPage.deliveryStatusUpdateSuccess'));
      setActionGuidePopup({
        isOpen: true,
        title: t('actionGuidePopup:deliveryStatusUpdated.title'),
        message: t('actionGuidePopup:deliveryStatusUpdated.message', { status: deliveryStatus }),
        nextSteps: t('actionGuidePopup:deliveryStatusUpdated.steps', { returnObjects: true }) as string[],
        type: 'success'
      });
    } catch (err: any) {
      setDeliveryError(err?.message || t('ownerRentalDetailPage.error.deliveryStatusUpdateFailed'));
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleChatWithRenter = async () => {
    if (!rental) return;
    const renterId = rental.renter?.id || rental.renter_id;
    if (!renterId) {
      showError(t('ownerRentalDetailPage.alerts.chatNotAvailable'));
      return;
    }
    setContactingRenter(true);
    try {
      const messageText = t('ownerRentalDetailPage.defaultChatMessage', { rentalId: rental.rental_uid, product: rental.product?.title || 'Product' });
      const msg = await sendMessage({ receiver_id: renterId, message_content: messageText, related_product_id: rental.product_id, related_rental_id: rental.id });
      if (msg && msg.conversation_id) {
        navigate(ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(msg.conversation_id)));
      } else {
        navigate('/chat');
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || err?.message || t('ownerRentalDetailPage.alerts.chatNotAvailable'));
    } finally {
      setContactingRenter(false);
    }
  };
  
  const slip = verifySlipResult?.data || verifySlipResult;
  const slipAmount = typeof slip?.amount === 'object' ? `${slip.amount.amount} ${slip.amount.local || ''}`.trim() : slip?.amount || 0;
  const rentalTotalAmount = rental?.total_amount_due || 0;
  const isAccountMatch = slip && ownerPayout && slip.account_number === ownerPayout.account_number && slip.bank_name?.trim().toLowerCase() === ownerPayout.bank_name?.trim().toLowerCase() && slip.account_name?.replace(/\s+/g, '').toLowerCase() === ownerPayout.account_name?.replace(/\s+/g, '').toLowerCase();
  const isAmountMatch = slip && rental && slipAmount && Math.abs(Number(slipAmount) - Number(rentalTotalAmount)) < 5;
  const isDateMatch = slip && rental && slip.date && (() => { const slipDate = new Date(slip.date); const rentalCreatedDate = new Date(rental.created_at); const toleranceMs = 2 * 24 * 60 * 60 * 1000; const minDate = new Date(rentalCreatedDate.getTime() - toleranceMs); const maxDate = new Date(rental.updated_at ? new Date(rental.updated_at).getTime() + toleranceMs : new Date().getTime() + toleranceMs); return slipDate >= minDate && slipDate <= maxDate; })();

  if (isLoading && !rental) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16 flex items-center justify-center"><LoadingSpinner message={t('ownerRentalDetailPage.loadingDetails')} /></div>;
  }
  if (error) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center text-gray-700">{t('ownerRentalDetailPage.error.rentalNotFound')}</div>;

  const canApprove = rental.rental_status === 'pending_owner_approval';
  const showPaymentActions = ['pending_payment', 'pending_verification'].includes(rental.payment_status) && Boolean(rental.payment_proof_url);
  const showReturnActions = ['return_pending', 'late_return'].includes(rental.rental_status);
  const showDisputeResolveButton = rental.rental_status === 'dispute';
  const showDeliveryUpdateForm = rental.pickup_method === 'delivery' && ['confirmed', 'active', 'shipped'].includes(rental.rental_status) && rental.delivery_status !== 'delivered';
  const showClaimButton = ['active', 'return_pending', 'late_return', 'completed'].includes(rental.rental_status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      <AlertNotification isVisible={realtimeNotification.isVisible} message={realtimeNotification.message} type={realtimeNotification.type} onClose={() => setRealtimeNotification(prev => ({ ...prev, isVisible: false }))} />
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="text-center sm:text-left">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4"><FaFileInvoiceDollar className="h-8 w-8 text-white" /></div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('ownerRentalDetailPage.title')}</h1>
                    <p className="text-blue-100 text-lg">{t('ownerRentalDetailPage.subtitle', { uid: rental.rental_uid || rental.id })}</p>
                </div>
                <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div><span className="text-sm text-blue-100 flex items-center gap-1"><FaWifi className="h-4 w-4" />{isSocketConnected ? 'Live' : 'Offline'}</span></div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Link to={ROUTE_PATHS.OWNER_RENTAL_HISTORY}><Button variant="primary" className="bg-white text-black hover:bg-blue-50 hover:text-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg"><FaArrowLeft className="h-5 w-5 mr-2" />{t('ownerRentalDetailPage.backToHistory')}</Button></Link></motion.div>
            </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 shadow-inner">
              <TabButton label={t('ownerRentalDetailPage.tabs.overview', 'ภาพรวม')} icon={<FaInfoCircle />} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <TabButton label={t('ownerRentalDetailPage.tabs.deliveryReturn', 'การจัดส่งและรับคืน')} icon={<FaTruck />} isActive={activeTab === 'delivery_return'} onClick={() => setActiveTab('delivery_return')} />
              <TabButton label={t('ownerRentalDetailPage.tabs.paymentVerification', 'ตรวจสอบการชำระเงิน')} icon={<FaReceipt />} isActive={activeTab === 'payment_verification'} onClick={() => setActiveTab('payment_verification')} />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <Card className="shadow-xl border border-gray-100 rounded-2xl">
                      <CardContent>
                        <SectionTitle icon={<FaBox />} title={t('ownerRentalDetailPage.sections.rentalInformation')} />
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                            <div className="md:col-span-2"><img src={rental.product?.primary_image?.image_url || rental.product?.images?.[0]?.image_url || 'https://picsum.photos/400/225?grayscale'} alt={rental.product?.title} className="w-full h-48 md:h-64 object-cover rounded-lg shadow-md border border-gray-200" /></div>
                            <div className="md:col-span-3 space-y-4">
                                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors"><Link to={ROUTE_PATHS.PRODUCT_DETAIL.replace(':slugOrId', String(rental.product_id))} className="hover:underline">{rental.product?.title}</Link></h3>
                                <div className="flex flex-col gap-1 text-xs text-gray-500"><span><b>ID:</b> {rental.id}</span><span><b>UID:</b> {rental.rental_uid}</span></div>
                                <DetailItem icon={<FaUser />} label={t('ownerRentalDetailPage.labels.renter')} value={`${rental.renter?.first_name} ${rental.renter?.last_name}`} color="text-green-500" />
                                <DetailItem icon={<FaCalendarAlt />} label={t('ownerRentalDetailPage.labels.rentalPeriod')} value={`${new Date(rental.start_date).toLocaleDateString()} - ${new Date(rental.end_date).toLocaleDateString()}`} color="text-purple-500" />
                                <DetailItem icon={<FaTruck />} label={t('ownerRentalDetailPage.labels.pickupMethod')} value={<span className="capitalize">{rental.pickup_method ? t(`ownerRentalDetailPage.pickupMethod.${rental.pickup_method.toLowerCase()}`) : '-'}</span>} color="text-orange-500" />
                                {rental.pickup_method === 'delivery' && rental.delivery_address && (
                                    <DetailItem icon={<FaMapMarkerAlt />} label={t('ownerRentalDetailPage.labels.deliveryAddress')} value={<div><div><b>{rental.delivery_address.recipient_name}</b> ({rental.delivery_address.phone_number})</div><div>{rental.delivery_address.address_line1}{rental.delivery_address.address_line2 && <>, {rental.delivery_address.address_line2}</>}</div><div>{rental.delivery_address.sub_district && rental.delivery_address.sub_district + ', '}{rental.delivery_address.district && rental.delivery_address.district + ', '}{provinces.find(p => p.id === rental.delivery_address?.province_id)?.name_th || rental.delivery_address.province_name || rental.delivery_address.province_id}, {rental.delivery_address.postal_code}</div>{rental.delivery_address.notes && <div className="text-xs text-gray-500 mt-1 italic">Notes: {rental.delivery_address.notes}</div>}</div>} color="text-red-500" />
                                )}
                            </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="shadow-xl border border-gray-100 rounded-2xl">
                        <CardContent>
                            <SectionTitle icon={<FaMoneyBillWave />} title={t('ownerRentalDetailPage.sections.costBreakdown')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-3">
                                  <DetailItem icon={<FaMoneyBillWave className="h-5 w-5 text-yellow-500" />} label={t('ownerRentalDetailPage.labels.pricePerDay')} value={`฿${rental.rental_price_per_day_at_booking.toLocaleString()}`} color="text-yellow-500" />
                                  <DetailItem icon={<FaMoneyBillWave className="h-5 w-5 text-blue-500" />} label={t('ownerRentalDetailPage.labels.subtotal')} value={`฿${(rental.calculated_subtotal_rental_fee || 0).toLocaleString()}`} color="text-blue-500" />
                                  {typeof rental.security_deposit_at_booking === 'number' && (<DetailItem icon={<FaShieldAlt className="h-5 w-5 text-blue-500" />} label={t('ownerRentalDetailPage.labels.deposit')} value={`฿${rental.security_deposit_at_booking.toLocaleString()}`} color="text-blue-500" />)}
                                  {typeof rental.delivery_fee === 'number' && rental.delivery_fee > 0 && (<DetailItem icon={<FaTruck className="h-5 w-5 text-green-500" />} label={t('ownerRentalDetailPage.labels.deliveryFee')} value={`฿${rental.delivery_fee.toLocaleString()}`} color="text-green-500" />)}
                                  {typeof rental.platform_fee_renter === 'number' && rental.platform_fee_renter > 0 && (<DetailItem icon={<FaCreditCard className="h-5 w-5 text-purple-500" />} label={t('ownerRentalDetailPage.labels.platformFeeRenter')} value={`฿${rental.platform_fee_renter.toLocaleString()}`} color="text-purple-500" />)}
                                  {typeof rental.late_fee_calculated === 'number' && rental.late_fee_calculated > 0 && (<DetailItem icon={<FaExclamationTriangle className="h-5 w-5 text-red-500" />} label={t('ownerRentalDetailPage.labels.lateFee')} value={<span className="text-red-600 font-semibold">฿{rental.late_fee_calculated.toLocaleString()} (หักจากเงินประกัน)</span>} color="text-red-500" />)}
                                  {typeof rental.security_deposit_refund_amount === 'number' && (<DetailItem icon={<FaMoneyBillWave className="h-5 w-5 text-green-500" />} label="เงินประกันที่ต้องคืนให้ผู้เช่า" value={<div><span className="text-green-600 font-semibold">฿{rental.security_deposit_refund_amount.toLocaleString()}</span>{rental.rental_status === 'late_return' && (<div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg"><div className="flex items-center gap-2 text-yellow-800"><FaExclamationTriangle className="h-4 w-4" /><span className="text-sm font-medium">คืนเลทแล้ว - กรุณาติดต่อผู้เช่าผ่านแชทเพื่อจัดการคืนเงินประกัน</span></div></div>)}</div>} color="text-green-500" />)}
                               </div>
                               <div className="space-y-3">
                                  <DetailItem icon={<FaMoneyBillWave className="h-5 w-5 text-green-500" />} label={t('ownerRentalDetailPage.labels.totalAmount')} value={`฿${(rental.total_amount_due || 0).toLocaleString()}`} color="text-green-500" />
                                  {typeof rental.final_amount_paid === 'number' && (<DetailItem icon={<FaCheckCircle className="h-5 w-5 text-green-500" />} label={t('ownerRentalDetailPage.labels.finalAmountPaid')} value={`฿${(rental.final_amount_paid || 0).toLocaleString()}`} color="text-green-500" />)}
                                  {typeof rental.platform_fee_owner === 'number' && rental.platform_fee_owner > 0 && (<DetailItem icon={<FaCreditCard className="h-5 w-5 text-orange-500" />} label={t('ownerRentalDetailPage.labels.platformFeeOwner')} value={`฿${(rental.platform_fee_owner || 0).toLocaleString()}`} color="text-orange-500" />)}
                                  <DetailItem icon={<FaCoins className="h-5 w-5 text-indigo-500" />} label={t('ownerRentalDetailPage.labels.estimatedPayout')} value={`฿${(((rental.final_amount_paid || rental.total_amount_due) || 0) - (rental.platform_fee_owner || 0)).toLocaleString()}`} color="text-indigo-500" />
                               </div>
                            </div>
                        </CardContent>
                    </Card>
                  </div>
                )}
                
                {activeTab === 'delivery_return' && (
                  <div className="space-y-8">
                    {showDeliveryUpdateForm && (
                      <Card className="shadow-xl border border-gray-100 rounded-2xl">
                          <CardContent>
                              <SectionTitle icon={<FaShippingFast />} title={t('ownerRentalDetailPage.sections.deliveryStatusUpdate')} />
                              <form onSubmit={handleDeliveryStatusUpdate} className="space-y-4">
                                <div>
                                  <label htmlFor="deliveryStatus" className="block text-sm font-medium text-gray-700 mb-1">{t('ownerRentalDetailPage.labels.deliveryStatus')} <span className="text-red-500">*</span></label>
                                  <select id="deliveryStatus" className="w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={deliveryStatus} onChange={e => setDeliveryStatus(e.target.value)} required>
                                    <option value="delivered">{t('ownerRentalDetailPage.status.delivery.delivered')}</option>
                                  </select>
                                  <p className="text-sm text-gray-600 mt-1">{t('ownerRentalDetailPage.deliveryStatus.onlyDeliveredAllowed')}</p>
                                </div>
                                <div>
                                  <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-1">{t('ownerRentalDetailPage.labels.trackingNumber')}</label>
                                  <input id="trackingNumber" className="w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder={t('ownerRentalDetailPage.placeholders.trackingNumber')} />
                                </div>
                                <div>
                                  <label htmlFor="carrierCode" className="block text-sm font-medium text-gray-700 mb-1">{t('ownerRentalDetailPage.labels.carrierCode')}</label>
                                  <input id="carrierCode" className="w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" type="text" value={carrierCode} onChange={e => setCarrierCode(e.target.value)} placeholder={t('ownerRentalDetailPage.placeholders.carrierCode')} />
                                </div>
                                {deliveryError && <ErrorMessage message={deliveryError} />}
                                <Button type="submit" isLoading={deliveryLoading} variant="primary" className="w-full">{t('ownerRentalDetailPage.actions.saveDeliveryStatus')}</Button>
                              </form>
                          </CardContent>
                      </Card>
                    )}
                    {rental.pickup_method === 'delivery' && rental.delivery_status === 'delivered' && !showDeliveryUpdateForm && (
                        <Card className="shadow-xl border border-green-200 rounded-2xl bg-green-50"><CardContent><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-xl"><FaCheckCircle className="h-6 w-6 text-green-600" /></div><div><h3 className="text-lg font-semibold text-green-800">{t('ownerRentalDetailPage.deliveryStatus.alreadyDelivered')}</h3><p className="text-green-700">{t('ownerRentalDetailPage.deliveryStatus.noFurtherUpdates')}</p></div></div></CardContent></Card>
                    )}
                    
                    {rental.return_condition_status || rental.actual_return_time ? (
                        <Card className="shadow-xl border border-gray-100 rounded-2xl">
                          <CardContent>
                            <SectionTitle icon={<FaClipboardCheck />} title={t('ownerRentalDetailPage.sections.returnProcessing')} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                              <DetailItem icon={<FaTag />} label={t('ownerRentalDetailPage.labels.returnMethod')} value={rental.return_method ? t(`ownerRentalDetailPage.returnMethod.${rental.return_method.toLowerCase()}`) : '-'} />
                              <DetailItem icon={<FaCalendarAlt />} label={t('ownerRentalDetailPage.labels.actualReturnTime')} value={rental.actual_return_time ? new Date(rental.actual_return_time).toLocaleString() : '-'} />
                              <DetailItem icon={<FaCheckCircle />} label={t('ownerRentalDetailPage.labels.returnConditionStatus')} value={rental.return_condition_status ? <StatusBadge status={rental.return_condition_status} type="return_condition" /> : '-'} />
                              {rental.return_initiated_at && (<DetailItem icon={<FaClock />} label={t('ownerRentalDetailPage.labels.returnInitiatedAt')} value={new Date(rental.return_initiated_at).toLocaleString()} />)}
                            </div>
                            {rental.notes_from_owner_on_return && (<div className="mt-4"><p className="text-sm font-medium text-gray-500 mb-1">{t('ownerRentalDetailPage.labels.ownerNote')}:</p><p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">{rental.notes_from_owner_on_return}</p></div>)}
                            {rental.return_details && (<div className="mt-4"><p className="text-sm font-medium text-gray-500 mb-2">{t('ownerRentalDetailPage.labels.returnDetails')}</p><div className="bg-gray-50 p-3 rounded-lg border border-gray-200">{(() => { try { const details = typeof rental.return_details === 'string' ? JSON.parse(rental.return_details) : rental.return_details; return ( <div className="space-y-2 text-sm"> {details.carrier && (<div className="flex items-center gap-2"><FaTruck className="text-blue-500" /><span className="font-medium text-gray-600">{t('ownerRentalDetailPage.labels.carrier')}:</span><span className="text-gray-800">{details.carrier}</span></div>)} {details.tracking_number && (<div className="flex items-center gap-2"><FaIdCard className="text-blue-500" /><span className="font-medium text-gray-600">{t('ownerRentalDetailPage.labels.returnTrackingNumber')}:</span><span className="text-gray-800">{details.tracking_number}</span></div>)} {details.return_datetime && (<div className="flex items-center gap-2"><FaCalendarAlt className="text-blue-500" /><span className="font-medium text-gray-600">{t('ownerRentalDetailPage.labels.returnDatetime')}:</span><span className="text-gray-800">{new Date(details.return_datetime).toLocaleString()}</span></div>)} </div> ); } catch (e) { return <span className="text-gray-600">{rental.return_details as string}</span>; } })()}</div></div>)}
                            {rental.return_shipping_receipt_url && (<div className="mt-4"><p className="text-sm font-medium text-gray-500 mb-2">{t('ownerRentalDetailPage.labels.returnShippingReceipt')}</p><a href={rental.return_shipping_receipt_url} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-lg max-w-xs"><img src={rental.return_shipping_receipt_url} alt={t('ownerRentalDetailPage.labels.viewReturnReceipt')} className="w-full h-auto object-contain rounded-lg shadow-md border border-gray-200 transition-transform duration-300 group-hover:scale-105" /><div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"><FaInfoCircle className="text-white text-2xl" /></div></a></div>)}
                            <div className="mt-4"><p className="text-sm font-medium text-gray-500 mb-2">{t('ownerRentalDetailPage.labels.returnConditionImages')}</p>{Array.isArray(rental.return_condition_image_urls) && rental.return_condition_image_urls.length > 0 ? (<div className="flex flex-wrap gap-2">{rental.return_condition_image_urls.map((imageUrl: string, idx: number) => (<a key={idx} href={imageUrl} target="_blank" rel="noopener noreferrer" className="block relative group"><img src={imageUrl} alt={t('ownerRentalDetailPage.labels.returnConditionImageAlt', { idx: idx + 1 })} className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm transition-all group-hover:scale-105" /><div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"><FaInfoCircle className="text-white text-2xl" /></div></a>))}</div>) : <p className="text-sm text-gray-400 italic">{t('ownerRentalDetailPage.labels.noReturnImages')}</p>}</div>
                          </CardContent>
                        </Card>
                    ) : (
                        <Card className="shadow-xl border border-gray-100 rounded-2xl">
                            <CardContent>
                                <p className="text-gray-500 text-center py-8">{t('ownerRentalDetailPage.sidebar.noReturnInfo')}</p>
                            </CardContent>
                        </Card>
                    )}
                  </div>
                )}

                {activeTab === 'payment_verification' && (
                  <div className="space-y-8">
                     {Boolean(rental.payment_proof_url) ? (
                        <Card className="shadow-xl border border-gray-100 rounded-2xl">
                            <CardContent>
                                <SectionTitle icon={<FaReceipt />} title={t('ownerRentalDetailPage.sidebar.paymentSlip')} />
                                <a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-lg"><img src={rental.payment_proof_url!} alt={t('ownerRentalDetailPage.sidebar.paymentSlipAlt')} className="w-full h-auto object-contain rounded-lg shadow-md border border-gray-200 transition-transform duration-300 group-hover:scale-105" /><div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"><FaInfoCircle className="text-white text-2xl" /></div></a>
                                {rental.payment_verified_at && <div className="mt-4 text-sm text-green-700 flex items-center gap-2"><FaCheckCircle />{t('ownerRentalDetailPage.labels.paymentVerifiedAt')}: {new Date(rental.payment_verified_at).toLocaleString()}</div>}
                                {rental.payment_verification_notes && <div className="mt-2 text-sm text-gray-700">{t('ownerRentalDetailPage.labels.paymentVerificationNotes')}: {rental.payment_verification_notes}</div>}
                                {rental.payment_status === 'pending_verification' && (
                                    <div className="mt-4 space-y-3">
                                        <Button onClick={handleVerifySlipByImage} isLoading={verifySlipLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">{verifySlipLoading ? t('ownerRentalDetailPage.sidebar.verifyingSlip') : <><FaCoins className="mr-2" />{t('ownerRentalDetailPage.sidebar.verifySlip')}</>}</Button>
                                        {verifySlipError && <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 rounded border border-red-200">{verifySlipError}</div>}
                                        {verifySlipResult && (
                                            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 text-sm space-y-2">
                                                <h4 className="font-bold mb-2 text-gray-800">{t('ownerRentalDetailPage.sidebar.slipComparisonResult')}</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                                                  <div className="flex items-center gap-2"><FaIdCard className="text-blue-500" /><div><p className="font-medium text-gray-600">{t('ownerRentalDetailPage.labels.accountName')}:</p><span className="text-gray-800">{slip?.account_name || '-'}</span> / <span className="font-semibold">{ownerPayout?.account_name || '-'}</span><span className={`ml-2 font-bold ${isAccountMatch ? 'text-green-600' : 'text-red-600'}`}>{isAccountMatch ? '✔' : '✘'}</span></div></div>
                                                  <div className="flex items-center gap-2"><FaBuilding className="text-blue-500" /><div><p className="font-medium text-gray-600">{t('ownerRentalDetailPage.labels.bankName')}:</p><span className="text-gray-800">{slip?.bank_name || '-'}</span> / <span className="font-semibold">{ownerPayout?.bank_name || '-'}</span><span className={`ml-2 font-bold ${isAccountMatch ? 'text-green-600' : 'text-red-600'}`}>{isAccountMatch ? '✔' : '✘'}</span></div></div>
                                                  <div className="flex items-center gap-2"><FaTag className="text-blue-500" /><div><p className="font-medium text-gray-600">{t('ownerRentalDetailPage.labels.accountNumber')}:</p><span className="text-gray-800">{slip?.account_number || '-'}</span> / <span className="font-semibold">{ownerPayout?.account_number || '-'}</span><span className={`ml-2 font-bold ${isAccountMatch ? 'text-green-600' : 'text-red-600'}`}>{isAccountMatch ? '✔' : '✘'}</span></div></div>
                                                  <div className="flex items-center gap-2"><FaMoneyBillWave className="text-blue-500" /><div><p className="font-medium text-gray-600">{t('ownerRentalDetailPage.labels.amount')}:</p><span className="text-gray-800">฿{Number(slipAmount).toLocaleString()}</span> / <span className="font-semibold">฿{rentalTotalAmount.toLocaleString()}</span><span className={`ml-2 font-bold ${isAmountMatch ? 'text-green-600' : 'text-red-600'}`}>{isAmountMatch ? '✔' : '✘'}</span></div></div>
                                                  <div className="flex items-center gap-2 col-span-full"><FaCalendarAlt className="text-blue-500" /><div><p className="font-medium text-gray-600">{t('ownerRentalDetailPage.labels.transferDate')}:</p><span className="text-gray-800">{slip?.date ? new Date(slip.date).toLocaleString() : '-'}</span> / <span className="font-semibold">{rental?.created_at ? new Date(rental.created_at).toLocaleString() : '-'}</span><span className={`ml-2 font-bold ${isDateMatch ? 'text-green-600' : 'text-red-600'}`}>{isDateMatch ? '✔' : '✘'}</span></div></div>
                                                </div>
                                                {(!isAccountMatch || !isAmountMatch || !isDateMatch) && (<div className="mt-3 p-2 bg-red-100 text-red-800 rounded-lg text-xs font-semibold flex items-center gap-2"><FaExclamationTriangle className="min-w-fit" /> {t('ownerRentalDetailPage.sidebar.slipMismatchWarning')}</div>)}
                                                {isAccountMatch && isAmountMatch && isDateMatch && (<div className="mt-3 p-2 bg-green-100 text-green-800 rounded-lg text-xs font-semibold flex items-center gap-2"><FaCheckCircle className="min-w-fit" /> {t('ownerRentalDetailPage.sidebar.slipMatchSuccess')}</div>)}
                                            </div>
                                        )}
                                        {(rental.rental_status !== 'completed' && (rental.payment_status === 'pending_verification' || rental.payment_status === 'paid')) && (
                                            <Button onClick={() => setInvalidSlipDialogOpen(true)} variant="danger" className="w-full">{t('ownerRentalDetailPage.sidebar.invalidSlip')}</Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                     ) : (
                        <Card className="shadow-xl border border-gray-100 rounded-2xl">
                            <CardContent>
                                <p className="text-gray-500 text-center py-8">{t('ownerRentalDetailPage.tabs.noPaymentSlip', 'ยังไม่มีการอัปโหลดสลิปการชำระเงิน')}</p>
                            </CardContent>
                        </Card>
                     )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
              <Card className="shadow-xl border border-gray-100 rounded-2xl">
                <CardContent>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">{t('ownerRentalDetailPage.sidebar.statusActions')}</h3>
                  <div className="space-y-4">
                    <DetailItem icon={<FaClipboardCheck />} label={t('ownerRentalDetailPage.sidebar.rentalStatus')} value={<StatusBadge status={rental.rental_status} type="rental" />} />
                    <DetailItem icon={<FaCreditCard />} label={t('ownerRentalDetailPage.sidebar.paymentStatus')} value={<StatusBadge status={rental.payment_status} type="payment" />} />
                    {rental.delivery_status && rental.pickup_method === 'delivery' && (
                      <DetailItem icon={<FaShippingFast />} label={t('ownerRentalDetailPage.sidebar.deliveryStatus')} value={<StatusBadge status={rental.delivery_status} type="delivery_status" />} />
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                    {canApprove && (
                      <>
                        <Button onClick={handleApprove} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700">{actionLoading ? t('ownerRentalDetailPage.sidebar.approving') : t('ownerRentalDetailPage.sidebar.approveRequest')}</Button>
                        <Button onClick={() => setShowRejectForm(true)} disabled={actionLoading} variant="outline" className="w-full">{t('ownerRentalDetailPage.sidebar.rejectRequest')}</Button>
                      </>
                    )}
                    {showPaymentActions && (<Button onClick={handleConfirmPayment} disabled={actionLoading} className="w-full bg-blue-600 hover:bg-blue-700">{actionLoading ? t('ownerRentalDetailPage.sidebar.confirmingPayment') : t('ownerRentalDetailPage.sidebar.confirmPayment')}</Button>)}
                    {showReturnActions && (<Button variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowReturnModal(true)}>{t('ownerRentalDetailPage.sidebar.confirmReturn')}</Button>)}
                    {showDisputeResolveButton && (<Button onClick={handleResolveDispute} disabled={actionLoading} className="w-full bg-red-600 hover:bg-red-700">{actionLoading ? t('ownerRentalDetailPage.sidebar.resolvingDispute') : t('ownerRentalDetailPage.sidebar.resolveDispute')}</Button>)}
                    {showClaimButton && (
                      <Button variant="primary" className="w-full bg-purple-600 hover:bg-purple-700" disabled={actionLoading}
                        onClick={async () => {
                          setActionLoading(true);
                          try {
                            const { data: conversations } = await getConversations({ page: 1, limit: 50 });
                            let convo = conversations.find(c => (c.participant1_id === rental.owner_id && c.participant2_id === rental.renter_id) || (c.participant2_id === rental.owner_id && c.participant1_id === rental.renter_id));
                            let conversationId = convo?.id;
                            let messageContent = t('ownerRentalDetailPage.claimMessageTemplate', { rentalUid: rental.rental_uid || rental.id, productName: rental.product?.title || '-', renterName: `${rental.renter?.first_name || ''} ${rental.renter?.last_name || ''}`, rentalPeriod: `${new Date(rental.start_date).toLocaleDateString()} - ${new Date(rental.end_date).toLocaleDateString()}`});
                            if (!conversationId) {
                              const newMessage = await sendMessage({ receiver_id: rental.renter_id, message_content: messageContent, message_type: 'text', related_product_id: rental.product_id, related_rental_id: rental.id });
                              conversationId = newMessage.conversation_id;
                            } else {
                              await sendMessage({ conversation_id: conversationId, message_content: messageContent, message_type: 'text', related_product_id: rental.product_id, related_rental_id: rental.id });
                            }
                            showSuccess(t('ownerRentalDetailPage.claimChatSuccess'));
                            navigate(ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(conversationId)));
                          } catch (err) {
                            showError(t('ownerRentalDetailPage.error.claimChatFailed'));
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                      >{actionLoading ? t('ownerRentalDetailPage.sidebar.sendingToChat') : <><FaComments className="mr-2" />{t('ownerRentalDetailPage.sidebar.claim')}</>}</Button>
                    )}
                    {(rental.renter?.id || rental.renter_id) && (<Button onClick={handleChatWithRenter} disabled={contactingRenter} isLoading={contactingRenter} className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"><FaComments className="mr-2" />{contactingRenter ? t('ownerRentalDetailPage.sidebar.contactingRenter') : t('ownerRentalDetailPage.sidebar.chatWithRenter')}</Button>)}
                    {!canApprove && !showPaymentActions && !showReturnActions && !showClaimButton && (<p className="text-center text-sm text-gray-500 italic py-2">{t('ownerRentalDetailPage.sidebar.noActionForStatus')}</p>)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showRejectForm && (
          <Modal onClose={() => setShowRejectForm(false)}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('ownerRentalDetailPage.sidebar.rejectReasonTitle')}</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" rows={4} placeholder={t('ownerRentalDetailPage.placeholders.rejectReason')} />
            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={() => setShowRejectForm(false)} variant="outline">{t('ownerRentalDetailPage.common.cancel')}</Button>
              <Button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} variant="danger">{actionLoading ? t('ownerRentalDetailPage.sidebar.confirmingReject') : t('ownerRentalDetailPage.sidebar.confirmReject')}</Button>
            </div>
          </Modal>
        )}
        {showReturnModal && rental && ( <ReturnConfirmModal rentalId={rental.id} onSuccess={() => { setShowReturnModal(false); fetchRental(); }} onClose={() => setShowReturnModal(false)} /> )}
        {invalidSlipDialogOpen && (
          <Modal onClose={() => setInvalidSlipDialogOpen(false)}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('ownerRentalDetailPage.invalidSlip.title')}</h3>
            <textarea value={invalidSlipReason} onChange={e => setInvalidSlipReason(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" rows={4} placeholder={t('ownerRentalDetailPage.invalidSlip.reasonPlaceholder')} disabled={invalidSlipLoading} />
            <div className="flex justify-end space-x-3 mt-6">
              <Button onClick={() => setInvalidSlipDialogOpen(false)} variant="outline" disabled={invalidSlipLoading}>{t('ownerRentalDetailPage.common.cancel')}</Button>
              <Button onClick={handleMarkSlipInvalid} disabled={invalidSlipLoading || !invalidSlipReason.trim()} variant="danger">{invalidSlipLoading ? t('ownerRentalDetailPage.invalidSlip.saving') : t('ownerRentalDetailPage.invalidSlip.confirm')}</Button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      
      <ActionGuidePopup
        isOpen={actionGuidePopup.isOpen}
        title={actionGuidePopup.title}
        message={actionGuidePopup.message}
        nextSteps={actionGuidePopup.nextSteps.map(step => ({ text: step }))}
        type={actionGuidePopup.type}
        onClose={() => setActionGuidePopup(prev => ({ ...prev, isOpen: false }))}
        autoClose={true}
      />
    </div>
  );
};

// --- Generic Modal Component ---
const Modal: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({ children, onClose }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]" onClick={onClose}>
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl transition-colors" aria-label="Close modal">×</button>
        {children}
      </motion.div>
    </motion.div>
  );
};

// --- ReturnConfirmModal ---
const ReturnConfirmModal = ({ rentalId, onSuccess, onClose }: { rentalId: number, onSuccess: () => void, onClose: () => void }) => {
  const { t } = useTranslation();
  const [actualReturnTime, setActualReturnTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [conditionStatus, setConditionStatus] = useState<RentalReturnConditionStatus>(RentalReturnConditionStatus.AS_RENTED);
  const [notes, setNotes] = useState('');
  const [initiateClaim, setInitiateClaim] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useAlert();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const imageFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      setImages(imageFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (images.length === 0) {
      setError(t('ownerRentalDetailPage.returnForm.imagesRequired'));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        actual_return_time: new Date(actualReturnTime).toISOString(),
        return_condition_status: conditionStatus,
        notes_from_owner_on_return: notes || undefined,
        initiate_claim: initiateClaim || undefined,
        "return_condition_images[]": images,
      };
      await processReturn(rentalId, payload);
      showSuccess(t('ownerRentalDetailPage.returnForm.success'));
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('ownerRentalDetailPage.returnForm.error'));
      showError(err?.response?.data?.message || err?.message || t('ownerRentalDetailPage.returnForm.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t('ownerRentalDetailPage.returnForm.title')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="actualReturnTime" className="block font-medium text-gray-700 mb-1">{t('ownerRentalDetailPage.returnForm.actualReturnTime')} <span className="text-red-500">*</span></label>
          <input id="actualReturnTime" type="datetime-local" value={actualReturnTime} onChange={e => setActualReturnTime(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" required />
        </div>
        <div>
          <label htmlFor="conditionStatus" className="block font-medium text-gray-700 mb-1">{t('ownerRentalDetailPage.returnForm.conditionStatus')} <span className="text-red-500">*</span></label>
          <select id="conditionStatus" value={conditionStatus} onChange={e => setConditionStatus(e.target.value as RentalReturnConditionStatus)} className="w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
            {Object.values(RentalReturnConditionStatus).map(statusValue => (<option key={statusValue} value={statusValue}>{t(`ownerRentalDetailPage.returnForm.conditionStatusOptions.${statusValue}`)}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="notes" className="block font-medium text-gray-700 mb-1">{t('ownerRentalDetailPage.returnForm.notes')}</label>
          <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg p-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder={t('ownerRentalDetailPage.placeholders.returnNotes')} />
        </div>
        <div>
          <label htmlFor="returnImages" className="block font-medium text-gray-700 mb-1">{t('ownerRentalDetailPage.returnForm.images')} <span className="text-red-500">*</span></label>
          <input id="returnImages" type="file" multiple accept="image/*" onChange={handleFileChange} required className="w-full block text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          {images.length > 0 && (<div className="flex flex-wrap gap-2 mt-2">{images.map((f, i) => (<span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700 flex items-center gap-1"><FaPaperPlane className="h-3 w-3 text-blue-500" />{f.name}</span>))}</div>)}
          <p className="text-sm text-gray-600 mt-1">{t('ownerRentalDetailPage.returnForm.imagesHelpText')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="initiate_claim" checked={initiateClaim} onChange={e => setInitiateClaim(e.target.checked)} className="h-5 w-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300" />
          <label htmlFor="initiate_claim" className="text-sm font-medium text-gray-700">{t('ownerRentalDetailPage.returnForm.initiateClaim')}</label>
        </div>
        {error && <div className="text-red-600 text-sm p-2 bg-red-50 rounded-lg border border-red-200">{error}</div>}
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" onClick={onClose} variant="outline" disabled={loading}>{t('ownerRentalDetailPage.common.cancel')}</Button>
          <Button type="submit" isLoading={loading} variant="primary">{loading ? t('ownerRentalDetailPage.returnForm.saving') : t('ownerRentalDetailPage.returnForm.submit')}</Button>
        </div>
      </form>
    </Modal>
  );
};