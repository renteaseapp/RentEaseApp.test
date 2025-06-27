import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRentalByIdOrUid, approveRentalRequest, rejectRentalRequest, markPaymentSlipInvalid, getRentalReturnInfo, processReturn, verifySlipByImage, verifyRentalPayment } from '../../services/rentalService';
import { Rental, ApiError, RentalStatus, PaymentStatus, RentalReturnConditionStatus, PayoutMethod } from '../../types';
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

// Status badge component
const StatusBadge: React.FC<{ status: string; type: 'rental' | 'payment' }> = ({ status, type }) => {
  const { t } = useTranslation();
  
  const getStatusColor = () => {
    if (type === 'rental') {
      switch (status) {
        case 'completed':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'active':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'pending_owner_approval':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'pending_payment':
          return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'confirmed':
          return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'return_pending':
          return 'bg-indigo-100 text-indigo-800 border-indigo-200';
        case 'cancelled_by_renter':
        case 'cancelled_by_owner':
        case 'rejected_by_owner':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'dispute':
          return 'bg-pink-100 text-pink-800 border-pink-200';
        case 'expired':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'late_return':
          return 'bg-red-100 text-red-800 border-red-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else {
      switch (status) {
        case 'paid':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'unpaid':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'failed':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'refunded':
          return 'bg-blue-100 text-blue-800 border-blue-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      {type === 'rental' 
        ? t(`ownerRentalDetailPage.status.rental.${status}`)
        : t(`ownerRentalDetailPage.status.payment.${status}`)
      }
    </span>
  );
};

// --- Helper Components for this page ---

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start">
    <div className="flex-shrink-0 w-6 h-6 text-gray-500">{icon}</div>
    <div className="ml-3 flex-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="text-sm text-gray-800 font-semibold mt-0.5">{value}</div>
    </div>
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-4 border-b pb-2">
    <div className="flex-shrink-0 w-7 h-7 text-indigo-500">{icon}</div>
    <h2 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h2>
  </div>
);

// --- Main Page Component ---
export const OwnerRentalDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { rentalId } = useParams<{ rentalId: string }>();
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
  const [returnInfo, setReturnInfo] = useState<any>(null);
  const [returnInfoLoading, setReturnInfoLoading] = useState(true);
  const [returnInfoError, setReturnInfoError] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const navigate = useNavigate();
  const [verifySlipLoading, setVerifySlipLoading] = useState(false);
  const [verifySlipResult, setVerifySlipResult] = useState<any>(null);
  const [verifySlipError, setVerifySlipError] = useState<string | null>(null);
  const [ownerPayout, setOwnerPayout] = useState<PayoutMethod | null>(null);
  const [provinces, setProvinces] = useState<{id: number, name_th: string}[]>([]);
  const [deliveryStatus, setDeliveryStatus] = useState<string>(rental?.delivery_status || 'pending');
  const [trackingNumber, setTrackingNumber] = useState<string>(rental?.tracking_number || '');
  const [carrierCode, setCarrierCode] = useState<string>(rental?.carrier_code || '');
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string|null>(null);

  const fetchRental = async () => {
    if (!rentalId) {
      setError("Rental ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getRentalByIdOrUid(rentalId);
      setRental(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('ownerRentalDetailPage.error.loadFailed'));
      console.error('Error fetching rental:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRental();
  }, [rentalId]);

  useEffect(() => {
    if (!rentalId) return;
    setReturnInfoLoading(true);
    getRentalReturnInfo(rentalId)
      .then(setReturnInfo)
      .catch(err => setReturnInfoError(err?.response?.data?.message || 'ไม่พบข้อมูลการคืนสินค้า'))
      .finally(() => setReturnInfoLoading(false));
  }, [rentalId]);

  // ดึง payout method หลักของ owner
  useEffect(() => {
    if (rental?.owner_id) {
      getPayoutMethodsByOwnerId(rental.owner_id).then(methods => {
        const primary = methods.find(m => m.is_primary) || methods[0];
        setOwnerPayout(primary);
      }).catch(() => setOwnerPayout(null));
    }
  }, [rental?.owner_id]);

  useEffect(() => {
    getProvinces().then(res => setProvinces(res.data)).catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    setDeliveryStatus(rental?.delivery_status || 'pending');
    setTrackingNumber(rental?.tracking_number || '');
    setCarrierCode(rental?.carrier_code || '');
  }, [rental]);

  const handleApprove = async () => {
    if (!rental) return;
    
    setActionLoading(true);
    try {
      await approveRentalRequest(rental.id);
      await fetchRental(); // Refresh data
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('ownerRentalDetailPage.error.approveFailed'));
      console.error('Error approving rental:', err);
    } finally {
        setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rental || !rejectReason.trim()) {
      setError(t('ownerRentalDetailPage.error.rejectReasonRequired'));
          return;
      }
    
      setActionLoading(true);
      try {
      await rejectRentalRequest(rental.id, rejectReason.trim());
      await fetchRental(); // Refresh data
      setShowRejectForm(false);
      setRejectReason("");
      } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('ownerRentalDetailPage.error.rejectFailed'));
      console.error('Error rejecting rental:', err);
      } finally {
          setActionLoading(false);
      }
  };

  const handleVerifyPayment = async () => {
    if (!rental?.payment_proof_url) {
      setVerifySlipError('ไม่พบไฟล์สลิป');
      return;
    }
    setVerifySlipLoading(true);
    setVerifySlipError(null);
    setVerifySlipResult(null);
    try {
      // ดึงไฟล์จาก URL เป็น blob แล้วแปลงเป็น File
      const res = await fetch(rental.payment_proof_url);
      const blob = await res.blob();
      const file = new File([blob], 'slip.jpg', { type: blob.type });
      // TODO: ใส่ EasySlip Token จริง
      const token = 'e4360c24-5b50-4d89-a673-6fed9d8a109e';
      const result = await verifySlipByImage({ file, token });
      setVerifySlipResult(result);
    } catch (err: any) {
      setVerifySlipError(err?.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสลิป');
    } finally {
      setVerifySlipLoading(false);
    }
  };

  const handleMarkSlipInvalid = async () => {
    if (!rental) {
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

  const handleVerifySlipByImage = async () => {
    if (!rental?.payment_proof_url) {
      setVerifySlipError('ไม่พบไฟล์สลิป');
      return;
    }
    setVerifySlipLoading(true);
    setVerifySlipError(null);
    setVerifySlipResult(null);
    try {
      // ดึงไฟล์จาก URL เป็น blob แล้วแปลงเป็น File
      const res = await fetch(rental.payment_proof_url);
      const blob = await res.blob();
      const file = new File([blob], 'slip.jpg', { type: blob.type });
      // TODO: ใส่ EasySlip Token จริง
      const token = 'e4360c24-5b50-4d89-a673-6fed9d8a109e';
      const result = await verifySlipByImage({ file, token });
      setVerifySlipResult(result);
    } catch (err: any) {
      setVerifySlipError(err?.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการตรวจสอบสลิป');
    } finally {
      setVerifySlipLoading(false);
    }
  };

  // ฟังก์ชันเปรียบเทียบข้อมูล slip กับบัญชีเจ้าของและยอดเงิน
  const slip = verifySlipResult?.data || verifySlipResult;
  const slipAmount = typeof slip?.amount === 'object'
    ? `${slip.amount.amount} ${slip.amount.local || ''}`.trim()
    : slip?.amount || '-';
  const isAccountMatch = slip && ownerPayout &&
    slip.account_number === ownerPayout.account_number &&
    slip.bank_name?.trim() === ownerPayout.bank_name?.trim() &&
    slip.account_name?.replace(/\s+/g, '') === ownerPayout.account_name?.replace(/\s+/g, '');
  const isAmountMatch = slip && rental && (typeof slip.amount === 'object' ? slip.amount.amount : slip.amount) &&
    Math.abs(Number(typeof slip.amount === 'object' ? slip.amount.amount : slip.amount) - Number(rental.total_amount_due)) < 5; // ยืดหยุ่น 5 บาท
  const isDateMatch = slip && rental && slip.date && (() => {
    // ตรวจสอบว่า slip.date อยู่ในช่วงวันที่เช่า หรือใกล้เคียง (±2 วัน)
    const slipDate = new Date(slip.date);
    const start = new Date(rental.created_at);
    const end = new Date(rental.updated_at);
    return slipDate >= new Date(start.getTime() - 2*86400000) && slipDate <= new Date(end.getTime() + 2*86400000);
  })();

  const handleConfirmPayment = async () => {
    if (!rental) return;
    setActionLoading(true);
    try {
      await verifyRentalPayment(rental.id); // Use the correct API for payment verification
      await fetchRental();
      showSuccess('ยืนยันการชำระเงินสำเร็จ');
    } catch (err) {
      showError('เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
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
      showSuccess('อัปเดตสถานะการจัดส่งสำเร็จ');
    } catch (err: any) {
      setDeliveryError(err?.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะการจัดส่ง');
    } finally {
      setDeliveryLoading(false);
    }
  };

  if (isLoading) return <LoadingSpinner message={t('ownerRentalDetailPage.loadingDetails')} />;
  if (error) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center">{t('ownerRentalDetailPage.error.rentalNotFound')}</div>;

  const canApprove = rental.rental_status === 'pending_owner_approval';

  return (
    <div className="container mx-auto p-4 md:p-8 bg-gray-50">
      <Link to={ROUTE_PATHS.OWNER_RENTAL_HISTORY} className="text-blue-600 hover:underline mb-6 block">
        &larr; {t('ownerRentalDetailPage.backToHistory')}
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* --- RENTAL INFORMATION CARD --- */}
          <Card className="shadow-lg">
            <CardContent>
              <SectionTitle 
                icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>}
                title={t('ownerRentalDetailPage.sections.rentalInformation')}
              />
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-2">
                  <img 
                    src={rental.product?.primary_image?.image_url || '/placeholder.png'} 
                    alt={rental.product?.title}
                    className="w-full h-auto object-cover rounded-lg aspect-square"
                  />
                </div>
                <div className="md:col-span-3 space-y-5">
                  <h3 className="text-2xl font-bold text-gray-900">{rental.product?.title}</h3>
                  <div className="flex flex-col gap-1 text-xs text-gray-500">
                    <span><b>{t('ownerRentalDetailPage.labels.rentalIdShort', 'ID')}:</b> {rental.id}</span>
                    <span><b>{t('ownerRentalDetailPage.labels.rentalUid', 'UID')}:</b> {rental.rental_uid}</span>
                  </div>
                  <DetailItem 
                    icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                    label={t('ownerRentalDetailPage.labels.renter')}
                    value={`${rental.renter?.first_name} ${rental.renter?.last_name}`}
                  />
                   <DetailItem 
                    icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 4h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z"></path></svg>}
                    label={t('ownerRentalDetailPage.labels.rentalPeriod')}
                    value={`${new Date(rental.start_date).toLocaleDateString()} - ${new Date(rental.end_date).toLocaleDateString()}`}
                  />
                  <DetailItem 
                    icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                    label={t('ownerRentalDetailPage.labels.pickupMethod')}
                    value={<span className="capitalize">{rental.pickup_method.replace('_', ' ')}</span>}
                  />
                  {/* Show delivery address if method is delivery */}
                  {rental.pickup_method === 'delivery' && rental.delivery_address && (
                    <DetailItem
                      icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                      label={t('ownerRentalDetailPage.labels.deliveryAddress', 'ที่อยู่สำหรับจัดส่ง')}
                      value={
                        <div>
                          <div><b>{rental.delivery_address.recipient_name}</b> ({rental.delivery_address.phone_number})</div>
                          <div>
                            {rental.delivery_address.address_line1}
                            {rental.delivery_address.address_line2 && <> {rental.delivery_address.address_line2}</>}
                          </div>
                          <div>
                            {rental.delivery_address.sub_district && rental.delivery_address.sub_district + ', '}
                            {rental.delivery_address.district && rental.delivery_address.district + ', '}
                            {rental.delivery_address.province_name || (provinces.find(p => p.id === rental.delivery_address?.province_id)?.name_th) || rental.delivery_address.province_id}, {rental.delivery_address.postal_code}
                          </div>
                          {rental.delivery_address.notes && <div className="text-xs text-gray-500 mt-1">{rental.delivery_address.notes}</div>}
                        </div>
                      }
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

           {/* --- RETURN PROCESSING CARD --- */}
           {(rental.return_condition_status || rental.actual_return_time) ? (
             <Card className="shadow-lg">
            <CardContent>
                 <SectionTitle
                   icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7v4a2 2 0 01-2 2H7a2 2 0 01-2-2V7m14 0V5a2 2 0 00-2-2H7a2 2 0 00-2 2v2m14 0H5"></path></svg>}
                   title={t('ownerRentalDetailPage.sections.returnProcessing')}
                 />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                   <DetailItem icon={<>#</>} label={t('ownerRentalDetailPage.labels.returnMethod', 'Return Method')} value={rental.return_method ?? '-'} />
                   <DetailItem icon={<>@</>} label={t('ownerRentalDetailPage.labels.actualReturnTime', 'Actual Return Time')} value={rental.actual_return_time ? new Date(rental.actual_return_time).toLocaleString() : '-'} />
                   <DetailItem icon={<>#️⃣</>} label={t('ownerRentalDetailPage.labels.returnConditionStatus', 'Return Condition Status')} value={rental.return_condition_status ?? '-'} />
                  </div>
                 {rental.notes_from_owner_on_return && (
                   <div className="mt-4">
                     <p className="text-sm font-medium text-gray-500">{t('ownerRentalDetailPage.labels.ownerNote', 'Owner Note')}:</p>
                     <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded-md mt-1">{rental.notes_from_owner_on_return}</p>
                    </div>
                  )}
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <p className="text-sm font-medium text-gray-500 mb-2">{t('ownerRentalDetailPage.labels.returnConditionImages', 'Return Condition Images')}</p>
                     {Array.isArray(rental.return_condition_image_urls) && rental.return_condition_image_urls.length > 0 ? (
                       <div className="flex flex-wrap gap-2">
                         {rental.return_condition_image_urls.map((imageUrl: string, idx: number) => (
                           <a key={idx} href={imageUrl} target="_blank" rel="noopener noreferrer">
                             <img src={imageUrl} alt={t('ownerRentalDetailPage.labels.returnConditionImageAlt', { idx: idx + 1 })} className="w-24 h-24 object-cover rounded border" />
                           </a>
                         ))}
                    </div>
                     ) : <p className="text-sm text-gray-400 italic">{t('ownerRentalDetailPage.labels.noReturnImages', 'ไม่มีข้อมูล')}</p>}
                  </div>
              </div>
            </CardContent>
          </Card>
           ) : (
             !canApprove && rental.rental_status !== 'confirmed' &&
             <Card><CardContent><p className="text-gray-500">{t('ownerRentalDetailPage.sidebar.noReturnInfo', 'ยังไม่มีข้อมูลการคืนสินค้า')}</p></CardContent></Card>
           )}

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-lg">
              <CardContent>
                  <h3 className="text-lg font-bold text-gray-700 mb-4 border-b pb-2">{t('ownerRentalDetailPage.sidebar.statusActions', 'สถานะ & Actions')}</h3>
                  <div className="space-y-4">
                      <DetailItem icon={<>📊</>} label={t('ownerRentalDetailPage.sidebar.rentalStatus', 'สถานะการเช่า')} value={<span className="capitalize">{rental.rental_status.replace('_', ' ')}</span>} />
                      <DetailItem icon={<>💳</>} label={t('ownerRentalDetailPage.sidebar.paymentStatus', 'สถานะการจ่ายเงิน')} value={<span className="capitalize">{rental.payment_status.replace('_', ' ')}</span>} />
                  </div>
                  <div className="mt-6 pt-4 border-t space-y-3">
                      {canApprove && (
                          <>
                              <Button onClick={handleApprove} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700">{actionLoading ? t('ownerRentalDetailPage.sidebar.approving', 'กำลังอนุมัติ...') : t('ownerRentalDetailPage.sidebar.approveRequest', 'อนุมัติคำขอเช่า')}</Button>
                              <Button onClick={() => setShowRejectForm(true)} disabled={actionLoading} variant="outline" className="w-full">{t('ownerRentalDetailPage.sidebar.rejectRequest', 'ปฏิเสธคำขอ')}</Button>
                          </>
                      )}
                      {/* Confirm Payment Button for owner */}
                      {['pending_verification', 'unpaid'].includes(rental.payment_status) && (
                        <Button onClick={handleConfirmPayment} disabled={actionLoading} className="w-full bg-green-600 hover:bg-green-700">
                          {actionLoading ? 'กำลังยืนยันการชำระเงิน...' : 'ยืนยันการชำระเงิน'}
                        </Button>
                      )}
                      {(rental.rental_status === 'return_pending' || rental.rental_status === 'late_return') && (
                          <Button variant="primary" className="w-full" onClick={() => setShowReturnModal(true)}>{t('ownerRentalDetailPage.sidebar.confirmReturn', 'ยืนยันการคืนสินค้า')}</Button>
                      )}
                      {['active', 'return_pending', 'late_return'].includes(rental.rental_status) && (
                        <Button
                          variant="danger"
                          className="w-full"
                          disabled={actionLoading}
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              // Find or create conversation with renter
                              const { data: conversations } = await getConversations({ page: 1, limit: 50 });
                              let convo = conversations.find(
                                c => (c.participant1_id === rental.owner_id && c.participant2_id === rental.renter_id) ||
                                     (c.participant2_id === rental.owner_id && c.participant1_id === rental.renter_id)
                              );
                              let conversationId = convo?.id;
                              // If not found, send message with receiver_id to create new convo
                              let message;
                              const rentalInfo = `แจ้งปัญหา/เคลมเกี่ยวกับการเช่า\nรหัสเช่า: ${rental.rental_uid || rental.id}\nสินค้า: ${rental.product?.title || '-'}\nผู้เช่า: ${rental.renter?.first_name || ''} ${rental.renter?.last_name || ''}\nช่วงวันที่เช่า: ${rental.start_date} - ${rental.end_date}`;
                              if (!conversationId) {
                                message = await sendMessage({
                                  receiver_id: rental.renter_id,
                                  message_content: rentalInfo,
                                  message_type: 'text',
                                  related_product_id: rental.product_id,
                                  related_rental_id: rental.id
                                });
                                conversationId = message.conversation_id;
                              } else {
                                message = await sendMessage({
                                  conversation_id: conversationId,
                                  message_content: rentalInfo,
                                  message_type: 'text',
                                  related_product_id: rental.product_id,
                                  related_rental_id: rental.id
                                });
                              }
                              showSuccess('ส่งข้อมูลการเช่าไปที่แชทเรียบร้อย');
                              navigate(ROUTE_PATHS.CHAT_ROOM.replace(':conversationId', String(conversationId)));
                            } catch (err) {
                              showError('เกิดข้อผิดพลาดในการส่งข้อมูลไปที่แชท');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                        >
                          {actionLoading ? 'กำลังส่งไปที่แชท...' : t('ownerRentalDetailPage.sidebar.claim', 'แจ้งเคลมสินค้า')}
                        </Button>
                      )}
                       {!canApprove && !['active', 'return_pending', 'late_return'].includes(rental.rental_status) && (
                         <p className="text-center text-sm text-gray-500 italic py-2">{t('ownerRentalDetailPage.sidebar.noActionForStatus', 'ไม่มี Action สำหรับสถานะนี้')}</p>
                       )}
                </div>
              </CardContent>
            </Card>

          {Boolean(rental.payment_proof_url) && (
            <Card className="shadow-lg">
              <CardContent>
                    <h3 className="text-lg font-bold text-gray-700 mb-4">{t('ownerRentalDetailPage.sidebar.paymentSlip', 'Payment Slip')}</h3>
                    <a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer">
                        <img src={rental.payment_proof_url!} alt={t('ownerRentalDetailPage.sidebar.paymentSlipAlt', 'สลิปการชำระเงิน')} className="max-w-xs rounded shadow border" />
                    </a>
                    {rental.payment_verified_at && (
                        <div className="mt-2 text-sm text-green-700">{t('ownerRentalDetailPage.labels.paymentVerifiedAt', 'Payment Verified At')}: {new Date(rental.payment_verified_at).toLocaleString()}</div>
                    )}
                    {rental.payment_verification_notes && (
                        <div className="mt-2 text-sm text-gray-700">{t('ownerRentalDetailPage.labels.paymentVerificationNotes', 'Payment Verification Notes')}: {rental.payment_verification_notes}</div>
                    )}
                    {rental.payment_status === 'pending_verification' && (
                      <div>
                        <Button onClick={handleVerifyPayment} isLoading={verifySlipLoading} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white">
                          {verifySlipLoading ? t('ownerRentalDetailPage.sidebar.verifyingSlip', 'กำลังตรวจสอบ...') : t('ownerRentalDetailPage.sidebar.verifySlip', 'ตรวจสอบ Slip อัตโนมัติ')}
                        </Button>
                        {verifySlipError && <div className="text-red-600 mt-2">{verifySlipError}</div>}
                        {verifySlipResult && (
                          <div className="mt-4 p-3 rounded border bg-gray-50">
                            <h4 className="font-bold mb-2">ผลการเปรียบเทียบข้อมูลสลิปกับบัญชีเจ้าของ</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              <div>
                                <b>ชื่อบัญชี (Slip):</b> {slip?.account_name || '-'}<br/>
                                <b>ชื่อบัญชี (Owner):</b> {ownerPayout?.account_name || '-'}
                                <span className={isAccountMatch ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>{isAccountMatch ? '✔' : '✘'}</span>
                              </div>
                              <div>
                                <b>เลขบัญชี (Slip):</b> {slip?.account_number || '-'}<br/>
                                <b>เลขบัญชี (Owner):</b> {ownerPayout?.account_number || '-'}
                                <span className={isAccountMatch ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>{isAccountMatch ? '✔' : '✘'}</span>
                              </div>
                              <div>
                                <b>ธนาคาร (Slip):</b> {slip?.bank_name || '-'}<br/>
                                <b>ธนาคาร (Owner):</b> {ownerPayout?.bank_name || '-'}
                                <span className={isAccountMatch ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>{isAccountMatch ? '✔' : '✘'}</span>
                              </div>
                              <div>
                                <b>จำนวนเงิน (Slip):</b> {slipAmount}<br/>
                                <b>ยอดที่ต้องชำระ:</b> {rental?.total_amount_due || '-'}
                                <span className={isAmountMatch ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>{isAmountMatch ? '✔' : '✘'}</span>
                              </div>
                              <div>
                                <b>วันที่โอน (Slip):</b> {slip?.date ? new Date(slip.date).toLocaleString() : '-'}<br/>
                                <b>วันที่เช่า:</b> {rental?.created_at ? new Date(rental.created_at).toLocaleString() : '-'}
                                <span className={isDateMatch ? 'text-green-600 ml-2' : 'text-red-600 ml-2'}>{isDateMatch ? '✔' : '✘'}</span>
                              </div>
                            </div>
                            {(!isAccountMatch || !isAmountMatch || !isDateMatch) && (
                              <div className="mt-2 text-red-600 font-semibold">ข้อมูลในสลิปไม่ตรงกับข้อมูลบัญชีเจ้าของหรือยอดเงิน กรุณาตรวจสอบอีกครั้ง</div>
                            )}
                            {isAccountMatch && isAmountMatch && isDateMatch && (
                              <div className="mt-2 text-green-600 font-semibold">ข้อมูลตรงกับบัญชีเจ้าของและยอดเงิน</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                     {(rental.rental_status !== 'completed' && (rental.payment_status === 'pending_verification' || rental.payment_status === 'paid')) && (
                        <Button onClick={() => setInvalidSlipDialogOpen(true)} variant="danger" className="mt-2 w-full">{t('ownerRentalDetailPage.sidebar.invalidSlip', 'Slip ไม่ถูกต้อง')}</Button>
                    )}
              </CardContent>
            </Card>
          )}

          {/* --- DELIVERY STATUS UPDATE CARD --- */}
          {rental.pickup_method === 'delivery' && (rental.rental_status === 'confirmed' || rental.rental_status === 'active') && (
            <Card className="shadow-lg">
              <CardContent>
                <SectionTitle
                  icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h1l2 7a2 2 0 002 2h8a2 2 0 002-2l2-7h1"></path><path strokeLinecap="round" strokeLinejoin="round" d="M16 10V6a4 4 0 00-8 0v4"></path></svg>}
                  title="อัปเดตสถานะการจัดส่งสินค้า"
                />
                <form onSubmit={handleDeliveryStatusUpdate} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">สถานะการจัดส่ง <span className="text-red-500">*</span></label>
                    <select
                      className="w-full border rounded p-2"
                      value={deliveryStatus}
                      onChange={e => setDeliveryStatus(e.target.value)}
                      required
                    >
                      <option value="pending">รอจัดส่ง (Pending)</option>
                      <option value="shipped">จัดส่งแล้ว (Shipped)</option>
                      <option value="delivered">ถึงมือผู้เช่าแล้ว (Delivered)</option>
                      <option value="failed">ส่งไม่สำเร็จ (Failed)</option>
                      <option value="returned">ส่งคืน (Returned)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input
                      className="w-full border rounded p-2"
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder="กรอกเลขพัสดุ (ถ้ามี)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carrier Code</label>
                    <input
                      className="w-full border rounded p-2"
                      type="text"
                      value={carrierCode}
                      onChange={e => setCarrierCode(e.target.value)}
                      placeholder="เช่น thailand_post, flash, kerry ฯลฯ"
                    />
                  </div>
                  {deliveryError && <ErrorMessage message={deliveryError} />}
                  <Button type="submit" isLoading={deliveryLoading} variant="primary">บันทึกสถานะการจัดส่ง</Button>
                </form>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

       {/* Modals will be rendered here */}
      {showRejectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('ownerRentalDetailPage.sidebar.rejectReasonTitle', 'เหตุผลในการปฏิเสธ')}</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md" rows={3}/>
            <div className="flex justify-end space-x-3 mt-4">
              <Button onClick={() => setShowRejectForm(false)} variant="outline">{t('ownerRentalDetailPage.sidebar.cancel', 'ยกเลิก')}</Button>
              <Button onClick={handleReject} disabled={actionLoading || !rejectReason.trim()} className="bg-red-600 hover:bg-red-700">{t('ownerRentalDetailPage.sidebar.confirmReject', 'ยืนยันการปฏิเสธ')}</Button>
            </div>
          </div>
        </div>
      )}
      {showReturnModal && rental && (
        <ReturnConfirmModal
          rentalId={rental.id}
          onSuccess={() => { setShowReturnModal(false); fetchRental(); }}
          onClose={() => setShowReturnModal(false)}
        />
      )}
      {invalidSlipDialogOpen && rental.rental_status !== 'completed' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('ownerRentalDetailPage.invalidSlip.title', 'ยืนยันว่า Slip ไม่ถูกต้อง')}</h3>
            <textarea
              value={invalidSlipReason}
              onChange={e => setInvalidSlipReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={3}
              placeholder={t('ownerRentalDetailPage.invalidSlip.reasonPlaceholder', 'กรุณาระบุเหตุผล')}
              disabled={invalidSlipLoading}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button onClick={() => setInvalidSlipDialogOpen(false)} variant="outline" disabled={invalidSlipLoading}>
                {t('ownerRentalDetailPage.invalidSlip.cancel', 'ยกเลิก')}
              </Button>
              <Button
                onClick={handleMarkSlipInvalid}
                disabled={invalidSlipLoading || !invalidSlipReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {invalidSlipLoading ? t('ownerRentalDetailPage.invalidSlip.saving', 'กำลังบันทึก...') : t('ownerRentalDetailPage.invalidSlip.confirm', 'ยืนยัน Slip ไม่ถูกต้อง')}
              </Button>
            </div>
          </div>
        </div>
      )}

        </div>
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
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        actual_return_time: new Date(actualReturnTime).toISOString(),
        return_condition_status: conditionStatus,
        notes_from_owner_on_return: notes || undefined,
        initiate_claim: initiateClaim || undefined,
        "return_condition_images[]": images.length > 0 ? images : undefined,
      };
      await processReturn(rentalId, payload);
      showSuccess(t('ownerRentalDetailPage.returnForm.success', 'Return confirmed successfully!'));
      onSuccess();
    } catch (err: any) {
      setError(err?.message || t('ownerRentalDetailPage.returnForm.error', 'An error occurred. Please try again.'));
      showError(err?.message || t('ownerRentalDetailPage.returnForm.error', 'An error occurred. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        <h2 className="text-xl font-bold mb-4">{t('ownerRentalDetailPage.returnForm.title', 'Confirm Item Return')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">{t('ownerRentalDetailPage.returnForm.actualReturnTime', 'Actual Return Time')} <span className="text-red-500">*</span></label>
            <input type="datetime-local" value={actualReturnTime} onChange={e => setActualReturnTime(e.target.value)} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block font-medium mb-1">{t('ownerRentalDetailPage.returnForm.conditionStatus', 'Item Condition')} <span className="text-red-500">*</span></label>
            <select value={conditionStatus} onChange={e => setConditionStatus(e.target.value as RentalReturnConditionStatus)} className="w-full border rounded px-3 py-2">
              <option value={RentalReturnConditionStatus.AS_RENTED}>{t('ownerRentalDetailPage.returnForm.asRented', 'As rented')}</option>
              <option value={RentalReturnConditionStatus.MINOR_WEAR}>{t('ownerRentalDetailPage.returnForm.minorWear', 'Minor wear')}</option>
              <option value={RentalReturnConditionStatus.DAMAGED}>{t('ownerRentalDetailPage.returnForm.damaged', 'Damaged')}</option>
              <option value={RentalReturnConditionStatus.LOST}>{t('ownerRentalDetailPage.returnForm.lost', 'Lost')}</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">{t('ownerRentalDetailPage.returnForm.notes', 'Notes (optional)')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block font-medium mb-1">{t('ownerRentalDetailPage.returnForm.images', 'Attach Return Images (optional)')}</label>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="w-full" />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((f, i) => (
                  <span key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">{f.name}</span>
                ))}
        </div>
      )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="initiate_claim" checked={initiateClaim} onChange={e => setInitiateClaim(e.target.checked)} />
            <label htmlFor="initiate_claim" className="text-sm">{t('ownerRentalDetailPage.returnForm.initiateClaim', 'Open claim (if item has issues)')}</label>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">{t('ownerRentalDetailPage.common.cancel', 'Cancel')}</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-60">
              {loading ? t('ownerRentalDetailPage.returnForm.saving', 'Saving...') : t('ownerRentalDetailPage.returnForm.submit', 'Confirm Return')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// --- End ReturnConfirmModal ---
