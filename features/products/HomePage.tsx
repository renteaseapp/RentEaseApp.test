import React, { useEffect, useState } from 'react';
import { Product, ApiError } from '../../types';
import { getPopularProducts } from '../../services/productService';
import { ProductCard } from './ProductCard';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaSearch, 
  FaBoxOpen, 
  FaTags, 
  FaShieldAlt, 
  FaCheckCircle, 
  FaHeadset, 
  FaUserPlus, 
  FaListOl, 
  FaTruck, 
  FaUndo,
  FaArrowRight
} from 'react-icons/fa';
import { motion } from 'framer-motion';

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (isAdmin) {
    return <Navigate to={ROUTE_PATHS.ADMIN_DASHBOARD} replace />;
  }

  const fetchPopularProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setProductsError(null);
      const response = await getPopularProducts(8);
      setPopularProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const apiError = err as ApiError;
      setProductsError(apiError.message || t('homePage.productsLoadError'));
      console.error('Error fetching popular products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`${ROUTE_PATHS.SEARCH_PRODUCTS}?q=${searchTerm}`);
  };

  useEffect(() => {
    fetchPopularProducts();
  }, [t, navigate]);

  const howItWorks = [
    { icon: <FaSearch className="text-blue-500 text-2xl" />, title: t('homePage.steps.search.title'), desc: t('homePage.steps.search.desc') },
    { icon: <FaListOl className="text-green-500 text-2xl" />, title: t('homePage.steps.book.title'), desc: t('homePage.steps.book.desc') },
    { icon: <FaTruck className="text-yellow-500 text-2xl" />, title: t('homePage.steps.receive.title'), desc: t('homePage.steps.receive.desc') },
    { icon: <FaUndo className="text-purple-500 text-2xl" />, title: t('homePage.steps.return.title'), desc: t('homePage.steps.return.desc') },
  ];

  const features = [
    { icon: <FaTags className="text-blue-500 text-xl" />, text: t('homePage.features.goodPrice') },
    { icon: <FaShieldAlt className="text-green-500 text-xl" />, text: t('homePage.features.safe') },
    { icon: <FaCheckCircle className="text-yellow-500 text-xl" />, text: t('homePage.features.variety') },
    { icon: <FaHeadset className="text-purple-500 text-xl" />, text: t('homePage.features.support') },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-95"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              {t('homePage.heroTitle')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10"
            >
              {t('homePage.heroSubtitle')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              <form onSubmit={handleSearch} className="flex shadow-xl rounded-lg overflow-hidden">
                <input 
                  type="search" 
                  placeholder={t('homePage.searchInputPlaceholder')}
                  className="flex-grow p-4 text-gray-800 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="bg-yellow-400 hover:bg-yellow-500 transition-colors text-gray-900 font-semibold px-6 flex items-center gap-2"
                >
                  <FaSearch /> {t('general.search')}
                </button>
              </form>
            </motion.div>
            
            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
            >
              <Link
                to={ROUTE_PATHS.SEARCH_PRODUCTS}
                className="bg-white text-blue-600 hover:bg-gray-100 transition-colors font-semibold px-8 py-3 rounded-lg shadow-lg flex items-center justify-center gap-2"
              >
                <FaBoxOpen /> {t('homePage.buttons.rentItem')}
              </Link>
              <Link
                to={ROUTE_PATHS.MY_LISTINGS}
                className="bg-yellow-400 hover:bg-yellow-500 transition-colors text-gray-900 font-semibold px-8 py-3 rounded-lg shadow-lg flex items-center justify-center gap-2"
              >
                <FaListOl /> {t('homePage.buttons.lendItem')}
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-white shadow-md mr-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{feature.text}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t('homePage.popularRentalsTitle')}
            </h2>
            <Link 
              to={ROUTE_PATHS.SEARCH_PRODUCTS} 
              className="text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors"
            >
              {t('homePage.viewAllLink')} <FaArrowRight className="ml-2" />
            </Link>
          </div>

          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm h-96 animate-pulse"></div>
              ))}
            </div>
          ) : productsError ? (
            <div className="text-center py-12">
              <ErrorMessage message={productsError} title={t('general.error')} />
              <Button 
                variant="primary" 
                onClick={fetchPopularProducts}
                className="mt-6"
              >
                {t('general.retry')}
              </Button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } }
              }}
            >
              {Array.isArray(popularProducts) && popularProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -10 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {(!Array.isArray(popularProducts) || popularProducts.length === 0) && !isLoadingProducts && !productsError && (
            <div className="text-center py-16">
              <FaBoxOpen className="mx-auto text-5xl text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-500">{t('homePage.noFeaturedProducts')}</h3>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-16">
            {t('homePage.howItWorksTitle')}
          </h2>
          
          <div className="relative">
            <div className="hidden lg:block absolute left-0 right-0 top-1/2 h-1 bg-gradient-to-r from-blue-500 via-green-500 to-purple-500 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-4">
              {howItWorks.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative bg-white lg:bg-transparent z-10"
                >
                  <div className="flex flex-col items-center text-center p-6">
                    <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center mb-6">
                      {step.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-8 md:p-12 inline-block"
            >
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {t('homePage.signUpFreeTitle')}
              </h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                {t('homePage.signUpFreeSubtitle')}
              </p>
              <Link 
                to={ROUTE_PATHS.REGISTER} 
                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg transition-all"
              >
                <FaUserPlus className="mr-2" />
                {t('homePage.signUpButton')}
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};