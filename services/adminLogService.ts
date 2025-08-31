import axios from 'axios';
import { ApiResponse, ApiError } from '../types';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface AdminLog {
  id: number;
  admin_user_id: number;
  action_type: string;
  target_entity_type: string;
  target_entity_id: number;
  target_entity_uid: string | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin_user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface AdminLogsResponse {
  data: AdminLog[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface AdminLogsQuery {
  page?: number;
  limit?: number;
  admin_user_id?: number;
  action_type?: string;
  target_entity_type?: string;
  start_date?: string;
  end_date?: string;
}

// Get admin logs with filtering and pagination
export const getAdminLogs = async (query: AdminLogsQuery = {}): Promise<AdminLogsResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (query.page) params.append('page', query.page.toString());
    if (query.limit) params.append('limit', query.limit.toString());
    if (query.admin_user_id) params.append('admin_user_id', query.admin_user_id.toString());
    if (query.action_type) params.append('action_type', query.action_type);
    if (query.target_entity_type) params.append('target_entity_type', query.target_entity_type);
    if (query.start_date) params.append('start_date', query.start_date);
    if (query.end_date) params.append('end_date', query.end_date);

    const response = await api.get<ApiResponse<AdminLogsResponse>>(`/admin/logs?${params.toString()}`);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw {
        message: error.response.data.message,
        status: error.response.status
      } as ApiError;
    }
    throw error;
  }
}; 