import React, { useEffect, useState } from 'react';
import { Product, ApiError } from '../../types';
import { getFeaturedProducts } from '../../services/productService';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (isAdmin) {
    return <Navigate to={ROUTE_PATHS.ADMIN_DASHBOARD} replace />;
  }

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);
      const response = await getFeaturedProducts(8);
      setFeaturedProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const apiError = err as ApiError;
      setProductsError(apiError.message || t('homePage.productsLoadError'));
      console.error('Error fetching featured products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`${ROUTE_PATHS.SEARCH_PRODUCTS}?q=${searchTerm}`);
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, [t, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-12 rounded-lg shadow-xl mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('homePage.heroTitle')}</h1>
        <p className="text-lg md:text-xl mb-8">{t('homePage.heroSubtitle')}</p>
        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex">
          <input 
            type="search" 
            placeholder={t('homePage.searchInputPlaceholder')}
            className="flex-grow p-4 rounded-l-lg text-gray-800 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-yellow-400 text-gray-900 font-bold p-4 rounded-r-lg hover:bg-yellow-500 transition-colors"
          >
            {t('general.search')}
          </button>
        </form>
      </div>

      
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-semibold text-gray-800">{t('homePage.popularRentalsTitle')}</h2>
          <Link to={ROUTE_PATHS.SEARCH_PRODUCTS} className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
            {t('homePage.viewAllLink')} <ChevronRightIcon/>
          </Link>
        </div>
        {isLoadingProducts ? (
          <LoadingSpinner message={t('homePage.loadingProducts')} />
        ) : productsError ? (
          <div className="text-center py-8">
            <ErrorMessage message={productsError} title={t('general.error')} />
            <Button 
              variant="primary" 
              onClick={fetchFeaturedProducts}
              className="mt-4"
            >
              {t('general.retry')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.isArray(featuredProducts) && featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {(!Array.isArray(featuredProducts) || featuredProducts.length === 0) && !isLoadingProducts && !productsError && (
          <p className="text-center text-gray-500 py-10">{t('homePage.noFeaturedProducts')}</p>
        )}
      </section>
    </div>
  );
};
