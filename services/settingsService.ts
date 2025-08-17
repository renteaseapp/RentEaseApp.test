import axios from 'axios';

const API_BASE_URL = 'https://renteaseapi-test.onrender.com/api';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FeeSettings {
  platform_fee_percentage: number;
  platform_fee_owner_percentage: number;
  delivery_fee_base: number;
}

export interface EstimatedFees {
  subtotal_rental_fee: number;
  platform_fee_renter: number;
  platform_fee_owner: number;
  delivery_fee: number;
  total_estimated_fees: number;
  total_amount_estimate: number;
}

export const settingsService = {
  async getPublicFeeSettings(): Promise<FeeSettings> {
    const response = await api.get('/settings/fee-settings');
    return response.data.data;
  },

  async calculateEstimatedFees(
    subtotalRentalFee: number,
    pickupMethod: string = 'self_pickup'
  ): Promise<EstimatedFees> {
    const response = await api.post('/settings/calculate-fees', {
      subtotal_rental_fee: subtotalRentalFee,
      pickup_method: pickupMethod
    });
    return response.data.data;
  }
}; 