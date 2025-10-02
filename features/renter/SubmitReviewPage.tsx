import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { getRentalDetails, createReview, getReview, updateReview } from '../../services/rentalService';
import { Rental, ReviewPayload, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { ROUTE_PATHS } from '../../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaStar, 
  FaBox, 
  FaUser, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaArrowRight,
  FaHeart,
  FaThumbsUp,
  FaComment,
  FaShieldAlt,
  FaSmile,
  FaCamera,
  FaEdit
} from 'react-icons/fa';

const StarIcon: React.FC<{ filled: boolean; onClick?: () => void; onMouseEnter?: () => void; onMouseLeave?: () => void; className?: string }> = 
    ({ filled, onClick, onMouseEnter, onMouseLeave, className }) => (
  <motion.svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={`h-10 w-10 cursor-pointer transition-all duration-200 ${filled ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-300 hover:text-yellow-300'} ${className}`} 
    viewBox="0 0 20 20" 
    fill="currentColor"
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </motion.svg>
);

export const SubmitReviewPage: React.FC = () => {
  const { rentalId } = useParams<{ rentalId: string }>();
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [rental, setRental] = useState<Rental | null>(null);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [ratingProduct, setRatingProduct] = useState(0);
  const [hoverRatingProduct, setHoverRatingProduct] = useState(0);
  const [ratingOwner, setRatingOwner] = useState(0);
  const [hoverRatingOwner, setHoverRatingOwner] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (rentalId && authUser?.id) {
      setIsLoading(true);
      
      // Load rental details and check for existing review
      Promise.all([
        getRentalDetails(rentalId, authUser.id, 'renter'),
        getReview(parseInt(rentalId)).catch(() => null) // Don't throw error if no review exists
      ])
        .then(([rentalData, reviewData]) => {
          setRental(rentalData);
          
          if (reviewData) {
            setExistingReview(reviewData);
            setIsEditMode(true);
            // Pre-fill form with existing review data
            setRatingProduct(reviewData.rating_product || 0);
            setRatingOwner(reviewData.rating_owner || 0);
            setComment(reviewData.comment || '');
          }
        })
        .catch(err => setError((err as ApiError).message || "ไม่สามารถโหลดข้อมูลได้"))
        .finally(() => setIsLoading(false));
    }
  }, [rentalId, authUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rental || !authUser?.id || ratingProduct === 0 || ratingOwner === 0) {
        setError("กรุณาให้คะแนนทั้งสินค้าและเจ้าของสินค้า");
        return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
        if (isEditMode) {
          // Update existing review
          await updateReview(parseInt(rentalId!), {
            rating_product: ratingProduct,
            rating_owner: ratingOwner,
            comment: comment
          });
          setSuccessMessage("แก้ไขรีวิวสำเร็จแล้ว");
        } else {
          // Create new review
          await createReview({
            rental_id: rental.id,
            rating_product: ratingProduct,
            rating_owner: ratingOwner,
            comment: comment || ''
          });
          setSuccessMessage("ส่งรีวิวสำเร็จแล้ว");
        }
        setTimeout(() => navigate(ROUTE_PATHS.MY_RENTALS_RENTER), 2000);
    } catch (err) {
        setError((err as ApiError).message || (isEditMode ? "แก้ไขรีวิวไม่สำเร็จ" : "ส่งรีวิวไม่สำเร็จ"));
    } finally {
        setIsSubmitting(false);
    }
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return "แย่";
      case 2: return "พอใช้";
      case 3: return "ดี";
      case 4: return "ดีมาก";
      case 5: return "ยอดเยี่ยม";
      default: return '';
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-20">
      <LoadingSpinner message={"กำลังโหลดรายละเอียดการเช่า..."} />
    </div>
  );
  
  if (error) return <ErrorMessage message={error} />;
  if (!rental) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center pt-20">
      <div className="text-center p-8">
        <FaExclamationTriangle className="text-6xl text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{"ไม่พบรายละเอียดการเช่า"}</h2>
        <p className="text-gray-600">{"ไม่สามารถเข้าถึงข้อมูลการเช่านี้ได้"}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 py-8">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            {isEditMode ? <FaEdit className="text-2xl text-white" /> : <FaComment className="text-2xl text-white" />}
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            {isEditMode ? "แก้ไขรีวิว" : "ส่งรีวิว"}
          </h1>
          <p className="text-gray-600 text-lg">
            {isEditMode ? "แก้ไขประสบการณ์การเช่าของคุณ" : "บอกเล่าประสบการณ์การเช่าของคุณ"}
          </p>
        </motion.div>

        {/* Main Content Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
        >
          {/* Product Info Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <FaBox className="text-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-1">
                  {isEditMode ? "แก้ไขรีวิวการเช่าสินค้า" : "รีวิวการเช่าสินค้า"}
                </h2>
                <p className="text-blue-100 text-lg">{rental.product?.title}</p>
                <div className="flex items-center mt-2 text-blue-100">
                  <FaUser className="mr-2" />
                  <span>{"เจ้าของ"}: {rental.owner?.first_name}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6"
                  role="alert"
                >
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-red-400 mr-3 text-xl" />
                    <div>
                      <p className="text-red-800 font-medium">{"เกิดข้อผิดพลาด"}</p>
                      <p className="text-red-700">{error}</p>
                    </div>
                    <button 
                      onClick={() => setError(null)}
                      className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
              
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6"
                  role="alert"
                >
                  <div className="flex items-center">
                    <FaCheckCircle className="text-green-400 mr-3 text-xl" />
                    <div>
                      <p className="text-green-800 font-medium">{"สำเร็จ"}</p>
                      <p className="text-green-700">{successMessage}</p>
                    </div>
                    <button 
                      onClick={() => setSuccessMessage(null)}
                      className="ml-auto text-green-400 hover:text-green-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
                      </svg>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!successMessage && (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Product Rating Section */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4">
                      <FaBox className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{"ให้คะแนนสินค้า"}</h3>
                      <p className="text-gray-600 text-sm">{"ให้คะแนนความพึงพอใจต่อสินค้าชิ้นนี้"}</p>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <StarIcon 
                        key={star} 
                        filled={star <= (hoverRatingProduct || ratingProduct)}
                        onClick={() => setRatingProduct(star)}
                        onMouseEnter={() => setHoverRatingProduct(star)}
                        onMouseLeave={() => setHoverRatingProduct(0)}
                      />
                    ))}
                  </div>
                  {ratingProduct > 0 && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center mt-3 text-blue-600 font-medium"
                    >
                      {getRatingText(ratingProduct)}
                    </motion.p>
                  )}
                </motion.div>

                {/* Owner Rating Section */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4">
                      <FaUser className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{"ให้คะแนนเจ้าของสินค้า"}</h3>
                      <p className="text-gray-600 text-sm">{"ให้คะแนนความพึงพอใจต่อบริการของเจ้าของสินค้า"}</p>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <StarIcon 
                        key={star} 
                        filled={star <= (hoverRatingOwner || ratingOwner)}
                        onClick={() => setRatingOwner(star)}
                        onMouseEnter={() => setHoverRatingOwner(star)}
                        onMouseLeave={() => setHoverRatingOwner(0)}
                      />
                    ))}
                  </div>
                  {ratingOwner > 0 && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center mt-3 text-purple-600 font-medium"
                    >
                      {getRatingText(ratingOwner)}
                    </motion.p>
                  )}
                </motion.div>

                {/* Comments Section */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mr-4">
                      <FaComment className="text-white text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{"แบ่งปันประสบการณ์"}</h3>
                      <p className="text-gray-600 text-sm">{"เขียนคอมเมนต์เกี่ยวกับสินค้าและบริการ"}</p>
                    </div>
                  </div>
                  <textarea 
                    id="comment" 
                    name="comment" 
                    rows={4}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="w-full p-4 border border-green-200 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
                    placeholder={"เขียนรีวิวของคุณที่นี่ (ไม่บังคับ)..."}
                  />
                  <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                    <span>{"รีวิวของคุณช่วยชุมชนได้"}</span>
                    <span>{comment.length}/500</span>
                  </div>
                </motion.div>

                {/* Submit Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <button 
                    type="submit" 
                    disabled={ratingProduct === 0 || ratingOwner === 0 || isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>{isEditMode ? "กำลังแก้ไขรีวิว..." : "กำลังส่งรีวิว..."}</span>
                      </>
                    ) : (
                      <>
                        {isEditMode ? <FaEdit className="text-xl" /> : <FaCheckCircle className="text-xl" />}
                        <span>{isEditMode ? "บันทึกการแก้ไข" : "ส่งรีวิว"}</span>
                      </>
                    )}
                  </button>
                </motion.div>
              </form>
            )}

            {/* Success State */}
            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-4xl text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {isEditMode ? "แก้ไขรีวิวเรียบร้อยแล้ว" : "ส่งรีวิวเรียบร้อยแล้ว"}
                </h3>
                <p className="text-gray-600 mb-6">{"ขอบคุณสำหรับการแบ่งปันประสบการณ์ของคุณ"}</p>
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <span>{"กำลังนำทางไปที่หน้ารายการเช่า..."}</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 text-gray-500"
        >
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <FaShieldAlt className="text-blue-400" />
              <span className="text-sm">{"ปลอดภัยและเป็นส่วนตัว"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaSmile className="text-purple-400" />
              <span className="text-sm">{"ช่วยให้ผู้อื่นตัดสินใจได้ง่ายขึ้น"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FaHeart className="text-red-400" />
              <span className="text-sm">{"ชุมชนขับเคลื่อน"}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};