import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { getOwnerListings, updateProductStatus, deleteProduct } from '../../services/ownerService';
import { Product, ApiError, PaginatedResponse, ProductAvailabilityStatus, } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { InputField } from '../../components/ui/InputField';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';

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

// Enhanced Icons with better styling
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);



const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
  </svg>
);

const GridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

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

  const getStatusText = () => {
    if (type === 'availability') {
      return t(`myListingsPage.status.${status.toLowerCase()}`);
    } else {
      return t(`myListingsPage.adminStatus.${status.toLowerCase()}`);
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}>
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
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('myListingsPage.title')}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {t('myListingsPage.subtitle')}
              </p>
            </div>
        <Link to={ROUTE_PATHS.CREATE_PRODUCT}>
              <Button variant="primary" className="w-full sm:w-auto">
                <PlusIcon />
                <span className="ml-2">{t('myListingsPage.addNewListing')}</span>
              </Button>
        </Link>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="space-y-6">
            {/* Search and Filter Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
              {/* Search Input */}
              <div className="lg:col-span-2">
                <InputField
                  label={t('general.search')}
            type="text" 
            placeholder={t('myListingsPage.searchPlaceholder')} 
            value={searchTerm} 
                  onChange={handleSearchChange}
                  icon={<SearchIcon />}
                  className="mb-0"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('myListingsPage.filterByStatus')}
                </label>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('myListingsPage.labels.category')}
                </label>
                <select
                  value={categoryFilter}
                  onChange={handleCategoryFilterChange}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('myListingsPage.allCategories')}</option>
                  {getUniqueCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Province Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('myListingsPage.labels.location')}
                </label>
                <select
                  value={provinceFilter}
                  onChange={handleProvinceFilterChange}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('myListingsPage.allProvinces')}</option>
                  {getUniqueProvinces().map(province => (
                    <option key={province} value={province}>{province}</option>
                  ))}
           </select>
      </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('myListingsPage.labels.price')}
                </label>
                <select
                  value={priceRangeFilter}
                  onChange={handlePriceRangeFilterChange}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t('myListingsPage.allPrices')}</option>
                  <option value="0-100">฿0 - ฿100</option>
                  <option value="100-500">฿100 - ฿500</option>
                  <option value="500-1000">฿500 - ฿1,000</option>
                  <option value="1000-5000">฿1,000 - ฿5,000</option>
                  <option value="5000-">฿5,000+</option>
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ClearIcon />
                  <span className="ml-1">{t('myListingsPage.clearFiltersButton')}</span>
                </button>
                
                {(searchTerm || statusFilter || categoryFilter || provinceFilter || priceRangeFilter) && (
                  <span className="text-sm text-gray-500">
                    {t('myListingsPage.activeFilters', { 
                      count: [searchTerm, statusFilter, categoryFilter, provinceFilter, priceRangeFilter].filter(Boolean).length 
                    })}
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">{t('myListingsPage.viewMode')}:</span>
                <div className="flex border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <ListIcon />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <GridIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        {displayProducts.length > 0 ? (
        <div className="space-y-6">
            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayProducts.map(product => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                    {/* Product Image */}
                    <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-t-lg">
                      <img 
                        src={product.images?.find(img => img.is_primary)?.image_url || product.images?.[0]?.image_url || 'https://picsum.photos/400/225?grayscale'} 
                alt={product.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    {/* Product Info */}
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                        <HighlightText text={product.title} searchTerm={searchTerm} />
                      </h3>
                      
                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {product.availability_status && (
                          <StatusBadge status={product.availability_status} type="availability" />
                        )}
                        {product.admin_approval_status && (
                          <StatusBadge status={product.admin_approval_status} type="admin" />
                        )}
                      </div>

                      {/* Quick Info */}
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                          <span>{t('myListingsPage.labels.price')}:</span>
                          <span className="font-semibold text-blue-600">฿{product.rental_price_per_day?.toLocaleString()}/{t('myListingsPage.labels.day')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{t('myListingsPage.labels.category')}:</span>
                          <span className="truncate">
                            <HighlightText text={product.category?.name || t('myListingsPage.labels.unknown')} searchTerm={searchTerm} />
                          </span>
                  </div>
                        <div className="flex justify-between">
                          <span>{t('myListingsPage.labels.views')}:</span>
                          <span>{product.view_count || 0}</span>
                  </div>
                </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link to={ROUTE_PATHS.EDIT_PRODUCT.replace(':productId', String(product.id))} className="flex-1">
                          <Button size="sm" variant="outline" className="w-full">
                            {t('myListingsPage.actions.edit')}
                          </Button>
                  </Link>
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => handleDelete(product.id, product.title)}
                          className="flex-1"
                        >
                          {t('myListingsPage.actions.delete')}
                        </Button>
                </div>
              </CardContent>
            </Card>
          ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {displayProducts.map(product => (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-200">
                    <div className="flex flex-col lg:flex-row">
                      {/* Product Image */}
                      <div className="w-full lg:w-64 h-48 lg:h-auto flex-shrink-0">
                        <img 
                          src={product.images?.find(img => img.is_primary)?.image_url || product.images?.[0]?.image_url || 'https://picsum.photos/400/225?grayscale'} 
                          alt={product.title}
                          className="w-full h-full object-cover rounded-t-lg lg:rounded-l-lg lg:rounded-t-none"
                        />
                      </div>

                      {/* Product Details */}
                      <CardContent className="flex-grow p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-grow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-3">
                              <HighlightText text={product.title} searchTerm={searchTerm} />
                            </h3>
                            
                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {product.availability_status && (
                                <StatusBadge status={product.availability_status} type="availability" />
                              )}
                              {product.admin_approval_status && (
                                <StatusBadge status={product.admin_approval_status} type="admin" />
                              )}
                            </div>

                            {/* Product Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex justify-between">
                                <span className="font-medium">{t('myListingsPage.labels.price')}:</span>
                                <span className="font-semibold text-blue-600">฿{product.rental_price_per_day?.toLocaleString()}/{t('myListingsPage.labels.day')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">{t('myListingsPage.labels.views')}:</span>
                                <span>{product.view_count || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">{t('myListingsPage.labels.category')}:</span>
                                <span className="truncate">
                                  <HighlightText text={product.category?.name || t('myListingsPage.labels.unknown')} searchTerm={searchTerm} />
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">{t('myListingsPage.labels.location')}:</span>
                                <span className="truncate">
                                  <HighlightText text={product.province?.name_th || t('myListingsPage.labels.unknown')} searchTerm={searchTerm} />
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium">{t('myListingsPage.labels.created')}:</span>
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
                          <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col gap-2 min-w-[200px]">
                            <Link to={ROUTE_PATHS.EDIT_PRODUCT.replace(':productId', String(product.id))}>
                              <Button variant="outline" className="w-full">
                                {t('myListingsPage.actions.edit')}
                              </Button>
                            </Link>
                            
                            <select 
                              value={product.availability_status || ''} 
                              onChange={(e) => handleChangeStatus(product.id, e.target.value as ProductAvailabilityStatus)}
                              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="available">{t('myListingsPage.status.available')}</option>
                              <option value="unavailable">{t('myListingsPage.status.unavailable')}</option>
                              <option value="hidden">{t('myListingsPage.status.hidden')}</option>
                            </select>
                            
                            <Button 
                              variant="danger" 
                              onClick={() => handleDelete(product.id, product.title)}
                              className="w-full"
                            >
                              {t('myListingsPage.actions.delete')}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination - Only show if not searching */}
            {!searchTerm.trim() && listingsResponse && listingsResponse.meta.last_page > 1 && (
                <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  {/* Previous Button */}
                  {listingsResponse.meta.current_page > 1 && (
                    <Button 
                      onClick={() => handlePageChange(listingsResponse.meta.current_page - 1)}
                      variant="ghost"
                      size="sm"
                    >
                      {t('myListingsPage.pagination.previous')}
                    </Button>
                  )}

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(5, listingsResponse.meta.last_page) }, (_, i) => {
                    const page = i + 1;
                    return (
                        <Button 
                            key={page}
                        onClick={() => handlePageChange(page)}
                            variant={page === listingsResponse.meta.current_page ? 'primary' : 'ghost'}
                            size="sm"
                        >
                            {page}
                        </Button>
                    );
                  })}

                  {/* Next Button */}
                  {listingsResponse.meta.current_page < listingsResponse.meta.last_page && (
                    <Button 
                      onClick={() => handlePageChange(listingsResponse.meta.current_page + 1)}
                      variant="ghost"
                      size="sm"
                    >
                      {t('myListingsPage.pagination.next')}
                    </Button>
                  )}
                </div>
                </div>
            )}
        </div>
      ) : (
          /* No Results */
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="text-gray-400 mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {hasNoSearchResults 
                  ? t('myListingsPage.noSearchResults', { term: searchTerm })
                  : t('myListingsPage.noListingsFound')
                }
              </h3>
              <p className="text-gray-500 mb-6">
                {hasNoSearchResults 
                  ? t('myListingsPage.searchSuggestions')
                  : t('myListingsPage.createFirstListing')
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {(searchTerm || statusFilter || categoryFilter || provinceFilter || priceRangeFilter) && (
                  <Button onClick={clearFilters} variant="outline">
                    {t('searchPage.clearFiltersButton')}
                  </Button>
                )}
                <Link to={ROUTE_PATHS.CREATE_PRODUCT}>
                  <Button variant="primary">
                    <PlusIcon />
                    <span className="ml-2">{t('myListingsPage.addNewListing')}</span>
                  </Button>
                </Link>
              </div>
            </div>
        </div>
      )}
      </div>
    </div>
  );
};
