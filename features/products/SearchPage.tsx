import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category, Province, ProductSearchParams } from '../../types';
import { getCategories, getProvinces, searchProducts } from '../../services/productService';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaSort, 
  FaMapMarkerAlt, 
  FaTag, 
  FaDollarSign,
  FaBoxOpen,
  FaChevronLeft,
  FaChevronRight,
  FaTh,
  FaList
} from 'react-icons/fa';

const FilterIcon = () => <FaFilter className="h-5 w-5 mr-2" />;
const ClearIcon = () => <FaTimes className="h-5 w-5 mr-2" />;

export const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [filters, setFilters] = useState<ProductSearchParams>({
    q: searchParams.get('q') || '',
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
    province_ids: searchParams.get('province_ids') || '',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    sort: searchParams.get('sort') || 'created_at_desc',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<number>(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(12);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.q) count++;
    if (filters.category_id) count++;
    if (filters.province_ids) count++;
    if (filters.min_price) count++;
    if (filters.max_price) count++;
    if (filters.sort !== 'created_at_desc') count++;
    setActiveFilters(count);
  }, [filters]);

  // Fetch categories, provinces, and products (pagination)
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [cats, provs] = await Promise.all([
          getCategories(),
          getProvinces()
        ]);
        setCategories(cats.data);
        setProvinces(provs.data);
      } catch (err) {
        setError('Failed to load categories or provinces.');
        setCategories([]);
        setProvinces([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch products with filters & pagination
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = { ...filters, limit: itemsPerPage };
        const response = await searchProducts(params);
        setProducts(response.data);
        setTotalPages(response.meta.last_page);
        setTotalItems(response.meta.total);
      } catch (err: any) {
        setError(err.message || 'Failed to load products.');
        setProducts([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [filters, itemsPerPage]);

  const handleFilterChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | undefined = value;
    if (type === 'number') {
      processedValue = value === '' ? undefined : Number(value);
    }
    setFilters(prev => ({ ...prev, [name]: processedValue, page: 1 }));
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newSearchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        newSearchParams.set(key, String(value));
      }
    });
    setSearchParams(newSearchParams);
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', String(newPage));
    setSearchParams(newSearchParams);
  };

  const handleClearFilters = () => {
    setFilters({
      q: '',
      category_id: undefined,
      province_ids: '',
      min_price: undefined,
      max_price: undefined,
      sort: 'created_at_desc',
      page: 1
    });
    setSearchParams(new URLSearchParams());
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('searchPage.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('searchPage.foundProductsInfo', { 
                  count: totalItems,
                  currentPage: filters.page || 1,
                  lastPage: totalPages
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaTh className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaList className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="md:hidden flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FilterIcon />
                {t('searchPage.filtersTitle')}
                {activeFilters > 0 && (
                  <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-1 text-xs font-bold">
                    {activeFilters}
                  </span>
                )}
              </button>

              {/* Active Filters Display */}
              {activeFilters > 0 && (
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {t('searchPage.activeFilters', { count: activeFilters })}
                  </span>
                  <Button
                    onClick={handleClearFilters}
                    variant="ghost"
                    size="sm"
                    className="flex items-center bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <ClearIcon />
                    {t('searchPage.clearFiltersButton')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <motion.aside 
            className={`lg:col-span-1 ${isFilterOpen ? 'block' : 'hidden lg:block'}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-8">
              <form onSubmit={handleSearchSubmit} className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                    <FilterIcon />
                    {t('searchPage.filtersTitle')}
                  </h3>
                  {activeFilters > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs font-bold rounded-full px-2 py-1">
                      {activeFilters}
                    </span>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    name="q"
                    placeholder={t('searchPage.keywordPlaceholder')}
                    value={filters.q || ''}
                    onChange={handleFilterChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaTag className="h-4 w-4 mr-2 text-blue-500" />
                    {t('searchPage.categoryLabel')}
                  </label>
                  <select 
                    name="category_id" 
                    value={filters.category_id || ''} 
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t('searchPage.allCategoriesOption')}</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Province Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaMapMarkerAlt className="h-4 w-4 mr-2 text-green-500" />
                    {t('searchPage.provinceLabel')}
                  </label>
                  <select 
                    name="province_ids" 
                    value={filters.province_ids || ''} 
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">{t('searchPage.allProvincesOption')}</option>
                    {provinces.map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.name_th}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaDollarSign className="h-4 w-4 mr-2 text-yellow-500" />
                    {t('searchPage.priceRangeLabel')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="number" 
                      name="min_price" 
                      placeholder={t('searchPage.minPricePlaceholder')} 
                      value={filters.min_price || ''} 
                      onChange={handleFilterChange} 
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <input 
                      type="number" 
                      name="max_price" 
                      placeholder={t('searchPage.maxPricePlaceholder')} 
                      value={filters.max_price || ''} 
                      onChange={handleFilterChange} 
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <FaSort className="h-4 w-4 mr-2 text-purple-500" />
                    {t('searchPage.sortByLabel')}
                  </label>
                  <select 
                    name="sort" 
                    value={filters.sort || 'created_at_desc'}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="created_at_desc">{t('searchPage.sortNewest')}</option>
                    <option value="created_at_asc">{t('searchPage.sortOldest')}</option>
                    <option value="price_asc">{t('searchPage.sortPriceAsc')}</option>
                    <option value="price_desc">{t('searchPage.sortPriceDesc')}</option>
                    <option value="rating_desc">{t('searchPage.sortRatingHighToLow')}</option>
                    <option value="rating_asc">{t('searchPage.sortRatingLowToHigh')}</option>
                    <option value="views_desc">{t('searchPage.sortMostViewed')}</option>
                    <option value="views_asc">{t('searchPage.sortLeastViewed')}</option>
                    <option value="updated_at_desc">{t('searchPage.sortRecentlyUpdated')}</option>
                    <option value="updated_at_asc">{t('searchPage.sortLeastRecentlyUpdated')}</option>
                  </select>
                </div>

                {/* Apply Filters Button */}
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105"
                >
                  <FaSearch className="h-4 w-4 mr-2" />
                  {t('searchPage.applyFiltersButton')}
                </Button>
              </form>
            </div>
          </motion.aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {isLoading && (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner message={t('searchPage.loadingProducts')} />
              </div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ErrorMessage message={error} title={t('general.error')} />
              </motion.div>
            )}
            
            {!isLoading && !error && (
              <AnimatePresence mode="wait">
                {products.length > 0 ? (
                  <motion.div
                    key="products"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`grid gap-6 ${
                      viewMode === 'grid' 
                        ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' 
                        : 'grid-cols-1'
                    }`}>
                      {products.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          whileHover={{ y: -5 }}
                        >
                          <ProductCard product={product} viewMode={viewMode} />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-products"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="text-center py-20 bg-white rounded-2xl shadow-lg border border-gray-100"
                  >
                    <FaBoxOpen className="mx-auto text-6xl text-gray-300 mb-6" />
                    <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                      {t('searchPage.noProductsFoundTitle')}
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {t('searchPage.noProductsFoundSubtitle')}
                    </p>
                    <Button
                      onClick={handleClearFilters}
                      variant="primary"
                      className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {t('searchPage.clearFiltersButton')}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Pagination */}
            {totalPages > 1 && !isLoading && !error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-12 flex justify-center items-center space-x-2"
              >
                <Button 
                  onClick={() => handlePageChange((filters.page || 1) - 1)}
                  disabled={(filters.page || 1) === 1}
                  variant="secondary"
                  size="sm"
                  className="flex items-center px-4 py-2 rounded-xl"
                >
                  <FaChevronLeft className="h-4 w-4 mr-1" />
                  {t('searchPage.previousPageButton')}
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(pageNumber => 
                    pageNumber === 1 || 
                    pageNumber === totalPages ||
                    (pageNumber >= (filters.page || 1) - 1 && pageNumber <= (filters.page || 1) + 1)
                  )
                  .map((pageNumber, index, arr) => (
                    <React.Fragment key={pageNumber}>
                      {index > 0 && arr[index-1] + 1 < pageNumber && (
                        <span className="text-gray-400 px-2">...</span>
                      )}
                      <Button
                        onClick={() => handlePageChange(pageNumber)}
                        variant={pageNumber === (filters.page || 1) ? 'primary' : 'ghost'}
                        size="sm"
                        className={`w-12 h-12 rounded-xl ${
                          pageNumber === (filters.page || 1) 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </Button>
                    </React.Fragment>
                  ))
                }
                
                <Button 
                  onClick={() => handlePageChange((filters.page || 1) + 1)}
                  disabled={(filters.page || 1) === totalPages}
                  variant="secondary"
                  size="sm"
                  className="flex items-center px-4 py-2 rounded-xl"
                >
                  {t('searchPage.nextPageButton')}
                  <FaChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

