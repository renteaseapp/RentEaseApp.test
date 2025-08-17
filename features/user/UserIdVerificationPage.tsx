import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentUser, getIdVerificationStatus, submitIdVerification } from '../../services/userService';
import { UserIdDocumentType, ApiError } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaIdCard, 
  FaPassport, 
  FaFileAlt, 
  FaUpload, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaClock, 
  FaShieldAlt,
  FaUserCheck,
  FaCamera,
  FaArrowRight,
  FaInfoCircle
} from 'react-icons/fa';

const UserIdVerificationPage: React.FC = () => {
  const { t } = useTranslation();
  const { user: authUser, updateUserContext } = useAuth();
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
      // ดึง user profile ล่าสุดแล้วอัปเดต context
      try {
        const latestUser = await getCurrentUser();
        updateUserContext(latestUser);
      } catch (e) {
        // ignore error, ไม่ต้องแจ้ง user
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || t('idVerificationPage.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderStatusBadge = (status: string) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    let icon = <FaClock className="h-4 w-4" />;
    
    switch (status) {
      case 'verified':
        bgColor = 'bg-gradient-to-r from-green-100 to-emerald-100';
        textColor = 'text-green-700';
        icon = <FaCheckCircle className="h-4 w-4" />;
        break;
      case 'pending':
        bgColor = 'bg-gradient-to-r from-yellow-100 to-orange-100';
        textColor = 'text-yellow-700';
        icon = <FaClock className="h-4 w-4" />;
        break;
      case 'rejected':
        bgColor = 'bg-gradient-to-r from-red-100 to-pink-100';
        textColor = 'text-red-700';
        icon = <FaExclamationTriangle className="h-4 w-4" />;
        break;
      case 'not_submitted':
        bgColor = 'bg-gradient-to-r from-blue-100 to-indigo-100';
        textColor = 'text-blue-700';
        icon = <FaUserCheck className="h-4 w-4" />;
        break;
    }
    
    return (
      <motion.span 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full ${bgColor} ${textColor} shadow-sm`}
      >
        {icon}
        {status.replace('_', ' ').toUpperCase()}
      </motion.span>
    );
  };


  if (isLoading) {
    return <LoadingSpinner message={t('idVerificationPage.loadingStatus')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-16">
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4 shadow-lg">
            <FaShieldAlt className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            {t('idVerificationPage.title')}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            ยืนยันตัวตนของคุณเพื่อความปลอดภัยและความน่าเชื่อถือในการใช้งาน
          </p>
        </motion.div>

        {/* Error and Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <FaCheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <FaUserCheck className="h-6 w-6" />
              <h2 className="text-xl font-bold">{t('idVerificationPage.currentStatusTitle')}</h2>
            </div>
            <p className="text-blue-100">ตรวจสอบสถานะการยืนยันตัวตนของคุณ</p>
          </div>
          
          <div className="p-6">
            {verificationData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">{t('idVerificationPage.statusLabel')}</span>
                  {renderStatusBadge(verificationData.status)}
                </div>
                
                {verificationData.document_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('idVerificationPage.docTypeLabel')}</span>
                    <span className="font-medium text-gray-900">{verificationData.document_type_th}</span>
                  </div>
                )}
                
                {verificationData.document_number && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('idVerificationPage.docNumberLabel')}</span>
                    <span className="font-mono font-medium text-gray-900">***{verificationData.document_number.slice(-4)}</span>
                  </div>
                )}
                
                {verificationData.notes && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <FaExclamationTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-red-700 font-medium">{t('idVerificationPage.notesLabel')}</span>
                    </div>
                    <p className="text-red-600 mt-1">{verificationData.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FaExclamationTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Could not load verification status.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Submit Documents Form */}
        {(verificationData?.status === 'not_submitted' || verificationData?.status === 'rejected') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <FaUpload className="h-6 w-6" />
                <h2 className="text-xl font-bold">{t('idVerificationPage.submitDocsTitle')}</h2>
              </div>
              <p className="text-green-100">อัปโหลดเอกสารเพื่อยืนยันตัวตน</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Document Type Selection */}
                <div>
                  <label htmlFor="id_document_type" className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('idVerificationPage.docTypeSelectLabel')}
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: UserIdDocumentType.NATIONAL_ID, label: 'บัตรประชาชน', icon: <FaIdCard /> },
                      { value: UserIdDocumentType.PASSPORT, label: 'หนังสือเดินทาง', icon: <FaPassport /> },
                      { value: UserIdDocumentType.OTHER, label: 'เอกสารอื่นๆ', icon: <FaFileAlt /> }
                    ].map((option) => (
                      <motion.div
                        key={option.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                          formData.id_document_type === option.value
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                        }`}
                        onClick={() => setFormData({ ...formData, id_document_type: option.value })}
                      >
                        <input
                          type="radio"
                          id={`doc_type_${option.value}`}
                          name="id_document_type"
                          value={option.value}
                          checked={formData.id_document_type === option.value}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            formData.id_document_type === option.value
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {option.icon}
                          </div>
                          <span className={`font-medium ${
                            formData.id_document_type === option.value
                              ? 'text-blue-900'
                              : 'text-gray-700'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                        {formData.id_document_type === option.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <FaCheckCircle className="h-2 w-2 text-white" />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Document Number */}
                <div>
                  <label htmlFor="id_document_number" className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('idVerificationPage.docNumberInputLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaIdCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="id_document_number"
                      name="id_document_number"
                      value={formData.id_document_number || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="กรอกเลขที่เอกสาร"
                    />
                  </div>
                </div>
                
                {/* File Upload Sections */}
                <div className="space-y-6">
                  {/* ID Document Front */}
                  <div>
                    <label htmlFor="id_document" className="block text-sm font-semibold text-gray-700 mb-3">
                      {t('idVerificationPage.docFrontInputLabel')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input 
                        type="file" 
                        id="id_document" 
                        name="id_document" 
                        onChange={handleFileChange} 
                        required 
                        accept="image/jpeg,image/jpg,image/png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-indigo-500 file:text-white hover:file:from-blue-600 hover:file:to-indigo-600 transition-all duration-200 cursor-pointer"
                      />
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <FaInfoCircle className="h-3 w-3" />
                        รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB
                      </div>
                    </div>
                  </div>
                  
                  {/* Selfie */}
                  <div>
                    <label htmlFor="id_selfie" className="block text-sm font-semibold text-gray-700 mb-3">
                      {t('idVerificationPage.selfieInputLabel')}
                    </label>
                    <div className="relative">
                      <input 
                        type="file" 
                        id="id_selfie" 
                        name="id_selfie" 
                        onChange={handleFileChange}
                        accept="image/jpeg,image/jpg,image/png"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-green-500 file:to-emerald-500 file:text-white hover:file:from-green-600 hover:file:to-emerald-600 transition-all duration-200 cursor-pointer"
                      />
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <FaCamera className="h-3 w-3" />
                        รูปเซลฟี่พร้อมถือเอกสาร (ไม่บังคับ)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      กำลังส่งข้อมูล...
                    </>
                  ) : (
                    <>
                      <FaUpload className="h-5 w-5" />
                      {t('idVerificationPage.submitDocsButton')}
                      <FaArrowRight className="h-4 w-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UserIdVerificationPage;
