import axios from 'axios';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api/admin';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
});

export const getRentalsReport = async (year?: number) => {
  const params = year ? { year } : {};
  const res = await axios.get(`${API_BASE_URL}/reports/rentals`, { headers: getAuthHeaders(), params });
  return res.data;
};

export const getIncomeReport = async (year?: number) => {
  const params = year ? { year } : {};
  const res = await axios.get(`${API_BASE_URL}/reports/income`, { headers: getAuthHeaders(), params });
  return res.data;
};

export const getPlatformStats = async (year?: number) => {
  const params = year ? { year } : {};
  const res = await axios.get(`${API_BASE_URL}/reports/platform-stats`, { headers: getAuthHeaders(), params });
  return res.data;
};

export const getUserReputationReport = async (year?: number) => {
  const params = year ? { year } : {};
  const res = await axios.get(`${API_BASE_URL}/reports/user-reputation`, { headers: getAuthHeaders(), params });
  return res.data;
};

export const getComplaintsReport = async (year?: number): Promise<{ complaints: number }> => {
  const params = year ? { year } : {};
  const res = await axios.get(`${API_BASE_URL}/reports/complaints`, { headers: getAuthHeaders(), params });
  return res.data;
};

export const getProductsReport = async (params: { year?: number; month?: string; date?: string } = {}) => {
  const res = await axios.get(`${API_BASE_URL}/reports/products`, { headers: getAuthHeaders(), params });
  return res.data;
};
