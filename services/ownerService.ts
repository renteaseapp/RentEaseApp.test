import { Product, OwnerDashboardData, PayoutMethod, ApiError, PaginatedResponse, Rental, ProductAvailabilityStatus, ProductAdminApprovalStatus, ProductImage } from '../types';
import { MOCK_USER_ID } from '../constants';
import { ApiResponse } from '../types';
import { handleApiResponse } from './api';

const API_BASE_URL = 'https://renteaseapi-test.onrender.com/api';

export const getOwnerDashboardData = async (ownerId: number): Promise<ApiResponse<OwnerDashboardData>> => {
    try {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No authentication token found');
    }

    console.log('🔍 Calling owner dashboard API for user:', ownerId);
    const response = await fetch(`${API_BASE_URL}/owners/me/dashboard`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    console.log('🔍 Owner dashboard API response status:', response.status);

    if (response.status === 401) {
        console.log('❌ Unauthorized - user is not an owner');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        throw new Error('Authentication failed');
    }

    if (response.status === 403) {
        console.log('❌ Forbidden - user does not have owner permissions');
        throw new Error('User does not have owner permissions');
    }

        if (!response.ok) {
            console.log('❌ API call failed with status:', response.status);
            throw new Error('Failed to fetch dashboard data');
        }

        const result = await response.json();
        console.log('✅ Dashboard API Response:', result);
        
        return {
            success: true,
            data: result.data.data,
            message: result.message || 'Dashboard data fetched successfully'
        };
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        throw error;
    }
};

export const getOwnerListings = async (ownerId: number, params: { availability_status?: string; q?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Product>> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.q) queryParams.append('search', params.q);
        if (params.availability_status) queryParams.append('availability_status', params.availability_status);

        const url = `${API_BASE_URL}/owners/me/products?${queryParams.toString()}`;
        console.log('API URL:', url);
        console.log('Query params:', queryParams.toString());
        console.log('Params object:', params);
        console.log('Availability status being sent:', params.availability_status);

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch owner listings');
        }

        const result = await response.json();
        console.log('API Response:', result);
        
        // Handle the nested data structure from the API response
        return {
            data: result.data.data,
            meta: {
                current_page: result.data.meta.current_page,
                last_page: result.data.meta.last_page,
                per_page: result.data.meta.per_page,
                total: result.data.meta.total,
                from: result.data.meta.from,
                to: result.data.meta.to
            }
        };
    } catch (error) {
        console.error('Error fetching owner listings:', error);
        throw error;
    }
};

export const updateProductStatus = async (productId: number, ownerId: number, availability_status: ProductAvailabilityStatus): Promise<Product> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/products/${productId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({ availability_status })
        });

        if (!response.ok) {
            throw new Error('Failed to update product status');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error updating product status:', error);
        throw error;
    }
};

export const deleteProduct = async (productId: number, ownerId: number): Promise<{ message: string }> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete product');
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

export const createProduct = async (ownerId: number, productData: Omit<Product, 'id' | 'owner_id' | 'slug' | 'created_at' | 'updated_at' | 'owner' | 'province' | 'category' | 'primary_image' | 'view_count' | 'admin_approval_status' | 'images'> & { imagesInput?: File[] }): Promise<Product> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('createProduct called with:', { ownerId, productData });

        const formData = new FormData();
        
        // Append product data
        Object.entries(productData).forEach(([key, value]) => {
            if (key !== 'imagesInput' && value !== undefined) {
                if (key === 'specifications' && typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                } else {
                    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value.toString());
                }
            }
        });

        // Append images from imagesInput
        if (productData.imagesInput) {
            productData.imagesInput.forEach((file, index) => {
                formData.append(`images[]`, file);
            });
        }

        // Debug: Log all FormData entries for createProduct
        console.log('FormData contents (createProduct):');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('API Error Response:', errorData);
            throw new Error(errorData?.message || 'Failed to create product');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

