import React from 'react';

import { Product } from '../../types';
import { AvailabilityBadge } from './AvailabilityBadge';
import { QuantityIndicator } from './QuantityIndicator';
import {
  isProductAvailable,
  isProductOutOfStock,
  shouldShowLowStockWarning,
  formatQuantityDisplay
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

  const available = isProductAvailable(product);
  const outOfStock = isProductOutOfStock(product);

  // Inline canRentProduct logic
  const getCanRentStatus = () => {
    if (!available) {
      if (product.availability_status !== 'available') {
        return { canRent: false, reason: `สถานะสินค้าคือ ${product.availability_status}` };
      }
      if ((product.quantity_available || 0) === 0) {
        return { canRent: false, reason: 'สินค้าหมด' };
      }
      if (product.admin_approval_status !== 'approved') {
        return { canRent: false, reason: 'สินค้ายังไม่ได้รับการอนุมัติจากผู้ดูแล' };
      }
      if (product.deleted_at) {
        return { canRent: false, reason: 'สินค้าถูกลบแล้ว' };
      }
    }
    return { canRent: true };
  };

  const { canRent, reason } = getCanRentStatus();

  const showLowStockWarning = shouldShowLowStockWarning(
    product.quantity_available || 0,
    product.quantity || 1
  );

  // Inline tooltip logic
  const getTooltipText = () => {
    const parts: string[] = [];

    // Status text mapping
    const status = product.availability_status;
    const statusText = status === 'available' ? 'พร้อมให้เช่า' :
                       status === 'rented_out' ? 'ถูกเช่าหมดแล้ว' :
                       status === 'unavailable' ? 'ไม่พร้อมให้เช่า' :
                       status === 'pending_approval' ? 'รอการอนุมัติ' :
                       status === 'draft' ? 'ร่าง' :
                       status === 'rejected' ? 'ถูกปฏิเสธ' :
                       (status ? String(status).replace('_', ' ').toUpperCase() : '');

    parts.push(`สถานะ: ${statusText}`);
    parts.push(`จำนวน: ${formatQuantityDisplay(product.quantity_available || 0, product.quantity)}`);

    if (product.admin_approval_status) {
      const adminText = product.admin_approval_status === 'approved' ? 'อนุมัติแล้ว' :
                        product.admin_approval_status === 'pending' ? 'รอการตรวจสอบ' :
                        product.admin_approval_status === 'rejected' ? 'ถูกปฏิเสธ' :
                        product.admin_approval_status;
      parts.push(`การอนุมัติของผู้ดูแล: ${adminText}`);
    }

    if (!canRent && reason) {
      parts.push(`หมายเหตุ: ${reason}`);
    }

    return parts.join('\n');
  };

  const containerClass = layout === 'horizontal'
    ? 'flex flex-wrap items-center gap-2'
    : 'flex flex-col gap-2';

  return (
    <div
      className={`${containerClass} ${className}`}
      title={getTooltipText()}
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
          ⚠️ สินค้าใกล้หมด ({product.quantity_available} ชิ้น)
        </span>
      )}

      {/* Out of Stock Notice */}
      {outOfStock && (
        <span className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          bg-red-100 text-red-700 border border-red-200
        `}>
          ❌ สินค้าหมด
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