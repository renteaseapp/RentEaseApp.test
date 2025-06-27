import axios from 'axios';
import { User, UserProfileData, ApiError, UserIdVerificationStatus, UserIdVerificationData as UserIdVerificationDataType, IdVerificationSubmissionPayload as IdVerificationSubmissionPayloadType,UserAddress, ApiResponse } from '../types';

const API_URL = 'http://localhost:3001/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Exporting the type aliases
export type UserIdVerificationData = UserIdVerificationDataType;
export type IdVerificationSubmissionPayload = IdVerificationSubmissionPayloadType;

export const getUserProfile = async (userId: number): Promise<UserProfileData> => {
  try {
    const response = await api.get<ApiResponse<UserProfileData>>(`/users/${userId}/profile`);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch user profile',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export interface UpdateUserProfilePayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province_id?: number;
  postal_code?: string;
}

export const updateUserProfile = async (userId: number, payload: UpdateUserProfilePayload): Promise<{ user: User }> => {
  try {
    const response = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}/profile`, payload);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to update user profile',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export const updateUserAvatar = async (userId: number, avatarFile: File): Promise<{ profile_picture_url: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    
    const response = await api.post<ApiResponse<{ profile_picture_url: string }>>(`/users/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to update avatar',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export const changePassword = async (userId: number, payload: ChangePasswordPayload): Promise<{ message: string }> => {
  try {
    const response = await api.put<ApiResponse<{ message: string }>>(`/users/${userId}/password`, payload);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to change password',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export interface IdVerificationResponse {
  success: boolean;
  message?: string;
  error_code?: string;
  data: {
    status: UserIdVerificationStatus;
    status_th: string;
    notes: string | null;
    document_type: 'national_id' | 'passport' | 'other';
    document_type_th: string;
    document_number: string;
    document_url: string;
    document_back_url: string | null;
    selfie_url: string | null;
  }
}

// Helper function to get Thai status translation
export const getStatusTranslation = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'not_submitted': 'ยังไม่ได้ส่งเอกสาร',
    'pending': 'รอการตรวจสอบ',
    'approved': 'ยืนยันตัวตนแล้ว',
    'rejected': 'ไม่ผ่านการตรวจสอบ'
  };
  return statusMap[status] || status;
};

// Helper function to get Thai document type translation
export const getDocumentTypeTranslation = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'national_id': 'บัตรประชาชน',
    'passport': 'หนังสือเดินทาง',
    'other': 'เอกสารอื่นๆ'
  };
  return typeMap[type] || type;
};

export interface IdVerificationSubmissionResponse {
  success: boolean;
  data: {
    id_verification_status: 'pending';
    id_document_type: string;
    id_document_number: string;
    id_document_url: string;
    id_document_back_url?: string;
    id_selfie_url?: string;
  }
}