export const updateProduct = async (productId: number, ownerId: number, productData: Partial<Omit<Product, 'id' | 'owner_id' | 'slug' | 'created_at' | 'updated_at' | 'owner' | 'province' | 'category' | 'primary_image' | 'view_count' | 'images'>> & { imagesInput?: File[], removeImageIds?: number[] }): Promise<Product> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const formData = new FormData();
        
        // Append product data with proper validation
        Object.entries(productData).forEach(([key, value]) => {
            if (key !== 'imagesInput' && key !== 'removeImageIds' && value !== undefined) {
                if (key === 'specifications' && typeof value === 'object') {
                    formData.append(key, JSON.stringify(value));
                } else if (key === 'rental_price_per_day' || key === 'rental_price_per_week' || key === 'rental_price_per_month' || key === 'security_deposit') {
                    // Ensure 2 decimal places for price fields
                    formData.append(key, Number(value).toFixed(2));
                } else if (key === 'latitude' || key === 'longitude') {
                    // Ensure proper precision for coordinates
                    formData.append(key, Number(value).toFixed(8));
                } else {
                    formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value.toString());
                }
            }
        });

        // Append new images as new_images[]
        if (productData.imagesInput) {
            productData.imagesInput.forEach((file, index) => {
                formData.append(`new_images[]`, file);
            });
        }

        // Append remove_image_ids[] field only when there are images to remove
        if (productData.removeImageIds && productData.removeImageIds.length > 0) {
            productData.removeImageIds.forEach(id => {
                formData.append(`remove_image_ids[]`, id.toString());
            });
        }

        // Debug: Log all FormData entries for updateProduct
        console.log('FormData contents (updateProduct):');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || `Failed to update product: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('API Response for product update:', result); // Debug log
        
        // Handle nested response structure
        if (result.data && result.data.data) {
            return result.data.data;
        } else if (result.data) {
            return result.data;
        } else {
            return result;
        }
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

export const getOwnerProductForEdit = async (productId: number, ownerId: number): Promise<Product> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to fetch product for edit');
        }

        const result = await response.json();
        console.log('API Response for product edit:', result); // Debug log
        
        // Handle nested response structure like getProductByID
        if (result.data && result.data.data) {
            return result.data.data;
        } else if (result.data) {
            return result.data;
        } else {
            throw new Error('Invalid response format from server');
        }
    } catch (error) {
        console.error('Error fetching product for edit:', error);
        throw error;
    }
};

export const getOwnerPayoutMethods = async (ownerId: number): Promise<PayoutMethod[]> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/owners/me/payout-methods`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch payout methods');
        }

        const result = await response.json();
        console.log('Payout methods response:', result);
        
        return result.data;
    } catch (error) {
        console.error('Error fetching payout methods:', error);
        throw error;
    }
};

export const addPayoutMethod = async (ownerId: number, data: Omit<PayoutMethod, 'id'|'owner_id'|'created_at'|'updated_at'>): Promise<PayoutMethod> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/owners/me/payout-methods`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to add payout method');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error adding payout method:', error);
        throw error;
    }
};

export const updatePayoutMethod = async (payoutMethodId: number, data: Partial<Omit<PayoutMethod, 'id'|'owner_id'|'created_at'|'updated_at'>>): Promise<PayoutMethod> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/owners/me/payout-methods/${payoutMethodId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to update payout method');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error updating payout method:', error);
        throw error;
    }
};

export const deletePayoutMethod = async (payoutMethodId: number): Promise<{ message: string }> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/owners/me/payout-methods/${payoutMethodId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to delete payout method');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error deleting payout method:', error);
        throw error;
    }
};

export const setPayoutMethodAsPrimary = async (payoutMethodId: number): Promise<PayoutMethod> => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}/owners/me/payout-methods/${payoutMethodId}/primary`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.message || 'Failed to set payout method as primary');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error setting payout method as primary:', error);
        throw error;
    }
};

export const getPayoutMethodsByOwnerId = async (ownerId: number): Promise<PayoutMethod[]> => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        throw new Error('No authentication token found');
    }
    const response = await fetch(`https://renteaseapi-test.onrender.com/api/owners/${ownerId}/payout-methods`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch payout methods');
    }
    const result = await response.json();
    return result.data;
};

/**
 * อัปเดตสถานะการจัดส่งของ rental (owner เท่านั้น)
 * @param rentalId
 * @param data { delivery_status, tracking_number, carrier_code }
 * @returns rental object
 */
export const updateRentalDeliveryStatus = async (
  rentalId: number,
  data: { delivery_status: 'pending' | 'shipped' | 'delivered' | 'failed' | 'returned'; tracking_number?: string; carrier_code?: string }
): Promise<Rental> => {
  const token = localStorage.getItem('authToken');
  if (!token) throw new Error('No authentication token found');
  const response = await fetch(`${API_BASE_URL}/owners/rentals/${rentalId}/delivery-status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update delivery status');
  }
  const result = await response.json();
  return result.data;
};
