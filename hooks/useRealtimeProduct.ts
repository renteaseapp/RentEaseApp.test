import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';
import { Product, ProductAvailabilityStatus } from '../types';

interface QuantityData {
  product_id: string;
  quantity_available: number;
  quantity_reserved: number;
  availability_status?: ProductAvailabilityStatus;
}

interface UseRealtimeProductProps {
  productId: string;
}

export const useRealtimeProduct = ({ productId }: UseRealtimeProductProps) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantityData, setQuantityData] = useState<QuantityData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Join product room when component mounts or productId changes
  useEffect(() => {
    if (productId && productId.trim() !== '') {
      console.log('🔄 Joining product room:', productId);
      socketService.joinProduct(productId);
      setIsConnected(true);
    } else {
      console.log('⚠️ No valid productId, skipping room join');
      setIsConnected(false);
    }

    return () => {
      if (productId && productId.trim() !== '') {
        console.log('🔄 Leaving product room:', productId);
        socketService.leaveProduct(productId);
      }
    };
  }, [productId]);

  // Listen for product updates
  useEffect(() => {
    const handleProductUpdate = (updatedProduct: Product) => {
      if (String(updatedProduct.id) === productId) {
        console.log('📦 Full product update received:', updatedProduct);
        setProduct(updatedProduct);
      }
    };

    const handleProductDeleted = (deletedProductId: number) => {
      if (String(deletedProductId) === productId) {
        // Product was deleted, you might want to redirect or show a message
        console.log('Product was deleted:', productId);
      }
    };

    const handleQuantityUpdate = (data: QuantityData) => {
      if (data.product_id === productId) {
        setQuantityData(data);
        // Also update the product if we have it - only update quantity fields
        if (product) {
          setProduct(prev => prev ? {
            ...prev,
            quantity_available: data.quantity_available,
            quantity_reserved: data.quantity_reserved,
            availability_status: data.availability_status || prev.availability_status
          } : null);
        }
      }
    };

    socketService.onProductUpdated(handleProductUpdate);
    socketService.onProductDeleted(handleProductDeleted);
    socketService.onQuantityUpdated(handleQuantityUpdate);

    return () => {
      socketService.offCallback('product_updated', handleProductUpdate);
      socketService.offCallback('product_deleted', handleProductDeleted);
      socketService.offCallback('quantity_updated', handleQuantityUpdate);
    };
  }, [productId, product]);

  // Set initial product data
  const setInitialProduct = useCallback((initialProduct: Product) => {
    setProduct(initialProduct);
  }, []);

  // Set initial quantity data
  const setInitialQuantityData = useCallback((initialQuantityData: QuantityData) => {
    setQuantityData(initialQuantityData);
  }, []);

  return {
    product,
    quantityData,
    isConnected,
    setInitialProduct,
    setInitialQuantityData
  };
};