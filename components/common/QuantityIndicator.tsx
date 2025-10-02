import React from 'react';

import { FaBox, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { getQuantityStatusColor } from '../../utils/quantityHelpers';

interface QuantityIndicatorProps {
  quantityAvailable: number;
  totalQuantity?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTotal?: boolean;
  className?: string;
}

export const QuantityIndicator: React.FC<QuantityIndicatorProps> = ({
  quantityAvailable,
  totalQuantity,
  size = 'md',
  showIcon = true,
  showTotal = false,
  className = ''
}) => {

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getStatusColor = () => {
    return getQuantityStatusColor(quantityAvailable);
  };

  const getIcon = () => {
    if (quantityAvailable === 0) {
      return <FaExclamationTriangle className={iconSizes[size]} />;
    } else {
      return <FaCheckCircle className={iconSizes[size]} />;
    }
  };

  const getText = () => {
    if (showTotal && totalQuantity !== undefined) {
      return `${quantityAvailable}/${totalQuantity} ชิ้น`;
    } else {
      if (quantityAvailable === 0) {
        return 'สินค้าหมด';
      } else if (quantityAvailable <= 2) {
        return `สินค้าใกล้หมด (${quantityAvailable} ชิ้น)`;
      } else {
        return `มีสินค้า (${quantityAvailable} ชิ้น)`;
      }
    }
  };

  return (
    <span className={`
      inline-flex items-center gap-2 rounded-full font-medium border
      ${sizeClasses[size]}
      ${getStatusColor()}
      ${className}
    `}>
      {showIcon && getIcon()}
      {getText()}
    </span>
  );
};

export default QuantityIndicator;