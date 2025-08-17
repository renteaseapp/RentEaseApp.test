import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBell, FaBellSlash, FaSpinner } from 'react-icons/fa';
import { Button } from '../ui/Button';
import { useQuantityMonitor } from '../../hooks/useQuantityMonitor';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

interface OutOfStockNotifierProps {
  productId: number;
  productTitle: string;
  isOutOfStock: boolean;
  className?: string;
}

export const OutOfStockNotifier: React.FC<OutOfStockNotifierProps> = ({
  productId,
  productTitle,
  isOutOfStock,
  className = ''
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    isSubscribed,
    subscribe,
    unsubscribe,
    error
  } = useQuantityMonitor({
    productId,
    onBackInStock: () => {
      toast.success(t('notifications.backInStock', { title: productTitle }));
    }
  });

  const handleToggleSubscription = async () => {
    if (!user) {
      toast.error(t('notifications.loginRequired'));
      return;
    }

    setIsLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
        toast.success(t('notifications.unsubscribeSuccess'));
      } else {
        await subscribe();
        toast.success(t('notifications.subscribeSuccess'));
      }
    } catch (err) {
      toast.error(t('notifications.subscriptionError'));
    } finally {
      setIsLoading(false);
    }
  };

  // ไม่แสดงถ้าสินค้าไม่หมด
  if (!isOutOfStock) return null;

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <FaBellSlash className="w-5 h-5 text-orange-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-orange-800 mb-1">
            {t('notifications.outOfStockTitle')}
          </h3>
          <p className="text-sm text-orange-700 mb-3">
            {t('notifications.outOfStockMessage', { title: productTitle })}
          </p>
          
          {user && (
            <Button
              size="sm"
              variant={isSubscribed ? "ghost" : "primary"}
              onClick={handleToggleSubscription}
              disabled={isLoading}
              className={`${
                isSubscribed 
                  ? 'text-orange-700 border-orange-300 hover:bg-orange-100' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {isLoading ? (
                <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
              ) : isSubscribed ? (
                <FaBellSlash className="w-4 h-4 mr-2" />
              ) : (
                <FaBell className="w-4 h-4 mr-2" />
              )}
              {isSubscribed 
                ? t('notifications.unsubscribeButton')
                : t('notifications.subscribeButton')
              }
            </Button>
          )}
          
          {!user && (
            <p className="text-xs text-orange-600 mt-2">
              {t('notifications.loginToSubscribe')}
            </p>
          )}
          
          {error && (
            <p className="text-xs text-red-600 mt-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutOfStockNotifier;