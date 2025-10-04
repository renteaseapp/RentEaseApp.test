import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRentalDetails, cancelRental, initiateReturn, setActualPickupTime } from '../../services/rentalService';
import { getProductByID } from '../../services/productService';
import { sendMessage } from '../../services/chatService';
import { Rental, ApiError, RentalStatus, RentalReturnConditionStatus, InitiateReturnPayload, Product } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';

import { useAlert } from '../../contexts/AlertContext';
import { InitiateReturnForm } from './InitiateReturnForm';
import { motion, AnimatePresence } from 'framer-motion';
import OpenStreetMapPicker from '../../components/common/OpenStreetMapPicker';
import { formatCurrency } from '../../utils/financialCalculations';
import { socketService } from '../../services/socketService';
import AlertNotification from '../../components/common/AlertNotification';
import ActionGuidePopup from '../../components/common/ActionGuidePopup';
import { 
  FaArrowLeft, FaCalendarAlt, FaUser, FaMoneyBillWave, FaClock, FaCheck, FaCheckCircle, FaFileAlt,
  FaExclamationTriangle, FaTimes, FaCreditCard, FaBox, FaStar, FaEye, FaDownload,
  FaShieldAlt, FaMapMarkerAlt, FaHistory, FaInfoCircle, FaBan, FaTruck, FaWifi, FaComments, FaReceipt, FaQuestionCircle
} from 'react-icons/fa';
import { useRealtimeRental } from '../../hooks/useRealtimeRental';
import { RentalStatusStepper } from '../../components/common/RentalStatusStepper';

// --- Tab Button Component ---
type TabId = 'overview' | 'delivery_return' | 'payment';
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


