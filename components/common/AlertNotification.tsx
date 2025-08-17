import React from 'react';
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaExclamationCircle } from 'react-icons/fa';

interface AlertNotificationProps {
  isVisible: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const AlertNotification: React.FC<AlertNotificationProps> = ({
  isVisible,
  message,
  type,
  onClose
}) => {
  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="h-5 w-5" />;
      case 'error':
        return <FaExclamationCircle className="h-5 w-5" />;
      case 'warning':
        return <FaExclamationTriangle className="h-5 w-5" />;
      case 'info':
        return <FaInfoCircle className="h-5 w-5" />;
      default:
        return <FaInfoCircle className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-400 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'info':
        return 'bg-blue-100 border-blue-400 text-blue-800';
      default:
        return 'bg-blue-100 border-blue-400 text-blue-800';
    }
  };

  return (
    <div className={`fixed top-20 right-4 z-50 max-w-sm w-full border-l-4 p-4 rounded shadow-lg ${getStyles()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="flex-shrink-0 ml-3">
          <button
            onClick={onClose}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition ease-in-out duration-150"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertNotification; 