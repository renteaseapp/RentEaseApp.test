import { Product, Category, Province, ApiError, ProductAdminApprovalStatus, ProductAvailabilityStatus, ProductSearchParams, PaginatedResponse } from '../types';

import { API_BASE_URL } from '../constants';

export const getFeaturedProducts = async (limit: number = 8): Promise<{ data: Product[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to fetch featured products');
    }
    const responseData = await response.json();
    // Ensure we're working with an array
    const products = Array.isArray(responseData.data) ? responseData.data : 
                    Array.isArray(responseData.data?.data) ? responseData.data.data : [];
    return { data: products };
  } catch (error) {
    console.error('Error fetching featured products:', error);
    throw error;
  }
};

export const getFeaturedCategories = async (limit: number = 6): Promise<{ data: Category[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories?featured=true&limit=${limit}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to fetch categories');
    }
    const responseData = await response.json();
    const categories = responseData.data || [];
    return { data: Array.isArray(categories) ? categories.slice(0, limit) : [] };
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getProductByID = async (slugOrId: string | number): Promise<{ data: Product }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${slugOrId}`);
    if (!response.ok) {
      throw new Error('Product not found');
    }
    const result = await response.json();
    if (result.data && result.data.data) {
      return { data: result.data.data };
    } else {
      throw new Error('Product not found');
    }
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    throw error;
  }
};

export const getProvinces = async (): Promise<{data: Province[]}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/provinces`);
    if (!response.ok) {
      throw new Error('Failed to fetch provinces');
    }
    const data = await response.json();
    return { data: data.data.data || [] };
  } catch (error) {
    console.error('Error fetching provinces:', error);
    throw error;
  }
};

export const getCategories = async (): Promise<{data: Category[]}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const data = await response.json();
    return { data: data.data.data || [] };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: [] };
  }
};

export const searchProducts = async (params: ProductSearchParams): Promise<PaginatedResponse<Product>> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params.q) queryParams.append('q', params.q);
    if (params.min_price) queryParams.append('min_price', params.min_price.toString());
    if (params.max_price) queryParams.append('max_price', params.max_price.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.province_ids) queryParams.append('province_ids', params.province_ids);

    const response = await fetch(`${API_BASE_URL}/products?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to search products');
    }
    
    const responseData = await response.json();
    console.log('API /products response:', responseData);

    let products: Product[] = [];
    let meta: any = {};
    let links: any = {};

    if (
      responseData.data &&
      Array.isArray(responseData.data.data) &&
      responseData.data.meta
    ) {
      products = responseData.data.data;
      meta = responseData.data.meta;
      links = responseData.data.links || { first: null, last: null, prev: null, next: null };
    } else {
      throw new Error('Invalid response format from server: ' + JSON.stringify(responseData));
    }

    return {
      data: products,
      meta: {
        current_page: meta.current_page || 1,
        last_page: meta.last_page || 1,
        per_page: meta.per_page || 10,
        total: meta.total || 0,
        from: meta.from || 0,
        to: meta.to || 0
      },
      links: {
        first: links.first || null,
        last: links.last || null,
        prev: links.prev || null,
        next: links.next || null
      }
    };
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// New function for location-based search
export const searchProductsByLocation = async (lat: number, lng: number, radius_km: number = 50, params: ProductSearchParams = {}): Promise<PaginatedResponse<Product>> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add location parameters
    queryParams.append('lat', lat.toString());
    queryParams.append('lng', lng.toString());
    queryParams.append('radius_km', radius_km.toString());
    
    // Add other search parameters
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params.q) queryParams.append('q', params.q);
    if (params.min_price) queryParams.append('min_price', params.min_price.toString());
    if (params.max_price) queryParams.append('max_price', params.max_price.toString());
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await fetch(`${API_BASE_URL}/products?${queryParams.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to search products by location');
    }
    
    const responseData = await response.json();
    console.log('API /products response:', responseData);

    let products: Product[] = [];
    let meta: any = {};
    let links: any = {};

    if (
      responseData.data &&
      Array.isArray(responseData.data.data) &&
      responseData.data.meta
    ) {
      products = responseData.data.data;
      meta = responseData.data.meta;
      links = responseData.data.links || { first: null, last: null, prev: null, next: null };
    } else {
      throw new Error('Invalid response format from server: ' + JSON.stringify(responseData));
    }

    return {
      data: products,
      meta: {
        current_page: meta.current_page || 1,
        last_page: meta.last_page || 1,
        per_page: meta.per_page || 10,
        total: meta.total || 0,
        from: meta.from || 0,
        to: meta.to || 0
      },
      links: {
        first: links.first || null,
        last: links.last || null,
        prev: links.prev || null,
        next: links.next || null
      }
    };
  } catch (error) {
    console.error('Error searching products by location:', error);
    throw error;
  }
};

