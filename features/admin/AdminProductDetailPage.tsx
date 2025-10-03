import React, { useEffect, useState, useMemo } from 'react';
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
import { getProductByID } from '../../services/productService';

export const AdminProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');

  const [imageError, setImageError] = useState(false);
  const imageUrl = useMemo(() => {
    if (!product) return '';
    return (
      product.primary_image?.image_url ??
      product.images?.find(img => img.is_primary)?.image_url ??
      product.images?.[0]?.image_url ??
      ''
    );
  }, [product]);

  useEffect(() => {
    // รีเซ็ตสถานะ error เมื่อ URL รูปเปลี่ยน เพื่อให้ลองโหลดใหม่อีกครั้ง
    setImageError(false);
  }, [imageUrl]);
  const fetchProduct = () => {
    if (productId) {
      setIsLoading(true);
      adminGetProducts({ page: 1, limit: 100 })
        .then(res => {
          const found = res.data.find(p => String(p.id) === productId);
          setProduct(found || null);
          setApprovalStatus(found?.admin_approval_status || '');
          setApprovalNotes((found as any)?.admin_approval_notes || '');
          // Load full product details (including images) using public product endpoint
          if (found?.id) {
            return getProductByID(found.id)
              .then(response => {
                const full = response.data;
                setProduct(full);
                // Sync approval fields if present in full detail
                if (full.admin_approval_status) setApprovalStatus(full.admin_approval_status);
                if ((full as any).admin_approval_notes !== undefined) {
                  setApprovalNotes((full as any).admin_approval_notes || '');
                }
              })
              .catch(() => {
                // ถ้าโหลดรายละเอียดเต็มล้มเหลว ก็ยังคงข้อมูลพื้นฐานจาก adminGetProducts ต่อไป
              });
          }
        })
        .catch(err => setError((err as ApiError).message || 'โหลดสินค้าล้มเหลว'))
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
      setError('อัปเดตสถานะการอนุมัติล้มเหลว');
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
          <LoadingSpinner message="กำลังโหลดสินค้า..." />
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
            <h2 className="text-2xl font-bold text-gray-700 mb-2">ไม่พบสินค้า</h2>
            <p className="text-gray-500 mb-4">ไม่สามารถค้นหาสินค้าที่คุณต้องการได้</p>
            <Link to={ROUTE_PATHS.ADMIN_MANAGE_PRODUCTS}>
              <Button variant="primary">กลับไปยังหน้าจัดการสินค้า</Button>
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
                    รายละเอียดสินค้า ID: {product.id} | เจ้าของ ID: {product.owner_id}
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
                  <span>ดูหน้าสินค้า</span>
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
                      <h2 className="text-xl font-bold text-gray-800">ข้อมูลสินค้า</h2>
                    </div>
                    
                    {/* Product Image Preview */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <FaImage className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">รูปสินค้า</h3>
                      </div>
                      {imageUrl && !imageError ? (
                        <img
                          src={imageUrl}
                          alt={product.title}
                          loading="lazy"
                          onError={() => setImageError(true)}
                          className="w-full max-w-xl max-h-96 h-auto object-cover rounded-xl border border-gray-200 shadow-md"
                        />
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-500">
                          ไม่มีรูปภาพสินค้า
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <FaUser className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">ID เจ้าของ</p>
                            <p className="font-semibold text-gray-900">{product.owner_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <FaTag className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">ID หมวดหมู่</p>
                            <p className="font-semibold text-gray-900">{product.category_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <FaMapMarkerAlt className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">ID จังหวัด</p>
                            <p className="font-semibold text-gray-900">{product.province_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <FaDollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-500">ราคาต่อวัน</p>
                            <p className="font-bold text-green-600 text-lg">฿{product.rental_price_per_day?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-2">สถานะความพร้อม</p>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
                            product.availability_status === 'available' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {product.availability_status === 'available' ? (
                              <>
                                <FaCheckCircle className="h-3 w-3" />
                                พร้อมให้เช่า
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
                          <p className="text-sm text-gray-500 mb-2">สถานะการอนุมัติ</p>
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(product.admin_approval_status || '')}`}>
                            {getStatusIcon(product.admin_approval_status || '')}
                            {product.admin_approval_status === 'approved' ? 'อนุมัติแล้ว' : 
                             product.admin_approval_status === 'pending' ? 'รอการตรวจสอบ' : 
                             product.admin_approval_status === 'rejected' ? 'ถูกปฏิเสธ' : 
                             product.admin_approval_status}
                          </span>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">สร้างเมื่อ</p>
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'ไม่มีข้อมูล'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {product.description && (
                      <div className="mt-6">
                        <p className="text-sm text-gray-500 mb-2">คำอธิบาย</p>
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
                      <h2 className="text-xl font-bold text-gray-800">การดำเนินการของผู้ดูแล</h2>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          บันทึกการอนุมัติ
                        </label>
                        <textarea 
                          className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                          rows={4} 
                          value={approvalNotes} 
                          onChange={e => setApprovalNotes(e.target.value)}
                          placeholder="เพิ่มบันทึกการอนุมัติ (ถ้ามี)..."
                        />
                      </div>
                      
                      <div className="space-y-3">
                        {product.admin_approval_status === 'pending' ? (
                          <>
                            <Button 
                              variant="primary" 
                              disabled={isSubmitting} 
                              onClick={() => handleApprove('approved' as ProductAdminApprovalStatus)}
                              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            >
                              <FaCheck className="h-4 w-4 mr-2" />
                              {isSubmitting ? 'กำลังประมวลผล...' : 'อนุมัติสินค้า'}
                            </Button>
                            <Button 
                              variant="danger" 
                              disabled={isSubmitting} 
                              onClick={() => handleApprove('rejected' as ProductAdminApprovalStatus)}
                              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                            >
                              <FaTimes className="h-4 w-4 mr-2" />
                              {isSubmitting ? 'กำลังประมวลผล...' : 'ปฏิเสธสินค้า'}
                            </Button>
                          </>
                        ) : (
                          <>
                            {product.admin_approval_status === 'approved' && (
                              <div className="w-full rounded-lg border border-green-200 bg-green-50 text-green-700 p-3 text-center">
                                สินค้าถูกอนุมัติแล้ว
                              </div>
                            )}
                            {product.admin_approval_status === 'rejected' && (
                              <div className="w-full rounded-lg border border-red-200 bg-red-50 text-red-700 p-3 text-center">
                                สินค้าถูกปฏิเสธแล้ว
                              </div>
                            )}
                          </>
                        )}
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
                    <h3 className="text-lg font-bold mb-4">สถิติโดยย่อ</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-blue-100">เงินประกัน</span>
                        <span className="font-semibold">฿{product.security_deposit !== undefined && product.security_deposit !== null ? product.security_deposit.toLocaleString() : 'ไม่มีข้อมูล'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-100">จำนวนที่มี</span>
                        <span className="font-semibold">{product.quantity_available ?? 'ไม่มีข้อมูล'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-100">จำนวนวันเช่าขั้นต่ำ</span>
                        <span className="font-semibold">{product.min_rental_duration_days ?? 'ไม่มีข้อมูล'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-100">คะแนนเฉลี่ย</span>
                        <span className="font-semibold">{product.average_rating !== undefined && product.average_rating !== null ? `${product.average_rating}/5` : 'ไม่มีข้อมูล'}</span>
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
