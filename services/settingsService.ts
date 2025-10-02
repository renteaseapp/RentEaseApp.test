import axios from 'axios';

import { API_BASE_URL } from '../constants';

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
    try {
      const response = await api.get('/settings/fee-settings');
      console.log('🔍 getPublicFeeSettings response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error fetching fee settings:', error);
      throw error;
    }
  },

  async calculateEstimatedFees(
    subtotalRentalFee: number,
    pickupMethod: string = 'self_pickup'
  ): Promise<EstimatedFees> {
    try {
      console.log('🔍 Calling calculateEstimatedFees API:', {
        subtotal_rental_fee: subtotalRentalFee,
        pickup_method: pickupMethod
      });
      
      const response = await api.post('/settings/calculate-fees', {
        subtotal_rental_fee: subtotalRentalFee,
        pickup_method: pickupMethod
      });
      
      console.log('✅ calculateEstimatedFees API response:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.data) {
        throw new Error('Invalid API response structure');
      }
      
      const fees = response.data.data;
      
      // Validate required fields
      if (typeof fees.total_amount_estimate !== 'number') {
        console.error('❌ Invalid total_amount_estimate:', fees.total_amount_estimate);
        throw new Error('Invalid total_amount_estimate in API response');
      }
      
      if (typeof fees.total_estimated_fees !== 'number') {
        console.error('❌ Invalid total_estimated_fees:', fees.total_estimated_fees);
        throw new Error('Invalid total_estimated_fees in API response');
      }
      
      console.log('✅ Validated fees data:', fees);
      return fees;
    } catch (error) {
      console.error('❌ Error calculating estimated fees:', error);
      throw error;
    }
  }
};