export const RenterRentalDetailPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user, token } = useAuth();
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
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [realtimeNotification, setRealtimeNotification] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ isVisible: false, message: '', type: 'info' });
  const [contactingOwner, setContactingOwner] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [actionGuidePopup, setActionGuidePopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    nextSteps: { text: string; action?: () => void; link?: string }[];
    type: 'success' | 'info' | 'warning' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    nextSteps: [],
    type: 'info'
  });

  // Real-time rental hook
  const { rental: realtimeRental, isConnected: isRealtimeConnected, setInitialRental } = useRealtimeRental({ rentalId: rentalId || '' });

  // Use refs to track previous values to prevent unnecessary re-renders
  const previousStatusRef = useRef<string | null>(null);
  const previousPaymentStatusRef = useRef<string | null>(null);

  // Enhanced real-time rental updates with notifications
  useEffect(() => {
    if (realtimeRental && rental) {
      const previousStatus = previousStatusRef.current;
      const previousPaymentStatus = previousPaymentStatusRef.current;
      
      // Merge real-time rental into existing state to avoid dropping nested data (e.g., product)
      setRental(prev => {
        const current = prev || (realtimeRental as unknown as Rental);
        const merged = {
          ...current,
          ...realtimeRental,
          product: (realtimeRental as any)?.product ?? (current as any)?.product,
          owner: (realtimeRental as any)?.owner ?? (current as any)?.owner,
          renter: (realtimeRental as any)?.renter ?? (current as any)?.renter,
          return_info: (realtimeRental as any)?.return_info ?? (current as any)?.return_info
        } as Rental;
        return merged;
      });
      
      // Show notifications for status changes
      if (previousStatus && previousStatus !== realtimeRental.rental_status) {
        const statusMessages: Record<string, string> = {
          [RentalStatus.CONFIRMED]: 'การเช่าได้รับการยืนยันแล้ว',
          [RentalStatus.ACTIVE]: 'การเช่ากำลังดำเนินอยู่',
          [RentalStatus.RETURN_PENDING]: 'รอการคืนสินค้า',
          [RentalStatus.COMPLETED]: 'การเช่าเสร็จสมบูรณ์',
          [RentalStatus.CANCELLED_BY_OWNER]: 'การเช่ายกเลิกโดยเจ้าของ',
          [RentalStatus.REJECTED_BY_OWNER]: 'การเช่าถูกปฏิเสธโดยเจ้าของ',
          [RentalStatus.LATE_RETURN]: 'ตรวจพบการคืนสินค้าล่าช้า'
        };
        
        const message = statusMessages[realtimeRental.rental_status];
        if (message) {
          setRealtimeNotification({
            isVisible: true,
            message,
            type: realtimeRental.rental_status.includes('cancelled') || realtimeRental.rental_status.includes('rejected') || realtimeRental.rental_status === 'late_return' ? 'warning' : 'success'
          });
          setTimeout(() => setRealtimeNotification(prev => ({ ...prev, isVisible: false })), 5000);
        }
      }
      
      if (previousPaymentStatus && previousPaymentStatus !== realtimeRental.payment_status) {
        const paymentMessages: Record<string, string> = {
          'pending_verification': 'สลิปการโอนเงินกำลังรอตรวจสอบ',
          'paid': 'การชำระเงินได้รับการยืนยันแล้ว',
          'failed': 'การชำระเงินไม่สำเร็จ'
        };
        
        const message = paymentMessages[realtimeRental.payment_status];
        if (message) {
          setRealtimeNotification({
            isVisible: true,
            message,
            type: realtimeRental.payment_status === 'failed' ? 'error' : 'info'
          });
          setTimeout(() => setRealtimeNotification(prev => ({ ...prev, isVisible: false })), 5000);
        }
      }

      // Update refs with current values for next comparison
      previousStatusRef.current = realtimeRental.rental_status;
      previousPaymentStatusRef.current = realtimeRental.payment_status;
    }
  }, [realtimeRental]);

  // Initial data fetch - only called once on mount
  const fetchRentalDetails = useCallback(async () => {
    if (!user?.id || !rentalId) return;
    setIsLoading(true);
    try {
      const fetchedRental = await getRentalDetails(rentalId, user.id, 'renter');
      setRental(fetchedRental);

      // Set initial rental data for real-time hook
      if (setInitialRental) {
        setInitialRental(fetchedRental);
      }

      if (fetchedRental.product_id) {
        try {
          const productData = await getProductByID(fetchedRental.product_id);
          setProductDetails(productData.data);
        } catch (productError) {
          console.error("ไม่สามารถโหลดรายละเอียดสินค้าได้", productError);
        }
      }
    } catch (err) {
      setError((err as ApiError).message || "ไม่สามารถโหลดรายละเอียดการเช่าได้");
    } finally {
      setIsLoading(false);
    }
  }, [rentalId, user?.id]);

  // Socket connection management
  useEffect(() => {
    if (token) {
      socketService.connect(token);
      setIsSocketConnected(true);
      socketService.onProductUpdated((updatedProduct) => {
        // Use current rental state without adding it to dependency array
        setProductDetails(prevDetails => {
          // Only update if the product matches current rental
          if (rental && updatedProduct.id === rental.product_id) {
            setRealtimeNotification({ isVisible: true, message: 'มีการอัปเดตรายละเอียดสินค้า', type: 'info' });
            setTimeout(() => setRealtimeNotification(prev => ({ ...prev, isVisible: false })), 5000);
            return updatedProduct;
          }
          return prevDetails;
        });
      });
      return () => {
        socketService.off('product_updated');
      };
    }
  }, [token]);

  // Initial data fetch - only once on mount
  useEffect(() => {
    fetchRentalDetails();
  }, [fetchRentalDetails]);

  const handleCancelRental = async () => {
    if (!rental) return;
    if (!cancelReason.trim()) {
      setCancelError("กรุณาระบุเหตุผลในการยกเลิก");
      return;
    }
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelRental(rental.id, cancelReason);
      setShowCancelDialog(false);
      showSuccess("ยกเลิกการเช่าสำเร็จ");
      // Real-time updates will handle the state change automatically
      
      // แสดง popup แจ้งเตือนขั้นตอนต่อไป
      setActionGuidePopup({
        isOpen: true,
        title: 'การเช่ายกเลิกแล้ว',
        message: 'การเช่าของคุณได้รับการยกเลิกแล้ว นี่คือขั้นตอนต่อไปที่คุณควรทำ:',
        type: 'success',
        nextSteps: [
          {
            text: 'ตรวจสอบอีเมลสำหรับการยืนยันการยกเลิก',
          },
          {
            text: 'ดูการเช่าอื่นๆ ของคุณ',
            link: ROUTE_PATHS.MY_RENTALS_RENTER
          },
          {
            text: 'ติดต่อฝ่ายสนับสนุนหากมีคำถาม',
            link: '/support' // Assuming support route exists
          }
        ]
      });
    } catch (err) {
      showError((err as ApiError).message || "ไม่สามารถยกเลิกการเช่าได้");
    } finally {
      setIsCancelling(false);
    }
  }

  const handleInitiateReturn = async (payload: InitiateReturnPayload) => {
    if (!rental) return;
    setIsReturning(true);
    try {
      await initiateReturn(rental.id, payload);
      setShowReturnForm(false);
      showSuccess("เริ่มการคืนสินค้าสำเร็จ");
      // Real-time updates will handle the state change automatically
      
      // แสดง popup แจ้งเตือนขั้นตอนต่อไป
      setActionGuidePopup({
        isOpen: true,
        title: 'แจ้งคืนสินค้าสำเร็จ',
        message: 'ข้อมูลการคืนสินค้าของคุณถูกส่งไปยังเจ้าของแล้ว โปรดติดตามสถานะและดำเนินการนัดหมาย/จัดส่งตามที่แจ้ง',
        type: 'success',
        nextSteps: [
          {
            text: 'ตรวจสอบรายละเอียดการคืนสินค้าที่ส่งไป',
            action: () => setActiveTab('delivery_return')
          },
          {
            text: 'รอการตอบกลับจากเจ้าของสินค้า',
          },
          {
            text: 'ติดต่อเจ้าของทันทีหากมีข้อสงสัย',
            action: handleChatWithOwner
          }
        ]
      });
    } catch (err) {
      showError((err as ApiError).message || "ไม่สามารถเริ่มการคืนสินค้าได้");
    } finally {
      setIsReturning(false);
    }
  }

  const handleSetActualPickupTime = async () => {
    if (!pickupTime || !rental?.id) {
      setPickupError("กรุณาเลือกวันที่และเวลารับสินค้าจริง");
      return;
    }
    setPickupLoading(true);
    setPickupError(null);
    try {
      const updatedRental = await setActualPickupTime(rental.id, pickupTime);
      // Merge updatedRental into existing state to preserve nested data
      setRental(prev => {
        const current = prev || (updatedRental as unknown as Rental);
        const merged = {
          ...current,
          ...updatedRental,
          product: (updatedRental as any)?.product ?? (current as any)?.product,
          owner: (updatedRental as any)?.owner ?? (current as any)?.owner,
          renter: (updatedRental as any)?.renter ?? (current as any)?.renter,
          return_info: (updatedRental as any)?.return_info ?? (current as any)?.return_info
        } as Rental;
        return merged;
      });
      // ซิงค์ให้ realtime hook ใช้ค่าล่าสุดเพื่อป้องกันการ override ด้วยค่าเก่า
      if (setInitialRental) {
        setInitialRental(updatedRental);
      }
      setShowPickupModal(false);
      setPickupTime('');
      showSuccess("เวลาการรับสินค้าได้รับการยืนยันแล้ว");
      // แสดง popup แจ้งเตือนขั้นตอนต่อไป
      setActionGuidePopup({
        isOpen: true,
        title: 'ยืนยันเวลารับสินค้าสำเร็จ',
        message: 'คุณได้ยืนยันเวลารับสินค้าแล้ว การเช่าของคุณจะเริ่มขึ้นในเวลานั้น',
        type: 'success',
        nextSteps: [
          {
            text: 'เตรียมรับสินค้าตามวันและเวลาที่กำหนด',
          },
          {
            text: 'หากมีข้อสงสัยใดๆ ให้ติดต่อเจ้าของสินค้า',
            action: handleChatWithOwner
          },
          {
            text: 'เมื่อได้รับสินค้าแล้ว การเช่าจะเปลี่ยนเป็นสถานะ "กำลังใช้งาน"',
          }
        ]
      });
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || "ไม่สามารถยืนยันเวลาการรับสินค้าได้";
      setPickupError(errorMessage);
    } finally {
      setPickupLoading(false);
    }
  };

  const getReturnConditionText = (condition: RentalReturnConditionStatus): string => {
    switch (condition) {
      case RentalReturnConditionStatus.AS_RENTED: return "เหมือนตอนเช่า";
      case RentalReturnConditionStatus.MINOR_WEAR: return "มีร่องรอยการใช้งานเล็กน้อย";
      case RentalReturnConditionStatus.DAMAGED: return "เสียหาย";
      case RentalReturnConditionStatus.LOST: return "สูญหาย";
      default: return "ไม่ระบุ";
    }
  };

  const getDeliveryStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return "รอดำเนินการ";
      case 'shipped': return "จัดส่งแล้ว";
      case 'delivered': return "ส่งมอบแล้ว";
      case 'failed': return "ส่งไม่สำเร็จ";
      case 'returned': return "คืนแล้ว";
      default: return "ไม่ทราบ";
    }
  };

  const getDeliveryStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'shipped': return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'delivered': return 'bg-green-100 border-green-400 text-green-800';
      case 'failed': return 'bg-red-100 border-red-400 text-red-800';
      case 'returned': return 'bg-gray-100 border-gray-400 text-gray-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  // แปลงสถานะการชำระเงินเป็นภาษาไทย
  const getPaymentStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'unpaid': 'ยังไม่ชำระ',
      'pending': 'รอดำเนินการ',
      'pending_verification': 'รอตรวจสอบ',
      'paid': 'ชำระแล้ว',
      'failed': 'ชำระไม่สำเร็จ',
      'refunded': 'คืนเงินแล้ว',
      'partially_refunded': 'คืนเงินบางส่วน',
    };
    return statusMap[status] || 'ไม่ทราบ';
  };

  const handleChatWithOwner = async () => {
    if (!user || !rental) return;
    const ownerId = rental.owner?.id || rental.owner_id;
    if (!ownerId) {
      showError("ไม่สามารถติดต่อเจ้าของสินค้าได้");
      return;
    }
    setContactingOwner(true);
    try {
      const messageText = `สวัสดีครับ/ค่ะ มีเรื่องสอบถามเกี่ยวกับการเช่า รหัส ${rental.rental_uid} สินค้า ${rental.product?.title || 'สินค้า'} ครับ/ค่ะ`;
      const msg = await sendMessage({ receiver_id: ownerId, message_content: messageText, related_product_id: rental.product_id, related_rental_id: rental.id });
      if (msg && msg.conversation_id) {
        navigate(ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(msg.conversation_id)));
      } else {
        navigate('/chat'); // Fallback to main chat page
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || err?.message || "ไม่สามารถเริ่มการสนทนาได้");
    } finally {
      setContactingOwner(false);
    }
  };


  if (isLoading) return <LoadingSpinner message={"กำลังโหลดรายละเอียดการเช่า..."} />;
  if (error) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center">{"ไม่พบรายละเอียดการเช่า"}</div>;

  let statusBox = null;
  // Create a complete mapping for all RentalStatus values
  const statusConfig: Record<string, { title: string; color: string; icon: React.ComponentType<{className?: string}>; description: string }> = {
    [RentalStatus.DRAFT]: { title: 'ร่างคำขอเช่า', color: 'bg-gray-400', icon: FaFileAlt, description: 'คำขอเช่ายังไม่ได้ส่ง คุณสามารถแก้ไขหรือส่งคำขอได้' },
    [RentalStatus.PENDING_OWNER_APPROVAL]: { title: 'รอเจ้าของอนุมัติ', color: 'bg-yellow-500', icon: FaClock, description: 'คำขอเช่าถูกส่งไปแล้ว โปรดรอการอนุมัติจากเจ้าของสินค้า' },
    [RentalStatus.PENDING_PAYMENT]: { title: 'รอชำระเงิน', color: 'bg-orange-500', icon: FaCreditCard, description: 'คำขอได้รับการอนุมัติแล้ว โปรดชำระเงินเพื่อยืนยันการเช่า' },
    [RentalStatus.CONFIRMED]: { title: 'ยืนยันแล้ว', color: 'bg-indigo-500', icon: FaCheckCircle, description: 'ชำระเงินเรียบร้อยแล้ว เตรียมตัวรับสินค้าตามวันเวลาที่กำหนด' },
    [RentalStatus.ACTIVE]: { title: 'กำลังใช้งาน', color: 'bg-green-500', icon: FaCheckCircle, description: 'คุณกำลังเช่าสินค้านี้อยู่ อย่าลืมคืนสินค้าให้ตรงตามกำหนด' },
    [RentalStatus.RETURN_PENDING]: { title: 'รอคืนสินค้า', color: 'bg-blue-500', icon: FaBox, description: 'สิ้นสุดการเช่าแล้ว โปรดดำเนินการคืนสินค้าตามวิธีการที่ตกลงไว้' },
    [RentalStatus.COMPLETED]: { title: 'เสร็จสมบูรณ์', color: 'bg-gray-500', icon: FaCheck, description: 'การเช่าเสร็จสมบูรณ์แล้ว' },
    [RentalStatus.CANCELLED_BY_RENTER]: { title: 'ยกเลิกโดยคุณ', color: 'bg-red-500', icon: FaTimes, description: 'การเช่าถูกยกเลิกแล้ว' },
    [RentalStatus.CANCELLED_BY_OWNER]: { title: 'ยกเลิกโดยเจ้าของ', color: 'bg-red-500', icon: FaTimes, description: 'การเช่าถูกยกเลิกโดยเจ้าของสินค้า' },
    [RentalStatus.REJECTED_BY_OWNER]: { title: 'ถูกปฏิเสธ', color: 'bg-red-500', icon: FaBan, description: 'คำขอเช่าถูกปฏิเสธโดยเจ้าของสินค้า' },
    [RentalStatus.DISPUTE]: { title: 'มีข้อพิพาท', color: 'bg-pink-500', icon: FaExclamationTriangle, description: 'การเช่ามีข้อพิพาท โปรดติดต่อเจ้าของหรือฝ่ายสนับสนุน' },
    [RentalStatus.LATE_RETURN]: { title: 'คืนล่าช้า', color: 'bg-red-500', icon: FaExclamationTriangle, description: 'คืนสินค้าเกินกำหนดแล้ว โปรดติดต่อเจ้าของโดยเร็วที่สุด' },
    [RentalStatus.PENDING_VERIFICATION]: { title: 'รอตรวจสอบการชำระเงิน', color: 'bg-purple-500', icon: FaInfoCircle, description: 'กำลังตรวจสอบการชำระเงินของคุณ โปรดรอการยืนยัน' }
  };

  const statusInfo = statusConfig[rental.rental_status];

  if (statusInfo) {
    const IconComponent = statusInfo.icon;
    statusBox = (
      <div className={`p-4 md:p-6 rounded-2xl shadow-lg border-l-8 ${statusInfo.color} border-opacity-70 bg-white/80 backdrop-blur-sm border-${statusInfo.color.split('-')[1]}-600`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${statusInfo.color} text-white`}>
            <IconComponent className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">{statusInfo.title}</h2>
            <p className="text-gray-600">{statusInfo.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      <AlertNotification isVisible={realtimeNotification.isVisible} message={realtimeNotification.message} type={realtimeNotification.type} onClose={() => setRealtimeNotification(prev => ({ ...prev, isVisible: false }))} />
      <div className="container mx-auto p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6">
          <Link to={ROUTE_PATHS.MY_RENTALS_RENTER} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-4"><FaArrowLeft className="h-4 w-4" />{"กลับไปหน้ารายการเช่าของฉัน"}</Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg"><FaEye className="h-8 w-8 text-white" /></div>
            <div className="flex-1"><h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{rental.product?.title}</h1><p className="text-gray-600 text-lg">{"รายละเอียดการเช่า"}</p></div>
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-sm text-gray-600 flex items-center gap-1"><FaWifi className="h-4 w-4" />{isSocketConnected ? "สด" : "ออฟไลน์"}</span>
                {isRealtimeConnected && (<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700 border border-green-200"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>{"เรียลไทม์"}</span>)}
            </div>
          </div>
        </motion.div>
        
        {statusBox && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-6">{statusBox}</motion.div>}
      
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Rental Status Stepper - Above Tabs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FaClock className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{"สถานะการเช่า"}</h3>
              </div>
              <RentalStatusStepper 
                rentalStatus={rental.rental_status}
                paymentStatus={rental.payment_status}
                userType="renter"
              />
            </div>

            <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 shadow-inner">
              <TabButton label={"ภาพรวม"} icon={<FaInfoCircle />} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
              <TabButton label={"การจัดส่งและรับคืน"} icon={<FaTruck />} isActive={activeTab === 'delivery_return'} onClick={() => setActiveTab('delivery_return')} />
              <TabButton label={"การชำระเงิน"} icon={<FaReceipt />} isActive={activeTab === 'payment'} onClick={() => setActiveTab('payment')} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {(productDetails?.primary_image?.image_url || rental.product?.primary_image?.image_url || (rental.product?.images && rental.product.images[0]?.image_url)) && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                        <img src={ productDetails?.primary_image?.image_url || rental.product?.primary_image?.image_url || (rental.product?.images && rental.product.images[0]?.image_url) || '' } alt={productDetails?.title || rental.product?.title || "รูปสินค้า"} className="w-full max-w-md max-h-72 h-auto object-cover rounded-xl shadow-lg mx-auto" />
                      </div>
                    )}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                      <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-100 rounded-xl"><FaInfoCircle className="h-6 w-6 text-blue-600" /></div><h3 className="text-2xl font-bold text-gray-800">{"รายละเอียดสินค้า"}</h3></div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaBox className="h-5 w-5 text-blue-500" /><div><span className="text-sm text-gray-500">{"ชื่อสินค้า"}</span><p className="font-semibold">{productDetails?.title || rental.product?.title}</p></div></div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaShieldAlt className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"หมวดหมู่"}</span><p className="font-semibold">{productDetails?.category?.name || rental.product?.category?.name}</p></div></div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaMoneyBillWave className="h-5 w-5 text-yellow-500" /><div><span className="text-sm text-gray-500">{"ราคาต่อวัน"}</span><p className="font-semibold">{formatCurrency((productDetails?.rental_price_per_day || rental.product?.rental_price_per_day) || 0)}</p></div></div>
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaShieldAlt className="h-5 w-5 text-purple-500" /><div><span className="text-sm text-gray-500">{"เงินประกัน"}</span><p className="font-semibold">{formatCurrency((productDetails?.security_deposit || rental.product?.security_deposit) || 0)}</p></div></div>
                        </div>
                        {((productDetails?.specifications && Object.keys(productDetails.specifications).length > 0) || (rental.product?.specifications && Object.keys(rental.product.specifications).length > 0)) && (
                          <div className="mt-6"><h4 className="font-semibold text-gray-800 mb-3">{"ข้อมูลจำเพาะ"}:</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{Object.entries(productDetails?.specifications || rental.product?.specifications || {}).map(([key, value]) => (<div key={`spec-${key}`} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg"><FaInfoCircle className="h-4 w-4 text-blue-500" /><span className="text-sm capitalize">{key.replace(/_/g, ' ')}: <strong>{String(value)}</strong></span></div>))}</div></div>
                        )}
                        {(productDetails?.condition_notes || rental.product?.condition_notes) && (<div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl"><div className="flex items-center gap-2 mb-2"><FaExclamationTriangle className="h-5 w-5 text-yellow-600" /><span className="font-semibold text-yellow-800">{"หมายเหตุ/สภาพสินค้า"}</span></div><p className="text-yellow-700">{productDetails?.condition_notes || rental.product?.condition_notes}</p></div>)}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'delivery_return' && (
                  <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                      <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-100 rounded-xl"><FaMapMarkerAlt className="h-6 w-6 text-blue-600" /></div><h3 className="text-2xl font-bold text-gray-800">{"วิธีการรับ-ส่งสินค้า"}</h3></div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaMapMarkerAlt className="h-5 w-5 text-blue-500" /><div><span className="text-sm text-gray-500">{"วิธีการรับสินค้า"}</span><p className="font-semibold">{rental.pickup_method === 'delivery' ? 'จัดส่ง' : 'นัดรับ'}</p></div></div>
                      {rental.delivery_address && (
                        <div className="p-4 mt-4 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-3"><FaMapMarkerAlt className="h-5 w-5 text-blue-600" /><span className="font-semibold text-blue-800">{"ที่อยู่จัดส่ง"}</span></div>
                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2"><FaUser className="h-4 w-4 text-gray-500" /><span><strong>{rental.delivery_address.recipient_name}</strong> ({rental.delivery_address.phone_number})</span></div>
                            <div className="flex items-center gap-2"><FaMapMarkerAlt className="h-4 w-4 text-gray-500" /><span>{rental.delivery_address.address_line1}{rental.delivery_address.address_line2 && <> {rental.delivery_address.address_line2}</>}</span></div>
                            <div className="flex items-center gap-2"><FaMapMarkerAlt className="h-4 w-4 text-gray-500" /><span>{rental.delivery_address.sub_district && rental.delivery_address.sub_district + ', '}{rental.delivery_address.district && rental.delivery_address.district + ', '}{rental.delivery_address.province_name || rental.delivery_address.province_id}, {rental.delivery_address.postal_code}</span></div>
                            {rental.delivery_address.notes && (<div className="flex items-center gap-2"><FaInfoCircle className="h-4 w-4 text-gray-500" /><span className="text-gray-600">{"หมายเหตุ"}: {rental.delivery_address.notes}</span></div>)}
                          </div>
                          {rental.delivery_address.latitude && rental.delivery_address.longitude && (
                            <div>
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3">
                                <OpenStreetMapPicker
                                  latitude={rental.delivery_address.latitude}
                                  longitude={rental.delivery_address.longitude}
                                  onLocationSelect={() => {}} // Read-only mode
                                  height="300px"
                                  zoom={15}
                                  readOnly={true}
                                  showSearch={false}
                                  showCurrentLocation={false}
                                />
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => {
                                    const googleMapsUrl = `https://www.google.com/maps?q=${rental.delivery_address?.latitude},${rental.delivery_address?.longitude}`;
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
                      {rental.pickup_method !== 'delivery' && (productDetails?.latitude || rental.product?.latitude) && (productDetails?.longitude || rental.product?.longitude) && (
                        <div className="p-4 mt-4 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-3"><FaMapMarkerAlt className="h-5 w-5 text-green-600" /><span className="font-semibold text-green-800">{"สถานที่รับสินค้า (จากเจ้าของ)"}</span></div>
                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2"><FaMapMarkerAlt className="h-4 w-4 text-gray-500" /><span>{productDetails?.address_details || rental.product?.address_details || '-'}</span></div>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-3">
                            <OpenStreetMapPicker
                              latitude={productDetails?.latitude || rental.product?.latitude || 0}
                              longitude={productDetails?.longitude || rental.product?.longitude || 0}
                              onLocationSelect={() => {}} // Read-only mode
                              height="300px"
                              zoom={15}
                              readOnly={true}
                              showSearch={false}
                              showCurrentLocation={false}
                            />
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                const lat = productDetails?.latitude || rental.product?.latitude;
                                const lng = productDetails?.longitude || rental.product?.longitude;
                                const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
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
                    {rental.pickup_method === 'delivery' && rental.delivery_status && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-100 rounded-xl"><FaTruck className="h-6 w-6 text-blue-600" /></div><h3 className="text-2xl font-bold text-gray-800">{"สถานะการจัดส่ง"}</h3></div>
                        <div className="space-y-4">
                          <div className={`border-l-4 p-4 rounded ${getDeliveryStatusColor(rental.delivery_status)}`}><div className="flex items-center gap-3"><FaTruck className="h-5 w-5" /><div><span className="text-sm font-medium">{"สถานะ"}</span><p className="font-semibold">{getDeliveryStatusText(rental.delivery_status)}</p></div></div></div>
                          {rental.tracking_number && <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaInfoCircle className="h-5 w-5 text-blue-500" /><div><span className="text-sm text-gray-500">{"หมายเลขติดตาม"}</span><p className="font-semibold">{rental.tracking_number}</p></div></div>}
                          {rental.carrier_code && <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaShieldAlt className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"ผู้ให้บริการ"}</span><p className="font-semibold">{rental.carrier_code}</p></div></div>}
                        </div>
                      </div>
                    )}
                    {rental.actual_return_time && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-green-100 rounded-xl"><FaCheckCircle className="h-6 w-6 text-green-600" /></div><h3 className="text-2xl font-bold text-green-800">{"ข้อมูลการคืนสินค้า"}</h3></div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl"><FaCalendarAlt className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"คืนสินค้าเมื่อ"}</span><p className="font-semibold">{new Date(rental.actual_return_time).toLocaleString('th-TH')}</p></div></div>
                            {rental.return_condition_status && (<div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl"><FaShieldAlt className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"สภาพสินค้า"}</span><p className="font-semibold">{getReturnConditionText(rental.return_condition_status)}</p></div></div>)}
                          </div>
                          {rental.notes_from_owner_on_return && (<div className="p-4 bg-blue-50 border border-blue-200 rounded-xl"><div className="flex items-center gap-2 mb-2"><FaUser className="h-5 w-5 text-blue-600" /><span className="font-semibold text-blue-800">{"หมายเหตุจากเจ้าของ"}</span></div><p className="text-blue-700">{rental.notes_from_owner_on_return}</p></div>)}
                          {rental.return_condition_image_urls && rental.return_condition_image_urls.length > 0 ? (<div><h4 className="font-semibold text-gray-800 mb-3">{"รูปภาพสภาพสินค้า"}:</h4><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{rental.return_condition_image_urls.map((imageUrl, index) => (<a key={`return-image-${index}`} href={imageUrl} target="_blank" rel="noopener noreferrer" className="group"><img src={imageUrl} alt={`หลักฐานการคืน ${index + 1}`} className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors" /></a>))}</div></div>) : (<div className="p-4 bg-gray-50 border border-gray-200 rounded-xl"><div className="flex items-center gap-2"><FaInfoCircle className="h-5 w-5 text-gray-500" /><span className="text-gray-600">{"ไม่มีรูปภาพสภาพสินค้า"}</span></div></div>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-green-100 rounded-xl"><FaMoneyBillWave className="h-6 w-6 text-green-600" /></div><h3 className="text-2xl font-bold text-gray-800">{"สรุปค่าใช้จ่าย"}</h3></div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaMoneyBillWave className="h-5 w-5 text-yellow-500" /><div><span className="text-sm text-gray-500">{"ราคาต่อวัน"}</span><p className="font-semibold">{formatCurrency(rental.rental_price_per_day_at_booking)}</p></div></div>
                            {rental.rental_price_per_week_at_booking && (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaMoneyBillWave className="h-5 w-5 text-blue-500" /><div><span className="text-sm text-gray-500">{"ราคารายสัปดาห์"}</span><p className="font-semibold">{formatCurrency(rental.rental_price_per_week_at_booking)}</p></div></div>
                            )}
                            {rental.rental_price_per_month_at_booking && (
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaMoneyBillWave className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"ราคารายเดือน"}</span><p className="font-semibold">{formatCurrency(rental.rental_price_per_month_at_booking)}</p></div></div>
                            )}
                            {rental.rental_pricing_type_used && (
                              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                <FaInfoCircle className="h-5 w-5 text-blue-500" />
                                <div className="flex-1">
                                  <span className="text-sm text-gray-500">{"ชนิดราคาที่ใช้คำนวณ"}</span>
                                  <p className="font-semibold text-blue-700">
                                    {rental.rental_pricing_type_used === 'daily' && 'คำนวณด้วยเรตรายวัน'}
                                    {rental.rental_pricing_type_used === 'weekly' && 'คำนวณด้วยเรตรายสัปดาห์'}
                                    {rental.rental_pricing_type_used === 'monthly' && 'คำนวณด้วยเรตรายเดือน'}
                                  </p>
                                </div>
                                <div className="relative group">
                                  <FaQuestionCircle className="h-4 w-4 text-blue-400 cursor-help" />
                                  <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                    <div className="text-center">
                                      <strong>{"ระบบเลือกเรตที่คุ้มค่าที่สุดให้อัตโนมัติ"}</strong>
                                      <br />{"เพื่อให้คุณได้ราคาที่ดีที่สุดสำหรับระยะเวลาการเช่าของคุณ"}
                                    </div>
                                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {typeof rental.security_deposit_at_booking === 'number' && (<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaShieldAlt className="h-5 w-5 text-blue-500" /><div><span className="text-sm text-gray-500">{"เงินประกัน"}</span><p className="font-semibold">{formatCurrency(rental.security_deposit_at_booking)}</p></div></div>)}
                            {typeof rental.delivery_fee === 'number' && (<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaTruck className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"ค่าจัดส่ง"}</span><p className="font-semibold">{formatCurrency(rental.delivery_fee)}</p></div></div>)}
                            {typeof rental.platform_fee_renter === 'number' && (<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaCreditCard className="h-5 w-5 text-purple-500" /><div><span className="text-sm text-gray-500">{"ค่าธรรมเนียมแพลตฟอร์ม"}</span><p className="font-semibold">{formatCurrency(rental.platform_fee_renter)}</p></div></div>)}
                            {typeof rental.late_fee_calculated === 'number' && rental.late_fee_calculated > 0 && (<div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl"><FaExclamationTriangle className="h-5 w-5 text-red-500" /><div><span className="text-sm text-gray-500">{"ค่าปรับคืนล่าช้า (หักจากเงินประกัน)"}</span><p className="font-semibold text-red-600">{formatCurrency(rental.late_fee_calculated)}</p></div></div>)}
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl"><FaMoneyBillWave className="h-5 w-5 text-blue-500" /><div><span className="text-sm text-gray-500">{"ยอดรวมค่าเช่า (Subtotal)"}</span><p className="font-semibold">{formatCurrency(rental.calculated_subtotal_rental_fee || 0)}</p></div></div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl"><FaCheckCircle className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"ยอดเงินที่ชำระทั้งหมด"}</span><p className="font-semibold">{formatCurrency((rental.final_amount_paid || rental.total_amount_due) || 0)}</p></div></div>
                        </div>
                    </div>
                    {typeof rental.security_deposit_refund_amount === 'number' && rental.security_deposit_refund_amount > 0 && (<div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl"><FaMoneyBillWave className="h-5 w-5 text-yellow-500" /><div><span className="text-sm text-gray-500">{"เงินประกันคืน (รอโอน)"}</span><p className="font-semibold text-yellow-600">{formatCurrency(rental.security_deposit_refund_amount)}</p><p className="text-xs text-gray-500 mt-1">{"ยอดเงินประกันที่เจ้าของจะคืนให้คุณหลังจากสิ้นสุดการเช่าและตรวจสอบสภาพสินค้าแล้ว"}</p>{rental.rental_status === 'late_return' && (<div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg"><div className="flex items-center gap-2 text-yellow-800"><FaExclamationTriangle className="h-4 w-4" /><span className="text-sm font-medium">{"คืนเลทแล้ว - กรุณาติดต่อเจ้าของผ่านแชทเพื่อรับเงินประกันคืน"}</span></div></div>)}</div></div>)}
                    {Boolean(rental.payment_proof_url) && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                        <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-100 rounded-xl"><FaCreditCard className="h-6 w-6 text-blue-600" /></div><h3 className="text-2xl font-bold text-gray-800">{"หลักฐานการชำระเงิน"}</h3></div>
                        <div className="space-y-4">
                          <div className="flex justify-center"><a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer" className="group"><img src={rental.payment_proof_url!} alt={"สลิปการชำระเงิน"} className="max-w-xs rounded-xl shadow-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors" /></a></div>
                          <div className="flex justify-center"><a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"><FaDownload className="h-4 w-4" />{"ดู/ดาวน์โหลดสลิป"}</a></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="space-y-4 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{"การดำเนินการ"}</h3>
                {rental.rental_status === RentalStatus.PENDING_PAYMENT && (<Link to={ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(rental.id))} className="block"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"><FaCreditCard className="h-5 w-5" />{"ดำเนินการชำระเงิน"}</motion.button></Link>)}
                {[RentalStatus.CONFIRMED, RentalStatus.ACTIVE, RentalStatus.LATE_RETURN].includes(rental.rental_status) && rental.actual_pickup_time && (<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowReturnForm(true)} className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"><FaBox className="h-5 w-5" />{"แจ้งคืนสินค้า"}</motion.button>)}
                {rental.actual_pickup_time == null && rental.payment_status === 'paid' && rental.rental_status === RentalStatus.CONFIRMED && (<motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowPickupModal(true)} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"><FaCalendarAlt className="h-5 w-5" />{"ยืนยันเวลารับสินค้าจริง"}</motion.button>)}
                {rental.rental_status === RentalStatus.COMPLETED && !rental.review_by_renter && (<Link to={ROUTE_PATHS.SUBMIT_REVIEW.replace(':rentalId', String(rental.id))} className="block"><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"><FaStar className="h-5 w-5" />{"เขียนรีวิว"}</motion.button></Link>)}
                {(rental.owner?.id || rental.owner_id) && (<motion.button whileHover={{ scale: contactingOwner ? 1 : 1.02 }} whileTap={{ scale: contactingOwner ? 1 : 0.98 }} onClick={handleChatWithOwner} disabled={contactingOwner} className={`w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${contactingOwner ? 'opacity-75 cursor-not-allowed' : ''}`}>{contactingOwner ? (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>) : (<FaComments className="h-5 w-5" />)}{contactingOwner ? "กำลังติดต่อเจ้าของ..." : "สนทนากับเจ้าของ"}</motion.button>)}
              </div>
              <hr className="my-6 border-gray-200" />
              <div className="space-y-4"><h3 className="text-xl font-bold text-gray-800 mb-4">{"รายละเอียดการเช่า"}</h3><div className="space-y-3"><div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaShieldAlt className="h-5 w-5 text-blue-500" /><div><span className="text-sm text-gray-500">{"รหัสการเช่า"}</span><p className="font-semibold">{rental.rental_uid}</p></div></div><div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaInfoCircle className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"สถานะ"}</span><p className="font-semibold">{statusInfo?.title || 'ไม่ทราบ'}</p></div></div><div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaCreditCard className="h-5 w-5 text-purple-500" /><div><span className="text-sm text-gray-500">{"สถานะการชำระเงิน"}</span><p className="font-semibold">{rental.payment_status ? getPaymentStatusText(rental.payment_status) : 'ไม่ทราบ'}</p></div></div><div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaCalendarAlt className="h-5 w-5 text-blue-500" /><div><span className="text-sm text-gray-500">{"ช่วงเวลาเช่า"}</span><p className="font-semibold">{new Date(rental.start_date).toLocaleDateString('th-TH')} - {new Date(rental.end_date).toLocaleDateString('th-TH')}</p></div></div><div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaClock className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"เวลารับสินค้าจริง"}</span><p className="font-semibold">{rental.actual_pickup_time ? new Date(rental.actual_pickup_time).toLocaleString('th-TH') : '-'}</p></div></div><div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaHistory className="h-5 w-5 text-purple-500" /><div><span className="text-sm text-gray-500">{"เวลาคืนสินค้าจริง"}</span><p className="font-semibold">{rental.actual_return_time ? new Date(rental.actual_return_time).toLocaleString('th-TH') : '-'}</p></div></div></div></div>
              <hr className="my-6 border-gray-200" />
              <div className="space-y-4"><h3 className="text-xl font-bold text-gray-800 mb-4">{"ผู้ที่เกี่ยวข้อง"}</h3><div className="space-y-3"><div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaUser className="h-5 w-5 text-blue-500" /><div><span className="text-sm text-gray-500">{"เจ้าของสินค้า"}</span><p className="font-semibold">{rental.owner?.first_name} {rental.owner?.last_name} (@{rental.owner?.username})</p></div></div><div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><FaUser className="h-5 w-5 text-green-500" /><div><span className="text-sm text-gray-500">{"ผู้เช่า (คุณ)"}</span><p className="font-semibold">{rental.renter?.first_name} {rental.renter?.last_name} (@{rental.renter?.username})</p></div></div></div></div>
              {(() => { const canCancel = [RentalStatus.PENDING_OWNER_APPROVAL, RentalStatus.PENDING_PAYMENT].includes(rental.rental_status); return canCancel; })() && (<><hr className="my-6 border-gray-200" /><motion.button onClick={() => setShowCancelDialog(true)} className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"><FaBan className="h-5 w-5" />{"ยกเลิกการเช่า"}</motion.button></>)}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showPickupModal && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowPickupModal(false)}><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-gray-800">{"ยืนยันเวลารับสินค้าจริง"}</h3><button onClick={() => setShowPickupModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><FaTimes className="h-6 w-6" /></button></div><div className="space-y-4"><div><label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-2">{"วันและเวลารับสินค้าจริง"}</label><input type="datetime-local" id="pickupTime" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required /></div>{pickupError && (<div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{pickupError}</p></div>)}<div className="flex gap-3 pt-4"><button onClick={() => setShowPickupModal(false)} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">{"ยกเลิก"}</button><button onClick={handleSetActualPickupTime} disabled={!pickupTime || pickupLoading} className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${!pickupTime || pickupLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>{pickupLoading ? (<div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{"กำลังบันทึก..."}</div>) : (<span>{"บันทึก"}</span>)}</button></div></div></motion.div></motion.div>)}
      </AnimatePresence>

      <AnimatePresence>
        {showReturnForm && ( <InitiateReturnForm rentalId={rental.id} onSubmit={handleInitiateReturn} onCancel={() => setShowReturnForm(false)} isLoading={isReturning} /> )}
      </AnimatePresence>

      <AnimatePresence>
        {showCancelDialog && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCancelDialog(false)}><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-red-600 flex items-center gap-2"><FaBan className="h-5 w-5" />{"ยกเลิกการเช่า"}</h3><button onClick={() => setShowCancelDialog(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><FaTimes className="h-6 w-6" /></button></div><div className="space-y-4"><div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-700 text-sm">{"คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการเช่านี้? การกระทำนี้ไม่สามารถยกเลิกได้"}</p></div><div><label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">{"เหตุผลในการยกเลิก"} *</label><textarea id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" rows={3} placeholder={"กรุณาระบุเหตุผลในการยกเลิก..."} required /></div>{cancelError && (<div className="p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm">{cancelError}</p></div>)}<div className="flex gap-3 pt-4"><button onClick={() => setShowCancelDialog(false)} className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">{"ยกเลิก"}</button><button onClick={handleCancelRental} disabled={!cancelReason.trim() || isCancelling} className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${!cancelReason.trim() || isCancelling ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}>{isCancelling ? (<div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{"กำลังดำเนินการ..."}</div>) : ("ยืนยันการยกเลิก")}</button></div></div></motion.div></motion.div>)}
      </AnimatePresence>

      {/* Action Guide Popup */}
      <ActionGuidePopup
        isOpen={actionGuidePopup.isOpen}
        onClose={() => setActionGuidePopup(prev => ({ ...prev, isOpen: false }))}
        title={actionGuidePopup.title}
        message={actionGuidePopup.message}
        nextSteps={actionGuidePopup.nextSteps}
        type={actionGuidePopup.type}
        autoClose={true}
        autoCloseDelay={8000}
      />
    </div>
  );
};
