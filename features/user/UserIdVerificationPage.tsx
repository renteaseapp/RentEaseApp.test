import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getIdVerificationStatus, submitIdVerification } from '../../services/userService';
import { UserIdDocumentType, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';

const DocumentTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
);

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
        <path d="M9 13h2v5H9v-5z" />
    </svg>
);

const UserIdVerificationPage: React.FC = () => {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [verificationData, setVerificationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    id_document_type: UserIdDocumentType;
    id_document_number?: string;
  }>({
    id_document_type: UserIdDocumentType.NATIONAL_ID,
  });

  useEffect(() => {
    const fetchStatus = async () => {
      if (authUser?.id) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await getIdVerificationStatus();
          setVerificationData(response.data);
        } catch (err) {
          const apiError = err as ApiError;
          setError(apiError.message || 'Failed to load ID verification status.');
        } finally {
          setIsLoading(false);
        }
      } else {
        setError("User not authenticated.");
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, [authUser]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(t('idVerificationPage.fileTooLarge'));
        e.target.value = ''; // Clear the file input
        return;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError(t('idVerificationPage.invalidFileType'));
        e.target.value = ''; // Clear the file input
        return;
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Create new FormData instance
    const formDataObj = new FormData();

    // Validate document type
    const selectedDocType = formData.id_document_type;
    if (!Object.values(UserIdDocumentType).includes(selectedDocType)) {
      setError('Invalid document type selected');
      return;
    }

    // Add document type and number
    formDataObj.append('id_document_type', selectedDocType);
    if (formData.id_document_number) {
      formDataObj.append('id_document_number', formData.id_document_number);
    }

    // Get files from form
    const form = e.target as HTMLFormElement;
    const idDocument = form.querySelector<HTMLInputElement>('#id_document')?.files?.[0];
    const idDocumentBack = form.querySelector<HTMLInputElement>('#id_document_back')?.files?.[0];
    const idSelfie = form.querySelector<HTMLInputElement>('#id_selfie')?.files?.[0];

    // Validate required files
    if (!idDocument) {
      setError(t('idVerificationPage.docFrontRequired'));
      return;
    }

    // Validate file sizes and types
    const validateFile = (file: File | undefined, fieldName: string) => {
      if (!file) return true; // Optional files can be undefined
      
      // Check file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError(`${fieldName}: ${t('idVerificationPage.fileTooLarge')}`);
        return false;
      }

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError(`${fieldName}: ${t('idVerificationPage.invalidFileType')}`);
        return false;
      }

      return true;
    };

    // Validate all files
    if (!validateFile(idDocument, 'ID Front') || 
        !validateFile(idDocumentBack, 'ID Back') || 
        !validateFile(idSelfie, 'Selfie')) {
      return;
    }

    // Add files to FormData with correct field names
    formDataObj.append('id_document', idDocument);
    if (idDocumentBack) {
      formDataObj.append('id_document_back', idDocumentBack);
    }
    if (idSelfie) {
      formDataObj.append('id_selfie', idSelfie);
    }

    // Debug log
    console.log('FormData contents before submission:');
    for (let [key, value] of formDataObj.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, {
          name: value.name,
          type: value.type,
          size: value.size
        });
      } else {
        console.log(`${key}:`, value);
      }
    }

    setIsSubmitting(true);

    try {
      await submitIdVerification(formDataObj);
      setSuccessMessage(t('idVerificationPage.submitSuccess'));
      const updatedStatus = await getIdVerificationStatus();
      setVerificationData(updatedStatus.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('idVerificationPage.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStatusBadge = (status: string) => {
    let bgColor = 'bg-gray-200';
    let textColor = 'text-gray-800';
    
    switch (status) {
      case 'verified':
        bgColor = 'bg-green-100';
        textColor = 'text-green-700';
        break;
      case 'pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-700';
        break;
      case 'rejected':
        bgColor = 'bg-red-100';
        textColor = 'text-red-700';
        break;
      case 'not_submitted':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-700';
        break;
    }
    
    return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${bgColor} ${textColor}`}>{status.replace('_', ' ').toUpperCase()}</span>;
  };

  if (isLoading) {
    return <LoadingSpinner message={t('idVerificationPage.loadingStatus')} />;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">{t('idVerificationPage.title')}</h1>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-4 rounded-md shadow" role="alert">
          <p>{successMessage}</p>
        </div>
      )}

      <Card className="mb-8">
        <CardContent>
          <h2 className="text-xl font-semibold text-gray-700 mb-3">{t('idVerificationPage.currentStatusTitle')}</h2>
          {verificationData ? (
            <div className="space-y-2">
              <p>{t('idVerificationPage.statusLabel')} {renderStatusBadge(verificationData.status)}</p>
              {verificationData.document_type && (
                <p>{t('idVerificationPage.docTypeLabel')} <span className="font-medium">{verificationData.document_type_th}</span></p>
              )}
              {verificationData.document_number && (
                <p>{t('idVerificationPage.docNumberLabel')} <span className="font-medium">***{verificationData.document_number.slice(-4)}</span></p>
              )}
              {verificationData.notes && (
                <p className="text-red-600">{t('idVerificationPage.notesLabel')} {verificationData.notes}</p>
              )}
            </div>
          ) : (
            <p>Could not load verification status.</p>
          )}
        </CardContent>
      </Card>

      {(verificationData?.status === 'not_submitted' || verificationData?.status === 'rejected') && (
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">{t('idVerificationPage.submitDocsTitle')}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="id_document_type" className="block text-sm font-medium text-gray-700 mb-1">{t('idVerificationPage.docTypeSelectLabel')}</label>
                <select
                  id="id_document_type"
                  name="id_document_type"
                  value={formData.id_document_type}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value={UserIdDocumentType.NATIONAL_ID}>บัตรประชาชน</option>
                  <option value={UserIdDocumentType.PASSPORT}>หนังสือเดินทาง</option>
                  <option value={UserIdDocumentType.OTHER}>เอกสารอื่นๆ</option>
                </select>
              </div>

              <InputField
                label={t('idVerificationPage.docNumberInputLabel')}
                id="id_document_number"
                name="id_document_number"
                value={formData.id_document_number || ''}
                onChange={handleInputChange}
                icon={<DocumentTextIcon />}
              />
              
              <div>
                <label htmlFor="id_document" className="block text-sm font-medium text-gray-700 mb-1">{t('idVerificationPage.docFrontInputLabel')} <span className="text-red-500">*</span></label>
                <input 
                  type="file" 
                  id="id_document" 
                  name="id_document" 
                  onChange={handleFileChange} 
                  required 
                  accept="image/jpeg,image/jpg,image/png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              <div>
                <label htmlFor="id_document_back" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('idVerificationPage.docBackInputLabel')} <span className="text-gray-400">({t('idVerificationPage.optional', 'ไม่บังคับ')})</span>
                </label>
                <input 
                  type="file" 
                  id="id_document_back" 
                  name="id_document_back" 
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png"
                  placeholder={t('idVerificationPage.optionalPlaceholder', 'ถ้ามี')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label htmlFor="id_selfie" className="block text-sm font-medium text-gray-700 mb-1">{t('idVerificationPage.selfieInputLabel')}</label>
                <input 
                  type="file" 
                  id="id_selfie" 
                  name="id_selfie" 
                  onChange={handleFileChange}
                  accept="image/jpeg,image/jpg,image/png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <Button type="submit" isLoading={isSubmitting} fullWidth variant="primary" size="lg">
                <UploadIcon /> {t('idVerificationPage.submitDocsButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserIdVerificationPage;
