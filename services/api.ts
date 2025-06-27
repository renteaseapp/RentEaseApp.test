import { ApiResponse } from '../types';

export const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  if (!response.ok) {
    throw new Error('API request failed');
  }
  return response.json();
}; 