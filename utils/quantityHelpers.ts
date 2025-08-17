import { Product, ProductAvailabilityStatus, ProductAdminApprovalStatus } from '../types';

/**
 * ตรวจสอบว่าสินค้าพร้อมให้เช่าหรือไม่
 */
export const isProductAvailable = (product: Product): boolean => {
  return (
    product.availability_status === ProductAvailabilityStatus.AVAILABLE &&
    (product.quantity_available || 0) > 0 &&
    product.admin_approval_status === 'approved' &&
    !product.deleted_at
  );
};

/**
 * ตรวจสอบว่าสินค้าหมดหรือไม่
 */
export const isProductOutOfStock = (product: Product): boolean => {
  return (
    product.availability_status === ProductAvailabilityStatus.RENTED_OUT ||
    (product.quantity_available || 0) === 0
  );
};

/**
 * ได้รับสีสำหรับแสดงสถานะ quantity
 */
export const getQuantityStatusColor = (quantityAvailable: number): string => {
  if (quantityAvailable === 0) {
    return 'text-red-600 bg-red-100 border-red-200';
  } else if (quantityAvailable <= 2) {
    return 'text-yellow-600 bg-yellow-100 border-yellow-200';
  } else {
    return 'text-green-600 bg-green-100 border-green-200';
  }
};

/**
 * ได้รับข้อความสถานะ quantity
 */
export const getQuantityStatusText = (quantityAvailable: number, t: (key: string, options?: any) => string): string => {
  if (quantityAvailable === 0) {
    return t('common.outOfStock');
  } else if (quantityAvailable <= 2) {
    return t('common.lowStock', { count: quantityAvailable });
  } else {
    return t('common.inStock', { count: quantityAvailable });
  }
};

/**
 * ได้รับสีสำหรับแสดงสถานะ availability
 */