export const getIdVerificationStatus = async (): Promise<IdVerificationResponse> => {
  try {
    const response = await api.get<IdVerificationResponse>('/users/me/id-verification');
    
    // Debug log for response
    console.log('Raw API Response:', response.data);

    // Return the response exactly as received
    return {
      success: response.data.success,
      data: {
        status: response.data.data.status,
        status_th: getStatusTranslation(response.data.data.status),
        notes: response.data.data.notes,
        document_type: response.data.data.document_type,
        document_type_th: getDocumentTypeTranslation(response.data.data.document_type),
        document_number: response.data.data.document_number,
        document_url: response.data.data.document_url,
        document_back_url: response.data.data.document_back_url,
        selfie_url: response.data.data.selfie_url
      }
    };
  } catch (error) {
    console.error('Error in getIdVerificationStatus:', error);
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch ID verification status',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export const submitIdVerification = async (formData: FormData): Promise<IdVerificationResponse> => {
  try {
    // Debug logs for form data
    console.log('Form data before submission:');
    for (let [key, value] of formData.entries()) {
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

    // Validate file sizes and types
    const validateFile = (file: File | null) => {
      if (!file) return;
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must not exceed 5MB');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed');
      }
    };

    // Check required files
    const idDocument = formData.get('id_document') as File;
    const idDocumentBack = formData.get('id_document_back') as File;
    const idSelfie = formData.get('id_selfie') as File;
    
    if (!idDocument) {
      throw new Error('ID document front image is required');
    }

    // Validate all files
    validateFile(idDocument);
    validateFile(idDocumentBack);
    validateFile(idSelfie);

    // Create new FormData to ensure clean data
    const cleanFormData = new FormData();
    
    // Add document type and number
    const idDocumentType = formData.get('id_document_type');
    const idDocumentNumber = formData.get('id_document_number');
    
    if (idDocumentType) {
      cleanFormData.append('id_document_type', idDocumentType.toString());
    }
    if (idDocumentNumber) {
      cleanFormData.append('id_document_number', idDocumentNumber.toString());
    }

    // Add files with correct field names
    cleanFormData.append('id_document', idDocument);
    if (idDocumentBack) {
      cleanFormData.append('id_document_back', idDocumentBack);
    }
    if (idSelfie) {
      cleanFormData.append('id_selfie', idSelfie);
    }

    const axiosResponse = await api.post<IdVerificationResponse>('/users/me/id-verification', cleanFormData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    // Add Thai translations to the response
    const responseData: IdVerificationResponse = {
      ...axiosResponse.data,
      data: {
        ...axiosResponse.data.data,
        status_th: getStatusTranslation(axiosResponse.data.data.status),
        document_type_th: getDocumentTypeTranslation(axiosResponse.data.data.document_type)
      }
    };

    return responseData;

  } catch (error) {
    console.error('Error in submitIdVerification:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw {
        message: error.response?.data?.message || 'Failed to submit ID verification',
        status: error.response?.status || 500,
        error_code: error.response?.data?.error_code
      } as ApiError;
    }
    throw error;
  }
};

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province_id?: number;
  postal_code?: string;
}

export interface UpdatePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface CreateAddressPayload {
  address_type: 'shipping' | 'billing' | 'other';
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  address_line2?: string;
  sub_district: string;
  district: string;
  province_id: number;
  postal_code: string;
  is_default: boolean;
  notes?: string;
}

export interface UpdateAddressPayload extends Partial<CreateAddressPayload> {
  id: number;
}

// Profile Management
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await api.get<ApiResponse<{ user: User }>>('/users/me');
    return response.data.data.user;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch user profile',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export const updateProfile = async (data: UpdateProfilePayload): Promise<User> => {
  try {
    const response = await api.put<ApiResponse<User>>('/users/me/profile', data);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to update profile',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export const updatePassword = async (data: UpdatePasswordPayload): Promise<void> => {
  try {
    await api.put<ApiResponse<void>>('/users/me/password', data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to update password',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

// Address Management
export const getUserAddresses = async (): Promise<UserAddress[]> => {
  try {
    const response = await api.get<ApiResponse<UserAddress[]>>('/users/me/addresses');
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to fetch addresses',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export const createAddress = async (data: CreateAddressPayload): Promise<UserAddress> => {
  try {
    const response = await api.post<ApiResponse<UserAddress>>('/users/me/addresses', data);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to create address',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export const updateAddress = async (addressId: number, data: Partial<CreateAddressPayload>): Promise<UserAddress> => {
  try {
    const response = await api.put<ApiResponse<UserAddress>>(`/users/me/addresses/${addressId}`, data);
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to update address',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};

export const updateAvatar = async (avatarFile: File): Promise<{ profile_picture_url: string }> => {
  try {
    const formData = new FormData();
    formData.append('avatar', avatarFile);

    const response = await api.post<ApiResponse<{ profile_picture_url: string }>>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw {
        message: error.response?.data?.message || 'Failed to update avatar',
        status: error.response?.status || 500
      } as ApiError;
    }
    throw error;
  }
};
