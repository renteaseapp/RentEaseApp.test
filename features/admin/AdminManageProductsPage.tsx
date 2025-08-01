import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetProducts, adminApproveProduct } from '../../services/adminService';
import { Product, ApiError, PaginatedResponse, ProductAdminApprovalStatus } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBox, 
  FaSearch, 
  FaTimes, 
  FaEye, 
  FaCheck, 
  FaTimes as FaX,
  FaEllipsisV,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDollarSign,
  FaUser
} from 'react-icons/fa';

export const AdminManageProductsPage: React.FC = () => {
  const { t } = useTranslation('adminManageProductsPage');
  const [productsResponse, setProductsResponse] = useState<PaginatedResponse<Product> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionRow, setActionRow] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchProducts = (pageNum = 1) => {
    setIsLoading(true);
    adminGetProducts({ page: pageNum, limit: 20 })
      .then(setProductsResponse)
      .catch(err => setError((err as ApiError).message || t('error.loadFailed')))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line
  }, [page]);

  const handleApproval = async (productId: number, status: ProductAdminApprovalStatus) => {
    try {
      await adminApproveProduct(productId, {
        admin_approval_status: status,
        approved_by_admin_id: 1 // TODO: ใช้ admin id จาก context
      });
      fetchProducts(page);
    } catch (err) {
      setError(t('error.updateApprovalFailed'));
    }
  };

  let products: Product[] = productsResponse?.data || [];
  
  // Client-side filtering
  if (search) {
    products = products.filter(
      p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        String(p.owner_id).includes(search)
    );
  }

  // Apply status filter
  if (selectedFilter !== 'all') {
    products = products.filter(p => p.admin_approval_status === selectedFilter);
  }

  const stats = {
    total: productsResponse?.data?.length || 0,
    pending: productsResponse?.data?.filter(p => p.admin_approval_status === 'pending').length || 0,
    approved: productsResponse?.data?.filter(p => p.admin_approval_status === 'approved').length || 0,
    rejected: productsResponse?.data?.filter(p => p.admin_approval_status === 'rejected').length || 0,
  };

  let hasPagination = !!productsResponse?.meta;

  if (isLoading && !productsResponse) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <LoadingSpinner message={t('loadingProducts')} />
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
                <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
                  <FaBox className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                    {t('title')}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {t('manageProductsDescription') || 'Manage product listings and approvals'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">{t('stats.totalProducts') || 'Total Products'}</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <FaBox className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">{t('stats.pendingReview') || 'Pending Review'}</p>
                    <p className="text-3xl font-bold">{stats.pending}</p>
                  </div>
                  <FaClock className="h-8 w-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">{t('stats.approved') || 'Approved'}</p>
                    <p className="text-3xl font-bold">{stats.approved}</p>
                  </div>
                  <FaCheckCircle className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">{t('stats.rejected') || 'Rejected'}</p>
                    <p className="text-3xl font-bold">{stats.rejected}</p>
                  </div>
                  <FaExclamationTriangle className="h-8 w-8 text-red-200" />
        </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
          />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: t('filters.allProducts') || 'All Products', icon: <FaBox className="h-4 w-4" /> },
                  { key: 'pending', label: t('filters.pending') || 'Pending', icon: <FaClock className="h-4 w-4" /> },
                  { key: 'approved', label: t('filters.approved') || 'Approved', icon: <FaCheckCircle className="h-4 w-4" /> },
                  { key: 'rejected', label: t('filters.rejected') || 'Rejected', icon: <FaExclamationTriangle className="h-4 w-4" /> }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      selectedFilter === filter.key
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.icon}
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => setSearch(searchInput)} 
                  variant="primary"
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <FaSearch className="h-4 w-4 mr-2" />
                  {t('actions.search')}
                </Button>
                {(search || selectedFilter !== 'all') && (
                  <Button 
                    onClick={() => { 
                      setSearch(''); 
                      setSearchInput(''); 
                      setSelectedFilter('all');
                    }} 
                    variant="outline"
                  >
                    <FaTimes className="h-4 w-4 mr-2" />
                    {t('actions.clear')}
                  </Button>
                )}
        </div>
      </div>
          </motion.div>

          {/* Products Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.title')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.ownerId')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.pricePerDay')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.approvalStatus')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {t('table.actions')}
                    </th>
            </tr>
          </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  <AnimatePresence>
                    {products && products.length > 0 ? (
                      products.map((product, index) => (
                        <motion.tr
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                  <FaBox className="h-5 w-5 text-white" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {product.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {product.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FaUser className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-700">
                                {product.owner_id}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FaDollarSign className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                ฿{product.rental_price_per_day?.toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              product.admin_approval_status === 'approved' 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : product.admin_approval_status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {product.admin_approval_status === 'approved' ? (
                                <>
                                  <FaCheckCircle className="h-3 w-3 mr-1" />
                                  {t(`approvalStatus.${product.admin_approval_status}`)}
                                </>
                              ) : product.admin_approval_status === 'pending' ? (
                                <>
                                  <FaClock className="h-3 w-3 mr-1" />
                                  {t(`approvalStatus.${product.admin_approval_status}`)}
                                </>
                              ) : (
                                <>
                                  <FaExclamationTriangle className="h-3 w-3 mr-1" />
                    {t(`approvalStatus.${product.admin_approval_status}`)}
                                </>
                              )}
                  </span>
                </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium relative">
                  <div className="relative inline-block text-left">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionRow(actionRow === product.id ? null : product.id)}
                                className="min-w-[2.5rem] hover:bg-gray-100"
                    >
                                <FaEllipsisV className="h-4 w-4" />
                    </Button>
                              
                              <AnimatePresence>
                    {actionRow === product.id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 border border-gray-100"
                                  >
                                    <div className="py-2">
                                      <Link 
                                        to={ROUTE_PATHS.ADMIN_PRODUCT_DETAIL.replace(':productId', String(product.id))} 
                                        className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors" 
                                        onClick={() => setActionRow(null)}
                                      >
                                        <FaEye className="h-4 w-4 mr-2" />
                                        {t('actions.viewEdit')}
                                      </Link>
                                      
                          {product.admin_approval_status === 'pending' && (
                            <>
                                          <button 
                                            onClick={() => { handleApproval(product.id, 'approved' as ProductAdminApprovalStatus); setActionRow(null); }} 
                                            className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                          >
                                            <FaCheck className="h-4 w-4 mr-2" />
                                            {t('actions.approve')}
                                          </button>
                                          <button 
                                            onClick={() => { handleApproval(product.id, 'rejected' as ProductAdminApprovalStatus); setActionRow(null); }} 
                                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                          >
                                            <FaX className="h-4 w-4 mr-2" />
                                            {t('actions.reject')}
                                          </button>
                            </>
                          )}
                        </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                      >
                        <td colSpan={5} className="text-center text-gray-400 py-12">
                          <div className="flex flex-col items-center">
                            <FaBox className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">No products found</p>
                            <p className="text-sm text-gray-500">No products match your current filters</p>
                      </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
          </tbody>
        </table>
      </div>
          </motion.div>

          {/* Pagination */}
      {hasPagination && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex justify-between items-center mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-4"
            >
              <Button 
                variant="outline" 
                disabled={page <= 1} 
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-2"
              >
                ← {t('pagination.prev')}
              </Button>
              <span className="text-gray-700 font-medium">
                {t('pagination.page')} {page}
                {productsResponse?.meta?.last_page ? ` / ${productsResponse.meta.last_page}` : ''}
              </span>
              <Button 
                variant="outline" 
                disabled={!!productsResponse && page >= (productsResponse.meta?.last_page || 1)} 
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-2"
              >
                {t('pagination.next')} →
              </Button>
            </motion.div>
          )}
        </div>
    </div>
    </AdminLayout>
  );
};
