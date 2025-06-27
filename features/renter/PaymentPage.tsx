import React, { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRentalDetails, submitPaymentProof, verifyKbankSlip } from '../../services/rentalService';
import { getPayoutMethodsByOwnerId } from '../../services/ownerService';
import { Rental, ApiError, PaymentStatus, PaymentProofPayload, RentalStatus, PayoutMethod, Product } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { getProductByID } from '../../services/productService';

export const PaymentPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [paymentProofImage, setPaymentProofImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [isLoadingPayout, setIsLoadingPayout] = useState(false);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  useEffect(() => {
    if (!authUser?.id) return;
    if (!rentalId) {
      setError("Rental ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getRentalDetails(rentalId, authUser.id, 'renter')
      .then(async data => {
        console.log('Fetched rental:', data);
        setRental(data);
        if (data.product_id) {
          setIsLoadingProduct(true);
          try {
            const res = await getProductByID(data.product_id);
            setProductDetail(res.data);
          } catch (e) {
            setProductDetail(null);
          } finally {
            setIsLoadingProduct(false);
          }
        }
        if (data.owner_id) {
          setIsLoadingPayout(true);
          try {
            const methods = await getPayoutMethodsByOwnerId(data.owner_id);
            setPayoutMethods(methods);
          } catch (e) {
            setPayoutMethods([]);
          } finally {
            setIsLoadingPayout(false);
          }
        }
        if (data.payment_status === PaymentStatus.PAID || data.payment_status === PaymentStatus.PENDING_VERIFICATION) {
          // Potentially redirect if already paid or pending
        }
      })
      .catch(err => setError((err as ApiError).message || "Failed to load rental details for payment."))
      .finally(() => setIsLoading(false));
  }, [rentalId, authUser]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setPaymentProofImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rental || !paymentProofImage || !authUser?.id) {
        setError("Please upload a payment proof image.");
        return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setVerifyResult(null);

    // ไม่ต้อง verifyKbankSlip แล้ว ส่ง slip เข้า backend ทันที
    const payload: PaymentProofPayload = {
        payment_proof_image: paymentProofImage,
        amount_paid: rental.total_amount_due // Assuming full amount paid
    };
    try {
        const updatedRental = await submitPaymentProof(rental.id, payload);
        setRental(updatedRental); // Update local state
        setSuccessMessage("Payment proof submitted! Awaiting owner/admin verification.");
    } catch (err) {
        setError((err as ApiError).message || "Failed to submit payment proof.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading payment details..." />;
  if (error && !rental) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center">Rental details not found.</div>;
  
  // --- Product Summary Section ---
  const product = productDetail || rental.product;
  const allImages = product?.images || (product?.primary_image ? [product.primary_image] : []);
  const mainImage = allImages && allImages.length > 0 ? allImages[0].image_url : undefined;

  // --- Modern Layout ---
  if (rental.payment_status === PaymentStatus.PAID) {
      return (
          <div className="container mx-auto p-4 md:p-8 text-center">
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="rounded-full bg-green-100 w-20 h-20 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-green-600 mb-2">{t('paymentPage.paymentSuccessTitle', 'Payment Successful!')}</h1>
                <p className="mb-4">{t('paymentPage.paymentSuccessDesc', { id: rental.rental_uid ? rental.rental_uid.substring(0,8) : '-' })}</p>
                <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))} className="mt-2">
                  <Button variant="primary" size="lg">{t('paymentPage.viewRentalDetailBtn', 'View Rental Details')}</Button>
                </Link>
              </div>
          </div>
      );
  }

  if (rental.rental_status === RentalStatus.PENDING_OWNER_APPROVAL) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex flex-col items-center min-h-[60vh]">
        <div className="max-w-lg w-full">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('paymentPage.title')}</h1>
          <Card className="mb-6">
            <CardContent>
              <h2 className="text-xl font-semibold mb-2">{t('paymentPage.rentalIdLabel', { id: rental.rental_uid ? rental.rental_uid.substring(0,8) : '-' })} {t('paymentPage.forProduct', { title: rental.product?.title || '-' })}</h2>
              <p className="text-lg font-bold mb-4">{t('paymentPage.totalAmountDueLabel')}: ฿{Number.isFinite(rental.total_amount_due) ? rental.total_amount_due.toLocaleString() : '-'}</p>
              <p><strong>{t('paymentPage.totalPaidLabel')}:</strong> ฿{Number.isFinite(rental.final_amount_paid ?? rental.total_amount_due) ? (rental.final_amount_paid ?? rental.total_amount_due).toLocaleString() : '-'}</p>
              <p><strong>{t('paymentPage.rentalPeriodLabel')}:</strong> {rental.start_date} - {rental.end_date}</p>
              <p><strong>{t('paymentPage.statusLabel')}:</strong> {rental.rental_status ? rental.rental_status.replace('_', ' ').toUpperCase() : '-'}</p>
              <p><strong>{t('paymentPage.paymentStatusLabel')}:</strong> {rental.payment_status ? rental.payment_status.replace('_', ' ').toUpperCase() : '-'}</p>
            </CardContent>
          </Card>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
            <div>
              <strong>{t('paymentPage.waitingApprovalTitle')}</strong> {t('paymentPage.waitingApprovalDesc')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Modern Layout ---
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Product Summary */}
        <div>
          {isLoadingProduct ? (
            <LoadingSpinner message={t('productDetailPage.loadingDetails')} />
          ) : product && (
            <Card className="mb-6">
              <CardContent>
                <div className="flex flex-col items-center md:items-start">
                  {mainImage ? (
                    <img src={mainImage} alt={product.title} className="object-cover w-48 h-48 rounded-lg border mb-4" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg mb-4">{t('productDetailPage.noImage')}</div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.title || '-'}</h2>
                  {product.category && <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2">{product.category.name}</span>}
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${i < Math.round(product.average_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                    <span className="text-xs text-gray-600">{t('productDetailPage.reviewsCount', { count: product.total_reviews || 0 })}</span>
                  </div>
                  <div className="text-blue-700 font-bold text-lg mb-1">฿{(product.rental_price_per_day ?? 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">{t('productCard.pricePerDay')}</span></div>
                  {product.security_deposit && <div className="text-sm text-gray-600 mb-1">{t('productDetailPage.securityDeposit')}: <span className="font-semibold text-gray-700">฿{product.security_deposit.toLocaleString()}</span></div>}
                  {product.min_rental_duration_days && product.max_rental_duration_days && (
                    <div className="text-sm text-gray-600 mb-1">{t('productDetailPage.rentalDuration')}: <span className="font-semibold text-gray-700">{product.min_rental_duration_days} - {product.max_rental_duration_days} {t('productDetailPage.days')}</span></div>
                  )}
                  {product.province && <div className="text-sm text-gray-600 flex items-center mb-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>{t('productDetailPage.location', { locationName: product.province.name_th })}</div>}
                  {product.address_details && <div className="text-sm text-gray-600 mb-1">{t('productDetailPage.pickupLocation')}: {product.address_details}</div>}
                  {product.description && <div className="text-sm text-gray-700 mt-2 mb-1">{product.description}</div>}
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="text-xs text-gray-500 mt-1 mb-1">{t('productDetailPage.specificationsLabel')}: {Object.entries(product.specifications).map(([k,v]) => `${k}: ${v}`).join(', ')}</div>
                  )}
                  {product.owner && (
                    <div className="flex items-center gap-2 mt-2">
                      {product.owner.profile_picture_url ? (
                        <img src={product.owner.profile_picture_url} alt={product.owner.first_name || 'Owner'} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">{(product.owner.first_name || 'O')[0].toUpperCase()}</div>
                      )}
                      <span className="text-sm text-gray-800 font-medium">{product.owner.first_name}</span>
                      {product.owner.average_owner_rating !== undefined && product.owner.average_owner_rating !== null && (
                        <span className="flex items-center text-xs text-gray-500 ml-1">{[...Array(5)].map((_, i) => (
                          <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${i < Math.round(product.owner?.average_owner_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))} <span className="ml-1">({product.owner.average_owner_rating.toFixed(1)})</span></span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        {/* Payment/Proof Section */}
        <div>
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" /></svg>
                {t('paymentPage.title')}
              </h2>
              <div className="mb-2 flex flex-wrap gap-2 items-center">
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">{t('paymentPage.rentalIdLabel', { id: rental.rental_uid ? rental.rental_uid.substring(0,8) : '-' })}</span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{t('paymentPage.forProduct', { title: rental.product?.title || '-' })}</span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{t('paymentPage.totalAmountDueLabel')}: ฿{Number.isFinite(rental.total_amount_due) ? rental.total_amount_due.toLocaleString() : '-'}</span>
              </div>
              <div className="mb-4">
                <span className="font-semibold text-gray-700">{t('paymentPage.rentalPeriodLabel')}:</span> {rental.start_date} - {rental.end_date}
              </div>
              {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
              {successMessage && <div className="bg-green-100 text-green-700 p-3 rounded my-3">{successMessage}</div>}

              {rental.payment_status === PaymentStatus.PENDING_VERIFICATION ? (
                <div className="text-center py-4">
                  <p className="text-yellow-700 font-semibold">{t('paymentPage.pendingVerificationMessage')}</p>
                  <p className="text-sm text-gray-600">{t('paymentPage.pendingVerificationNotify')}</p>
                  <Link to={ROUTE_PATHS.MY_RENTALS_RENTER} className="mt-4 inline-block">
                    <Button variant="secondary" size="lg">{t('paymentPage.goToPaymentHistory')}</Button>
                  </Link>
                </div>
              ) : (rental.payment_status === PaymentStatus.UNPAID || rental.rental_status === RentalStatus.PENDING_PAYMENT) ? (
                <>
                  <div className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-semibold text-blue-700 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2z" /></svg>
                      {t('paymentPage.bankTransferTitle')}
                    </h3>
                    {isLoadingPayout ? (
                      <p className="text-sm text-blue-600">{t('paymentPage.loadingPayout')}</p>
                    ) : payoutMethods.length > 0 ? (
                      (() => {
                        const primary = payoutMethods.find(m => m.is_primary) || payoutMethods[0];
                        if (primary.method_type === 'bank_account') {
                          return <>
                            <p className="text-sm text-blue-600">{t('paymentPage.bankLabel')}: {primary.bank_name || '-'}</p>
                            <p className="text-sm text-blue-600">{t('paymentPage.accountNameLabel')}: {primary.account_name}</p>
                            <p className="text-sm text-blue-600">{t('paymentPage.accountNumberLabel')}: {primary.account_number}</p>
                            <p className="text-sm text-blue-600">{t('paymentPage.includeRentalIdNote', { id: rental.rental_uid ? rental.rental_uid.substring(0,8) : '-' })}</p>
                          </>;
                        } else if (primary.method_type === 'promptpay') {
                          return <>
                            <p className="text-sm text-blue-600">{t('paymentPage.promptpayLabel')}: {primary.account_number}</p>
                            <p className="text-sm text-blue-600">{t('paymentPage.accountNameLabel')}: {primary.account_name}</p>
                            <p className="text-sm text-blue-600">{t('paymentPage.includeRentalIdNote', { id: rental.rental_uid ? rental.rental_uid.substring(0,8) : '-' })}</p>
                          </>;
                        } else {
                          return <p className="text-sm text-blue-600">{t('paymentPage.unknownPayoutMethod')}</p>;
                        }
                      })()
                    ) : (
                      <p className="text-sm text-red-600">{t('paymentPage.noPayoutMethod')}</p>
                    )}
                  </div>
                  {/* Modern Upload Proof */}
                  <form onSubmit={handleSubmitProof} className="space-y-6">
                    <div>
                      <label htmlFor="payment_proof_image" className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-1">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10V6a5 5 0 0110 0v4" /></svg>
                          {t('paymentPage.uploadProofLabel', 'Upload Payment Proof (e.g., transfer slip)')}
                        </span>
                      </label>
                      <div className="relative border-2 border-dashed border-blue-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition" tabIndex={0} aria-label={t('paymentPage.uploadProofLabel')} onClick={() => document.getElementById('payment_proof_image')?.click()} onKeyDown={e => { if (e.key === 'Enter') document.getElementById('payment_proof_image')?.click(); }}>
                        <input 
                          type="file" 
                          id="payment_proof_image" 
                          name="payment_proof_image" 
                          accept="image/*"
                          onChange={handleFileChange} 
                          required
                          className="hidden"
                        />
                        <svg className="w-10 h-10 text-blue-300 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12M7 16l5 5 5-5" /></svg>
                        <span className="text-blue-500 font-medium">{t('paymentPage.dragDropOrClick', 'Drag & drop or click to select image')}</span>
                        {imagePreview && <img src={imagePreview} alt="Payment proof preview" className="mt-2 h-40 rounded border shadow" />}
                      </div>
                    </div>
                    <Button type="submit" isLoading={isSubmitting} fullWidth variant="primary" size="lg">
                      {t('paymentPage.submitProofBtn', 'Submit Payment Proof')}
                    </Button>
                  </form>
                </>
              ) : (
                <p className="text-gray-600">{t('paymentPage.currentPaymentStatus', { status: rental.payment_status ? rental.payment_status.replace('_', ' ').toUpperCase() : '-' })}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};