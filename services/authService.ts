import { User, LoginResponse, RegisterResponse, ApiError, ForgotPasswordResponse, ResetPasswordPayload as ResetPasswordPayloadType, ResetPasswordResponse, ApiResponse } from '../types';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

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

  const response = await axios.post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/auth/login`, credentials, {
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
    const response = await axios.post<ApiResponse<{ user: User; access_token: string }>>(`${API_BASE_URL}/users/register`, credentials);
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
    const response = await axios.post(`${API_BASE_URL}/auth/request-password-reset`, { email });
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
    const response = await axios.post(`${API_BASE_URL}/auth/reset-password-with-otp`, payload, {
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

// Refresh token function (assumes backend has /auth/refresh endpoint)
export const refreshToken = async (currentToken: string): Promise<{ access_token: string; user: User }> => {
  try {
    const response = await axios.post<ApiResponse<{ access_token: string; user: User }>>(`${API_BASE_URL}/auth/refresh`, {}, {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (response.data.success && response.data.data) {
      // Update localStorage with new token
      localStorage.setItem('authToken', response.data.data.access_token);
      localStorage.setItem('userData', JSON.stringify(response.data.data.user));
      return response.data.data;
    } else {
      throw {
        message: response.data.message || 'Token refresh failed',
        status: 401
      } as ApiError;
    }
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      // Clear invalid session on refresh failure
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('isAdmin');
      throw {
        message: 'Token refresh failed - session expired',
        status: 401
      } as ApiError;
    }
    throw {
      message: 'Network error during token refresh',
      status: 500
    } as ApiError;
  }
};
