import React, { useEffect, useState, ChangeEvent, FormEvent, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category, Province, ProductSearchParams } from '../../types';
import { getCategories, getProvinces, searchProducts, searchProductsByLocation } from '../../services/productService';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaMapMarkerAlt, 
  FaDollarSign,
  FaBoxOpen,
  FaChevronLeft,
  FaChevronRight,
  FaTh,
  FaList
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const FilterIcon = () => <FaFilter className="h-5 w-5 mr-2" />;
const ClearIcon = () => <FaTimes className="h-5 w-5 mr-2" />;

export const SearchPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [nearMe, setNearMe] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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
  
  // Ref to track if we need to update filters to avoid infinite loops
  const shouldUpdateFilters = useRef(true);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('เบราว์เซอร์ของคุณไม่รองรับการระบุตำแหน่ง');
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setNearMe(true);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('คุณปฏิเสธการเข้าถึงตำแหน่ง กรุณาเปิดใช้งานการเข้าถึงตำแหน่งในเบราว์เซอร์ของคุณ');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('ไม่สามารถระบุตำแหน่งของคุณได้');
            break;
          case error.TIMEOUT:
            setLocationError('หมดเวลาการเชื่อมต่อในการระบุตำแหน่ง');
            break;
          default:
            setLocationError('เกิดข้อผิดพลาดในการระบุตำแหน่ง');
            break;
        }
      }
    );
  };

  // Near Me functionality with GPS
  useEffect(() => {
    if (nearMe && userLocation) {
      // When using GPS, we'll search by coordinates
      const fetchProductsByLocation = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const params = { ...filters, limit: itemsPerPage };
          const response = await searchProductsByLocation(userLocation.lat, userLocation.lng, 50, params);
          setProducts(response.data);
          setTotalPages(response.meta.last_page);
          setTotalItems(response.meta.total);
        } catch (err: any) {
          setError(err.message || 'ไม่สามารถโหลดสินค้าได้');
          setProducts([]);
          setTotalPages(1);
          setTotalItems(0);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProductsByLocation();
    } else if (nearMe && user?.province_id) {
      // Use province from user profile
      if (shouldUpdateFilters.current) {
        setFilters((prev: ProductSearchParams) => {
          // Only update if the province_ids is not already set to user's province
          if (prev.province_ids !== String(user.province_id)) {
            return { ...prev, province_ids: String(user.province_id), page: 1 };
          }
          return prev;
        });
      }
    } else if (!nearMe) {
      // เมื่อปิด Near Me ให้เคลียร์ province_ids ที่อาจถูกตั้งจากการใช้ Near Me
      if (shouldUpdateFilters.current) {
        setFilters((prev: ProductSearchParams) => {
          // ถ้าผู้ใช้มี province_id และ province_ids ถูกตั้งเป็นค่าเดียวกันกับ province ของผู้ใช้
          // ให้เคลียร์ province_ids เพราะมันถูกตั้งจากการใช้ Near Me
          const myProv = user?.province_id ? String(user.province_id) : undefined;
          if (myProv && prev.province_ids === myProv) {
            return { ...prev, province_ids: '', page: 1 };
          }
          return prev;
        });
      }
      // Reset the flag after handling
      shouldUpdateFilters.current = true;
    }
  }, [nearMe, user?.province_id, userLocation, filters, itemsPerPage]);

  // Fetch products with filters & pagination (for non-location searches)
  useEffect(() => {
    // Skip this effect if we're using location-based search
    if (nearMe && userLocation) {
      return;
    }
    
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
        setError(err.message || 'ไม่สามารถโหลดสินค้าได้');
        setProducts([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [filters, itemsPerPage]);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.q) count++;
    if (filters.category_id) count++;
    if (filters.province_ids) count++;
    if (filters.min_price) count++;
    if (filters.max_price) count++;
    if (filters.sort !== 'created_at_desc') count++;
    // Add location filter to count if active
    if (nearMe) count++;
    setActiveFilters(count);
  }, [filters, nearMe]);

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
        setError('ไม่สามารถโหลดหมวดหมู่หรือจังหวัดได้');
        setCategories([]);
        setProvinces([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, []);

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
    setNearMe(false);
    setUserLocation(null);
    setLocationError(null);
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
                ค้นหาสินค้า
              </h1>
              <p className="text-gray-600 mt-1">
                พบ {totalItems} สินค้า หน้า {filters.page || 1} จาก {totalPages} หน้า
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Near Me Toggle */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (nearMe) {
                      // If already active, turn it off
                      setNearMe(false);
                      setUserLocation(null);
                      setLocationError(null);
                      // Allow filter updates when turning off Near Me
                      shouldUpdateFilters.current = true;
                    } else {
                      // Try to get current location
                      getCurrentLocation();
                      // Prevent filter updates when turning on Near Me
                      shouldUpdateFilters.current = false;
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    nearMe
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FaMapMarkerAlt className="h-4 w-4" />
                  ใกล้ฉัน
                </button>
                {locationError && (
                  <div className="absolute -bottom-12 left-0 bg-red-100 border border-red-300 text-red-800 text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10">
                    {locationError}
                  </div>
                )}
                {userLocation && (
                  <div className="absolute -bottom-8 left-0 bg-green-100 border border-green-300 text-green-800 text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10">
                  ใช้ตำแหน่งปัจจุบัน
                  </div>
                )}
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex rounded-xl bg-gray-100 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaTh className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FaList className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:w-80 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden'} lg:block`}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-24"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FilterIcon />
                  ตัวกรอง
                </h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <FaTimes className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit}>
                {/* Active Location Filter Indicator */}
                {nearMe && userLocation && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        ใกล้ฉัน
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNearMe(false);
                        setUserLocation(null);
                        setLocationError(null);
                        shouldUpdateFilters.current = true;
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                {/* Search Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    คำค้นหา
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="q"
                      value={filters.q || ''}
                      onChange={handleFilterChange}
                      placeholder="ค้นหาสินค้า..."
                      className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    หมวดหมู่
                  </label>
                  <select
                    name="category_id"
                    value={filters.category_id || ''}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">หมวดหมู่ทั้งหมด</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Province Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    จังหวัด
                  </label>
                  <select
                    name="province_ids"
                    value={filters.province_ids || ''}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">จังหวัดทั้งหมด</option>
                    {provinces.map(province => (
                      <option key={province.id} value={province.id}>
                        {province.name_th}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ช่วงราคา
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        name="min_price"
                        value={filters.min_price || ''}
                        onChange={handleFilterChange}
                        placeholder="ราคาต่ำสุด"
                        className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        name="max_price"
                        value={filters.max_price || ''}
                        onChange={handleFilterChange}
                        placeholder="ราคาสูงสุด"
                        className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Sort */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    เรียงลำดับตาม
                  </label>
                  <select
                    name="sort"
                    value={filters.sort || 'created_at_desc'}
                    onChange={handleFilterChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="created_at_desc">ใหม่ล่าสุด</option>
                    <option value="price_asc">ราคาน้อยไปมาก</option>
                    <option value="price_desc">ราคามากไปน้อย</option>
                    <option value="rating_desc">คะแนนรีวิวสูงสุด</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  <Button type="submit" variant="primary" className="w-full py-3 rounded-xl">
                    <FaSearch className="h-4 w-4 mr-2" />
                    ใช้ตัวกรอง
                  </Button>
                  {activeFilters > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={handleClearFilters}
                      className="w-full py-3 rounded-xl border border-gray-200 hover:bg-gray-50"
                    >
                      <ClearIcon />
                      ล้างตัวกรอง ({activeFilters})
                    </Button>
                  )}
                </div>
              </form>
            </motion.div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-6">
              <Button 
                onClick={() => setIsFilterOpen(true)}
                variant="secondary"
                className="w-full py-3 rounded-xl flex items-center justify-center"
              >
                <FilterIcon />
                ตัวกรอง {activeFilters > 0 && `(${activeFilters})`}
              </Button>
            </div>

            {/* Loading & Error States */}
            {isLoading && <LoadingSpinner message="กำลังโหลดสินค้า..." />}
            {error && <ErrorMessage message={error} title="ข้อผิดพลาด" />}

            {/* Empty State */}
            {!isLoading && !error && products.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <FaBoxOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  ไม่พบสินค้า
                </h3>
                <p className="text-gray-600 mb-6">
                  ลองปรับตัวกรองหรือคำค้นหาเพื่อหาสินค้าที่ต้องการ
                </p>
                {activeFilters > 0 && (
                  <Button 
                    onClick={handleClearFilters}
                    variant="primary"
                    className="px-6 py-3 rounded-xl"
                  >
                    ล้างตัวกรองทั้งหมด
                  </Button>
                )}
              </motion.div>
            )}

            {/* Products Grid/List */}
            {!isLoading && !error && products.length > 0 && (
              <>
                <motion.div
                  layout
                  className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8' 
                    : 'flex flex-col gap-6 mb-8'
                  }
                >
                  <AnimatePresence>
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <ProductCard product={product} viewMode={viewMode} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 flex-wrap"
                  >
                    <Button 
                      onClick={() => handlePageChange((filters.page || 1) - 1)}
                      disabled={(filters.page || 1) === 1}
                      variant="secondary"
                      size="sm"
                      className="flex items-center px-4 py-2 rounded-xl"
                    >
                      <FaChevronLeft className="h-4 w-4 mr-1" />
                      หน้าก่อนหน้า
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
                      หน้าถัดไป
                      <FaChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;