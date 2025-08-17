import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaClock, 
  FaEyeSlash, 
  FaEdit,
  FaTimes
} from 'react-icons/fa';
import { ProductAvailabilityStatus, ProductAdminApprovalStatus } from '../../types';
import { getAvailabilityStatusColor, getAvailabilityStatusText, getAdminApprovalStatusColor, getAdminApprovalStatusText } from '../../utils/quantityHelpers';

interface AvailabilityBadgeProps {
  status: ProductAvailabilityStatus | ProductAdminApprovalStatus | string;
  type?: 'availability' | 'admin';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({
  status,
  type = 'availability',
  size = 'md',
  showIcon = true,
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

  const getStatusConfig = (status: string, type: string) => {
    const getIcon = (iconType: string) => {
      switch (iconType) {
        case 'check': return <FaCheckCircle className={iconSizes[size]} />;
        case 'clock': return <FaClock className={iconSizes[size]} />;
        case 'times': return <FaTimes className={iconSizes[size]} />;
        case 'warning': return <FaExclamationTriangle className={iconSizes[size]} />;
        case 'hidden': return <FaEyeSlash className={iconSizes[size]} />;
        case 'edit': return <FaEdit className={iconSizes[size]} />;
        default: return <FaExclamationTriangle className={iconSizes[size]} />;
      }
    };

    if (type === 'admin') {
      const color = getAdminApprovalStatusColor(status);
      const text = getAdminApprovalStatusText(status, t);
      const iconType = status === 'approved' ? 'check' : status === 'pending' ? 'clock' : 'warning';
      
      return {
        color,
        icon: getIcon(iconType),
        text
      };
    } else {
      const color = getAvailabilityStatusColor(status);
      const text = getAvailabilityStatusText(status, t);
      
      let iconType = 'warning';
      switch (status) {
        case 'available': iconType = 'check'; break;
        case 'rented_out': iconType = 'clock'; break;
        case 'unavailable': iconType = 'times'; break;
        case 'pending_approval': iconType = 'clock'; break;
        case 'rejected': iconType = 'warning'; break;
        case 'hidden': iconType = 'hidden'; break;
        case 'draft': iconType = 'edit'; break;
      }
      
      return {
        color,
        icon: getIcon(iconType),
        text
      };
    }
  };

  const config = getStatusConfig(status, type);

  return (
    <span className={`
      inline-flex items-center gap-2 rounded-full font-medium border
      ${sizeClasses[size]}
      ${config.color}
      ${className}
    `}>
      {showIcon && config.icon}
      {config.text}
    </span>
  );
};

export default AvailabilityBadge;