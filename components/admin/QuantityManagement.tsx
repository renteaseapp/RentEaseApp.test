import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSync, FaBox, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { Button } from '../ui/Button';
import { quantityService, QuantitySyncResult } from '../../services/quantityService';
import { toast } from 'react-toastify';

interface QuantityManagementProps {
  className?: string;
}

export const QuantityManagement: React.FC<QuantityManagementProps> = ({
  className = ''
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<QuantitySyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSyncAllQuantities = async () => {
    setIsLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await quantityService.syncAllProductQuantities();
      setSyncResult(result);
      
      if (result.synced_products > 0) {
        toast.success(t('admin.quantitySync.syncSuccess', { count: result.synced_products }));
      } else {
        toast.info(t('admin.quantitySync.noChanges'));
      }
    } catch (err) {
      const errorMessage = t('admin.quantitySync.syncError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSingleProduct = async (productId: number) => {
    try {
      const result = await quantityService.syncSingleProductQuantity(productId);
      toast.success(t('admin.quantitySync.singleSyncSuccess', { productId }));
      return result;
    } catch (err) {
      toast.error(t('admin.quantitySync.singleSyncError', { productId }));
      throw err;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FaBox className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {t('admin.quantitySync.title')}
          </h2>
          <p className="text-sm text-gray-600">
            {t('admin.quantitySync.description')}
          </p>
        </div>
      </div>

      {/* Sync All Button */}
      <div className="mb-6">
        <Button
          onClick={handleSyncAllQuantities}
          disabled={isLoading}
          isLoading={isLoading}
          variant="primary"
          size="lg"
          className="w-full sm:w-auto"
        >
          <FaSync className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {t('admin.quantitySync.syncAllButton')}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-medium">
              {t('admin.quantitySync.errorTitle')}
            </span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Sync Results */}
      {syncResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FaCheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-gray-800">
              {t('admin.quantitySync.resultsTitle')}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="text-2xl font-bold text-blue-600">
                {syncResult.synced_products}
              </div>
              <div className="text-sm text-gray-600">
                {t('admin.quantitySync.syncedProducts')}
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {syncResult.details && syncResult.details.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">
                {t('admin.quantitySync.changesDetails')}
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {syncResult.details.map((detail, index) => (
                  <div key={index} className="bg-white p-3 rounded border text-sm">
                    <div className="font-medium text-gray-800 mb-1">
                      {detail.title} (ID: {detail.product_id})
                    </div>
                    <div className="text-gray-600">
                      {t('admin.quantitySync.quantityChange', {
                        old: detail.old_quantity_available,
                        new: detail.new_quantity_available
                      })}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {t('admin.quantitySync.activeRentals', { count: detail.active_rentals })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">
          {t('admin.quantitySync.instructionsTitle')}
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• {t('admin.quantitySync.instruction1')}</li>
          <li>• {t('admin.quantitySync.instruction2')}</li>
          <li>• {t('admin.quantitySync.instruction3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default QuantityManagement;