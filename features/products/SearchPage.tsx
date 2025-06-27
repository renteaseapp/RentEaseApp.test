import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category, Province, ProductSearchParams } from '../../types';
import { getCategories, getProvinces } from '../../services/productService';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { useTranslation } from 'react-i18next';

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
    </svg>
);

const ClearIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const SearchPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  
  const [filters, setFilters] = useState<ProductSearchParams>({
    q: searchParams.get('q') || '',
    category_id: searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
    province_ids: searchParams.get('province_ids') || '',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    sort: searchParams.get('sort') || 'newest',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<number>(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.q) count++;
    if (filters.category_id) count++;
    if (filters.province_ids) count++;
    if (filters.min_price) count++;
    if (filters.max_price) count++;
    if (filters.sort !== 'newest') count++;
    setActiveFilters(count);
  }, [filters]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch categories and provinces
        const [cats, provs] = await Promise.all([
          getCategories(),
          getProvinces()
        ]);
        setCategories(cats.data);
        setProvinces(provs.data);

        // Fetch all products
        const response = await fetch('http://localhost:3001/api/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const responseData = await response.json();
        console.log('API Response:', responseData);

        // Check if response is successful and has data
        if (responseData.success && responseData.data && responseData.data.data) {
          const products = responseData.data.data;
          setProducts(products);
          setFilteredProducts(products);
          
          // Set pagination info if available
          if (responseData.data.meta) {
            setTotalPages(responseData.data.meta.last_page);
            setTotalItems(responseData.data.meta.total);
          }
        } else {
          console.warn('API response indicates failure or missing data:', responseData);
          setProducts([]);
          setFilteredProducts([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError("Failed to load data.");
        setCategories([]);
        setProvinces([]);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Apply filters whenever filters change
  useEffect(() => {
    if (!Array.isArray(products)) {
      setFilteredProducts([]);
      return;
    }

    let filtered = [...products];

    // Search by keyword
    if (filters.q) {
      const searchTerm = filters.q.toLowerCase();
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by category
    if (filters.category_id) {
      filtered = filtered.filter(product => product.category?.id === Number(filters.category_id));
    }

    // Filter by province
    if (filters.province_ids) {
      filtered = filtered.filter(product => product.province?.id === Number(filters.province_ids));
    }

    // Filter by price range
    if (filters.min_price !== undefined) {
      filtered = filtered.filter(product => product.rental_price_per_day >= filters.min_price!);
    }
    if (filters.max_price !== undefined) {
      filtered = filtered.filter(product => product.rental_price_per_day <= filters.max_price!);
    }

    // Sort products
    switch (filters.sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.rental_price_per_day - b.rental_price_per_day);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.rental_price_per_day - a.rental_price_per_day);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    // Apply pagination
    const itemsPerPage = 12;
    const startIndex = ((filters.page || 1) - 1) * itemsPerPage;
    const paginatedProducts = filtered.slice(startIndex, startIndex + itemsPerPage);
    setFilteredProducts(paginatedProducts);
    setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    setTotalItems(filtered.length);
  }, [filters, products]);

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
      sort: 'newest',
      page: 1
    });
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{t('searchPage.title')}</h1>
        {activeFilters > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {t('searchPage.activeFilters', { count: activeFilters })}
            </span>
            <Button
              onClick={handleClearFilters}
              variant="ghost"
              size="sm"
              className="flex items-center"
            >
              <ClearIcon />
              {t('searchPage.clearFiltersButton')}
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <form onSubmit={handleSearchSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-3 flex items-center">
              <FilterIcon /> {t('searchPage.filtersTitle')}
            </h3>
            <InputField
              label={t('searchPage.keywordLabel')}
              name="q"
              placeholder={t('searchPage.keywordPlaceholder')}
              value={filters.q || ''}
              onChange={handleFilterChange}
            />
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                {t('searchPage.categoryLabel')}
              </label>
              <select 
                name="category_id" 
                id="category_id"
                value={filters.category_id || ''} 
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">{t('searchPage.allCategoriesOption')}</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="province_ids" className="block text-sm font-medium text-gray-700 mb-1">
                {t('searchPage.provinceLabel')}
              </label>
              <select 
                name="province_ids" 
                id="province_ids"
                value={filters.province_ids || ''} 
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">{t('searchPage.allProvincesOption')}</option>
                {provinces.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.name_th}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <InputField 
                label={t('searchPage.minPriceLabel')} 
                name="min_price" 
                type="number" 
                placeholder={t('searchPage.minPricePlaceholder')} 
                value={filters.min_price || ''} 
                onChange={handleFilterChange} 
              />
              <InputField 
                label={t('searchPage.maxPriceLabel')} 
                name="max_price" 
                type="number" 
                placeholder={t('searchPage.maxPricePlaceholder')} 
                value={filters.max_price || ''} 
                onChange={handleFilterChange} 
              />
            </div>
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                {t('searchPage.sortByLabel')}
              </label>
              <select 
                name="sort" 
                id="sort"
                value={filters.sort || 'newest'} 
                onChange={handleFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="newest">{t('searchPage.sortNewest')}</option>
                <option value="price_asc">{t('searchPage.sortPriceAsc')}</option>
                <option value="price_desc">{t('searchPage.sortPriceDesc')}</option>
                <option value="rating">{t('searchPage.sortRating')}</option>
              </select>
            </div>
          </form>
        </aside>

        <main className="md:col-span-3">
          {isLoading && <LoadingSpinner message={t('searchPage.loadingProducts')} />}
          {error && <ErrorMessage message={error} title={t('general.error')} />}
          
          {!isLoading && !error && (
            <>
              <div className="mb-4 text-sm text-gray-600">
                {t('searchPage.foundProductsInfo', { 
                  count: totalItems,
                  currentPage: filters.page || 1,
                  lastPage: totalPages
                })}
              </div>
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {t('searchPage.noProductsFoundTitle')}
                  </h3>
                  <p className="text-gray-500">
                    {t('searchPage.noProductsFoundSubtitle')}
                  </p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center space-x-2">
                  <Button 
                    onClick={() => handlePageChange((filters.page || 1) - 1)}
                    disabled={(filters.page || 1) === 1}
                    variant="secondary"
                    size="sm"
                  >
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
                        {index > 0 && arr[index-1] + 1 < pageNumber && <span className="text-gray-500">...</span>}
                        <Button
                          onClick={() => handlePageChange(pageNumber)}
                          variant={pageNumber === (filters.page || 1) ? 'primary' : 'ghost'}
                          size="sm"
                          className="w-10 h-10"
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
                  >
                    {t('searchPage.nextPageButton')}
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

