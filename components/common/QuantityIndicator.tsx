import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaBox, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { getQuantityStatusColor, getQuantityStatusText } from '../../utils/quantityHelpers';

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
  const { t } = useTranslation();

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
      return `${quantityAvailable}/${totalQuantity} ${t('common.available')}`;
    } else {
      return getQuantityStatusText(quantityAvailable, t);
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