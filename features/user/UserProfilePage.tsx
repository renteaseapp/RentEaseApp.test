import React, { useEffect, useState, ChangeEvent, FormEvent, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentUser, updateProfile, updatePassword, updateAvatar, UpdateProfilePayload, UpdatePasswordPayload, getUserAddresses, createAddress, updateAddress } from '../../services/userService';
import { User, ApiError, UserAddress } from '../../types';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { Button } from '../../components/ui/Button';
import { InputField } from '../../components/ui/InputField';
import { Card, CardContent } from '../../components/ui/Card';
import { ROUTE_PATHS } from '../../constants';
import { useTranslation } from 'react-i18next';
import { getProvinces } from '../../services/productService';

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944a11.954 11.954 0 007.834 3.055c.097 1.002-.052 2.006-.228 3.003-.176 1.001-.422 2.003-.693 3.002-.271 1-.579 1.999-.938 2.999-.36 1-.803 1.998-1.295 2.997A11.954 11.954 0 0110 18.056a11.954 11.954 0 01-7.834-3.055c-.492-.999-.935-1.998-1.295-2.997-.359-1-.667-1.999-.938-2.999-.271-1.001-.517-2.002-.693-3.002C2.218 6.997 2.069 5.993 2.166 4.999zM10 5a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 5zm0 6.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586A2 2 0 0116.414 3H15V2a1 1 0 10-2 0v1h-1.586A2 2 0 0110.414 3H4zm3 10a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

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
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('userProfilePage.title')}</h1>
      
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} title={t('general.error')} />}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-4 rounded-md shadow" role="alert">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4 group">
                <img 
                  src={profileData.profile_picture_url || `https://picsum.photos/seed/${profileData.username}/200/200`} 
                  alt={profileData.username} 
                  className="w-32 h-32 rounded-full object-cover shadow-lg mx-auto border-2 border-gray-200"
                />
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {isUploadingAvatar ? (
                    <span className="text-white">{t('userProfilePage.uploadingAvatar')}</span>
                  ) : (
                    <CameraIcon />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mt-2">{profileData.first_name} {profileData.last_name}</h2>
              <p className="text-gray-600">@{profileData.username}</p>
              <p className="text-sm text-gray-500 mt-1">
                {profileData.email} 
                {profileData.email_verified_at ? 
                  <span title="Email verified" className="text-green-500">✓</span> : 
                  <span title="Email not verified" className="text-red-500">!</span>
                }
              </p>
              {profileData.phone_number && <p className="text-sm text-gray-500">{profileData.phone_number}</p>}
              {profileData.created_at && (
                <p className="text-xs text-gray-400 mt-2">
                  {t('productDetailPage.memberSince', {date: new Date(profileData.created_at).toLocaleDateString()})}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">{t('userProfilePage.personalInfoTitle')}</h3>
                <div className="flex space-x-2">
                  {!isEditingProfile && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setIsEditingProfile(true); setSuccessMessage(null); setError(null); }}
                      >
                        {t('userProfilePage.editProfileButton')} <EditIcon />
                      </Button>
                      <Link to={ROUTE_PATHS.ID_VERIFICATION}>
                        <Button variant="ghost" size="sm">
                          {t('userProfilePage.verifyIdButton')} <ShieldCheckIcon />
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
              {!isEditingProfile ? (
                <div className="space-y-3 text-gray-700">
                  <dl className="divide-y divide-gray-200">
                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">{t('userProfilePage.fullNameLabel')}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {profileData.first_name} {profileData.last_name}
                      </dd>
                    </div>
                    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-500">{t('userProfilePage.phoneLabel')}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        {profileData.phone_number || t('userProfilePage.notApplicable')}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label={t('registerPage.firstNameLabel')} 
                      name="first_name" 
                      value={formData.first_name || ''} 
                      onChange={handleInputChange} 
                    />
                    <InputField 
                      label={t('registerPage.lastNameLabel')} 
                      name="last_name" 
                      value={formData.last_name || ''} 
                      onChange={handleInputChange} 
                    />
                  </div>
                  <InputField 
                    label={t('registerPage.phoneLabel')} 
                    name="phone_number" 
                    type="tel" 
                    value={formData.phone_number || ''} 
                    onChange={handleInputChange} 
                  />
                  <div className="flex space-x-3 pt-2">
                    <Button type="submit" isLoading={isLoading} variant="primary">
                      {t('userProfilePage.saveChangesButton')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={() => {
                        setIsEditingProfile(false);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                    >
                      {t('userProfilePage.cancelButton')}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">{t('userProfilePage.changePasswordTitle')}</h3>
                {!isChangingPassword && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setIsChangingPassword(true);
                      setSuccessMessage(null);
                      setError(null);
                    }}
                  >
                    {t('userProfilePage.changePasswordButton')} <EditIcon />
                  </Button>
                )}
              </div>
              {isChangingPassword && (
                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                  <InputField 
                    label={t('userProfilePage.currentPasswordLabel')} 
                    name="current_password" 
                    type="password" 
                    required 
                    value={passwordFormData.current_password} 
                    onChange={handlePasswordInputChange} 
                  />
                  <InputField 
                    label={t('userProfilePage.newPasswordLabel')} 
                    name="new_password" 
                    type="password" 
                    required 
                    value={passwordFormData.new_password} 
                    onChange={handlePasswordInputChange} 
                  />
                  <InputField 
                    label={t('userProfilePage.confirmNewPasswordLabel')} 
                    name="new_password_confirmation" 
                    type="password" 
                    required 
                    value={passwordFormData.new_password_confirmation} 
                    onChange={handlePasswordInputChange} 
                  />
                  <div className="flex space-x-3 pt-2">
                    <Button type="submit" isLoading={isLoading} variant="primary">
                      {t('userProfilePage.updatePasswordButton')}
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
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
                    >
                      {t('userProfilePage.cancelButton')}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-700">{t('userProfilePage.addressSectionTitle', 'ที่อยู่สำหรับจัดส่ง/ออกบิล')}</h3>
                <Button size="sm" variant="primary" onClick={() => setShowAddAddress(true)}>+ เพิ่มที่อยู่ใหม่</Button>
              </div>
              {isLoadingAddresses ? (
                <div>กำลังโหลดที่อยู่...</div>
              ) : addresses.length === 0 ? (
                <div className="text-gray-500">ยังไม่มีที่อยู่ในระบบ</div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {addresses.map(addr => (
                    <li key={addr.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{addr.recipient_name} <span className="text-xs text-gray-500">({addr.address_type})</span></div>
                        <div className="text-sm text-gray-700">{addr.address_line1}{addr.address_line2 || ''}, {addr.sub_district || ''}{addr.district}, {addr.province_name || addr.province_id}</div>
                        <div className="text-xs text-gray-500">{addr.phone_number} {addr.is_default && <span className="text-green-600 ml-2">[ค่าเริ่มต้น]</span>}</div>
                        {addr.notes || ''}
                      </div>
                      {/* ปุ่มแก้ไข/ลบ address สามารถเพิ่มได้ภายหลัง */}
                    </li>
                  ))}
                </ul>
              )}
              {showAddAddress && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
                    <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={() => setShowAddAddress(false)}>&times;</button>
                    <h3 className="text-xl font-bold mb-4">เพิ่มที่อยู่ใหม่</h3>
                    {addAddressError && <div className="text-red-600 mb-2">{addAddressError}</div>}
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
                    }} className="space-y-2">
                      <input className="block w-full border rounded p-2" placeholder="ชื่อผู้รับ" required value={newAddress.recipient_name} onChange={e => setNewAddress({...newAddress, recipient_name: e.target.value})} />
                      <input className="block w-full border rounded p-2" placeholder="เบอร์โทรศัพท์" required value={newAddress.phone_number} onChange={e => setNewAddress({...newAddress, phone_number: e.target.value})} />
                      <input className="block w-full border rounded p-2" placeholder="ที่อยู่ (บรรทัดที่ 1)" required value={newAddress.address_line1} onChange={e => setNewAddress({...newAddress, address_line1: e.target.value})} />
                      <input className="block w-full border rounded p-2" placeholder="ที่อยู่ (บรรทัดที่ 2)" value={newAddress.address_line2 || ''} onChange={e => setNewAddress({...newAddress, address_line2: e.target.value})} />
                      <input className="block w-full border rounded p-2" placeholder="แขวง/ตำบล (ถ้ามี)" value={newAddress.sub_district || ''} onChange={e => setNewAddress({...newAddress, sub_district: e.target.value})} />
                      <input className="block w-full border rounded p-2" placeholder="เขต/อำเภอ" required value={newAddress.district} onChange={e => setNewAddress({...newAddress, district: e.target.value})} />
                      <select className="block w-full border rounded p-2" required value={newAddress.province_id} onChange={e => setNewAddress({...newAddress, province_id: Number(e.target.value)})}>
                        <option value="">เลือกจังหวัด</option>
                        {provinces.map(prov => (
                          <option key={prov.id} value={prov.id}>{prov.name_th}</option>
                        ))}
                      </select>
                      <input className="block w-full border rounded p-2" placeholder="รหัสไปรษณีย์" required value={newAddress.postal_code} onChange={e => setNewAddress({...newAddress, postal_code: e.target.value})} />
                      <input className="block w-full border rounded p-2" placeholder="หมายเหตุ (ถ้ามี)" value={newAddress.notes || ''} onChange={e => setNewAddress({...newAddress, notes: e.target.value})} />
                      <select className="block w-full border rounded p-2" value={newAddress.address_type} onChange={e => setNewAddress({...newAddress, address_type: e.target.value as 'shipping' | 'billing' | 'other'})}>
                        <option value="shipping">ที่อยู่สำหรับจัดส่ง</option>
                        <option value="billing">ที่อยู่สำหรับออกบิล</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                      <button type="submit" className="w-full bg-blue-600 text-white rounded p-2 mt-2" disabled={addingAddress}>{addingAddress ? 'กำลังบันทึก...' : 'บันทึกที่อยู่'}</button>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
