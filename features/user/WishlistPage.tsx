import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWishlist, removeFromWishlist } from '../../services/userService';
import { Product, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { ROUTE_PATHS } from '../../constants';
import { useAlert } from '../../contexts/AlertContext';

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
  </svg>
);

const EmptyWishlistIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0l.318.318.318-.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
    </svg>
  );

export const WishlistPage: React.FC = () => {
  const { t } = useTranslation();
  const { showSuccess, showError } = useAlert();
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWishlist = () => {
    setIsLoading(true);
    getWishlist()
      .then(response => {
        setItems(response?.data?.products || []);
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
    try {
      await removeFromWishlist(productId);
      setItems(prevItems => prevItems.filter(item => item.id !== productId));
      showSuccess(t('wishlistPage.alerts.removedSuccess'));
    } catch (err) {
      showError((err as ApiError).message || t('wishlistPage.errors.removeFailed'));
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={t('wishlistPage.loading')} />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0l.318.318.318-.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
          </svg>
          <h1 className="text-3xl font-bold text-gray-800">{t('wishlistPage.title', 'My Wishlist')}</h1>
        </div>
        <p className="text-gray-500 mb-8 ml-12">{t('wishlistPage.subtitle', 'All your favorite items in one place.')}</p>
        
        {items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col items-center">
            <EmptyWishlistIcon />
            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">{t('wishlistPage.empty.title', 'Your wishlist is empty')}</h3>
            <p className="text-gray-500 mb-6 max-w-sm">{t('wishlistPage.empty.subtitle', 'Looks like you haven\'t added anything yet. Let\'s find something you\'ll love!')}</p>
            <Link to={ROUTE_PATHS.SEARCH_PRODUCTS}>
              <Button variant="primary" size="lg">{t('wishlistPage.empty.browseButton', 'Browse Items')}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative">
                <button 
                    onClick={() => handleRemove(product.id)}
                    className="absolute top-2 right-2 z-10 bg-white/70 backdrop-blur-sm rounded-full p-2 text-gray-500 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label={t('wishlistPage.removeButton', 'Remove')}
                >
                    <TrashIcon/>
                </button>
                <Link to={ROUTE_PATHS.PRODUCT_DETAIL.replace(':slugOrId', product.slug || String(product.id))}>
                  <div className="aspect-w-4 aspect-h-3">
                    <img 
                      src={product.primary_image?.image_url || 'https://via.placeholder.com/300'} 
                      alt={product.title} 
                      className="object-cover w-full h-full"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  {product.category && <p className="text-xs text-blue-600 font-semibold mb-1">{product.category.name}</p>}
                  <h3 className="font-semibold text-lg text-gray-800 truncate group-hover:text-blue-700">
                    <Link to={ROUTE_PATHS.PRODUCT_DETAIL.replace(':slugOrId', product.slug || String(product.id))}>
                      {product.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{product.province?.name_th}</p>
                  <p className="text-gray-800 mt-2 font-bold text-lg">฿{product.rental_price_per_day?.toLocaleString()} <span className="text-sm font-normal text-gray-500">/ {t('productCard.pricePerDay')}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 