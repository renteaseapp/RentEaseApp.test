import React, { useEffect, useState } from 'react';
import { Product, ApiError } from '../../types';
import { getPopularProducts } from '../../services/productService';
import { ProductCard } from './ProductCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { FaSearch, FaFire, FaChevronRight, FaBoxOpen, FaTags, FaShieldAlt, FaCheckCircle, FaHeadset, FaUserPlus, FaListOl, FaTruck, FaUndo } from 'react-icons/fa';
import { motion } from 'framer-motion';

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // ย้าย early return หลัง hook ทั้งหมด
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

  // ขั้นตอนการเช่า
  const howItWorks = [
    { icon: <FaSearch className="text-blue-500 text-3xl" />, title: t('homePage.steps.search.title'), desc: t('homePage.steps.search.desc') },
    { icon: <FaListOl className="text-green-500 text-3xl" />, title: t('homePage.steps.book.title'), desc: t('homePage.steps.book.desc') },
    { icon: <FaTruck className="text-yellow-500 text-3xl" />, title: t('homePage.steps.receive.title'), desc: t('homePage.steps.receive.desc') },
    { icon: <FaUndo className="text-pink-500 text-3xl" />, title: t('homePage.steps.return.title'), desc: t('homePage.steps.return.desc') },
  ];

  // จุดเด่น
  const whyUs = [
    { icon: <FaTags className="text-blue-500 text-2xl" />, text: t('homePage.features.goodPrice') },
    { icon: <FaShieldAlt className="text-green-500 text-2xl" />, text: t('homePage.features.safe') },
    { icon: <FaCheckCircle className="text-yellow-500 text-2xl" />, text: t('homePage.features.variety') },
    { icon: <FaHeadset className="text-pink-500 text-2xl" />, text: t('homePage.features.support') },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50 via-white to-pink-50">
      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="max-w-4xl mx-auto mt-10 mb-16 px-6 py-14 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl shadow-2xl text-center relative overflow-hidden flex flex-col items-center"
      >
        <FaBoxOpen className="absolute left-8 top-8 text-7xl text-yellow-300 opacity-20 animate-bounce-slow" />
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-lg flex justify-center items-center gap-3">
          <FaFire className="text-yellow-400 animate-pulse" />
          {t('homePage.heroTitle')}
        </h1>
        <p className="text-lg md:text-2xl mb-8 opacity-90 font-medium max-w-2xl mx-auto">
          {t('homePage.heroSubtitle')}
        </p>
        <form onSubmit={handleSearch} className="w-full max-w-xl mx-auto flex shadow-lg rounded-lg overflow-hidden bg-white">
          <span className="flex items-center px-3 text-gray-400">
            <FaSearch />
          </span>
          <input 
            type="search" 
            placeholder={t('homePage.searchInputPlaceholder')}
            className="flex-grow p-4 text-gray-800 focus:ring-2 focus:ring-yellow-400 focus:outline-none text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-yellow-400 hover:bg-yellow-500 transition-colors text-gray-900 font-bold px-6 flex items-center gap-2 text-lg"
          >
            <FaSearch /> {t('general.search')}
          </button>
        </form>
      </motion.div>

      {/* POPULAR PRODUCTS SECTION */}
      <section className="max-w-6xl mx-auto mb-20 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaFire className="text-red-500 animate-pulse" />
            {t('homePage.popularRentalsTitle')}
          </h2>
          <Link to={ROUTE_PATHS.SEARCH_PRODUCTS} className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-base gap-1">
            {t('homePage.viewAllLink')} <FaChevronRight/>
          </Link>
        </div>
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <motion.div key={i} className="bg-white rounded-2xl shadow-md h-64 animate-pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
            ))}
          </div>
        ) : productsError ? (
          <div className="text-center py-8">
            <ErrorMessage message={productsError} title={t('general.error')} />
            <Button 
              variant="primary" 
              onClick={fetchPopularProducts}
              className="mt-4"
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
              visible: { transition: { staggerChildren: 0.08 } }
            }}
          >
            {Array.isArray(popularProducts) && popularProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ scale: 1.04, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                className="relative"
              >
                {/* Badge อันดับ */}
                <span className="absolute -top-3 -left-3 bg-yellow-400 text-gray-900 font-bold rounded-full px-3 py-1 shadow text-xs flex items-center gap-1 z-10">
                  <FaFire className="text-red-500" /> {t('homePage.topBadge')} {idx + 1}
                </span>
                {/* Card สินค้า */}
                <ProductCard product={product} />
                {/* rental_count */}
                <span className="absolute bottom-3 right-3 bg-white/90 text-red-500 rounded-full px-3 py-1 text-xs flex items-center gap-1 shadow">
                  <FaFire className="text-red-500" /> {(product as any).rental_count || 0} {t('homePage.rentalCount')}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
        {(!Array.isArray(popularProducts) || popularProducts.length === 0) && !isLoadingProducts && !productsError && (
          <p className="text-center text-gray-500 py-10 flex flex-col items-center gap-2">
            <FaBoxOpen className="text-4xl mb-2" />
            {t('homePage.noFeaturedProducts')}
          </p>
        )}
      </section>

      {/* WHY CHOOSE US SECTION */}
      <motion.section initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7 }} className="max-w-5xl mx-auto mb-20 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <FaShieldAlt className="text-green-500" /> {t('homePage.whyChooseUsTitle')}
        </h2>
        <div className="flex flex-col sm:flex-row justify-center gap-8">
          {whyUs.map((item, idx) => (
            <motion.div key={idx} whileHover={{ scale: 1.07 }} className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-3 transition w-full sm:w-1/4">
              {item.icon}
              <span className="font-medium text-gray-700 text-lg mt-2 text-center">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* HOW IT WORKS SECTION */}
      <motion.section initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="max-w-5xl mx-auto mb-20 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <FaListOl className="text-yellow-500" /> {t('homePage.howItWorksTitle')}
        </h2>
        <div className="flex flex-col md:flex-row justify-center gap-8 items-stretch">
          {howItWorks.map((step, idx) => (
            <motion.div key={idx} whileHover={{ scale: 1.07 }} className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center gap-3 transition w-full md:w-1/4 relative">
              <div className="mb-2">{step.icon}</div>
              <span className="font-bold text-gray-700 text-lg mt-2">{step.title}</span>
              <span className="text-gray-500 text-base text-center">{step.desc}</span>
              {idx < howItWorks.length - 1 && (
                <span className="hidden md:block absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 text-3xl text-gray-200">
                  <FaChevronRight />
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CALL TO ACTION SECTION */}
      {!user && (
        <motion.section initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }} className="max-w-3xl mx-auto mb-20 text-center px-4">
          <div className="inline-block w-full bg-gradient-to-r from-yellow-400 to-pink-400 rounded-2xl px-8 py-10 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
              <FaUserPlus className="text-pink-600" /> {t('homePage.signUpFreeTitle')}
            </h3>
            <p className="text-gray-700 mb-6">{t('homePage.signUpFreeSubtitle')}</p>
            <Link to={ROUTE_PATHS.REGISTER} className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold px-8 py-4 rounded-lg text-xl shadow transition">
              <FaUserPlus /> {t('homePage.signUpButton')}
            </Link>
          </div>
        </motion.section>
      )}
    </div>
  );
};
