import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../../services/userService';
import { Product, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '../../constants';
import { useAlert } from '../../contexts/AlertContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHeart, 
  FaTrash, 
  FaSearch, 
  FaMapMarkerAlt, 
  FaTag, 
  FaEye,
  FaShoppingCart,
  FaArrowRight,
  FaStar,
  FaClock
} from 'react-icons/fa';

export const WishlistPage: React.FC = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useAlert();
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingItem, setRemovingItem] = useState<number | null>(null);

  const fetchWishlist = () => {
    setIsLoading(true);
    getWishlist()
      .then(response => {
        // ดึง items จาก backend
        const itemsFromResponse = response?.items || [];
        // ดึง products ออกมาและ map product_images เป็น primary_image
        const products = itemsFromResponse
          .map((item: any) => {
            if (!item?.products) return null;
            const product = { ...item.products };
            // Map product_images เป็น primary_image
            if (Array.isArray(product.product_images)) {
              product.primary_image =
                product.product_images.find((img: any) => img.is_primary) ||
                product.product_images[0] ||
                null;
            } else {
              product.primary_image = null;
            }
            return product;
          })
          .filter(Boolean);
        setItems(products);
      })
      .catch(err => {
        setError((err as ApiError).message || t('wishlistPage.errors.loadFailed'));
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: number) => {
    setRemovingItem(productId);
    try {
      await removeFromWishlist(productId);
      setItems(prevItems => prevItems.filter(item => item.id !== productId));
      showSuccess(t('wishlistPage.alerts.removedSuccess'));
    } catch (err) {
      showError((err as ApiError).message || t('wishlistPage.errors.removeFailed'));
    } finally {
      setRemovingItem(null);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={t('wishlistPage.loading')} />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-red-50 pt-16">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full mb-4 shadow-lg">
            <FaHeart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            {t('wishlistPage.title', 'My Wishlist')}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('wishlistPage.subtitle', 'All your favorite items in one place.')}
          </p>
          
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-4 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200"
            >
              <FaHeart className="h-4 w-4 text-pink-500" />
              <span className="text-gray-700 font-medium">{items.length} items</span>
            </motion.div>
          )}
        </motion.div>
        
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12 max-w-md mx-auto">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-pink-100 to-red-100 rounded-full mb-6">
                <FaHeart className="h-12 w-12 text-pink-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {t('wishlistPage.empty.title', 'Your wishlist is empty')}
              </h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {t('wishlistPage.empty.subtitle', 'Looks like you haven\'t added anything yet. Let\'s find something you\'ll love!')}
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to={ROUTE_PATHS.SEARCH_PRODUCTS}>
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-pink-500 to-red-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-pink-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <FaSearch className="h-5 w-5" />
                    {t('wishlistPage.empty.browseButton', 'Browse Items')}
                    <FaArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence>
              {items.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
                    {/* Remove Button */}
                    <motion.button 
                      onClick={() => handleRemove(product.id)}
                      className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={removingItem === product.id}
                      aria-label={t('wishlistPage.removeButton', 'Remove')}
                    >
                      {removingItem === product.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      ) : (
                        <FaTrash className="h-4 w-4" />
                      )}
                    </motion.button>

                    {/* Product Image */}
                    <Link to={ROUTE_PATHS.PRODUCT_DETAIL.replace(':slugOrId', product.slug || String(product.id))}>
                      <div className="relative aspect-w-4 aspect-h-3 overflow-hidden">
                        <img 
                          src={product.primary_image?.image_url || 'https://via.placeholder.com/300'} 
                          alt={product.title} 
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Quick View Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                            <FaEye className="h-5 w-5 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-5">
                      {/* Category */}
                      {product.category && (
                        <div className="flex items-center gap-2 mb-2">
                          <FaTag className="h-3 w-3 text-blue-500" />
                          <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                            {product.category.name}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                        <Link to={ROUTE_PATHS.PRODUCT_DETAIL.replace(':slugOrId', product.slug || String(product.id))}>
                          {product.title}
                        </Link>
                      </h3>

                      {/* Location */}
                      {product.province && (
                        <div className="flex items-center gap-2 mb-3">
                          <FaMapMarkerAlt className="h-3 w-3 text-gray-400" />
                          <span className="text-sm text-gray-500">{product.province.name_th}</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            ฿{product.rental_price_per_day?.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <FaClock className="h-3 w-3" />
                            {t('productCard.pricePerDay')}
                          </p>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors duration-200"
                            title="Quick View"
                          >
                            <FaEye className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors duration-200"
                            title="Add to Cart"
                          >
                            <FaShoppingCart className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>

                      
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Bottom CTA for non-empty wishlist */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-12"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Ready to rent something?
              </h3>
              <p className="text-gray-600 mb-6">
                Discover more amazing items in our collection
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to={ROUTE_PATHS.SEARCH_PRODUCTS}>
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl">
                    <FaSearch className="h-5 w-5" />
                    Browse More Items
                    <FaArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}; 