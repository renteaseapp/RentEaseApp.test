import React, { useEffect, useState, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getRentalDetails, submitPaymentProof, verifyKbankSlip } from '../../services/rentalService';
import { getPayoutMethodsByOwnerId } from '../../services/ownerService';
import { Rental, ApiError, PaymentStatus, PaymentProofPayload, RentalStatus, PayoutMethod, Product } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';

import { getProductByID } from '../../services/productService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCreditCard, 
  FaUpload, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaClock, 
  FaUser, 
  FaStar, 
  FaMapMarkerAlt, 
  FaMoneyBillWave,
  FaShieldAlt,
  FaBox,
  FaArrowRight,
  FaDownload,
  FaInfoCircle,
  FaQrcode,
  FaEye,
  FaHistory,
  FaCalendarAlt,
  FaTruck,
  FaHandshake,
  FaCalculator
} from 'react-icons/fa';
import { 
  calculateRentalSubtotal, 
  calculateTotalAmount, 
  formatCurrency,
  validateRentalDuration 
} from '../../utils/financialCalculations';

export const PaymentPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

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
    if (!rentalId || !authUser?.id) return;
    
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
      .catch(err => setError((err as ApiError).message || "ไม่สามารถโหลดรายละเอียดการเช่าเพื่อชำระเงินได้"))
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
        setError("กรุณาอัปโหลดรูปภาพหลักฐานการชำระเงิน");
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
        setSuccessMessage("ส่งหลักฐานการชำระเงินสำเร็จ! กำลังรอเจ้าของ/ผู้ดูแลระบบตรวจสอบ");
    } catch (err) {
        setError((err as ApiError).message || "ไม่สามารถส่งหลักฐานการชำระเงินได้");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner message={"กำลังโหลด..."} />;
  if (error && !rental) return <ErrorMessage message={error} />;
  if (!rental) return <div className="p-4 text-center">{"ไม่พบรายละเอียดการเช่า"}</div>;
  
  // --- Product Summary Section ---
  const product = productDetail || rental.product;
  const allImages = product?.images || (product?.primary_image ? [product.primary_image] : []);
  const mainImage = allImages && allImages.length > 0 ? allImages[0].image_url : undefined;

  // --- Payment Success Layout ---
  if (rental.payment_status === PaymentStatus.PAID) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 pt-20">
            <div className="container mx-auto p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center justify-center min-h-[60vh]"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="rounded-full bg-green-100 w-24 h-24 flex items-center justify-center mb-6 shadow-lg"
                >
                  <FaCheckCircle className="w-12 h-12 text-green-600" />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-3xl font-bold text-green-600 mb-4"
                >
                  {"ชำระเงินสำเร็จ"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-lg text-gray-600 mb-8"
                >
                  {"การชำระเงินของคุณเสร็จสมบูรณ์แล้ว รหัสการเช่า"}: {rental.rental_uid ? rental.rental_uid.substring(0,8) : '-'}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <FaEye className="h-5 w-5" />
                      {"ดูรายละเอียดการเช่า"}
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </div>
      );
  }

  // --- Pending Owner Approval Layout ---
  if (rental.rental_status === RentalStatus.PENDING_OWNER_APPROVAL) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 pt-20">
        <div className="container mx-auto p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center min-h-[60vh]"
          >
            <div className="max-w-lg w-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-center justify-center mb-6"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl shadow-lg">
                  <FaClock className="h-10 w-10 text-white" />
                </div>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-3xl font-bold text-gray-800 mb-6 text-center"
              >
                {"รอการอนุมัติคำขอ"}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-6"
              >
                <h2 className="text-xl font-semibold mb-4">{"รหัสการเช่า"}: {rental.rental_uid ? rental.rental_uid.substring(0,8) : '-'} {"สำหรับสินค้า"}: {rental.product?.title || '-'}</h2>
                
                {/* Rental Details Summary */}
                <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {/* Rental Period */}
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="h-4 w-4 text-blue-600" />
                      <div>
                        <span className="font-semibold text-blue-800">{"ช่วงเวลาเช่า"}:</span>
                        <p className="text-blue-700">{rental.start_date} - {rental.end_date}</p>
                      </div>
                    </div>
                    
                    {/* Pickup Method */}
                    <div className="flex items-center gap-2">
                      {rental.pickup_method === 'delivery' ? (
                        <FaTruck className="h-4 w-4 text-green-600" />
                      ) : (
                        <FaHandshake className="h-4 w-4 text-blue-600" />
                      )}
                      <div>
                        <span className="font-semibold text-gray-800">{"วิธีการรับสินค้า"}:</span>
                        <p className="text-gray-700">
                          {rental.pickup_method === 'delivery' ? "จัดส่ง" : "รับเอง"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Cost Breakdown Section */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                    <FaMoneyBillWave className="h-4 w-4 text-gray-600" />
                    {"สรุปค่าใช้จ่าย"}
                  </h3>
                  

                  
                  <div className="space-y-2">
                    {/* Rental Fee with Pricing Type Info */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 text-sm flex items-center gap-1">
                          <FaCalendarAlt className="h-3 w-3 text-blue-500" />
                          {"ยอดรวมค่าเช่า"}:
                        </span>
                        <span className="font-semibold text-sm text-blue-600">฿{(rental.calculated_subtotal_rental_fee || 0).toLocaleString()}</span>
                      </div>
                      {rental.rental_pricing_type_used && (
                        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <FaInfoCircle className="h-4 w-4 text-blue-500" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">ชนิดราคาที่ใช้คำนวณ:</span>
                            <p className="font-semibold text-xs text-blue-700">
                              {rental.rental_pricing_type_used === 'daily' && 'คำนวณด้วยเรตรายวัน'}
                              {rental.rental_pricing_type_used === 'weekly' && 'คำนวณด้วยเรตรายสัปดาห์'}
                              {rental.rental_pricing_type_used === 'monthly' && 'คำนวณด้วยเรตรายเดือน'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Security Deposit */}
                    {rental.security_deposit_at_booking && rental.security_deposit_at_booking > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 text-sm flex items-center gap-1">
                          <FaShieldAlt className="h-3 w-3 text-yellow-500" />
                          {"เงินประกัน"}:
                        </span>
                        <span className="font-semibold text-sm text-yellow-600">฿{rental.security_deposit_at_booking.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Delivery Fee */}
                    {rental.delivery_fee && rental.delivery_fee > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 text-sm flex items-center gap-1">
                          <FaTruck className="h-3 w-3 text-green-500" />
                          {"ค่าจัดส่ง"}:
                        </span>
                        <span className="font-semibold text-sm text-green-600">฿{rental.delivery_fee.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Platform Fee */}
                    {rental.platform_fee_renter && rental.platform_fee_renter > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 text-sm flex items-center gap-1">
                          <FaCreditCard className="h-3 w-3 text-purple-500" />
                          {"ค่าธรรมเนียมแพลตฟอร์ม"}:
                        </span>
                        <span className="font-semibold text-sm text-purple-600">฿{rental.platform_fee_renter.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Late Fee (if applicable) */}
                    {rental.late_fee_calculated && rental.late_fee_calculated > 0 && (
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 text-sm flex items-center gap-1">
                          <FaExclamationTriangle className="h-3 w-3 text-red-500" />
                          {"ค่าปรับล่าช้า"}:
                        </span>
                        <span className="font-semibold text-sm text-red-600">฿{rental.late_fee_calculated.toLocaleString()}</span>
                      </div>
                    )}
                    
                    {/* Total Amount Due */}
                    <div className="flex justify-between items-center py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg px-2 mt-2 border border-blue-200">
                      <span className="text-blue-800 font-semibold text-sm">{"ยอดรวมที่ต้องชำระ"}:</span>
                      <span className="font-bold text-blue-800">฿{(rental.total_amount_due || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">{"ยอดที่ชำระแล้ว"}:</span>
                    <span className="font-semibold">{formatCurrency(Number.isFinite(rental.final_amount_paid ?? rental.total_amount_due) ? (rental.final_amount_paid ?? rental.total_amount_due) : 0)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">{"ช่วงเวลาเช่า"}:</span>
                    <span className="font-semibold">{rental.start_date} - {rental.end_date}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">{"สถานะการเช่า"}:</span>
                    <span className="font-semibold">{rental.rental_status ? rental.rental_status.replace('_', ' ').toUpperCase() : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">{"สถานะการชำระเงิน"}:</span>
                    <span className="font-semibold">{rental.payment_status ? rental.payment_status.replace('_', ' ').toUpperCase() : '-'}</span>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-xl flex items-center gap-3"
              >
                <FaExclamationTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                <div>
                  <strong className="block mb-1">{"รอเจ้าของอนุมัติคำขอ"}</strong>
                  <span>{"คำขอเช่าถูกส่งไปยังเจ้าของสินค้าแล้ว โปรดรอการอนุมัติก่อนดำเนินการชำระเงิน"}</span>
                </div>
              </motion.div>
              
              {/* Add View Rental Details button */}
              <div className="mt-6 text-center">
                <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <FaEye className="h-4 w-4" />
                    {"ดูรายละเอียดการเช่า"}
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // --- Main Modern Layout (Payment Required) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20">
      <div className="container mx-auto p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg">
              <FaCreditCard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {"หน้าชำระเงิน"}
              </h1>
              <p className="text-gray-600 text-lg">{"ดำเนินการชำระเงินเพื่อยืนยันการเช่า"}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* Product Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {isLoadingProduct ? (
              <LoadingSpinner message={"กำลังโหลดรายละเอียดสินค้า..."} />
            ) : product && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
                <div className="flex flex-col items-center md:items-start">
                  {mainImage ? (
                    <img src={mainImage} alt={product.title} className="object-cover w-48 h-48 rounded-xl border-2 border-gray-200 mb-4 shadow-lg" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-xl mb-4 border-2 border-gray-200">
                      <FaBox className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.title || '-'}</h2>
                  {product.category && (
                    <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3 border border-blue-200">
                      {product.category.name}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={`h-4 w-4 ${i < Math.round(product.average_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-xs text-gray-600">({product.total_reviews || 0} {"รีวิว"})</span>
                  </div>
                  <div className="text-blue-700 font-bold text-lg mb-2 flex items-center gap-2">
                    <FaMoneyBillWave className="h-5 h-5" />
                    {formatCurrency(product.rental_price_per_day ?? 0)} <span className="text-sm font-normal text-gray-500">{"/วัน"}</span>
                  </div>
                  
                  {/* Rental Duration Information */}
                  {product.min_rental_duration_days && product.max_rental_duration_days && (
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <FaClock className="h-4 w-4" />
                      {"ช่วงเวลาเช่า"}: <span className="font-semibold text-gray-700">{product.min_rental_duration_days} - {product.max_rental_duration_days} {"วัน"}</span>
                    </div>
                  )}
                  
                  {/* Security Deposit */}
                  {product.security_deposit && (
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <FaShieldAlt className="h-4 w-4" />
                      {"เงินประกัน"}: <span className="font-semibold text-gray-700">{formatCurrency(product.security_deposit)}</span>
                    </div>
                  )}
                  
                  {/* Location */}
                  {product.province && (
                    <div className="text-sm text-gray-600 flex items-center mb-2">
                      <FaMapMarkerAlt className="h-4 w-4 mr-2 text-gray-500" />
                      {"ตั้งอยู่ที่"} {product.province.name_th}
                    </div>
                  )}
                  
                  {/* Pickup Location */}
                  {product.address_details && (
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                      <FaMapMarkerAlt className="h-4 w-4 text-gray-500" />
                      {"สถานที่รับสินค้า"}: <span className="font-semibold text-gray-700">{product.address_details}</span>
                    </div>
                  )}
                  
                  {/* Description */}
                  {product.description && (
                    <div className="text-sm text-gray-700 mt-3 mb-2 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-200">
                      <span className="font-semibold text-gray-800">{"คำอธิบายสินค้า"}:</span>
                      <p className="mt-1">{product.description}</p>
                    </div>
                  )}
                  
                  {/* Specifications */}
                  {product.specifications && Object.keys(product.specifications).length > 0 && (
                    <div className="text-xs text-gray-500 mt-2 mb-2 p-2 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-700">{"ข้อมูลจำเพาะ"}:</span>
                      <div className="mt-1 space-y-1">
                        {Object.entries(product.specifications).map(([key, value], index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium text-gray-700">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.owner && (
                    <div className="flex items-center gap-2 mt-3 p-3 bg-gray-50 rounded-xl">
                      {product.owner.profile_picture_url ? (
                        <img src={product.owner.profile_picture_url} alt={product.owner.first_name || 'Owner'} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                          <FaUser className="h-4 w-4" />
                        </div>
                      )}
                      <span className="text-sm text-gray-800 font-medium">{product.owner.first_name}</span>
                      {product.owner.average_owner_rating !== undefined && product.owner.average_owner_rating !== null && (
                        <span className="flex items-center text-xs text-gray-500 ml-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={`h-3 w-3 ${i < Math.round(product.owner?.average_owner_rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                          ))} <span className="ml-1">({product.owner.average_owner_rating.toFixed(1)})</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Payment/Proof Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FaCreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{"ดำเนินการชำระเงิน"}</h2>
              </div>
              
              <div className="mb-4 flex flex-wrap gap-2 items-center">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">{"รหัสเช่า"}: {rental.rental_uid ? rental.rental_uid.substring(0,8) : '-'}</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">{"สินค้า"}: {rental.product?.title || '-'}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">{"ยอดรวมที่ต้องชำระ"}: {formatCurrency(Number.isFinite(rental.total_amount_due) ? rental.total_amount_due : 0)}</span>
              </div>
              
              {/* Rental Details Summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rental Period */}
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="h-4 w-4 text-blue-600" />
                    <div>
                      <span className="font-semibold text-blue-800 text-sm">{"ช่วงเวลาเช่า"}:</span>
                      <p className="text-blue-700 text-sm">{rental.start_date} - {rental.end_date}</p>
                    </div>
                  </div>
                  
                  {/* Pickup Method */}
                  <div className="flex items-center gap-2">
                    {rental.pickup_method === 'delivery' ? (
                      <FaTruck className="h-4 w-4 text-green-600" />
                    ) : (
                      <FaHandshake className="h-4 w-4 text-blue-600" />
                    )}
                    <div>
                      <span className="font-semibold text-gray-800 text-sm">{"วิธีการรับสินค้า"}:</span>
                      <p className="text-gray-700 text-sm">
                        {rental.pickup_method === 'delivery' ? "จัดส่ง" : "รับเอง"}
                      </p>
                    </div>
                  </div>
                  
                  {/* Rental Status */}
                  <div className="flex items-center gap-2">
                    <FaClock className="h-4 w-4 text-orange-600" />
                    <div>
                      <span className="font-semibold text-gray-800 text-sm">{"สถานะการเช่า"}:</span>
                      <p className="text-gray-700 text-sm">
                        {rental.rental_status ? rental.rental_status.replace('_', ' ').toUpperCase() : '-'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Payment Status */}
                  <div className="flex items-center gap-2">
                    <FaCreditCard className="h-4 w-4 text-purple-600" />
                    <div>
                      <span className="font-semibold text-gray-800 text-sm">{"สถานะการชำระเงิน"}:</span>
                      <p className="text-gray-700 text-sm">
                        {rental.payment_status ? rental.payment_status.replace('_', ' ').toUpperCase() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cost Breakdown Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200"
              >
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                  <FaMoneyBillWave className="h-5 w-5 text-gray-600" />
                  {"สรุปค่าใช้จ่าย"}
                </h3>
                <div className="space-y-3">
                  {/* Rental Fee (Subtotal) with Pricing Type */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center gap-2">
                        <FaCalendarAlt className="h-4 w-4 text-blue-500" />
                        {"ยอดรวมค่าเช่า"}:
                      </span>
                      <span className="font-semibold text-blue-600">{formatCurrency(rental.calculated_subtotal_rental_fee || 0)}</span>
                    </div>
                    {rental.rental_pricing_type_used && (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <FaInfoCircle className="h-5 w-5 text-blue-500" />
                        <div className="flex-1">
                          <span className="text-sm text-gray-500">{"ชนิดราคาที่ใช้คำนวณ"}:</span>
                          <p className="font-semibold text-blue-700">
                            {rental.rental_pricing_type_used === 'daily' && 'คำนวณด้วยเรตรายวัน'}
                            {rental.rental_pricing_type_used === 'weekly' && 'คำนวณด้วยเรตรายสัปดาห์'}
                            {rental.rental_pricing_type_used === 'monthly' && 'คำนวณด้วยเรตรายเดือน'}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {"ระบบเลือกเรตที่คุ้มค่าที่สุดให้อัตโนมัติ"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Security Deposit */}
                  {rental.security_deposit_at_booking && rental.security_deposit_at_booking > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center gap-2">
                        <FaShieldAlt className="h-4 w-4 text-yellow-500" />
                        {"เงินประกัน"}:
                      </span>
                      <span className="font-semibold text-yellow-600">{formatCurrency(rental.security_deposit_at_booking)}</span>
                    </div>
                  )}
                  
                  {/* Delivery Fee */}
                  {rental.delivery_fee && rental.delivery_fee > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center gap-2">
                        <FaTruck className="h-4 w-4 text-green-500" />
                        {"ค่าจัดส่ง"}:
                      </span>
                      <span className="font-semibold text-green-600">{formatCurrency(rental.delivery_fee)}</span>
                    </div>
                  )}
                  
                  {/* Platform Fee */}
                  {rental.platform_fee_renter && rental.platform_fee_renter > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center gap-2">
                        <FaCreditCard className="h-4 w-4 text-purple-500" />
                        {"ค่าธรรมเนียมแพลตฟอร์ม"}:
                      </span>
                      <span className="font-semibold text-purple-600">{formatCurrency(rental.platform_fee_renter)}</span>
                    </div>
                  )}
                  
                  {/* Late Fee (if applicable) */}
                  {rental.late_fee_calculated && rental.late_fee_calculated > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600 flex items-center gap-2">
                        <FaExclamationTriangle className="h-4 w-4 text-red-500" />
                        {"ค่าปรับล่าช้า"}:
                      </span>
                      <span className="font-semibold text-red-600">{formatCurrency(rental.late_fee_calculated)}</span>
                    </div>
                  )}
                  
                  {/* Rental Period Information */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaClock className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-blue-800 text-sm">{"ข้อมูลระยะเวลาเช่า"}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-700">{"ขั้นต่ำ"}:</span>
                        <span className="font-semibold text-blue-800">
                          {product?.min_rental_duration_days || 1} {"วัน"}
                        </span>
                      </div>
                      {product?.max_rental_duration_days && (
                        <div className="flex items-center gap-1">
                          <span className="text-blue-700">{"สูงสุด"}:</span>
                          <span className="font-semibold text-blue-800">
                            {product.max_rental_duration_days} {"วัน"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Total Amount Due */}
                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg px-3 border border-blue-200">
                    <span className="text-blue-800 font-semibold text-lg">{"ยอดรวมที่ต้องชำระ"}:</span>
                    <span className="font-bold text-2xl text-blue-800">{formatCurrency(rental.total_amount_due || 0)}</span>
                  </div>
                  
                  {/* Final Amount Paid (if different from total) */}
                  {rental.final_amount_paid && rental.final_amount_paid !== rental.total_amount_due && (
                    <div className="flex justify-between items-center py-2 bg-green-100 rounded-lg px-3 border border-green-200">
                      <span className="text-green-800 font-semibold">{"ยอดเงินที่ชำระสุดท้าย"}:</span>
                      <span className="font-bold text-lg text-green-800">{formatCurrency(rental.final_amount_paid)}</span>
                    </div>
                  )}
                  
                  {/* Security Deposit Refund (if applicable) */}
                  {rental.security_deposit_refund_amount !== undefined && rental.security_deposit_refund_amount !== null && rental.security_deposit_refund_amount > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-yellow-800 font-semibold">{"ยอดเงินประกันคืน"}:</span>
                        <span className="font-bold text-yellow-800">{formatCurrency(rental.security_deposit_refund_amount)}</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        {"ยอดเงินประกันจะถูกคืนหลังจากสิ้นสุดการเช่าและตรวจสอบสภาพสินค้าแล้ว"}
                      </p>
                    </div>
                  )}
                  
                  {/* Important Note */}
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaInfoCircle className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold text-yellow-800">{"ข้อควรทราบ"}</h4>
                    </div>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <p>{"1. โปรดชำระเงินตามยอดรวมที่ต้องชำระด้านบน"}</p>
                      <p>{"2. เมื่อชำระเงินแล้ว โปรดอัปโหลดสลิปเพื่อยืนยัน"}</p>
                      <p>{"3. การเช่าจะได้รับการยืนยันเมื่อเจ้าของสินค้าตรวจสอบสลิปแล้ว"}</p>
                      <p>{"4. หากมีข้อสงสัย โปรดติดต่อเจ้าของสินค้าทันที"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <ErrorMessage message={error} onDismiss={() => setError(null)} />
                </motion.div>
              )}
              
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <div className="flex items-center gap-2 text-green-700">
                    <FaCheckCircle className="h-4 w-4" />
                    <span>{successMessage}</span>
                  </div>
                </motion.div>
              )}

              {rental.payment_status === PaymentStatus.PENDING_VERIFICATION ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                    <FaClock className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-yellow-700 font-semibold mb-2">{"รอการตรวจสอบหลักฐานการชำระเงิน"}</p>
                  <p className="text-sm text-gray-600 mb-6">{"หลักฐานของคุณถูกส่งแล้ว โปรดรอการยืนยันจากเจ้าของสินค้า"}</p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link to={ROUTE_PATHS.MY_RENTALS_RENTER}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <FaHistory className="h-4 w-4" />
                        {"ไปที่ประวัติการชำระเงิน"}
                      </motion.button>
                    </Link>
                    
                    <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <FaEye className="h-4 w-4" />
                        {"ดูรายละเอียดการเช่า"}
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              ) : (rental.payment_status === PaymentStatus.UNPAID || rental.rental_status === RentalStatus.PENDING_PAYMENT) ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-xl"
                  >
                    <h3 className="font-semibold text-blue-700 flex items-center gap-2 mb-4">
                      <FaShieldAlt className="h-5 w-5 text-blue-400" />
                      {"โอนเงินผ่านธนาคาร"}
                    </h3>
                    {isLoadingPayout ? (
                      <div className="flex items-center gap-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm">{"กำลังโหลดข้อมูลบัญชีรับเงิน..."}</span>
                      </div>
                    ) : payoutMethods.length > 0 ? (
                      (() => {
                        const primary = payoutMethods.find(m => m.is_primary) || payoutMethods[0];
                        if (primary.method_type === 'bank_account') {
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <FaCreditCard className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-blue-600">{"ธนาคาร"}: <strong>{primary.bank_name || '-'}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaUser className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-blue-600">{"ชื่อบัญชี"}: <strong>{primary.account_name}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaCreditCard className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-blue-600">{"เลขที่บัญชี"}: <strong>{primary.account_number}</strong></span>
                              </div>
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-yellow-700">
                                  <FaInfoCircle className="h-4 w-4" />
                                  <span>{"โปรดระบุรหัสการเช่านี้"}: {rental.rental_uid ? rental.rental_uid.substring(0,8) : '-'} {"ในหมายเหตุการโอน (ถ้าทำได้)"}</span>
                                </div>
                              </div>
                            </div>
                          );
                        } else if (primary.method_type === 'promptpay') {
                          return (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <FaQrcode className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-blue-600">{"พร้อมเพย์"}: <strong>{primary.account_number}</strong></span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FaUser className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-blue-600">{"ชื่อบัญชี"}: <strong>{primary.account_name}</strong></span>
                              </div>
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-yellow-700">
                                  <FaInfoCircle className="h-4 w-4" />
                                  <span>{"โปรดระบุรหัสการเช่านี้"}: {rental.rental_uid ? rental.rental_uid.substring(0,8) : '-'} {"ในหมายเหตุการโอน (ถ้าทำได้)"}</span>
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return <p className="text-sm text-blue-600">{"ไม่พบวิธีการรับเงินที่ทราบ"}</p>;
                        }
                      })()
                    ) : (
                      <p className="text-sm text-red-600">{"เจ้าของยังไม่ได้กำหนดวิธีการรับเงิน"}</p>
                    )}
                  </motion.div>
                  
                  {/* Modern Upload Proof */}
                  <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.0 }}
                    onSubmit={handleSubmitProof}
                    className="space-y-6"
                  >
                    <div>
                      <label htmlFor="payment_proof_image" className="block text-sm font-semibold text-gray-700 mb-3">
                        <span className="flex items-center gap-2">
                          <FaUpload className="h-5 w-5 text-blue-400" />
                          {"อัปโหลดหลักฐานการชำระเงิน"}
                        </span>
                      </label>
                      <div 
                        className="relative border-2 border-dashed border-blue-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-all duration-200" 
                        tabIndex={0} 
                        aria-label={"อัปโหลดหลักฐานการชำระเงิน"} 
                        onClick={() => document.getElementById('payment_proof_image')?.click()} 
                        onKeyDown={e => { if (e.key === 'Enter') document.getElementById('payment_proof_image')?.click(); }}
                      >
                        <input 
                          type="file" 
                          id="payment_proof_image" 
                          name="payment_proof_image" 
                          accept="image/*"
                          onChange={handleFileChange} 
                          required
                          className="hidden"
                        />
                        <FaUpload className="w-12 h-12 text-blue-300 mb-4" />
                        <span className="text-blue-500 font-medium text-center">{"ลากและวางไฟล์ หรือคลิกเพื่อเลือกไฟล์"}</span>
                        {imagePreview && (
                          <motion.img 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            src={imagePreview} 
                            alt="Payment proof preview" 
                            className="mt-4 h-40 rounded-lg border shadow-lg" 
                          />
                        )}
                      </div>
                    </div>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 ${
                        isSubmitting
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          {"กำลังส่งหลักฐาน..."}
                        </>
                      ) : (
                        <>
                          <FaUpload className="h-5 w-5" />
                          {"ส่งหลักฐานการชำระเงิน"}
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <FaInfoCircle className="h-8 w-8 text-gray-600" />
                  </div>
                  <p className="text-gray-600">{"สถานะการชำระเงินปัจจุบัน"}: {rental.payment_status ? rental.payment_status.replace('_', ' ').toUpperCase() : '-'}</p>
                  
                  {/* Add View Rental Details button */}
                  <div className="mt-6">
                    <Link to={ROUTE_PATHS.RENTER_RENTAL_DETAIL.replace(':rentalId', String(rental.id))}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <FaEye className="h-4 w-4" />
                        {"ดูรายละเอียดการเช่า"}
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};