export const getPopularProducts = async (limit: number = 5): Promise<{ data: Product[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/popular?limit=${limit}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.warn('Popular products API error:', errorData);
      // Return empty array instead of throwing error
      return { data: [] };
    }
    const responseData = await response.json();
    console.log('Popular products response:', responseData);
    
    // รองรับ response format ใหม่
    const products = responseData.data?.data || responseData.data || [];
    return { data: products };
  } catch (error) {
    console.error('Error fetching popular products:', error);
    // Return empty array instead of throwing error to prevent app crash
    return { data: [] };
  }
};

export const getProductRentals = async (productId: number, yearMonth: string): Promise<{ booked_dates: string[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/availability/${yearMonth}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to fetch product availability');
    }
    const responseData = await response.json();
    return responseData.data || { booked_dates: [] };
  } catch (error) {
    console.error('Error fetching product availability:', error);
    throw error;
  }
};

export const getProductRentalDetails = async (productId: number, yearMonth: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/rentals/${yearMonth}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to fetch product rental details');
    }
    const responseData = await response.json();
    // responseData.data contains { rentals: [], booked_dates: [] }
    // We need to return the rentals array
    return responseData.data?.rentals || [];
  } catch (error) {
    console.error('Error fetching product rental details:', error);
    throw error;
  }
};

export const getBufferTimeSettings = async (): Promise<{
  enabled: boolean;
  delivery_buffer_days: number;
  return_buffer_days: number;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/settings/public`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to fetch buffer time settings');
    }
    const responseData = await response.json();
    const settings = responseData.data || {};
    
    // ใช้ field names ที่ถูกต้องตาม backend response structure
    const bufferSettings = settings.buffer_settings || {};
    
    return {
      enabled: bufferSettings.enabled === true,
      delivery_buffer_days: parseInt(bufferSettings.delivery_buffer_days || '0'),
      return_buffer_days: parseInt(bufferSettings.return_buffer_days || '0')
    };
  } catch (error) {
    console.error('Error fetching buffer time settings:', error);
    // Return default values if fetch fails - get from backend settings
    try {
      // Try to get default settings from backend
      const defaultResponse = await fetch(`${API_BASE_URL}/settings`);
      if (defaultResponse.ok) {
        const defaultSettings = await defaultResponse.json();
        const defaultBufferSettings = defaultSettings.data?.buffer_settings || {};
        return {
          enabled: defaultBufferSettings.enabled === true,
          delivery_buffer_days: parseInt(defaultBufferSettings.delivery_buffer_days || '0'),
          return_buffer_days: parseInt(defaultBufferSettings.return_buffer_days || '0')
        };
      }
    } catch (fallbackError) {
      console.error('Error fetching default buffer settings:', fallbackError);
    }
    
    // Final fallback - no hardcoded values
    return {
      enabled: false,
      delivery_buffer_days: 0,
      return_buffer_days: 0
    };
  }
};

export const getProductRentalCount = async (productId: number): Promise<{ rental_count: number }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}/rental-count`);
    if (!response.ok) {
      throw new Error('Failed to fetch product rental count');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching product rental count:', error);
    throw error;
  }
};

export const checkProductAvailabilityWithBuffer = async (
  productId: number, 
  startDate: string, 
  endDate: string
): Promise<{
  available: boolean;
  conflicts: any[];
  buffer_settings: {
    enabled: boolean;
    delivery_buffer_days: number;
    return_buffer_days: number;
  };
}> => {
  try {
    // Always use quantity = 1 for single item rental
    const quantity = 1;
    const response = await fetch(
      `${API_BASE_URL}/products/${productId}/check-availability-with-buffer?start_date=${startDate}&end_date=${endDate}&quantity=${quantity}`
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to check product availability');
    }
    const responseData = await response.json();
    return responseData.data || {
      available: false,
      conflicts: [],
      buffer_settings: { enabled: false, delivery_buffer_days: 0, return_buffer_days: 0 }
    };
  } catch (error) {
    console.error('Error checking product availability:', error);
    throw error;
  }
};
