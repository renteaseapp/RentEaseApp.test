import { useState, useEffect, useCallback } from 'react';
import { quantityService, ProductAvailabilityCheck } from '../services/quantityService';
import { useAuth } from '../contexts/AuthContext';

interface UseQuantityMonitorOptions {
  productId: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onQuantityChange?: (oldQuantity: number, newQuantity: number) => void;
  onOutOfStock?: () => void;
  onBackInStock?: () => void;
}

interface UseQuantityMonitorReturn {
  availability: ProductAvailabilityCheck | null;
  isLoading: boolean;
  error: string | null;
  isSubscribed: boolean;
  refresh: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export const useQuantityMonitor = ({
  productId,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  onQuantityChange,
  onOutOfStock,
  onBackInStock
}: UseQuantityMonitorOptions): UseQuantityMonitorReturn => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<ProductAvailabilityCheck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // ตรวจสอบความพร้อมของสินค้า
  const checkAvailability = useCallback(async () => {
    try {
      setError(null);
      const result = await quantityService.checkProductAvailability(productId);
      
      // ตรวจสอบการเปลี่ยนแปลง quantity
      if (availability && onQuantityChange) {
        const oldQuantity = availability.quantity_available;
        const newQuantity = result.quantity_available;
        
        if (oldQuantity !== newQuantity) {
          onQuantityChange(oldQuantity, newQuantity);
          
          // เรียก callback เฉพาะ
          if (oldQuantity > 0 && newQuantity === 0 && onOutOfStock) {
            onOutOfStock();
          } else if (oldQuantity === 0 && newQuantity > 0 && onBackInStock) {
            onBackInStock();
          }
        }
      }
      
      setAvailability(result);
    } catch (err) {
      setError('Failed to check product availability');
      console.error('Error checking availability:', err);
    } finally {
      setIsLoading(false);
    }
  }, [productId, availability, onQuantityChange, onOutOfStock, onBackInStock]);

  // ตรวจสอบสถานะการสมัครรับการแจ้งเตือน
  const checkSubscription = useCallback(async () => {
    if (!user) return;
    
    try {
      const subscribed = await quantityService.checkBackInStockSubscription(productId);
      setIsSubscribed(subscribed);
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  }, [productId, user]);

  // สมัครรับการแจ้งเตือน
  const subscribe = useCallback(async () => {
    if (!user) {
      setError('Please login to subscribe to notifications');
      return;
    }

    try {
      setError(null);
      await quantityService.subscribeToBackInStockNotification(productId);
      setIsSubscribed(true);
    } catch (err) {
      setError('Failed to subscribe to notifications');
      console.error('Error subscribing:', err);
    }
  }, [productId, user]);

  // ยกเลิกการสมัครรับการแจ้งเตือน
  const unsubscribe = useCallback(async () => {
    try {
      setError(null);
      await quantityService.unsubscribeFromBackInStockNotification(productId);
      setIsSubscribed(false);
    } catch (err) {
      setError('Failed to unsubscribe from notifications');
      console.error('Error unsubscribing:', err);
    }
  }, [productId]);

  // Refresh manually
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await checkAvailability();
  }, [checkAvailability]);

  // Initial load
  useEffect(() => {
    checkAvailability();
    if (user) {
      checkSubscription();
    }
  }, [checkAvailability, checkSubscription, user]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      checkAvailability();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, checkAvailability]);

  return {
    availability,
    isLoading,
    error,
    isSubscribed,
    refresh,
    subscribe,
    unsubscribe
  };
};

export default useQuantityMonitor;