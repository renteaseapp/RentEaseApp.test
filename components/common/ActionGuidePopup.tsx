import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaTimes, FaArrowRight } from 'react-icons/fa';

interface ActionGuidePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  nextSteps?: {
    text: string;
    action?: () => void;
    link?: string;
  }[];
  type?: 'success' | 'info' | 'warning' | 'error';
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const ActionGuidePopup: React.FC<ActionGuidePopupProps> = ({
  isOpen,
  onClose,
  title,
  message,
  nextSteps = [],
  type = 'info',
  autoClose = false,
  autoCloseDelay = 5000
}) => {  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="h-8 w-8 text-green-500" />;
      case 'warning':
        return <FaExclamationTriangle className="h-8 w-8 text-yellow-500" />;
      case 'error':
        return <FaTimes className="h-8 w-8 text-red-500" />;
      default:
        return <FaInfoCircle className="h-8 w-8 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'from-green-50 to-green-100 border-green-200';
      case 'warning':
        return 'from-yellow-50 to-yellow-100 border-yellow-200';
      case 'error':
        return 'from-red-50 to-red-100 border-red-200';
      default:
        return 'from-blue-50 to-blue-100 border-blue-200';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`bg-gradient-to-br ${getBackgroundColor()} border-2 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getIcon()}
                  <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                  <FaTimes className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed">{message}</p>
            </div>

            {/* Next Steps */}
            {nextSteps.length > 0 && (
              <div className="px-6 pb-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaArrowRight className="h-4 w-4" />
                  ขั้นตอนถัดไป
                </h4>
                <div className="space-y-3">
                  {nextSteps.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-white/40"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        {step.link ? (
                          <a
                            href={step.link}
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {step.text}
                          </a>
                        ) : step.action ? (
                          <button
                            onClick={step.action}
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
                          >
                            {step.text}
                          </button>
                        ) : (
                          <span className="text-gray-700 font-medium">{step.text}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-white/30 border-t border-white/40">
              <button
                onClick={onClose}
                className="w-full bg-white/80 hover:bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActionGuidePopup;