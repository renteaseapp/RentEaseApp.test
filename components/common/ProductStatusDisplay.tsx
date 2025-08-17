import React from 'react';
import { useTranslation } from 'react-i18next';
import { Product } from '../../types';
import { AvailabilityBadge } from './AvailabilityBadge';
import { QuantityIndicator } from './QuantityIndicator';
import { 
  isProductAvailable, 
  isProductOutOfStock, 
  canRentProduct,
  shouldShowLowStockWarning,
  getProductStatusTooltip
} from '../../utils/quantityHelpers';

interface ProductStatusDisplayProps {
  product: Product;
  showQuantity?: boolean;
  showAvailability?: boolean;
  showAdminStatus?: boolean;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProductStatusDisplay: React.FC<ProductStatusDisplayProps> = ({
  product,
  showQuantity = true,
  showAvailability = true,
  showAdminStatus = false,
  layout = 'horizontal',
  size = 'md',
  className = ''
}) => {
  const { t } = useTranslation();

  const available = isProductAvailable(product);
  const outOfStock = isProductOutOfStock(product);
  const { canRent, reason } = canRentProduct(product);
  const showLowStockWarning = shouldShowLowStockWarning(
    product.quantity_available || 0, 
    product.quantity || 1
  );

  const containerClass = layout === 'horizontal' 
    ? 'flex flex-wrap items-center gap-2' 
    : 'flex flex-col gap-2';

  return (
    <div 
      className={`${containerClass} ${className}`}
      title={getProductStatusTooltip(product, t)}
    >
      {/* Availability Status */}
      {showAvailability && product.availability_status && (
        <AvailabilityBadge
          status={product.availability_status}
          type="availability"
          size={size}
        />
      )}

      {/* Admin Approval Status */}
      {showAdminStatus && product.admin_approval_status && (
        <AvailabilityBadge
          status={product.admin_approval_status}
          type="admin"
          size={size}
        />
      )}

      {/* Quantity Indicator */}
      {showQuantity && product.quantity_available !== undefined && (
        <QuantityIndicator
          quantityAvailable={product.quantity_available}
          totalQuantity={product.quantity}
          size={size}
          showTotal={true}
        />
      )}

      {/* Low Stock Warning */}
      {showLowStockWarning && (
        <span className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          bg-yellow-100 text-yellow-700 border border-yellow-200
        `}>
          ⚠️ {t('common.lowStock', { count: product.quantity_available })}
        </span>
      )}

      {/* Out of Stock Notice */}
      {outOfStock && (
        <span className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          bg-red-100 text-red-700 border border-red-200
        `}>
          ❌ {t('common.outOfStock')}
        </span>
      )}

      {/* Cannot Rent Notice */}
      {!canRent && reason && (
        <span className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          bg-gray-100 text-gray-700 border border-gray-200
        `}>
          🚫 {reason}
        </span>
      )}
    </div>
  );
};

export default ProductStatusDisplay;