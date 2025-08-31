import axios from 'axios';
import { LoginResponse, ApiError } from '../types';

export interface GoogleAuthResponse {
  access_token: string;
  user: any;
  is_admin: boolean;
}

export interface GoogleUserInfo {
  email: string;
  given_name: string;
  family_name: string;
  picture: string;
  sub: string;
}

export const googleAuthService = {
  // ดึงข้อมูลผู้ใช้จาก Google API
  async getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Google user info:', error);
      throw new Error('Failed to get user information from Google');
    }
  },

  // ส่งข้อมูล Google ไปยัง backend เพื่อ login/register
  async authenticateWithGoogle(googleUserInfo: GoogleUserInfo): Promise<GoogleAuthResponse> {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/google/callback', {
        userInfo: googleUserInfo
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Google authentication error:', error);
      if (error.response?.data?.message) {
        throw {
          message: error.response.data.message,
          status: error.response.status
        } as ApiError;
      }
      throw new Error('Google authentication failed');
    }
  },

  // ตรวจสอบ Google ID token (สำหรับ mobile apps)
  async verifyIdToken(idToken: string): Promise<GoogleAuthResponse> {
    try {
      const response = await axios.post('http://localhost:3001/api/auth/google/verify-id-token', {
        idToken,
      });

      return response.data.data;
    } catch (error: any) {
      console.error('Google ID token verification error:', error);
      if (error.response?.data?.message) {
        throw {
          message: error.response.data.message,
          status: error.response.status
        } as ApiError;
      }
      throw new Error('Google ID token verification failed');
    }
  },

  // ดึง Google OAuth URL จาก backend
  async getGoogleAuthUrl(): Promise<string> {
    try {
      const response = await axios.get('http://localhost:3001/api/auth/google/auth-url');
      return response.data.data.authUrl;
    } catch (error: any) {
      console.error('Error getting Google auth URL:', error);
      throw new Error('Failed to get Google authentication URL');
    }
  },
};

export default googleAuthService; 