export const getAvailabilityStatusColor = (status: ProductAvailabilityStatus | string): string => {
  switch (status) {
    case ProductAvailabilityStatus.AVAILABLE:
      return 'text-green-600 bg-green-100 border-green-200';
    case ProductAvailabilityStatus.RENTED_OUT:
      return 'text-orange-600 bg-orange-100 border-orange-200';
    case ProductAvailabilityStatus.UNAVAILABLE:
      return 'text-red-600 bg-red-100 border-red-200';
    case ProductAvailabilityStatus.PENDING_APPROVAL:
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case ProductAvailabilityStatus.DRAFT:
      return 'text-blue-600 bg-blue-100 border-blue-200';
    case 'rejected': // Handle rejected as string since it's from admin_approval_status
      return 'text-red-600 bg-red-100 border-red-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

/**
 * ได้รับข้อความสถานะ availability
 */
export const getAvailabilityStatusText = (status: ProductAvailabilityStatus | string, t: (key: string) => string): string => {
  const statusMap: Record<string, string> = {
    [ProductAvailabilityStatus.AVAILABLE]: t('productStatus.available'),
    [ProductAvailabilityStatus.RENTED_OUT]: t('productStatus.rented_out'),
    [ProductAvailabilityStatus.UNAVAILABLE]: t('productStatus.unavailable'),
    [ProductAvailabilityStatus.PENDING_APPROVAL]: t('productStatus.pending_approval'),
    [ProductAvailabilityStatus.DRAFT]: t('productStatus.draft'),
    'rejected': t('productStatus.rejected') // Handle rejected as string since it's from admin_approval_status
  };
  
  return statusMap[status] || status.replace('_', ' ').toUpperCase();
};

/**
 * ได้รับสีสำหรับแสดงสถานะ admin approval
 */
export const getAdminApprovalStatusColor = (status: ProductAdminApprovalStatus | string): string => {
  switch (status) {
    case ProductAdminApprovalStatus.APPROVED:
      return 'text-green-600 bg-green-100 border-green-200';
    case ProductAdminApprovalStatus.PENDING:
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case ProductAdminApprovalStatus.REJECTED:
      return 'text-red-600 bg-red-100 border-red-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

/**
 * ได้รับข้อความสถานะ admin approval
 */
export const getAdminApprovalStatusText = (status: ProductAdminApprovalStatus | string, t: (key: string) => string): string => {
  const statusMap: Record<string, string> = {
    [ProductAdminApprovalStatus.APPROVED]: t('adminStatus.approved'),
    [ProductAdminApprovalStatus.PENDING]: t('adminStatus.pending'),
    [ProductAdminApprovalStatus.REJECTED]: t('adminStatus.rejected')
  };
  
  return statusMap[status] || status.replace('_', ' ').toUpperCase();
};

/**
 * คำนวณเปอร์เซ็นต์ความพร้อมของสินค้า
 */
export const calculateAvailabilityPercentage = (quantityAvailable: number, totalQuantity: number): number => {
  if (totalQuantity === 0) return 0;
  return Math.round((quantityAvailable / totalQuantity) * 100);
};

/**
 * ตรวจสอบว่าควรแสดงการแจ้งเตือน low stock หรือไม่
 */
export const shouldShowLowStockWarning = (quantityAvailable: number, totalQuantity: number): boolean => {
  if (quantityAvailable === 0) return false; // Out of stock จะแสดงแยก
  
  const percentage = calculateAvailabilityPercentage(quantityAvailable, totalQuantity);
  return percentage <= 20 || quantityAvailable <= 2; // แจ้งเตือนเมื่อเหลือ <= 20% หรือ <= 2 ชิ้น
};

/**
 * จัดรูปแบบการแสดงจำนวนสินค้า
 */
export const formatQuantityDisplay = (quantityAvailable: number, totalQuantity?: number): string => {
  if (totalQuantity !== undefined && totalQuantity > 1) {
    return `${quantityAvailable}/${totalQuantity}`;
  }
  return quantityAvailable.toString();
};

/**
 * ตรวจสอบว่าสินค้าสามารถเช่าได้หรือไม่
 */
export const canRentProduct = (product: Product): { canRent: boolean; reason?: string } => {
  if (!isProductAvailable(product)) {
    if (product.availability_status !== ProductAvailabilityStatus.AVAILABLE) {
      return { canRent: false, reason: `Product status is ${product.availability_status}` };
    }
    if ((product.quantity_available || 0) === 0) {
      return { canRent: false, reason: 'Product is out of stock' };
    }
    if (product.admin_approval_status !== 'approved') {
      return { canRent: false, reason: 'Product is not approved by admin' };
    }
    if (product.deleted_at) {
      return { canRent: false, reason: 'Product is deleted' };
    }
  }
  
  return { canRent: true };
};

/**
 * สร้าง tooltip text สำหรับสถานะสินค้า
 */
export const getProductStatusTooltip = (product: Product, t: (key: string, options?: any) => string): string => {
  const parts: string[] = [];
  
  parts.push(`${t('common.status')}: ${getAvailabilityStatusText(product.availability_status || '', t)}`);
  parts.push(`${t('common.quantity')}: ${formatQuantityDisplay(product.quantity_available || 0, product.quantity)}`);
  
  if (product.admin_approval_status) {
    parts.push(`${t('common.adminApproval')}: ${product.admin_approval_status}`);
  }
  
  const { canRent, reason } = canRentProduct(product);
  if (!canRent && reason) {
    parts.push(`${t('common.note')}: ${reason}`);
  }
  
  return parts.join('\n');
};

export default {
  isProductAvailable,
  isProductOutOfStock,
  getQuantityStatusColor,
  getQuantityStatusText,
  getAvailabilityStatusColor,
  getAvailabilityStatusText,
  getAdminApprovalStatusColor,
  getAdminApprovalStatusText,
  calculateAvailabilityPercentage,
  shouldShowLowStockWarning,
  formatQuantityDisplay,
  canRentProduct,
  getProductStatusTooltip
};