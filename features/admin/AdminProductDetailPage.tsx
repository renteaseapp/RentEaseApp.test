import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetProducts, adminApproveProduct } from '../../services/adminService';
import { Product, ApiError, ProductAdminApprovalStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { Button } from '../../components/ui/Button';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FaBox, 
  FaArrowLeft, 
  FaUser, 
  FaTag, 
  FaMapMarkerAlt, 
  FaDollarSign, 
  FaCheckCircle, 
  FaClock, 
  FaExclamationTriangle,
  FaEdit,
  FaCheck,
  FaTimes,
  FaImage,
  FaCalendarAlt,
  FaShieldAlt,
  FaInfoCircle,
  FaEye
} from 'react-icons/fa';

export const AdminProductDetailPage: React.FC = () => {
  const { t } = useTranslation('adminProductDetailPage');
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const fetchProduct = () => {
    if (productId) {
      setIsLoading(true);
      adminGetProducts({ page: 1, limit: 100 })
        .then(res => {
          const found = res.data.find(p => String(p.id) === productId);
          setProduct(found || null);
          setApprovalStatus(found?.admin_approval_status || '');
          setApprovalNotes((found as any)?.admin_approval_notes || '');
        })
        .catch(err => setError((err as ApiError).message || t('error.loadFailed')))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const handleApprove = async (status: ProductAdminApprovalStatus) => {
    if (!productId) return;
    setIsSubmitting(true);
    try {
      await adminApproveProduct(Number(productId), {
        admin_approval_status: status,
        admin_approval_notes: approvalNotes,
        approved_by_admin_id: 1 // TODO: ใช้ admin id จริงจาก context
      });
      fetchProduct();
    } catch (err) {
      setError(t('error.updateApprovalFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <FaCheckCircle className="h-4 w-4" />;
      case 'pending':
        return <FaClock className="h-4 w-4" />;
      case 'rejected':
        return <FaExclamationTriangle className="h-4 w-4" />;
      default:
        return <FaInfoCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <LoadingSpinner message={t('loadingProduct')} />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <ErrorMessage message={error} />
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <FaBox className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">{t('productNotFound')}</h2>
            <p className="text-gray-500 mb-4">{t('productNotFoundDescription')}</p>
            <Link to={ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS}>
              <Button variant="primary">{t('backToProducts')}</Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto p-4 md:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <Link 
                  to={ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS}
                  className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <FaArrowLeft className="h-5 w-5 text-gray-600" />
                </Link>
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                  <FaBox className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    {product.title}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {t('productInfo', { productId: product.id, ownerId: product.owner_id })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link 
                  to={`/products/${product.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <FaEye className="h-4 w-4" />
                  <span>{t('viewProductPage')}</span>
                </Link>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-white shadow-xl border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <FaInfoCircle className="h-5 w-5 text-green-600" />
                      <h2 className="text-xl font-bold text-gray-800">{t('productInformation')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <FaUser className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">{t('ownerId')}</p>
                            <p className="font-semibold text-gray-900">{product.owner_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <FaTag className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">{t('categoryId')}</p>
                            <p className="font-semibold text-gray-900">{product.category_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">{t('provinceId')}</p>
                            <p className="font-semibold text-gray-900">{product.province_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <FaDollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">{t('pricePerDay')}</p>
                            <p className="font-bold text-green-600 text-lg">฿{product.rental_price_per_day?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-2">{t('availabilityStatus')}</p>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
                            product.availability_status === 'available' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {product.availability_status === 'available' ? (
                              <>
                                <FaCheckCircle className="h-3 w-3" />
                                {t('available')}
                              </>
                            ) : (
                              <>
                                <FaExclamationTriangle className="h-3 w-3" />
                                {product.availability_status?.toUpperCase()}
                              </>
                            )}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">{t('adminApprovalStatus')}</p>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(product.admin_approval_status || '')}`}>
                            {getStatusIcon(product.admin_approval_status || '')}
                            {t(`approvalStatus.${product.admin_approval_status}`)}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">{t('createdAt')}</p>
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {product.created_at ? new Date(product.created_at).toLocaleDateString() : t('notAvailable')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {product.description && (
                      <div className="mt-6">
                        <p className="text-sm text-gray-500 mb-2">{t('description')}</p>
                        <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                          {product.description}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Admin Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-white shadow-xl border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <FaShieldAlt className="h-5 w-5 text-green-600" />
                      <h2 className="text-xl font-bold text-gray-800">{t('adminActions')}</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('approvalNotes')}
                        </label>
                        <textarea 
                          className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                          rows={4} 
                          value={approvalNotes} 
                          onChange={e => setApprovalNotes(e.target.value)}
                          placeholder={t('approvalNotesPlaceholder')}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Button 
                          variant="primary" 
                          disabled={isSubmitting} 
                          onClick={() => handleApprove('approved' as ProductAdminApprovalStatus)}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                        >
                          <FaCheck className="h-4 w-4 mr-2" />
                          {isSubmitting ? t('processing') : t('approveProduct')}
                        </Button>
                        
                        <Button 
                          variant="danger" 
                          disabled={isSubmitting} 
                          onClick={() => handleApprove('rejected' as ProductAdminApprovalStatus)}
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        >
                          <FaTimes className="h-4 w-4 mr-2" />
                          {isSubmitting ? t('processing') : t('rejectProduct')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold mb-4">{t('quickStats')}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-100">{t('securityDeposit')}</span>
                        <span className="font-semibold">฿{product.security_deposit?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-100">{t('quantityAvailable')}</span>
                        <span className="font-semibold">{product.quantity_available || t('notAvailable')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-100">{t('minRentalDays')}</span>
                        <span className="font-semibold">{product.min_rental_duration_days || t('notAvailable')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-100">{t('averageRating')}</span>
                        <span className="font-semibold">{product.average_rating ? `${product.average_rating}/5` : t('notAvailable')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
