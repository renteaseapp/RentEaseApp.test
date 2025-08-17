import React, { useEffect, useState, ChangeEvent, FormEvent, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentUser, updateProfile, updatePassword, updateAvatar, UpdateProfilePayload, UpdatePasswordPayload, getUserAddresses, createAddress, updateAddress, deleteAddress, } from '../../services/userService';
import { User, ApiError, UserAddress } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { getProvinces } from '../../services/productService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaEdit,
  FaShieldAlt,
  FaCamera,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaCheck,
  FaTimes,
  FaPlus,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaHome,
  FaCreditCard,
  FaInfoCircle,
  FaStar,
  FaGlobe,
  FaTrash
} from 'react-icons/fa';
import { TimezoneSettings } from '../../components/common/TimezoneSettings';

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

export const UserProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { updateUserContext } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [provinces, setProvinces] = useState<{id: number, name_th: string}[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTimezoneSettings, setShowTimezoneSettings] = useState(false);
  const [newAddress, setNewAddress] = useState<Omit<UserAddress, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'province_name'>>({
    recipient_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    sub_district: '',
    district: '',
    province_id: 1,
    postal_code: '',
    address_type: 'shipping',
    is_default: true,
    notes: ''
  });
  const [addingAddress, setAddingAddress] = useState(false);
  const [addAddressError, setAddAddressError] = useState<string|null>(null);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [updatingAddress, setUpdatingAddress] = useState(false);
  const [updateAddressError, setUpdateAddressError] = useState<string|null>(null);
  const [deletingAddress, setDeletingAddress] = useState<number | null>(null);

  const [formData, setFormData] = useState<UpdateProfilePayload>({
    first_name: '',
    last_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province_id: undefined,
    postal_code: '',
  });

  const [passwordFormData, setPasswordFormData] = useState<UpdatePasswordPayload>({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  const refreshProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      setProfileData(user);
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        address_line1: user.address_line1 || '',
        address_line2: user.address_line2 || '',
        city: user.city || '',
        province_id: user.province_id || undefined,
        postal_code: user.postal_code || '',
      });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to refresh profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  useEffect(() => {
    getProvinces().then(res => setProvinces(res.data)).catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    setIsLoadingAddresses(true);
    getUserAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]))
      .finally(() => setIsLoadingAddresses(false));
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'province_id' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  const handlePasswordInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPasswordFormData({ ...passwordFormData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updatedUser = await updateProfile(formData);
      setProfileData(updatedUser);
      updateUserContext(updatedUser);
      setSuccessMessage(t('userProfilePage.profileUpdatedSuccess'));
      setIsEditingProfile(false);
      await refreshProfile();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await updatePassword(passwordFormData);
      setSuccessMessage(t('userProfilePage.passwordUpdateSuccess'));
      setIsChangingPassword(false);
      setPasswordFormData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
      await refreshProfile();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to change password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Compress image before uploading
      const compressedFile = await compressImage(file);
      const { profile_picture_url } = await updateAvatar(compressedFile);
      
      if (profileData) {
        const updatedUser = { ...profileData, profile_picture_url };
        setProfileData(updatedUser);
        updateUserContext(updatedUser);
      }
      setSuccessMessage(t('userProfilePage.avatarUpdatedSuccess'));
      await refreshProfile();
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update avatar.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading && !profileData) {
    return <LoadingSpinner message={t('userProfilePage.title')} />;
  }

  if (error && !profileData) {
    return <ErrorMessage message={error} title={t('general.error')} />;
  }

  if (!profileData) {
    return <div className="container mx-auto p-4 text-center">Could not load profile data. Please try logging in again.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-16 py-8">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">
            {t('userProfilePage.title')}
          </h1>
          <p className="text-gray-600 text-center mb-8">
            {t('userProfilePage.subtitle')}
          </p>
        </motion.div>
        
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />
            </motion.div>
          )}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <FaCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">{t('general.success')}</p>
                <p className="text-green-700 text-sm">{successMessage}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="relative w-40 h-40 mx-auto mb-6 group">
                  <motion.img 
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.2 }}
                    src={profileData.profile_picture_url || `https://picsum.photos/seed/${profileData.username}/200/200`} 
                    alt={profileData.username} 
                    className="w-40 h-40 rounded-full object-cover shadow-xl mx-auto border-4 border-white"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm"
                  >
                    {isUploadingAvatar ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    ) : (
                      <FaCamera className="h-8 w-8 text-white" />
                    )}
                  </motion.button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-900 mb-2"
                >
                  {profileData.first_name} {profileData.last_name}
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-blue-600 font-medium mb-4"
                >
                  @{profileData.username}
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 text-sm"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-600">
                    <FaEnvelope className="h-4 w-4" />
                    <span>{profileData.email}</span>
                    {profileData.email_verified_at ? 
                      <FaCheck className="h-4 w-4 text-green-500" title="Email verified" /> : 
                      <FaTimes className="h-4 w-4 text-red-500" title="Email not verified" />
                    }
                  </div>
                  
                  {profileData.phone_number && (
                    <div className="flex items-center justify-center gap-2 text-gray-600">
                      <FaPhone className="h-4 w-4" />
                      <span>{profileData.phone_number}</span>
                    </div>
                  )}
                  
                  {profileData.created_at && (
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <FaCalendarAlt className="h-4 w-4" />
                      <span>{t('productDetailPage.memberSince', {date: new Date(profileData.created_at).toLocaleDateString()})}</span>
                    </div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Personal Information Card */}
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <FaUser className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t('userProfilePage.personalInfoTitle')}</h3>
                  </div>
                  <div className="flex space-x-2">
                    {!isEditingProfile && (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setIsEditingProfile(true); setSuccessMessage(null); setError(null); }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                        >
                          <FaEdit className="h-4 w-4" />
                          {t('userProfilePage.editProfileButton')}
                        </motion.button>
                        <Link to={ROUTE_PATHS.ID_VERIFICATION}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                          >
                            <FaShieldAlt className="h-4 w-4" />
                            {t('userProfilePage.verifyIdButton')}
                          </motion.button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                
                <AnimatePresence mode="wait">
                  {!isEditingProfile ? (
                    <motion.div
                      key="view"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-500 mb-1">{t('userProfilePage.fullNameLabel')}</p>
                          <p className="text-lg font-semibold text-gray-900">{profileData.first_name} {profileData.last_name}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-sm font-medium text-gray-500 mb-1">{t('userProfilePage.phoneLabel')}</p>
                          <p className="text-lg font-semibold text-gray-900">{profileData.phone_number || t('userProfilePage.notApplicable')}</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="edit"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleProfileSubmit}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {t('registerPage.firstNameLabel')}
                          </label>
                          <input
                            type="text"
                            name="first_name"
                            value={formData.first_name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {t('registerPage.lastNameLabel')}
                          </label>
                          <input
                            type="text"
                            name="last_name"
                            value={formData.last_name || ''}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('registerPage.phoneLabel')}
                        </label>
                        <input
                          type="tel"
                          name="phone_number"
                          value={formData.phone_number || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      <div className="flex space-x-3 pt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <FaCheck className="h-4 w-4" />
                              {t('userProfilePage.saveChangesButton')}
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setError(null);
                            setSuccessMessage(null);
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <FaTimes className="h-4 w-4" />
                          {t('userProfilePage.cancelButton')}
                        </motion.button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100">
                      <FaLock className="h-5 w-5 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t('userProfilePage.changePasswordTitle')}</h3>
                  </div>
                  {!isChangingPassword && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsChangingPassword(true);
                        setSuccessMessage(null);
                        setError(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                    >
                      <FaEdit className="h-4 w-4" />
                      {t('userProfilePage.changePasswordButton')}
                    </motion.button>
                  )}
                </div>
                
                <AnimatePresence mode="wait">
                  {isChangingPassword && (
                    <motion.form
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handlePasswordChangeSubmit}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('userProfilePage.currentPasswordLabel')}
                        </label>
                        <input
                          type="password"
                          name="current_password"
                          required
                          value={passwordFormData.current_password}
                          onChange={handlePasswordInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('userProfilePage.newPasswordLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="new_password"
                            required
                            value={passwordFormData.new_password}
                            onChange={handlePasswordInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showNewPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {t('userProfilePage.confirmNewPasswordLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="new_password_confirmation"
                            required
                            value={passwordFormData.new_password_confirmation}
                            onChange={handlePasswordInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 pt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <FaLock className="h-4 w-4" />
                              {t('userProfilePage.updatePasswordButton')}
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            setIsChangingPassword(false);
                            setError(null);
                            setSuccessMessage(null);
                            setPasswordFormData({
                              current_password: '',
                              new_password: '',
                              new_password_confirmation: '',
                            });
                          }}
                          className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <FaTimes className="h-4 w-4" />
                          {t('userProfilePage.cancelButton')}
                        </motion.button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Timezone Settings Card */}
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <FaGlobe className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t('userProfilePage.timezoneSettingsTitle', 'Timezone Settings')}</h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTimezoneSettings(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
                  >
                    <FaGlobe className="h-4 w-4" />
                    {t('userProfilePage.configureTimezoneButton', 'Configure')}
                  </motion.button>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    {t('userProfilePage.timezoneDescription', 'Configure your local timezone and language preferences to ensure all dates and times are displayed correctly for your location.')}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FaGlobe className="h-4 w-4 text-purple-500" />
                    <span>
                      {t('userProfilePage.timezoneHelp', 'Click "Configure" to set your timezone and language preferences.')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Addresses Card */}
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <FaMapMarkerAlt className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{t('userProfilePage.addressSectionTitle', 'ที่อยู่สำหรับจัดส่ง/ออกบิล')}</h3>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddAddress(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                  >
                    <FaPlus className="h-4 w-4" />
                    เพิ่มที่อยู่ใหม่
                  </motion.button>
                </div>
                
                {isLoadingAddresses ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">กำลังโหลดที่อยู่...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <FaMapMarkerAlt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">ยังไม่มีที่อยู่ในระบบ</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr, index) => (
                      <motion.div
                        key={addr.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-green-300 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {addr.address_type === 'shipping' ? (
                              <FaHome className="h-4 w-4 text-blue-600" />
                            ) : addr.address_type === 'billing' ? (
                              <FaCreditCard className="h-4 w-4 text-purple-600" />
                            ) : (
                              <FaInfoCircle className="h-4 w-4 text-gray-600" />
                            )}
                            <span className="font-semibold text-gray-900">{addr.recipient_name}</span>
                            <span className="text-xs text-gray-500">({addr.address_type})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {addr.is_default && (
                              <FaStar className="h-4 w-4 text-yellow-500" title="ที่อยู่เริ่มต้น" />
                            )}
                            <button
                              onClick={() => {
                                setEditingAddress(addr);
                                setShowEditAddress(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="แก้ไขที่อยู่"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm('คุณต้องการลบที่อยู่นี้หรือไม่?')) {
                                  setDeletingAddress(addr.id);
                                  try {
                                    await deleteAddress(addr.id);
                                    const updatedAddresses = addresses.filter(a => a.id !== addr.id);
                                    setAddresses(updatedAddresses);
                                  } catch (error: any) {
                                    alert(error.message || 'เกิดข้อผิดพลาดในการลบที่อยู่');
                                  } finally {
                                    setDeletingAddress(null);
                                  }
                                }
                              }}
                              disabled={deletingAddress === addr.id}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="ลบที่อยู่"
                            >
                              {deletingAddress === addr.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <FaTrash className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p>{addr.address_line1}</p>
                          {addr.address_line2 && <p>{addr.address_line2}</p>}
                          <p>{addr.sub_district || ''}{addr.district}, {addr.province_name || addr.province_id}</p>
                          <p className="text-gray-500">{addr.phone_number}</p>
                        </div>
                        {addr.notes && (
                          <p className="text-xs text-gray-500 mt-2 italic">"{addr.notes}"</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Add Address Modal */}
        <AnimatePresence>
          {showAddAddress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <FaPlus className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">เพิ่มที่อยู่ใหม่</h3>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowAddAddress(false)}
                    >
                      <FaTimes className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {addAddressError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                      <FaTimes className="h-4 w-4 text-red-500" />
                      <p className="text-red-700 text-sm">{addAddressError}</p>
                    </div>
                  )}
                  
                  <form onSubmit={async e => {
                  e.preventDefault();
                  setAddingAddress(true);
                  setAddAddressError(null);
                  try {
                    await createAddress({
                      recipient_name: newAddress.recipient_name,
                      phone_number: newAddress.phone_number,
                      address_line1: newAddress.address_line1,
                      address_line2: newAddress.address_line2 || '',
                      sub_district: newAddress.sub_district || '',
                      district: newAddress.district,
                      province_id: newAddress.province_id,
                      postal_code: newAddress.postal_code,
                      address_type: newAddress.address_type,
                      is_default: !!newAddress.is_default,
                      notes: newAddress.notes || ''
                    });
                    const addrs = await getUserAddresses();
                    setAddresses(addrs);
                    setShowAddAddress(false);
                    setNewAddress({
                      recipient_name: '',
                      phone_number: '',
                      address_line1: '',
                      address_line2: '',
                      sub_district: '',
                      district: '',
                      province_id: 1,
                      postal_code: '',
                      address_type: 'shipping',
                      is_default: true,
                      notes: ''
                    });
                  } catch (err: any) {
                    setAddAddressError(err?.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มที่อยู่');
                  } finally {
                    setAddingAddress(false);
                  }
                }} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">ชื่อผู้รับ</label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                      placeholder="ชื่อผู้รับ" 
                      required 
                      value={newAddress.recipient_name} 
                      onChange={e => setNewAddress({...newAddress, recipient_name: e.target.value})} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                      placeholder="เบอร์โทรศัพท์" 
                      required 
                      value={newAddress.phone_number} 
                      onChange={e => setNewAddress({...newAddress, phone_number: e.target.value})} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">ที่อยู่ (บรรทัดที่ 1)</label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                      placeholder="ที่อยู่ (บรรทัดที่ 1)" 
                      required 
                      value={newAddress.address_line1} 
                      onChange={e => setNewAddress({...newAddress, address_line1: e.target.value})} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">ที่อยู่ (บรรทัดที่ 2)</label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                      placeholder="ที่อยู่ (บรรทัดที่ 2)" 
                      value={newAddress.address_line2 || ''} 
                      onChange={e => setNewAddress({...newAddress, address_line2: e.target.value})} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">แขวง/ตำบล</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                        placeholder="แขวง/ตำบล" 
                        value={newAddress.sub_district || ''} 
                        onChange={e => setNewAddress({...newAddress, sub_district: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">เขต/อำเภอ</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                        placeholder="เขต/อำเภอ" 
                        required 
                        value={newAddress.district} 
                        onChange={e => setNewAddress({...newAddress, district: e.target.value})} 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">จังหวัด</label>
                      <select 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                        required 
                        value={newAddress.province_id} 
                        onChange={e => setNewAddress({...newAddress, province_id: Number(e.target.value)})}
                      >
                        <option value="">เลือกจังหวัด</option>
                        {provinces.map(prov => (
                          <option key={prov.id} value={prov.id}>{prov.name_th}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">รหัสไปรษณีย์</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                        placeholder="รหัสไปรษณีย์" 
                        required 
                        value={newAddress.postal_code} 
                        onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">ประเภทที่อยู่</label>
                    <select 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                      value={newAddress.address_type} 
                      onChange={e => setNewAddress({...newAddress, address_type: e.target.value as 'shipping' | 'billing' | 'other'})}
                    >
                      <option value="shipping">ที่อยู่สำหรับจัดส่ง</option>
                      <option value="billing">ที่อยู่สำหรับออกบิล</option>
                      <option value="other">อื่นๆ</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                    <input 
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200" 
                      placeholder="หมายเหตุ (ถ้ามี)" 
                      value={newAddress.notes || ''} 
                      onChange={e => setNewAddress({...newAddress, notes: e.target.value})} 
                    />
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    disabled={addingAddress}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {addingAddress ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <FaPlus className="h-4 w-4" />
                        บันทึกที่อยู่
                      </>
                    )}
                  </motion.button>
                </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Address Modal */}
        <AnimatePresence>
          {showEditAddress && editingAddress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <FaEdit className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">แก้ไขที่อยู่</h3>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => {
                        setShowEditAddress(false);
                        setEditingAddress(null);
                      }}
                    >
                      <FaTimes className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {updateAddressError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
                      <FaTimes className="h-4 w-4 text-red-500" />
                      <p className="text-red-700 text-sm">{updateAddressError}</p>
                    </div>
                  )}
                  
                  <form onSubmit={async e => {
                    e.preventDefault();
                    if (!editingAddress) return;
                    
                    setUpdatingAddress(true);
                    setUpdateAddressError(null);
                    try {
                      await updateAddress(editingAddress.id, {
                        recipient_name: editingAddress.recipient_name,
                        phone_number: editingAddress.phone_number,
                        address_line1: editingAddress.address_line1,
                        address_line2: editingAddress.address_line2 || '',
                        sub_district: editingAddress.sub_district || '',
                        district: editingAddress.district,
                        province_id: editingAddress.province_id,
                        postal_code: editingAddress.postal_code,
                        address_type: editingAddress.address_type,
                        is_default: !!editingAddress.is_default,
                        notes: editingAddress.notes || ''
                      });
                      const addrs = await getUserAddresses();
                      setAddresses(addrs);
                      setShowEditAddress(false);
                      setEditingAddress(null);
                    } catch (err: any) {
                      setUpdateAddressError(err?.response?.data?.message || 'เกิดข้อผิดพลาดในการแก้ไขที่อยู่');
                    } finally {
                      setUpdatingAddress(false);
                    }
                  }} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">ชื่อผู้รับ</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        placeholder="ชื่อผู้รับ" 
                        required 
                        value={editingAddress.recipient_name} 
                        onChange={e => setEditingAddress({...editingAddress, recipient_name: e.target.value})} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        placeholder="เบอร์โทรศัพท์" 
                        required 
                        value={editingAddress.phone_number} 
                        onChange={e => setEditingAddress({...editingAddress, phone_number: e.target.value})} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">ที่อยู่ (บรรทัดที่ 1)</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        placeholder="ที่อยู่ (บรรทัดที่ 1)" 
                        required 
                        value={editingAddress.address_line1} 
                        onChange={e => setEditingAddress({...editingAddress, address_line1: e.target.value})} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">ที่อยู่ (บรรทัดที่ 2)</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        placeholder="ที่อยู่ (บรรทัดที่ 2)" 
                        value={editingAddress.address_line2 || ''} 
                        onChange={e => setEditingAddress({...editingAddress, address_line2: e.target.value})} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">แขวง/ตำบล</label>
                        <input 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="แขวง/ตำบล" 
                          value={editingAddress.sub_district || ''} 
                          onChange={e => setEditingAddress({...editingAddress, sub_district: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">เขต/อำเภอ</label>
                        <input 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="เขต/อำเภอ" 
                          required 
                          value={editingAddress.district} 
                          onChange={e => setEditingAddress({...editingAddress, district: e.target.value})} 
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">จังหวัด</label>
                        <select 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          required 
                          value={editingAddress.province_id} 
                          onChange={e => setEditingAddress({...editingAddress, province_id: Number(e.target.value)})}
                        >
                          <option value="">เลือกจังหวัด</option>
                          {provinces.map(prov => (
                            <option key={prov.id} value={prov.id}>{prov.name_th}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">รหัสไปรษณีย์</label>
                        <input 
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                          placeholder="รหัสไปรษณีย์" 
                          required 
                          value={editingAddress.postal_code} 
                          onChange={e => setEditingAddress({...editingAddress, postal_code: e.target.value})} 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">ประเภทที่อยู่</label>
                      <select 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        value={editingAddress.address_type} 
                        onChange={e => setEditingAddress({...editingAddress, address_type: e.target.value as 'shipping' | 'billing' | 'other'})}
                      >
                        <option value="shipping">ที่อยู่สำหรับจัดส่ง</option>
                        <option value="billing">ที่อยู่สำหรับออกบิล</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">หมายเหตุ</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                        placeholder="หมายเหตุ (ถ้ามี)" 
                        value={editingAddress.notes || ''} 
                        onChange={e => setEditingAddress({...editingAddress, notes: e.target.value})} 
                      />
                    </div>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      disabled={updatingAddress}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updatingAddress ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <FaEdit className="h-4 w-4" />
                          บันทึกการแก้ไข
                        </>
                      )}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timezone Settings Modal */}
        <AnimatePresence>
          {showTimezoneSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col"
              >
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaGlobe className="h-6 w-6 text-purple-600" />
                      <h3 className="text-xl font-bold text-gray-900">
                        {t('userProfilePage.timezoneSettingsTitle', 'Timezone Settings')}
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowTimezoneSettings(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaTimes className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                  <TimezoneSettings 
                    onClose={() => setShowTimezoneSettings(false)}
                    showAsModal={false}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
