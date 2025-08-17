import { User, LoginResponse, RegisterResponse, ApiError, ForgotPasswordResponse, ResetPasswordPayload as ResetPasswordPayloadType, ResetPasswordResponse, ApiResponse } from '../types';
import axios from 'axios';

export interface LoginCredentials {
  email_or_username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

// Exporting the type alias, the original ResetPasswordPayload is in types.ts
export type ResetPasswordPayload = ResetPasswordPayloadType;

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await axios.post<ApiResponse<LoginResponse>>('https://renteaseapi-test.onrender.com/api/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.data.success && response.data.data) {
      // Always store admin token as 'authToken' for admin API
      localStorage.setItem('authToken', response.data.data.access_token);
      localStorage.setItem('isAdmin', String(response.data.data.is_admin));
      // Remove any other token keys to avoid confusion
      localStorage.removeItem('token');
      return response.data.data;
    } else {
      throw {
        message: response.data.message || 'Login failed',
        status: 401
      } as ApiError;
    }
  } catch (error: any) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Login failed',
        status: error.response.status
      } as ApiError;
    }
    throw {
      message: 'Network error occurred',
      status: 500
    } as ApiError;
  }
};

export const register = async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
  try {
    const response = await axios.post<ApiResponse<{ user: User; access_token: string }>>('https://renteaseapi-test.onrender.com/api/users/register', credentials);
    const { data } = response.data;
    return {
      user: data.user,
      access_token: data.access_token,
      message: response.data.message
    };
  } catch (error: any) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Registration failed',
        errors: error.response.data.errors,
        status: error.response.status
      } as ApiError;
    }
    throw {
      message: 'Network error occurred',
      status: 500
    } as ApiError;
  }
};

export const forgotPassword = async (email: string): Promise<ForgotPasswordResponse> => {
  try {
    const response = await axios.post('https://renteaseapi-test.onrender.com/api/auth/request-password-reset', { email });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw {
        message: error.response.data.message || 'Failed to process forgot password request',
        status: error.response.status
      } as ApiError;
    }
    throw {
      message: 'Network error occurred',
      status: 500
    } as ApiError;
  }
};

export const resetPassword = async (payload: ResetPasswordPayloadType): Promise<ResetPasswordResponse> => {
  try {
    const response = await axios.post('https://renteaseapi-test.onrender.com/api/auth/reset-password-with-otp', payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      const errorData = error.response.data;
      console.error('Password reset error details:', {
        status: error.response.status,
        message: errorData.message,
        errors: errorData.errors,
        data: errorData.data
      });
      throw {
        message: errorData.message || 'Failed to reset password',
        status: error.response.status,
        errors: errorData.errors || [],
        data: errorData.data
      } as ApiError;
    }
    throw {
      message: 'Network error occurred',
      status: 500
    } as ApiError;
  }
};
