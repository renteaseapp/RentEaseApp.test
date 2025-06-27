import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/admin';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  'Content-Type': 'application/json',
});

export const getRentalsReport = async () => {
  const res = await axios.get(`${API_BASE_URL}/reports/rentals?month=2024-06`, { headers: getAuthHeaders() });
  return res.data;
};

export const getIncomeReport = async () => {
  // For demo, use owner_id=1
  const res = await axios.get(`${API_BASE_URL}/reports/income?owner_id=1`, { headers: getAuthHeaders() });
  return res.data;
};

export const getPlatformStats = async () => {
  const res = await axios.get(`${API_BASE_URL}/reports/platform-stats`, { headers: getAuthHeaders() });
  return res.data;
};

export const getComplaintsReport = async () => {
  const res = await axios.get(`${API_BASE_URL}/reports/complaints`, { headers: getAuthHeaders() });
  return res.data;
};

export const getUserReputationReport = async () => {
  const res = await axios.get(`${API_BASE_URL}/reports/user-reputation`, { headers: getAuthHeaders() });
  return res.data;
}; 