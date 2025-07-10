import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { InitiateReturnPayload } from '../../types';

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
      if (!carrier) {
        setError(t('renterRentalDetailPage.initiateReturnForm.errorCarrierRequired'));
        return;
      }
      payload = {
        return_method: 'shipping',
        return_details: {
          carrier,
          tracking_number: trackingNumber || undefined,
          return_datetime: new Date(proposedDateTime).toISOString(),
        },
        notes,
        return_proof_image: returnProofImage || undefined,
      };
    } else { // in_person
      if (!proposedDateTime || !locationDetails) {
        setError(t('renterRentalDetailPage.initiateReturnForm.errorInPersonDetailsRequired'));
        return;
      }
      payload = {
        return_method: 'in_person',
        return_details: {
          return_datetime: new Date(proposedDateTime).toISOString(),
          return_location: locationDetails,
        },
        notes,
      };
    }
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-screen overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">{t('renterRentalDetailPage.initiateReturnForm.title')}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('renterRentalDetailPage.initiateReturnForm.returnMethodLabel')}</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="returnMethod"
                  value="shipping"
                  checked={returnMethod === 'shipping'}
                  onChange={() => setReturnMethod('shipping')}
                  className="form-radio"
                />
                <span className="ml-2">{t('renterRentalDetailPage.initiateReturnForm.methodShipping')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="returnMethod"
                  value="in_person"
                  checked={returnMethod === 'in_person'}
                  onChange={() => setReturnMethod('in_person')}
                  className="form-radio"
                />
                <span className="ml-2">{t('renterRentalDetailPage.initiateReturnForm.methodInPerson')}</span>
              </label>
            </div>
          </div>

          {returnMethod === 'shipping' && (
            <div className="space-y-4 p-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold">{t('renterRentalDetailPage.initiateReturnForm.shippingDetailsTitle')}</h3>
              <InputField
                label={t('renterRentalDetailPage.initiateReturnForm.carrierLabel')}
                id="carrier"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                placeholder={t('renterRentalDetailPage.initiateReturnForm.carrierPlaceholder')}
                required
              />
              <InputField
                label={t('renterRentalDetailPage.initiateReturnForm.trackingNumberLabel')}
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
              <div>
                <label htmlFor="returnProofImage" className="block text-sm font-medium text-gray-700">{t('renterRentalDetailPage.initiateReturnForm.proofImageLabel')}</label>
                <input
                  type="file"
                  id="returnProofImage"
                  onChange={(e) => setReturnProofImage(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          )}

          {returnMethod === 'in_person' && (
            <div className="space-y-4 p-4 border rounded-md bg-gray-50">
              <h3 className="font-semibold">{t('renterRentalDetailPage.initiateReturnForm.inPersonDetailsTitle')}</h3>
              <InputField
                label={t('renterRentalDetailPage.initiateReturnForm.proposedDateTimeLabel')}
                id="proposedDateTime"
                type="datetime-local"
                value={proposedDateTime}
                onChange={(e) => setProposedDateTime(e.target.value)}
                required
              />
              <InputField
                label={t('renterRentalDetailPage.initiateReturnForm.locationDetailsLabel')}
                id="locationDetails"
                value={locationDetails}
                onChange={(e) => setLocationDetails(e.target.value)}
                placeholder={t('renterRentalDetailPage.initiateReturnForm.locationDetailsPlaceholder')}
                required
              />
            </div>
          )}

          <div className="mt-4">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">{t('renterRentalDetailPage.initiateReturnForm.notesLabel')}</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              {t('renterRentalDetailPage.initiateReturnForm.submitButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 