import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InitiateReturnPayload } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBox, 
  FaTruck, 
  FaHandshake, 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaFileAlt, 
  FaUpload, 
  FaTimes, 
  FaCheckCircle,
  FaInfoCircle,
  FaArrowRight
} from 'react-icons/fa';

interface InitiateReturnFormProps {
  rentalId: number;
  onSubmit: (payload: InitiateReturnPayload) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const InitiateReturnForm: React.FC<InitiateReturnFormProps> = ({ rentalId, onSubmit, onCancel, isLoading }) => {
  const { t } = useTranslation();
  const [returnMethod, setReturnMethod] = useState<'shipping' | 'in_person'>('shipping');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [proposedDateTime, setProposedDateTime] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [notes, setNotes] = useState('');
  const [returnProofImage, setReturnProofImage] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let payload: InitiateReturnPayload;

    if (returnMethod === 'shipping') {
      // Validate required fields for shipping
      if (!carrier) {
        setError(t('renterRentalDetailPage.initiateReturnForm.errorCarrierRequired'));
        return;
      }
      if (!trackingNumber) {
        setError(t('renterRentalDetailPage.initiateReturnForm.errorTrackingNumberRequired'));
        return;
      }
      if (!proposedDateTime) {
        setError(t('renterRentalDetailPage.initiateReturnForm.errorInvalidDate'));
        return;
      }
      
      // Check if the date is valid
      const dateObj = new Date(proposedDateTime);
      if (isNaN(dateObj.getTime())) {
        setError(t('renterRentalDetailPage.initiateReturnForm.errorInvalidDate'));
        return;
      }

      payload = {
        return_method: 'shipping',
        return_details: {
          carrier,
          tracking_number: trackingNumber,
          return_datetime: dateObj.toISOString(),
        },
        notes,
        shipping_receipt_image: returnProofImage || undefined,
      };
    } else { // in_person
      // Validate required fields for in-person
      if (!proposedDateTime) {
        setError(t('renterRentalDetailPage.initiateReturnForm.errorInPersonDetailsRequired'));
        return;
      }
      
      // Check if the date is valid
      const dateObj = new Date(proposedDateTime);
      if (isNaN(dateObj.getTime())) {
        setError(t('renterRentalDetailPage.initiateReturnForm.errorInvalidDate'));
        return;
      }
      
      if (!locationDetails) {
        setError(t('renterRentalDetailPage.initiateReturnForm.errorInPersonDetailsRequired'));
        return;
      }
      
      payload = {
        return_method: 'in_person',
        return_details: {
          return_datetime: dateObj.toISOString(),
          location: locationDetails, // Use 'location' as expected by schema
        },
        notes,
      };
    }
    onSubmit(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-screen overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FaBox className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{t('renterRentalDetailPage.initiateReturnForm.title')}</h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="h-5 w-5 text-gray-500" />
          </motion.button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-4"
          >
            <label className="block text-sm font-semibold text-gray-700 mb-3">{t('renterRentalDetailPage.initiateReturnForm.returnMethodLabel')}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.label
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  returnMethod === 'shipping' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="returnMethod"
                  value="shipping"
                  checked={returnMethod === 'shipping'}
                  onChange={() => setReturnMethod('shipping')}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  returnMethod === 'shipping' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}>
                  {returnMethod === 'shipping' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <div className="flex items-center gap-2">
                  <FaTruck className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">{t('renterRentalDetailPage.initiateReturnForm.methodShipping')}</span>
                </div>
              </motion.label>
              
              <motion.label
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  returnMethod === 'in_person' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="returnMethod"
                  value="in_person"
                  checked={returnMethod === 'in_person'}
                  onChange={() => setReturnMethod('in_person')}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                  returnMethod === 'in_person' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                }`}>
                  {returnMethod === 'in_person' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <div className="flex items-center gap-2">
                  <FaHandshake className="h-5 w-5 text-green-500" />
                  <span className="font-medium">{t('renterRentalDetailPage.initiateReturnForm.methodInPerson')}</span>
                </div>
              </motion.label>
            </div>
          </motion.div>

          {returnMethod === 'shipping' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 p-6 border-2 border-blue-200 rounded-xl bg-blue-50"
            >
              <div className="flex items-center gap-2 mb-4">
                <FaTruck className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">{t('renterRentalDetailPage.initiateReturnForm.shippingDetailsTitle')}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaTruck className="h-4 w-4 text-blue-500" />
                    {t('renterRentalDetailPage.initiateReturnForm.carrierLabel')}
                  </label>
                  <input
                    id="carrier"
                    value={carrier}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCarrier(e.target.value)}
                    placeholder={t('renterRentalDetailPage.initiateReturnForm.carrierPlaceholder')}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaFileAlt className="h-4 w-4 text-green-500" />
                    {t('renterRentalDetailPage.initiateReturnForm.trackingNumberLabel')}
                  </label>
                  <input
                    id="trackingNumber"
                    value={trackingNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackingNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaCalendarAlt className="h-4 w-4 text-blue-500" />
                    {t('renterRentalDetailPage.initiateReturnForm.proposedDateTimeLabel')}
                  </label>
                  <input
                    id="proposedDateTimeShipping"
                    type="datetime-local"
                    value={proposedDateTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProposedDateTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaUpload className="h-4 w-4 text-purple-500" />
                    {t('renterRentalDetailPage.initiateReturnForm.proofImageLabel')}
                  </label>
                  <input
                    type="file"
                    id="returnProofImage"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReturnProofImage(e.target.files ? e.target.files[0] : null)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {returnMethod === 'in_person' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 p-6 border-2 border-green-200 rounded-xl bg-green-50"
            >
              <div className="flex items-center gap-2 mb-4">
                <FaHandshake className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">{t('renterRentalDetailPage.initiateReturnForm.inPersonDetailsTitle')}</h3>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaCalendarAlt className="h-4 w-4 text-green-500" />
                    {t('renterRentalDetailPage.initiateReturnForm.proposedDateTimeLabel')}
                  </label>
                  <input
                    id="proposedDateTime"
                    type="datetime-local"
                    value={proposedDateTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProposedDateTime(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FaMapMarkerAlt className="h-4 w-4 text-green-500" />
                    {t('renterRentalDetailPage.initiateReturnForm.locationDetailsLabel')}
                  </label>
                  <input
                    id="locationDetails"
                    value={locationDetails}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocationDetails(e.target.value)}
                    placeholder={t('renterRentalDetailPage.initiateReturnForm.locationDetailsPlaceholder')}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-2"
          >
            <label htmlFor="notes" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FaInfoCircle className="h-4 w-4 text-gray-500" />
              {t('renterRentalDetailPage.initiateReturnForm.notesLabel')}
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              placeholder="Add any additional notes about the return..."
            />
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 border border-red-200 rounded-xl"
            >
              <div className="flex items-center gap-2 text-red-700">
                <FaTimes className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex justify-end gap-3 pt-4"
          >
            <motion.button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.cancel')}
            </motion.button>
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 flex items-center gap-2 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaCheckCircle className="h-4 w-4" />
                  {t('renterRentalDetailPage.initiateReturnForm.submitButton')}
                  <FaArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </motion.div>
  );
}; 