import { AppNotification, ApiError } from '../types';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';

export const getNotifications = async (params: { page?: number, limit?: number } = {}): Promise<AppNotification[]> => {
  const token = localStorage.getItem('authToken');
  const url = new URL(`${API_BASE_URL}/notifications`);
  if (params.page) url.searchParams.append('page', String(params.page));
  if (params.limit) url.searchParams.append('limit', String(params.limit));
  const res = await fetch(url.toString(), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const result = await res.json();
  return result.data;
};

export const markNotificationsRead = async (notification_ids: number[]): Promise<{ success: boolean }> => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`${API_BASE_URL}/notifications/mark-read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ notification_ids })
  });
  if (!res.ok) throw new Error('Failed to mark notifications as read');
  const result = await res.json();
  return result.data;
}; 