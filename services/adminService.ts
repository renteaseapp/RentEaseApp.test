import axios from 'axios';
import {
  User,
  Category,
  Product,
  StaticPageContent,
  PaginatedResponse,
  UserIdVerificationStatus,
  ProductAdminApprovalStatus
} from '../types';

const API_URL = 'https://renteaseapi-test.onrender.com/api';

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- 1. Auth: Login ---
export const adminLogin = async (payload: { email_or_username: string; password: string }) => {
  const res = await api.post('/admin/login', payload);
  return res.data;
};

// --- 2. Users Management ---
export const adminGetUsers = async (params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<User>> => {
  const res = await api.get('/admin/users', { params });
  return res.data;
};
export const adminGetUserById = async (id: number): Promise<User> => {
  const res = await api.get(`/admin/users/${id}`);
  return res.data;
};
export const adminUpdateUser = async (id: number, payload: Partial<User>): Promise<User> => {
  const res = await api.put(`/admin/users/${id}`, payload);
  return res.data;
};
export const adminBanUser = async (id: number): Promise<User> => {
  const res = await api.post(`/admin/users/${id}/ban`);
  return res.data;
};
export const adminUnbanUser = async (id: number): Promise<User> => {
  const res = await api.post(`/admin/users/${id}/unban`);
  return res.data;
};
export const adminDeleteUser = async (id: number): Promise<User> => {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data;
};
export const adminUpdateUserIdVerification = async (
  id: number,
  payload: {
    id_verification_status: UserIdVerificationStatus;
    id_verification_notes?: string;
    id_verified_at?: string;
    id_verified_by_admin_id?: number;
  }
): Promise<User> => {
  const res = await api.put(`/admin/users/${id}/id-verification`, payload);
  return res.data;
};

// --- 3. Complaints Management ---
export const adminGetComplaints = async (params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<any>> => {
  const res = await api.get('/admin/complaints', { params });
  return res.data;
};
export const adminGetComplaintById = async (id: number): Promise<any> => {
  const res = await api.get(`/admin/complaints/${id}`);
  return res.data;
};
export const adminReplyComplaint = async (
  id: number,
  payload: {
    status: string;
    admin_notes?: string;
    resolution_notes?: string;
    admin_handler_id?: number;
  }
): Promise<any> => {
  const res = await api.put(`/admin/complaints/${id}/reply`, payload);
  return res.data;
};

// --- 4. Categories Management ---
export const adminGetCategories = async (): Promise<{ data: Category[] }> => {
  const res = await api.get('/admin/categories');
  return res.data;
};
export const adminCreateCategory = async (payload: Partial<Category>): Promise<Category> => {
  const res = await api.post('/admin/categories', payload);
  return res.data;
};
export const adminUpdateCategory = async (id: number, payload: Partial<Category>): Promise<Category> => {
  const res = await api.put(`/admin/categories/${id}`, payload);
  return res.data;
};
export const adminDeleteCategory = async (id: number): Promise<Category> => {
  const res = await api.delete(`/admin/categories/${id}`);
  return res.data;
};

// --- 5. Products Management ---
export const adminGetProducts = async (params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<Product>> => {
  const res = await api.get('/admin/products', { params });
  return res.data;
};
export const adminApproveProduct = async (
  id: number,
  payload: {
    admin_approval_status: ProductAdminApprovalStatus;
    admin_approval_notes?: string;
    approved_by_admin_id?: number;
  }
): Promise<Product> => {
  const res = await api.put(`/admin/products/${id}/approve`, payload);
  return res.data;
};

// --- 6. System Settings ---
export const adminGetSystemSettings = async (): Promise<{ settings: any[] }> => {
  const res = await api.get('/admin/settings');
  return res.data;
};
export const adminUpdateSystemSettings = async (payload: any): Promise<any> => {
  const res = await api.put('/admin/settings', payload);
  return res.data;
};



