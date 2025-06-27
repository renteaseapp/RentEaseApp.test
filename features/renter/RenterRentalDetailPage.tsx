import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRentalDetails, cancelRental, initiateReturn, setActualPickupTime } from '../../services/rentalService';
import { getProductByID } from '../../services/productService';
import { Rental, ApiError, RentalStatus, RentalReturnConditionStatus, InitiateReturnPayload, Product } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../../contexts/AlertContext';
import { InitiateReturnForm } from './InitiateReturnForm';

export const RenterRentalDetailPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showSuccess, showError } = useAlert();
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

  useEffect(() => {
    fetchRentalDetails();
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
    <div className="container mx-auto p-4 md:p-8">
      <Link to={ROUTE_PATHS.MY_RENTALS_RENTER} className="text-blue-600 hover:underline mb-4 block">&larr; {t('renterRentalDetailPage.backToMyRentals')}</Link>
      
      <div className="grid grid-cols-1 md:grid-cols-3 md:gap-8">
        {/* Main Content (Left Column) */}
        <div className="md:col-span-2 space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 ">{rental.product?.title}</h1>
          {statusBox}

          {/* Product Image */}
          {(productDetails?.primary_image?.image_url || rental.product?.primary_image?.image_url || (rental.product?.images && rental.product.images[0]?.image_url)) && (
            <Card>
              <CardContent>
                <img
                  src={
                    productDetails?.primary_image?.image_url ||
                    rental.product?.primary_image?.image_url ||
                    (rental.product?.images && rental.product.images[0]?.image_url) ||
                    ''
                  }
                  alt={productDetails?.title || rental.product?.title || 'Product Image'}
                  className="w-full max-w-md max-h-72 h-auto object-cover rounded-lg shadow-md mx-auto"
                />
              </CardContent>
            </Card>
          )}

          {/* Product & Return Details in separate cards */}
          <Card>
            <CardContent>
              <h3 className="text-xl font-semibold mb-4">{t('renterRentalDetailPage.productDetails')}</h3>
              <div className="space-y-2">
                <div><strong>{t('renterRentalDetailPage.productName')}:</strong> {productDetails?.title || rental.product?.title}</div>
                <div><strong>{t('renterRentalDetailPage.category')}:</strong> {productDetails?.category?.name || rental.product?.category?.name}</div>
                <div><strong>{t('renterRentalDetailPage.pricePerDay')}:</strong> ฿{(productDetails?.rental_price_per_day || rental.product?.rental_price_per_day)?.toLocaleString?.() || '-'}</div>
                <div><strong>{t('renterRentalDetailPage.deposit')}:</strong> ฿{(productDetails?.security_deposit || rental.product?.security_deposit)?.toLocaleString?.() || '-'}</div>
                {(productDetails?.specifications && Object.keys(productDetails.specifications).length > 0) || (rental.product?.specifications && Object.keys(rental.product.specifications).length > 0) ? (
                  <div>
                    <strong>Specifications:</strong>
                    <ul className="list-disc list-inside pl-4 mt-1">
                      {Object.entries(productDetails?.specifications || rental.product?.specifications || {}).map(([key, value]) => (
                        <li key={key} className="capitalize">{key.replace(/_/g, ' ')}: {String(value)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {productDetails?.condition_notes || rental.product?.condition_notes ? (
                  <p><strong>{t('renterRentalDetailPage.conditionNotes')}:</strong> {productDetails?.condition_notes || rental.product?.condition_notes}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
          
          {rental.actual_return_time && (
             <Card>
                <CardContent>
                   <h3 className="text-xl font-semibold text-green-800 mb-3">{t('renterRentalDetailPage.returnInfo.title')}</h3>
                    <div className="space-y-2">
                      <p><strong>{t('renterRentalDetailPage.returnInfo.returnedAt')}:</strong> {new Date(rental.actual_return_time).toLocaleString()}</p>
                      {rental.return_condition_status && (
                        <p><strong>{t('renterRentalDetailPage.returnInfo.condition')}:</strong> {getReturnConditionText(rental.return_condition_status)}</p>
                      )}
                      {rental.notes_from_owner_on_return && (
                        <p><strong>{t('renterRentalDetailPage.returnInfo.notes')}:</strong> {rental.notes_from_owner_on_return}</p>
                      )}
                      {rental.return_condition_image_urls && rental.return_condition_image_urls.length > 0 ? (
                        <div>
                          <strong>{t('renterRentalDetailPage.returnInfo.images')}:</strong>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {rental.return_condition_image_urls.map((imageUrl, index) => (
                              <a key={index} href={imageUrl} target="_blank" rel="noopener noreferrer">
                                <img src={imageUrl} alt={`Return evidence ${index + 1}`} className="w-20 h-20 object-cover rounded border" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p><strong>{t('renterRentalDetailPage.returnInfo.images')}:</strong> {t('renterRentalDetailPage.returnInfo.noImages')}</p>
                      )}
                    </div>
                </CardContent>
             </Card>
          )}

          {Boolean(rental.payment_proof_url) && (
            <Card>
                <CardContent>
                    <h3 className="text-xl font-semibold mb-4">{t('renterRentalDetailPage.paymentSlip')}</h3>
                     <div className="my-2">
                        <a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer">
                        <img src={rental.payment_proof_url!} alt="Payment Slip" className="max-w-xs rounded shadow border" />
                        </a>
                    </div>
                    <a href={rental.payment_proof_url!} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{t('renterRentalDetailPage.viewDownloadSlip')}</a>
                </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">
            <Card className="p-4">
                 {/* Main Action Buttons */}
                <div className="space-y-3 mb-6">
                    {rental.rental_status === RentalStatus.PENDING_PAYMENT && (
                        <Link to={ROUTE_PATHS.PAYMENT_PAGE.replace(':rentalId', String(rental.id))} className="block">
                            <Button variant="primary" size="lg" className="w-full">{t('renterRentalDetailPage.buttons.proceedToPayment')}</Button>
                        </Link>
                    )}
                    {[RentalStatus.CONFIRMED, RentalStatus.ACTIVE, RentalStatus.LATE_RETURN].includes(rental.rental_status) && rental.actual_pickup_time && (
                        <Button variant="primary" size="lg" className="w-full" onClick={() => setShowReturnForm(true)}>{t('renterRentalDetailPage.buttons.returnItem')}</Button>
                    )}
                    {/* Actual Pickup Button */}
                    {rental.actual_pickup_time == null && (
                      <Button variant="outline" className="w-full" onClick={() => setShowPickupModal(true)}>
                        แจ้งวัน-เวลารับสินค้าจริง
                      </Button>
                    )}
                     {rental.rental_status === RentalStatus.COMPLETED && !rental.review_by_renter && (
                        <Link to={ROUTE_PATHS.SUBMIT_REVIEW.replace(':rentalId', String(rental.id))} className="block">
                            <Button variant="outline" className="w-full">{t('renterRentalDetailPage.buttons.leaveReview')}</Button>
                        </Link>
                    )}
                </div>

                <hr className="my-4"/>

                {/* Rental Details - DETAILED */}
                <div className="space-y-2 text-sm">
                  <h3 className="text-lg font-semibold mb-2">{t('renterRentalDetailPage.rentalDetailsTitle')}</h3>
                  <div><strong>{t('renterRentalDetailPage.rentalId')}:</strong> {rental.rental_uid}</div>
                  <div><strong>{t('renterRentalDetailPage.statusLabel')}:</strong> {t(`rentalStatus.${rental.rental_status}`, rental.rental_status.replace(/_/g, ' ').toUpperCase())}</div>
                  <div><strong>{t('renterRentalDetailPage.paymentStatusLabel')}:</strong> {t(`paymentStatus.${rental.payment_status}`, rental.payment_status.replace(/_/g, ' ').toUpperCase())}</div>
                  <div><strong>{t('renterRentalDetailPage.rentalPeriod')}:</strong> {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</div>
                  <div><strong>Actual Pickup:</strong> {rental.actual_pickup_time ? new Date(rental.actual_pickup_time).toLocaleString() : '-'}</div>
                  <div><strong>Actual Return:</strong> {rental.actual_return_time ? new Date(rental.actual_return_time).toLocaleString() : '-'}</div>
                  <div><strong>Days:</strong> {Math.ceil((new Date(rental.end_date).getTime() - new Date(rental.start_date).getTime()) / (1000*60*60*24))}</div>
                  <div><strong>{t('renterRentalDetailPage.pricePerDay')}:</strong> ฿{rental.rental_price_per_day_at_booking.toLocaleString()}</div>
                  {typeof rental.security_deposit_at_booking === 'number' && <div><strong>{t('renterRentalDetailPage.deposit')}:</strong> ฿{rental.security_deposit_at_booking.toLocaleString()}</div>}
                  {typeof rental.delivery_fee === 'number' && <div><strong>Delivery Fee:</strong> ฿{rental.delivery_fee.toLocaleString()}</div>}
                  {typeof rental.platform_fee_renter === 'number' && <div><strong>Platform Fee:</strong> ฿{rental.platform_fee_renter.toLocaleString()}</div>}
                  <div><strong>Subtotal:</strong> ฿{rental.calculated_subtotal_rental_fee.toLocaleString()}</div>
                  <div><strong>{t('renterRentalDetailPage.totalPaid')}:</strong> ฿{(rental.final_amount_paid || rental.total_amount_due).toLocaleString()}</div>
                  <div><strong>Created:</strong> {new Date(rental.created_at).toLocaleString()}</div>
                  <div><strong>Updated:</strong> {new Date(rental.updated_at).toLocaleString()}</div>
                  {rental.notes_from_renter && <div><strong>{t('renterRentalDetailPage.yourNotes')}:</strong> {rental.notes_from_renter}</div>}
                  {rental.cancellation_reason && <div className="text-red-600"><strong>{t('renterRentalDetailPage.cancellationReason')}:</strong> {rental.cancellation_reason}</div>}
                </div>

                <hr className="my-4"/>

                 {/* People Info */}
                 <div className="space-y-2 text-sm">
                    <h3 className="text-lg font-semibold mb-2">People</h3>
                    <p><strong>{t('renterRentalDetailPage.owner')}:</strong> {rental.owner?.first_name} {rental.owner?.last_name} (@{rental.owner?.username})</p>
                    <p><strong>{t('renterRentalDetailPage.renter')}:</strong> {rental.renter?.first_name} {rental.renter?.last_name} (@{rental.renter?.username})</p>
                 </div>
                 
                 <hr className="my-4"/>

                {/* Pickup/Delivery Info */}
                <div className="space-y-2 text-sm">
                    <h3 className="text-lg font-semibold mb-2">{t('renterRentalDetailPage.pickupMethod')}</h3>
                    <p>{t(`pickupMethod.${rental.pickup_method}`, rental.pickup_method.replace('_',' ').toUpperCase())}</p>
                    {rental.delivery_address && (
                        <div className="bg-gray-50 p-2 rounded border mt-1">
                        <strong>{t('renterRentalDetailPage.deliveryAddress')}:</strong>
                          <div><b>{rental.delivery_address.recipient_name}</b> ({rental.delivery_address.phone_number})</div>
                          <div>{rental.delivery_address.address_line1}{rental.delivery_address.address_line2 && <> {rental.delivery_address.address_line2}</>}</div>
                          <div>
                            {rental.delivery_address.sub_district && rental.delivery_address.sub_district + ', '}
                            {rental.delivery_address.district && rental.delivery_address.district + ', '}
                            {rental.delivery_address.province_name || rental.delivery_address.province_id}, {rental.delivery_address.postal_code}
                          </div>
                          {rental.delivery_address.notes && <div className="text-xs text-gray-500 mt-1">{rental.delivery_address.notes}</div>}
                        </div>
                    )}
                </div>

                {/* Secondary Actions */}
                 {[RentalStatus.PENDING_OWNER_APPROVAL, RentalStatus.PENDING_PAYMENT].includes(rental.rental_status) && (
                     <>
                        <hr className="my-4"/>
                        <Button variant="danger" onClick={() => setShowCancelDialog(true)} className="w-full text-sm">{t('renterRentalDetailPage.buttons.cancelRental')}</Button>
                     </>
                )}

            </Card>
        </div>
      </div>


      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">{t('renterRentalDetailPage.cancelDialog.title')}</h3>
            <p>{t('renterRentalDetailPage.cancelDialog.confirmation')}</p>
            <p className="text-sm text-gray-500 mt-2 mb-4">{t('renterRentalDetailPage.cancelDialog.warning')}</p>
            <form onSubmit={(e) => { e.preventDefault(); handleCancelRental(); }}>
              <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700">{t('renterRentalDetailPage.cancelDialog.reasonLabel')}</label>
              <textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder={t('renterRentalDetailPage.cancelDialog.reasonPlaceholder')}
                rows={3}
              />
              {cancelError && <p className="text-red-500 text-sm mt-1">{cancelError}</p>}
              <div className="mt-6 flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>{t('renterRentalDetailPage.cancelDialog.back')}</Button>
                <Button type="submit" variant="danger" disabled={isCancelling}>
                  {isCancelling ? t('renterRentalDetailPage.cancelDialog.cancelling') : t('renterRentalDetailPage.cancelDialog.confirm')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReturnForm && rental && (
        <InitiateReturnForm
          rentalId={rental.id}
          onSubmit={async (payload) => {
            setIsReturning(true);
            setReturnError(null);
            try {
              await handleInitiateReturn(payload);
              setShowReturnForm(false);
            } catch (err: any) {
              // Check for missing images error
              const msg = err?.response?.data?.message || err.message || '';
              if (msg.includes('return_condition_images')) {
                setReturnError('กรุณาแนบรูปภาพสภาพสินค้าอย่างน้อย 1 รูป (return_condition_images[])');
              } else {
                setReturnError(msg || 'เกิดข้อผิดพลาดในการคืนสินค้า');
              }
            } finally {
              setIsReturning(false);
            }
          }}
          onCancel={() => setShowReturnForm(false)}
          isLoading={isReturning}
        />
      )}

      {/* Show return error if any */}
      {returnError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <div className="text-red-600 font-bold text-center">{returnError}</div>
            <div className="flex justify-center mt-4">
              <Button onClick={() => setReturnError(null)} variant="outline">ปิด</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Actual Pickup */}
      {showPickupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">แจ้งวัน-เวลารับสินค้าจริง</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setPickupLoading(true);
              setPickupError(null);
              try {
                if (!pickupTime) throw new Error('กรุณาเลือกวัน-เวลา');
                // แปลงเป็น ISO8601
                const iso = new Date(pickupTime).toISOString();
                await setActualPickupTime(rental.id, iso);
                setShowPickupModal(false);
                setPickupTime('');
                fetchRentalDetails();
                showSuccess('บันทึกวัน-เวลารับสินค้าสำเร็จ');
              } catch (err: any) {
                setPickupError(err?.response?.data?.message || err.message || 'เกิดข้อผิดพลาด');
              } finally {
                setPickupLoading(false);
              }
            }}>
              <label className="block mb-2">เลือกวัน-เวลารับสินค้าจริง</label>
              <input type="datetime-local" className="block w-full border rounded p-2 mb-4" value={pickupTime} onChange={e => setPickupTime(e.target.value)} required />
              {pickupError && <div className="text-red-600 mb-2">{pickupError}</div>}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowPickupModal(false)} disabled={pickupLoading}>ยกเลิก</Button>
                <Button type="submit" isLoading={pickupLoading} variant="primary">บันทึก</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
