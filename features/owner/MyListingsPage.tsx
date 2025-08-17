import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { getOwnerListings, updateProductStatus, deleteProduct } from '../../services/ownerService';
import { Product, ApiError, PaginatedResponse, ProductAvailabilityStatus, } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaPlus, 
  FaTimes, 

  FaEdit,
  FaTrash,
  FaFilter,
  FaTh,
  FaList,
  FaBox,
  FaMapMarkerAlt,
  FaTag,
  FaCalendarAlt,
  FaEye as FaViews,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExclamationTriangle,
  FaArrowRight,
} from 'react-icons/fa';

// Debounce hook for search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Highlight search term in text
const HighlightText: React.FC<{ text: string; searchTerm: string }> = ({ text, searchTerm }) => {
  if (!searchTerm.trim()) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 px-1 rounded font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

// Filter products based on search term
const filterProductsBySearch = (products: Product[], searchTerm: string): Product[] => {
  if (!searchTerm.trim()) {
    return products;
  }

  const searchLower = searchTerm.toLowerCase();
  
  return products.filter(product => {
    // Search in title
    if (product.title.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in description
    if (product.description && product.description.toLowerCase().includes(searchTerm)) {
      return true;
    }
    
    // Search in category name
    if (product.category?.name && product.category.name.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in province name
    if (product.province?.name_th && product.province.name_th.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in specifications
    if (product.specifications) {
      const specsString = JSON.stringify(product.specifications).toLowerCase();
      if (specsString.includes(searchLower)) {
        return true;
      }
    }
    
    return false;
  });
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string; type: 'availability' | 'admin' }> = ({ status, type }) => {
  const { t } = useTranslation();
  
  const getStatusColor = () => {
    if (type === 'availability') {
      switch (status) {
        case 'available': return 'bg-green-100 text-green-800 border-green-200';
        case 'unavailable': return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'hidden': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else {
      switch (status) {
        case 'approved': return 'bg-green-100 text-green-800 border-green-200';
        case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
  };

  const getStatusIcon = () => {
    if (type === 'availability') {
      switch (status) {
        case 'available': return <FaCheckCircle className="h-3 w-3" />;
        case 'unavailable': return <FaTimesCircle className="h-3 w-3" />;
        case 'hidden': return <FaClock className="h-3 w-3" />;
        default: return <FaExclamationTriangle className="h-3 w-3" />;
      }
    } else {
      switch (status) {
        case 'approved': return <FaCheckCircle className="h-3 w-3" />;
        case 'rejected': return <FaTimesCircle className="h-3 w-3" />;
        case 'pending': return <FaClock className="h-3 w-3" />;
        default: return <FaExclamationTriangle className="h-3 w-3" />;
      }
    }
  };

  const getStatusText = () => {
    if (type === 'availability') {
      return t(`myListingsPage.status.${status.toLowerCase()}`);
    } else {
      return t(`myListingsPage.adminStatus.${status.toLowerCase()}`);
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      {getStatusIcon()}
      {getStatusText()}
    </span>
  );
};

export const MyListingsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showSuccess, showError } = useAlert();
  
  // State management
  const [listingsResponse, setListingsResponse] = useState<PaginatedResponse<Product> | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [priceRangeFilter, setPriceRangeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch listings function
  const fetchListings = useCallback(async (page = 1, search = debouncedSearchTerm, status = statusFilter) => {
    if (!user?.id) return;

    try {
      const params: any = { q: search, page, limit: 20 };
      if (status && status !== '') {
        params.availability_status = status;
      }
      
      console.log('Fetching listings with params:', params);
      
      const response = await getOwnerListings(user.id, params);
      
      console.log('Listings response:', response);
      
      // Handle the new API response format
      const responseData = response as any;
      if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
        // Transform the response to match expected format
        const transformedResponse: PaginatedResponse<Product> = {
          data: responseData.data.data,
          meta: responseData.data.meta,
          links: responseData.data.links || {}
        };
        setListingsResponse(transformedResponse);
      } else {
        // Fallback for old format
        setListingsResponse(response as PaginatedResponse<Product>);
      }
      
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching listings:', err);
      const apiError = err as ApiError;
      showError(apiError.message || t('myListingsPage.error.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, debouncedSearchTerm, t, showError]);

  // Filter products when search term changes
  useEffect(() => {
    if (listingsResponse?.data) {
      let filtered = filterProductsBySearch(listingsResponse.data, searchTerm);
      // Apply additional filters (ยกเว้น status เพราะ API กรองให้แล้ว)
      if (categoryFilter) {
        filtered = filtered.filter(product => 
          product.category?.name === categoryFilter
        );
      }
      if (provinceFilter) {
        filtered = filtered.filter(product => 
          product.province?.name_th === provinceFilter
        );
      }
      if (priceRangeFilter) {
        const [min, max] = priceRangeFilter.split('-').map(Number);
        filtered = filtered.filter(product => {
          const price = product.rental_price_per_day;
          if (max) {
            return price >= min && price <= max;
          } else {
            return price >= min;
          }
        });
      }
      setFilteredProducts(filtered);
    }
  }, [listingsResponse?.data, searchTerm, categoryFilter, provinceFilter, priceRangeFilter]);

  // Initial load
  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      fetchListings(1);
    }
  }, [user?.id, fetchListings]);

  // Refetch when search or filter changes
  useEffect(() => {
    if (user?.id) {
      fetchListings(1, debouncedSearchTerm, statusFilter);
    }
  }, [debouncedSearchTerm, statusFilter, fetchListings]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    console.log('Status filter changed to:', newStatus);
    setStatusFilter(newStatus);
  };

  // Handle category filter change
  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
  };

  // Handle province filter change
  const handleProvinceFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProvinceFilter(e.target.value);
  };

  // Handle price range filter change
  const handlePriceRangeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPriceRangeFilter(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCategoryFilter('');
    setProvinceFilter('');
    setPriceRangeFilter('');
  };

  // Handle delete
  const handleDelete = async (productId: number, productTitle: string) => {
    if (!user?.id) return;
    
    const confirmed = window.confirm(
      t('myListingsPage.deleteConfirmation.message', { title: productTitle })
    );
    
    if (!confirmed) return;

    try {
      setIsLoading(true);
        await deleteProduct(productId, user.id);
      showSuccess(t('myListingsPage.deleteSuccess'));
      await fetchListings(currentPage);
    } catch (err) {
      const apiError = err as ApiError;
      showError(apiError.message || t('myListingsPage.error.delete'));
    } finally {
        setIsLoading(false);
    }
  };
  
  // Handle status change
  const handleChangeStatus = async (productId: number, newStatus: ProductAvailabilityStatus) => {
     if (!user?.id) return;

    try {
     setIsLoading(true);
        await updateProductStatus(productId, user.id, newStatus);
      showSuccess(t('myListingsPage.statusUpdateSuccess'));
      await fetchListings(currentPage);
     } catch (err) {
      const apiError = err as ApiError;
      showError(apiError.message || t('myListingsPage.error.statusUpdate'));
     } finally {
        setIsLoading(false);
     }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchListings(page);
  };

  // Get unique categories and provinces for filters
  const getUniqueCategories = () => {
    if (!listingsResponse?.data) return [];
    const categories = listingsResponse.data.map(product => product.category?.name).filter(Boolean);
    return [...new Set(categories)];
  };

  const getUniqueProvinces = () => {
    if (!listingsResponse?.data) return [];
    const provinces = listingsResponse.data.map(product => product.province?.name_th).filter(Boolean);
    return [...new Set(provinces)];
  };

  // Loading state
  if (isLoading && !listingsResponse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <LoadingSpinner message={t('myListingsPage.loadingListings')} />
      </div>
    );
  }

  // Determine which products to display
  const displayProducts = searchTerm.trim() || categoryFilter || provinceFilter || priceRangeFilter 
    ? filteredProducts 
    : (listingsResponse?.data || []);
  const hasNoSearchResults = (searchTerm.trim() || categoryFilter || provinceFilter || priceRangeFilter) && filteredProducts.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <FaBox className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{t('myListingsPage.title')}</h1>
              <p className="text-blue-100 text-lg">
                {t('myListingsPage.subtitle')}
              </p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={ROUTE_PATHS.CREATE_PRODUCT}>
                <Button variant="primary" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold shadow-lg">
                  <FaPlus className="h-5 w-5 mr-2" />
                  {t('myListingsPage.addNewListing')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8"
        >
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('myListingsPage.searchPlaceholder')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200"
              >
                <FaFilter className="h-4 w-4" />
                {t('myListingsPage.filterByStatus')}
                <FaArrowRight className={`h-4 w-4 transition-transform duration-200 ${showFilters ? 'rotate-90' : ''}`} />
              </motion.button>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium">{t('myListingsPage.viewMode')}:</span>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('list')}
                    className={`p-3 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
                  >
                    <FaList className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('grid')}
                    className={`p-3 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-colors`}
                  >
                    <FaTh className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200"
                >
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('myListingsPage.filterByStatus')}
                    </label>
                    <select
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">{t('myListingsPage.allStatuses')}</option>
                      <option value="available">{t('myListingsPage.status.available')}</option>
                      <option value="unavailable">{t('myListingsPage.status.unavailable')}</option>
                      <option value="hidden">{t('myListingsPage.status.hidden')}</option>
                      <option value="draft">{t('myListingsPage.status.draft')}</option>
                      <option value="pending_approval">{t('myListingsPage.status.pending_approval')}</option>
                      <option value="rented_out">{t('myListingsPage.status.rented_out')}</option>
                    </select>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('myListingsPage.labels.category')}
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={handleCategoryFilterChange}
                      className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">{t('myListingsPage.allCategories')}</option>
                      {getUniqueCategories().map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  {/* Province Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('myListingsPage.labels.location')}
                    </label>
                    <select
                      value={provinceFilter}
                      onChange={handleProvinceFilterChange}
                      className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">{t('myListingsPage.allProvinces')}</option>
                      {getUniqueProvinces().map(province => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('myListingsPage.labels.price')}
                    </label>
                    <select
                      value={priceRangeFilter}
                      onChange={handlePriceRangeFilterChange}
                      className="block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">{t('myListingsPage.allPrices')}</option>
                      <option value="0-100">฿0 - ฿100</option>
                      <option value="100-500">฿100 - ฿500</option>
                      <option value="500-1000">฿500 - ฿1,000</option>
                      <option value="1000-5000">฿1,000 - ฿5,000</option>
                      <option value="5000-">฿5,000+</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter Actions */}
            {(searchTerm || statusFilter || categoryFilter || provinceFilter || priceRangeFilter) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap gap-3 items-center justify-between pt-4 border-t border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                  >
                    <FaTimes className="h-4 w-4" />
                    {t('myListingsPage.clearFiltersButton')}
                  </motion.button>
                  
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {t('myListingsPage.activeFilters', { 
                      count: [searchTerm, statusFilter, categoryFilter, provinceFilter, priceRangeFilter].filter(Boolean).length 
                    })}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Listings Section */}
        {displayProducts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {displayProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-2xl transition-all duration-300 group overflow-hidden"
                    >
                      {/* Product Image */}
                      <div className="relative overflow-hidden">
                        <img 
                          src={product.images?.find(img => img.is_primary)?.image_url || product.images?.[0]?.image_url || 'https://picsum.photos/400/225?grayscale'} 
                          alt={product.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute top-3 right-3 flex flex-col gap-2">
                          {product.availability_status && (
                            <StatusBadge status={product.availability_status} type="availability" />
                          )}
                          {product.admin_approval_status && (
                            <StatusBadge status={product.admin_approval_status} type="admin" />
                          )}
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          <HighlightText text={product.title} searchTerm={searchTerm} />
                        </h3>
                        
                        {/* Quick Info */}
                        <div className="space-y-3 text-sm text-gray-600 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FaMoneyBillWave className="h-3 w-3 text-green-500" />
                              {t('myListingsPage.labels.price')}:
                            </span>
                            <span className="font-bold text-green-600">฿{product.rental_price_per_day?.toLocaleString()}/{t('myListingsPage.labels.day')}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FaTag className="h-3 w-3 text-blue-500" />
                              {t('myListingsPage.labels.category')}:
                            </span>
                            <span className="truncate">
                              <HighlightText text={product.category?.name || t('myListingsPage.labels.unknown')} searchTerm={searchTerm} />
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FaViews className="h-3 w-3 text-purple-500" />
                              {t('myListingsPage.labels.views')}:
                            </span>
                            <span>{product.view_count || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <FaBox className="h-3 w-3 text-orange-500" />
                              {t('myListingsPage.labels.quantity')}:
                            </span>
                            <span className={`font-medium ${
                              (product.quantity_available || 0) > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {product.quantity_available || 0}/{product.quantity || 1}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Link to={ROUTE_PATHS.EDIT_PRODUCT.replace(':productId', String(product.id))}>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              <FaEdit className="h-4 w-4" />
                              {t('myListingsPage.actions.edit')}
                            </motion.button>
                          </Link>
                          <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDelete(product.id, product.title)}
                            className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-2"
                          >
                            <FaTrash className="h-4 w-4" />
                            {t('myListingsPage.actions.delete')}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                <AnimatePresence>
                  {displayProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ x: 4, scale: 1.01 }}
                      className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group overflow-hidden"
                    >
                      <div className="flex flex-col lg:flex-row">
                        {/* Product Image */}
                        <div className="w-full lg:w-64 h-48 lg:h-auto flex-shrink-0 relative">
                          <img 
                            src={product.images?.find(img => img.is_primary)?.image_url || product.images?.[0]?.image_url || 'https://picsum.photos/400/225?grayscale'} 
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 right-3 flex flex-col gap-2">
                            {product.availability_status && (
                              <StatusBadge status={product.availability_status} type="availability" />
                            )}
                            {product.admin_approval_status && (
                              <StatusBadge status={product.admin_approval_status} type="admin" />
                            )}
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-grow p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between h-full">
                            <div className="flex-grow">
                              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                                <HighlightText text={product.title} searchTerm={searchTerm} />
                              </h3>

                              {/* Product Info Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaMoneyBillWave className="h-3 w-3 text-green-500" />
                                    {t('myListingsPage.labels.price')}:
                                  </span>
                                  <span className="font-bold text-green-600">฿{product.rental_price_per_day?.toLocaleString()}/{t('myListingsPage.labels.day')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaViews className="h-3 w-3 text-purple-500" />
                                    {t('myListingsPage.labels.views')}:
                                  </span>
                                  <span>{product.view_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaTag className="h-3 w-3 text-blue-500" />
                                    {t('myListingsPage.labels.category')}:
                                  </span>
                                  <span className="truncate">
                                    <HighlightText text={product.category?.name || t('myListingsPage.labels.unknown')} searchTerm={searchTerm} />
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaMapMarkerAlt className="h-3 w-3 text-red-500" />
                                    {t('myListingsPage.labels.location')}:
                                  </span>
                                  <span className="truncate">
                                    <HighlightText text={product.province?.name_th || t('myListingsPage.labels.unknown')} searchTerm={searchTerm} />
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 font-medium">
                                    <FaCalendarAlt className="h-3 w-3 text-gray-500" />
                                    {t('myListingsPage.labels.created')}:
                                  </span>
                                  <span>{product.created_at ? new Date(product.created_at).toLocaleDateString() : t('myListingsPage.labels.unknown')}</span>
                                </div>
                              </div>

                              {/* Show description if it matches search */}
                              {product.description && searchTerm.trim() && 
                               product.description.toLowerCase().includes(searchTerm.toLowerCase()) && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                                  <strong className="text-gray-700">{t('myListingsPage.labels.description')}:</strong>
                                  <div className="mt-1 text-gray-600">
                                    <HighlightText text={product.description} searchTerm={searchTerm} />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col gap-3 min-w-[200px]">
                              <Link to={ROUTE_PATHS.EDIT_PRODUCT.replace(':productId', String(product.id))}>
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                  <FaEdit className="h-4 w-4" />
                                  {t('myListingsPage.actions.edit')}
                                </motion.button>
                              </Link>
                              
                              <select 
                                value={product.availability_status || ''} 
                                onChange={(e) => handleChangeStatus(product.id, e.target.value as ProductAvailabilityStatus)}
                                className="px-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all"
                              >
                                <option value="available">{t('myListingsPage.status.available')}</option>
                                <option value="unavailable">{t('myListingsPage.status.unavailable')}</option>
                                <option value="hidden">{t('myListingsPage.status.hidden')}</option>
                              </select>
                              
                              <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleDelete(product.id, product.title)}
                                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center gap-2"
                              >
                                <FaTrash className="h-4 w-4" />
                                {t('myListingsPage.actions.delete')}
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination - Only show if not searching */}
            {!searchTerm.trim() && listingsResponse && listingsResponse.meta.last_page > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex justify-center"
              >
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  {listingsResponse.meta.current_page > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(listingsResponse.meta.current_page - 1)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      {t('myListingsPage.pagination.previous')}
                    </motion.button>
                  )}

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, listingsResponse.meta.last_page) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                          page === listingsResponse.meta.current_page 
                            ? 'bg-blue-500 text-white shadow-lg' 
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </motion.button>
                    );
                  })}

                  {/* Next Button */}
                  {listingsResponse.meta.current_page < listingsResponse.meta.last_page && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePageChange(listingsResponse.meta.current_page + 1)}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
                    >
                      {t('myListingsPage.pagination.next')}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* No Results */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-6">
                <FaBox className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {hasNoSearchResults 
                  ? t('myListingsPage.noSearchResults', { term: searchTerm })
                  : t('myListingsPage.noListingsFound')
                }
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                {hasNoSearchResults 
                  ? t('myListingsPage.searchSuggestions')
                  : t('myListingsPage.createFirstListing')
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(searchTerm || statusFilter || categoryFilter || provinceFilter || priceRangeFilter) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearFilters}
                    className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    {t('searchPage.clearFiltersButton')}
                  </motion.button>
                )}
                <Link to={ROUTE_PATHS.CREATE_PRODUCT}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 flex items-center gap-2"
                  >
                    <FaPlus className="h-4 w-4" />
                    {t('myListingsPage.addNewListing')}
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
