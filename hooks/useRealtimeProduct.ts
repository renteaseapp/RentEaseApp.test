import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';

interface Product {
  id: string;
  title: string;
  description: string;
  rental_price_per_day: number;
  quantity_available: number;
  quantity_reserved: number;
  availability_status: string;
  admin_approval_status: string;
  [key: string]: any;
}

interface QuantityData {
  product_id: string;
  quantity_available: number;
  quantity_reserved: number;
}

interface UseRealtimeProductProps {
  productId: string;
}

export const useRealtimeProduct = ({ productId }: UseRealtimeProductProps) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantityData, setQuantityData] = useState<QuantityData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Join product room when component mounts
  useEffect(() => {
    if (productId) {
      socketService.joinProduct(productId);
      setIsConnected(true);
    }

    return () => {
      if (productId) {
        socketService.leaveProduct(productId);
      }
    };
  }, [productId]);

  // Listen for product updates
  useEffect(() => {
    const handleProductUpdate = (updatedProduct: Product) => {
      if (updatedProduct.id === productId) {
        setProduct(updatedProduct);
      }
    };

    const handleProductDeleted = (deletedProductId: string) => {
      if (deletedProductId === productId) {
        // Product was deleted, you might want to redirect or show a message
        console.log('Product was deleted:', productId);
      }
    };

    const handleQuantityUpdate = (data: QuantityData) => {
      if (data.product_id === productId) {
        setQuantityData(data);
        // Also update the product if we have it
        if (product) {
          setProduct(prev => prev ? {
            ...prev,
            quantity_available: data.quantity_available,
            quantity_reserved: data.quantity_reserved
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